export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Stock Exchange API Types
export type SubredditStock = {
  id: string;
  symbol: string; // e.g., "WSB" for r/wallstreetbets
  name: string;   // e.g., "r/wallstreetbets"
  price: number;
  change: number; // percentage change
  volume: number;
  marketCap: number;
  subscribers: number;
  dailyActiveUsers?: number;
};

export type Portfolio = {
  userId: string;
  totalValue: number;
  cash: number;
  holdings: Holding[];
  totalReturn: number;
  totalReturnPercent: number;
};

export type Holding = {
  stockId: string;
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
};

export type MarketDataResponse = {
  stocks: SubredditStock[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  lastUpdated: string;
};

export type PortfolioResponse = {
  portfolio: Portfolio;
};

export type TradeRequest = {
  stockId: string;
  type: 'buy' | 'sell';
  shares: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
};

export type TradeResponse = {
  success: boolean;
  message: string;
  trade?: {
    id: string;
    stockId: string;
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    total: number;
    timestamp: string;
  };
  updatedPortfolio?: Portfolio;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  portfolioValue: number;
  totalReturn: number;
  totalReturnPercent: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
};