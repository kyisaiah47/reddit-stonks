import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, MarketDataResponse, PortfolioResponse, TradeRequest, LeaderboardResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { getOrCreatePortfolio, executeTrade, getLeaderboard, setMarketData } from './core/trading';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

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

// Stock Exchange API Routes

// Get market data
router.get<{}, MarketDataResponse | { status: string; message: string }>(
  '/api/market-data',
  async (_req, res): Promise<void> => {
    try {
      // For now, return mock data - in production this would fetch from Reddit API
      const mockStocks = [
        {
          id: 'wallstreetbets',
          symbol: 'WSB',
          name: 'r/wallstreetbets',
          price: 45.67,
          change: 2.34,
          volume: 89234,
          marketCap: 45670000,
          subscribers: 1000000,
          dailyActiveUsers: 50000
        },
        {
          id: 'stocks',
          symbol: 'STCK',
          name: 'r/stocks',
          price: 23.12,
          change: -1.67,
          volume: 34567,
          marketCap: 23120000,
          subscribers: 500000,
          dailyActiveUsers: 25000
        },
        {
          id: 'cryptocurrency',
          symbol: 'CRYP',
          name: 'r/cryptocurrency',
          price: 78.34,
          change: 4.12,
          volume: 67890,
          marketCap: 78340000,
          subscribers: 800000,
          dailyActiveUsers: 40000
        },
        {
          id: 'technology',
          symbol: 'TECH',
          name: 'r/technology',
          price: 156.43,
          change: 3.45,
          volume: 45678,
          marketCap: 156430000,
          subscribers: 1200000,
          dailyActiveUsers: 60000
        },
        {
          id: 'gaming',
          symbol: 'GAME',
          name: 'r/gaming',
          price: 34.89,
          change: -0.89,
          volume: 56789,
          marketCap: 34890000,
          subscribers: 900000,
          dailyActiveUsers: 45000
        }
      ];

      const marketData: MarketDataResponse = {
        stocks: mockStocks,
        marketSentiment: 'bullish',
        lastUpdated: new Date().toISOString()
      };

      // Cache market data
      await setMarketData(marketData);

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

// Get portfolio
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

      const portfolio = await getOrCreatePortfolio(userId);
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

// Execute trade
router.post<{}, any, TradeRequest & { userId: string }>(
  '/api/trade',
  async (req, res): Promise<void> => {
    try {
      const { userId, ...tradeRequest } = req.body;
      
      if (!userId) {
        res.status(400).json({
          status: 'error',
          message: 'userId is required'
        });
        return;
      }

      const result = await executeTrade(userId, tradeRequest);
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

// Get leaderboard
router.get<{}, LeaderboardResponse | { status: string; message: string }>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
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

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
