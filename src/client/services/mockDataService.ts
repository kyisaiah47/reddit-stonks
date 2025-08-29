import { SubredditStock, MarketDataResponse } from '../../shared/types/api';

export const mockStocks: SubredditStock[] = [
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

export function generateMockMarketData(): MarketDataResponse {
  // Add small random fluctuations to prices
  const stocks = mockStocks.map(stock => ({
    ...stock,
    price: Math.round((stock.price * (1 + (Math.random() - 0.5) * 0.02)) * 100) / 100,
    change: Math.round((stock.change + (Math.random() - 0.5) * 2) * 100) / 100
  }));

  const positiveChanges = stocks.filter(s => s.change > 0).length;
  const negativeChanges = stocks.filter(s => s.change < 0).length;
  const avgChange = stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length;

  let marketSentiment: 'bullish' | 'bearish' | 'neutral';
  if (avgChange > 1 && positiveChanges > negativeChanges) {
    marketSentiment = 'bullish';
  } else if (avgChange < -1 && negativeChanges > positiveChanges) {
    marketSentiment = 'bearish';
  } else {
    marketSentiment = 'neutral';
  }

  return {
    stocks,
    marketSentiment,
    lastUpdated: new Date().toISOString()
  };
}