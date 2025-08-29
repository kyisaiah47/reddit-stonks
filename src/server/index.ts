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
import { stockSearchService } from './services/stockSearchService';
import { initializeWebSocketService, getWebSocketService } from './services/websocketService';
import { userDataService } from './services/userDataService';
import { redditNewsService } from './services/redditNewsService';

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

// Get all stocks (optionally filtered/searched)
router.get<{}, any | { status: string; message: string }>(
  '/api/stocks',
  async (req, res): Promise<void> => {
    try {
      const filters = {
        query: req.query.q as string,
        category: req.query.category as any,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        changeMin: req.query.changeMin ? parseFloat(req.query.changeMin as string) : undefined,
        changeMax: req.query.changeMax ? parseFloat(req.query.changeMax as string) : undefined,
        volumeMin: req.query.volumeMin ? parseFloat(req.query.volumeMin as string) : undefined,
        isDividendStock: req.query.dividendOnly === 'true' ? true : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = stockSearchService.searchStocks(filters);
      res.json(result);
    } catch (error) {
      console.error('Stock search error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to search stocks'
      });
    }
  }
);

// Get stocks by category
router.get<{ category: string }, any | { status: string; message: string }>(
  '/api/stocks/category/:category',
  async (req, res): Promise<void> => {
    try {
      const { category } = req.params;
      const stocks = stockSearchService.getStocksByCategory(category as any);
      res.json({ stocks });
    } catch (error) {
      console.error('Category stocks error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch stocks by category'
      });
    }
  }
);

// Get top performers
router.get<{}, any | { status: string; message: string }>(
  '/api/stocks/top-gainers',
  async (req, res): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const stocks = stockSearchService.getTopGainers(limit);
      res.json({ stocks });
    } catch (error) {
      console.error('Top gainers error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch top gainers'
      });
    }
  }
);

router.get<{}, any | { status: string; message: string }>(
  '/api/stocks/top-losers',
  async (req, res): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const stocks = stockSearchService.getTopLosers(limit);
      res.json({ stocks });
    } catch (error) {
      console.error('Top losers error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch top losers'
      });
    }
  }
);

router.get<{}, any | { status: string; message: string }>(
  '/api/stocks/most-active',
  async (req, res): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const stocks = stockSearchService.getMostActive(limit);
      res.json({ stocks });
    } catch (error) {
      console.error('Most active error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch most active stocks'
      });
    }
  }
);

// Get search suggestions
router.get<{}, any | { status: string; message: string }>(
  '/api/search/suggestions',
  async (req, res): Promise<void> => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const suggestions = stockSearchService.searchSuggestions(query, limit);
      res.json({ suggestions });
    } catch (error) {
      console.error('Search suggestions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch search suggestions'
      });
    }
  }
);

// Get market overview with category breakdown
router.get<{}, any | { status: string; message: string }>(
  '/api/market/overview',
  async (req, res): Promise<void> => {
    try {
      const overview = stockSearchService.getMarketOverview();
      res.json(overview);
    } catch (error) {
      console.error('Market overview error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch market overview'
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
      // Get Reddit username from Devvit context or fallback to query param
      let username: string | null = null;
      try {
        username = await reddit.getCurrentUsername();
      } catch (error) {
        // Fallback to userId from query if not in Devvit context
        const userId = req.query.userId as string;
        if (userId && userId.startsWith('reddit_')) {
          username = userId.replace('reddit_', '');
        } else {
          username = userId;
        }
      }
      
      if (!username) {
        res.status(400).json({
          status: 'error',
          message: 'Reddit username is required'
        });
        return;
      }

      // Use userDataService for Redis-based persistence
      const portfolio = await userDataService.getPortfolio(username);
      
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
      
      // Get Reddit username from Devvit context or extract from userId
      let username: string | null = null;
      try {
        username = await reddit.getCurrentUsername();
      } catch (error) {
        // Fallback to extract from userId if not in Devvit context
        if (userId && userId.startsWith('reddit_')) {
          username = userId.replace('reddit_', '');
        } else {
          username = userId;
        }
      }
      
      if (!username) {
        res.status(400).json({
          success: false,
          message: 'Reddit username is required'
        });
        return;
      }

      // Get current portfolio
      const portfolio = await userDataService.getPortfolio(username);
      
      // Validate trade
      const stock = marketDataService.getStock(tradeRequest.stockId);
      if (!stock) {
        res.status(404).json({
          success: false,
          message: 'Stock not found'
        });
        return;
      }

      const totalCost = tradeRequest.shares * stock.price;
      
      if (tradeRequest.type === 'buy') {
        if (portfolio.cash < totalCost) {
          res.status(400).json({
            success: false,
            message: 'Insufficient funds'
          });
          return;
        }
        
        // Execute buy order
        portfolio.cash -= totalCost;
        
        // Add or update holding
        const existingHolding = portfolio.holdings.find(h => h.stockId === tradeRequest.stockId);
        if (existingHolding) {
          existingHolding.shares += tradeRequest.shares;
          existingHolding.averagePrice = (existingHolding.averagePrice * (existingHolding.shares - tradeRequest.shares) + totalCost) / existingHolding.shares;
        } else {
          portfolio.holdings.push({
            stockId: tradeRequest.stockId,
            symbol: stock.symbol,
            shares: tradeRequest.shares,
            averagePrice: stock.price,
            currentValue: totalCost,
            totalReturn: 0,
            totalReturnPercent: 0
          });
        }
      } else {
        // Execute sell order
        const holding = portfolio.holdings.find(h => h.stockId === tradeRequest.stockId);
        if (!holding || holding.shares < tradeRequest.shares) {
          res.status(400).json({
            success: false,
            message: 'Insufficient shares to sell'
          });
          return;
        }
        
        portfolio.cash += totalCost;
        holding.shares -= tradeRequest.shares;
        
        // Remove holding if all shares sold
        if (holding.shares === 0) {
          portfolio.holdings = portfolio.holdings.filter(h => h.stockId !== tradeRequest.stockId);
        }
      }
      
      // Recalculate portfolio totals
      let holdingsValue = 0;
      for (const holding of portfolio.holdings) {
        const currentStock = marketDataService.getStock(holding.stockId);
        if (currentStock) {
          holding.currentValue = holding.shares * currentStock.price;
          holding.totalReturn = holding.currentValue - (holding.shares * holding.averagePrice);
          holding.totalReturnPercent = ((currentStock.price - holding.averagePrice) / holding.averagePrice) * 100;
          holdingsValue += holding.currentValue;
        }
      }
      
      portfolio.totalValue = portfolio.cash + holdingsValue;
      const initialValue = 10000; // Starting cash
      portfolio.totalReturn = portfolio.totalValue - initialValue;
      portfolio.totalReturnPercent = ((portfolio.totalValue - initialValue) / initialValue) * 100;
      
      // Save updated portfolio
      await userDataService.savePortfolio(username, portfolio);
      
      // Save trade history
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stockId: tradeRequest.stockId,
        symbol: stock.symbol,
        type: tradeRequest.type,
        shares: tradeRequest.shares,
        price: stock.price,
        total: totalCost,
        timestamp: new Date().toISOString()
      };
      
      await userDataService.saveTradeHistory(username, trade);
      
      // Update user stats
      await userDataService.updateUserStats(username, {
        totalTrades: 1, // This would be incremented
        totalVolume: totalCost
      });
      
      // Update leaderboard
      await userDataService.updateLeaderboard(username, portfolio.totalValue, portfolio.totalReturnPercent);

      // Broadcast trade execution to WebSocket clients
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastTradeExecution({
          ...trade,
          userId: username
        });
        
        // Send portfolio update to user
        wsService.sendPortfolioUpdate(username, portfolio);
      }

      res.json({
        success: true,
        trade,
        updatedPortfolio: portfolio
      });
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
  async (req, res): Promise<void> => {
    try {
      const type = (req.query.type as 'value' | 'return') || 'value';
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Use userDataService for Redis-based leaderboard
      const leaderboard = await userDataService.getLeaderboard(type, limit);
      
      res.json({ 
        leaderboard,
        type,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch leaderboard'
      });
    }
  }
);

// Get user trade history
router.get<{}, any | { status: string; message: string }>(
  '/api/trade-history',
  async (req, res): Promise<void> => {
    try {
      // Get Reddit username from Devvit context or query param
      let username: string | null = null;
      try {
        username = await reddit.getCurrentUsername();
      } catch (error) {
        // Fallback to userId from query if not in Devvit context
        const userId = req.query.userId as string;
        if (userId && userId.startsWith('reddit_')) {
          username = userId.replace('reddit_', '');
        } else {
          username = userId;
        }
      }
      
      if (!username) {
        res.status(400).json({
          status: 'error',
          message: 'Reddit username is required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const trades = await userDataService.getTradeHistory(username, limit);
      
      res.json({ 
        trades,
        username,
        count: trades.length
      });
    } catch (error) {
      console.error('Trade history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch trade history'
      });
    }
  }
);

// Get user stats
router.get<{}, any | { status: string; message: string }>(
  '/api/user-stats',
  async (req, res): Promise<void> => {
    try {
      // Get Reddit username from Devvit context or query param
      let username: string | null = null;
      try {
        username = await reddit.getCurrentUsername();
      } catch (error) {
        // Fallback to userId from query if not in Devvit context
        const userId = req.query.userId as string;
        if (userId && userId.startsWith('reddit_')) {
          username = userId.replace('reddit_', '');
        } else {
          username = userId;
        }
      }
      
      if (!username) {
        res.status(400).json({
          status: 'error',
          message: 'Reddit username is required'
        });
        return;
      }

      const stats = await userDataService.getUserStats(username);
      
      res.json({ 
        stats,
        username
      });
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user stats'
      });
    }
  }
);

// Get Reddit financial news
router.get<{}, any | { status: string; message: string }>(
  '/api/news',
  async (req, res): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const news = await redditNewsService.getFinancialNews(limit);
      
      res.json(news);
    } catch (error) {
      console.error('Reddit news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch Reddit financial news'
      });
    }
  }
);

// Get trending topics from Reddit
router.get<{}, any | { status: string; message: string }>(
  '/api/news/trending',
  async (req, res): Promise<void> => {
    try {
      const topics = await redditNewsService.getTrendingTopics();
      
      res.json({ 
        topics,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Trending topics error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch trending topics'
      });
    }
  }
);

// Get stock-specific Reddit news
router.get<{}, any | { status: string; message: string }>(
  '/api/news/stocks',
  async (req, res): Promise<void> => {
    try {
      const symbols = (req.query.symbols as string)?.split(',') || [];
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (symbols.length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Stock symbols are required'
        });
        return;
      }
      
      const stockNews = await redditNewsService.getStockNews(symbols, limit);
      
      res.json({ 
        posts: stockNews,
        symbols,
        count: stockNews.length
      });
    } catch (error) {
      console.error('Stock news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch stock-specific news'
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