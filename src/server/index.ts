import express from 'express';
import { createServer as createHttpServer } from 'http';
import dotenv from 'dotenv';
import { InitResponse, IncrementResponse, DecrementResponse, MarketDataResponse, PortfolioResponse, TradeRequest, TradeResponse, LeaderboardResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { getOrCreatePortfolio, executeTrade, getLeaderboard, setMarketData } from './core/trading';
import { marketDataService } from './services/marketDataService';
import { tradingEngine } from './services/tradingEngine';
import { redditApiService } from './services/redditApiService';
import { initializeWebSocketService, getWebSocketService } from './services/websocketService';

// Load environment variables
dotenv.config();

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// CORS middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

const router = express.Router();

// Original Devvit routes
router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Original Devvit internal routes
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Reddit Stonks API Routes

// Get real-time market data powered by Reddit API
router.get<{}, MarketDataResponse | { status: string; message: string }>(
  '/api/market-data',
  async (_req, res): Promise<void> => {
    try {
      const marketData = await marketDataService.getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch market data'
      });
    }
  }
);

// Get specific stock data
router.get<{ stockId: string }, any | { status: string; message: string }>(
  '/api/stocks/:stockId',
  async (req, res): Promise<void> => {
    try {
      const { stockId } = req.params;
      const stock = marketDataService.getStock(stockId);
      
      if (!stock) {
        res.status(404).json({
          status: 'error',
          message: `Stock ${stockId} not found`
        });
        return;
      }

      const orderBook = tradingEngine.getOrderBook(stockId);
      const recentTrades = tradingEngine.getRecentTrades(stockId, 20);

      res.json({
        stock,
        orderBook,
        recentTrades
      });
    } catch (error) {
      console.error('Stock data error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch stock data'
      });
    }
  }
);

// Get user portfolio
router.get<{}, PortfolioResponse | { status: string; message: string }>(
  '/api/portfolio',
  async (req, res): Promise<void> => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'userId is required'
        });
        return;
      }

      let portfolio = tradingEngine.getPortfolio(userId);
      if (!portfolio) {
        // Create new portfolio - fallback to legacy system if needed
        portfolio = await getOrCreatePortfolio(userId);
      }
      
      res.json({ portfolio });
    } catch (error) {
      console.error('Portfolio error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch portfolio'
      });
    }
  }
);

// Execute trade with real-time order matching
router.post<{}, TradeResponse, TradeRequest & { userId: string }>(
  '/api/trade',
  async (req, res): Promise<void> => {
    try {
      const { userId, ...tradeRequest } = req.body;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required'
        });
        return;
      }

      // Execute trade through our trading engine
      const result = await tradingEngine.submitOrder(userId, tradeRequest);

      // Broadcast trade execution to WebSocket clients if successful
      if (result.success && result.trade) {
        const wsService = getWebSocketService();
        if (wsService) {
          wsService.broadcastTradeExecution(result.trade);
          
          // Send portfolio update to user
          if (result.updatedPortfolio) {
            wsService.sendPortfolioUpdate(userId, result.updatedPortfolio);
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Trade error:', error);
      res.status(500).json({
        success: false,
        message: 'Trade execution failed'
      });
    }
  }
);

// Get user's orders
router.get<{}, any | { status: string; message: string }>(
  '/api/orders',
  async (req, res): Promise<void> => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'userId is required'
        });
        return;
      }

      const orders = tradingEngine.getUserOrders(userId);
      res.json({ orders });
    } catch (error) {
      console.error('Orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch orders'
      });
    }
  }
);

// Cancel order
router.post<{ orderId: string }, any, { userId: string }>(
  '/api/orders/:orderId/cancel',
  async (req, res): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required'
        });
        return;
      }

      const success = tradingEngine.cancelOrder(userId, orderId);
      res.json({ 
        success,
        message: success ? 'Order cancelled successfully' : 'Failed to cancel order'
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order'
      });
    }
  }
);

// Get order book for a stock
router.get<{ stockId: string }, any | { status: string; message: string }>(
  '/api/orderbook/:stockId',
  async (req, res): Promise<void> => {
    try {
      const { stockId } = req.params;
      const orderBook = tradingEngine.getOrderBook(stockId);
      
      if (!orderBook) {
        res.status(404).json({
          status: 'error',
          message: `Order book for ${stockId} not found`
        });
        return;
      }

      res.json(orderBook);
    } catch (error) {
      console.error('Order book error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order book'
      });
    }
  }
);

// Get recent trades
router.get<{}, any | { status: string; message: string }>(
  '/api/trades',
  async (req, res): Promise<void> => {
    try {
      const stockId = req.query.stockId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const trades = tradingEngine.getRecentTrades(stockId, limit);
      res.json({ trades });
    } catch (error) {
      console.error('Trades error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch trades'
      });
    }
  }
);

// Trigger market event (admin only in production)
router.post<{}, any, {
  subredditId: string;
  eventType: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news';
  impact: number;
  durationMinutes: number;
  title: string;
}>(
  '/api/market-event',
  async (req, res): Promise<void> => {
    try {
      const { subredditId, eventType, impact, durationMinutes, title } = req.body;
      
      // Trigger the market event
      marketDataService.triggerMarketEvent(subredditId, eventType, impact, durationMinutes, title);
      
      // Broadcast to WebSocket clients
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastMarketEvent({
          type: eventType,
          subredditId,
          title,
          impact,
          timestamp: new Date().toISOString()
        });
      }

      res.json({ 
        success: true,
        message: `Market event triggered for ${subredditId}`
      });
    } catch (error) {
      console.error('Market event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger market event'
      });
    }
  }
);

// Get leaderboard
router.get<{}, LeaderboardResponse | { status: string; message: string }>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
      // For now use the legacy system, could be enhanced to use trading engine data
      const leaderboard = await getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch leaderboard'
      });
    }
  }
);

// System status endpoint
router.get('/api/system/status', (_req, res) => {
  try {
    const wsService = getWebSocketService();
    const status = {
      server: 'running',
      timestamp: new Date().toISOString(),
      reddit: redditApiService.getAuthStatus(),
      marketData: marketDataService.getSystemStatus(),
      trading: tradingEngine.getSystemStatus(),
      websocket: wsService ? wsService.getConnectionStats() : null,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status'
    });
  }
});

// Use router middleware
app.use(router);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Get port from environment variable with fallback
const port = getServerPort();

// Create HTTP server that works with both Express and Socket.io
const httpServer = createHttpServer(app);

// Initialize WebSocket service
const wsService = initializeWebSocketService(httpServer);

// Use Devvit's server wrapper if available, otherwise use our HTTP server
const server = createServer ? createServer(app) : httpServer;

server.on('error', (err) => console.error(`server error; ${err.stack}`));

server.listen(port, () => {
  console.log(`🚀 Reddit Stonks server running on port ${port}`);
  console.log(`📊 Market data service initialized with ${marketDataService.getSystemStatus().totalStocks} stocks`);
  console.log(`🔑 Reddit API status: ${redditApiService.getAuthStatus().authenticated ? 'Connected' : 'Disconnected'}`);
  console.log(`📡 WebSocket service running`);
  
  // Check if environment variables are properly configured
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('⚠️  Reddit API credentials not found. Please check your .env file.');
    console.log('📖 Refer to .env.example for required environment variables');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  marketDataService.stop();
  if (wsService) {
    wsService.stop();
  }
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  marketDataService.stop();
  if (wsService) {
    wsService.stop();
  }
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

export default app;