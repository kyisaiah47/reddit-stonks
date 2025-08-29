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
export type StockCategory = 
  | 'meme' 
  | 'blue-chip' 
  | 'tech-growth' 
  | 'entertainment' 
  | 'lifestyle' 
  | 'sports' 
  | 'creative' 
  | 'science' 
  | 'niche';

export type SubredditStock = {
  id: string;
  symbol: string; // e.g., "WSB" for r/wallstreetbets
  name: string;   // e.g., "r/wallstreetbets"
  price: number;
  change: number; // percentage change
  volume: number;
  marketCap: number;
  subscribers: number;
  dailyActiveUsers?: number | undefined;
  category: StockCategory;
  volatilityMultiplier: number; // Category-based volatility modifier
  isDividendStock: boolean;
  basePrice: number; // Price before real-time adjustments
  priceDrivers: {
    subscriberGrowth: number;
    postActivity: number;
    engagementScore: number;
    viralBoost: number;
    sentiment: number;
    tradingImpact: number;
  };
};

export type Portfolio = {
  userId: string;
  totalValue: number;
  cash: number;
  holdings: Holding[];
  totalReturn: number;
  totalReturnPercent: number;
  dividendIncome: number;
  riskScore: number;
  diversificationScore: number;
  sectorAllocations: {
    [category in StockCategory]: number;
  };
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
  marketEvents: MarketEvent[];
  sectorPerformance: SectorPerformance[];
};

export type MarketEvent = {
  id: string;
  type: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news';
  subredditId: string;
  title: string;
  impact: number; // Price impact multiplier
  duration: number; // Duration in minutes
  timestamp: string;
};

export type SectorPerformance = {
  category: StockCategory;
  avgChange: number;
  volume: number;
  topGainer: string;
  topLoser: string;
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

export type Achievement = {
  id: string;
  name: string;
  description: string;
  type: 'diamond-hands' | 'paper-hands' | 'diversification' | 'sector-specialist' | 'risk-taker' | 'value-investor';
  criteria: {
    [key: string]: number;
  };
  reward: {
    type: 'cash' | 'multiplier' | 'badge';
    value: number;
  };
  unlockedAt?: string;
};

export type UserAchievements = {
  userId: string;
  achievements: Achievement[];
  progress: {
    [achievementId: string]: number;
  };
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
  achievements?: UserAchievements;
};