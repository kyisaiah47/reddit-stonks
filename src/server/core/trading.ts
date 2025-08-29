import { redis } from '@devvit/web/server';
import { 
  Portfolio, 
  SubredditStock, 
  TradeRequest, 
  TradeResponse, 
  Holding,
  LeaderboardResponse,
  LeaderboardEntry 
} from '../../shared/types/api';

const STARTING_CASH = 10000;
const PORTFOLIO_KEY_PREFIX = 'portfolio:';

// In-memory storage for demo purposes (would use Redis in production)
const inMemoryPortfolios = new Map<string, Portfolio>();
const inMemoryLeaderboard = new Map<string, number>();

export async function getOrCreatePortfolio(userId: string): Promise<Portfolio> {
  const portfolioKey = `${PORTFOLIO_KEY_PREFIX}${userId}`;
  
  // Check in-memory first
  if (inMemoryPortfolios.has(userId)) {
    return inMemoryPortfolios.get(userId)!;
  }
  
  // Try Redis
  try {
    const portfolioData = await redis.get(portfolioKey);
    if (portfolioData) {
      const portfolio = JSON.parse(portfolioData);
      inMemoryPortfolios.set(userId, portfolio);
      return portfolio;
    }
  } catch (error) {
    console.warn('Redis unavailable, using in-memory storage');
  }

  // Create new portfolio
  const newPortfolio: Portfolio = {
    userId,
    totalValue: STARTING_CASH,
    cash: STARTING_CASH,
    holdings: [],
    totalReturn: 0,
    totalReturnPercent: 0
  };

  inMemoryPortfolios.set(userId, newPortfolio);
  
  try {
    await redis.set(portfolioKey, JSON.stringify(newPortfolio));
  } catch (error) {
    // Ignore Redis errors for demo
  }
  
  return newPortfolio;
}

export async function updatePortfolio(portfolio: Portfolio): Promise<void> {
  const portfolioKey = `${PORTFOLIO_KEY_PREFIX}${portfolio.userId}`;
  
  // Update in-memory
  inMemoryPortfolios.set(portfolio.userId, portfolio);
  
  // Update leaderboard
  inMemoryLeaderboard.set(portfolio.userId, portfolio.totalValue);
  
  try {
    await redis.set(portfolioKey, JSON.stringify(portfolio));
  } catch (error) {
    // Ignore Redis errors for demo
  }
}

export async function executeTrade(userId: string, trade: TradeRequest): Promise<TradeResponse> {
  try {
    const portfolio = await getOrCreatePortfolio(userId);
    
    // Mock stock data for demo
    const mockStocks = [
      { id: 'wallstreetbets', symbol: 'WSB', price: 45.67 },
      { id: 'stocks', symbol: 'STCK', price: 23.12 },
      { id: 'cryptocurrency', symbol: 'CRYP', price: 78.34 },
      { id: 'technology', symbol: 'TECH', price: 156.43 },
      { id: 'gaming', symbol: 'GAME', price: 34.89 }
    ];
    
    const stock = mockStocks.find(s => s.id === trade.stockId);
    if (!stock) {
      return {
        success: false,
        message: 'Stock not found'
      };
    }

    const executePrice = trade.orderType === 'market' ? stock.price : trade.limitPrice || stock.price;
    const totalCost = executePrice * trade.shares;

    if (trade.type === 'buy') {
      if (portfolio.cash < totalCost) {
        return {
          success: false,
          message: 'Insufficient funds'
        };
      }

      const updatedPortfolio = executeBuyOrder(portfolio, { ...stock, name: '', change: 0, volume: 0, marketCap: 0, subscribers: 0 }, trade.shares, executePrice);
      await updatePortfolio(updatedPortfolio);

      return {
        success: true,
        message: `Successfully bought ${trade.shares} shares of ${stock.symbol}`,
        trade: {
          id: generateTradeId(),
          stockId: stock.id,
          symbol: stock.symbol,
          type: 'buy',
          shares: trade.shares,
          price: executePrice,
          total: totalCost,
          timestamp: new Date().toISOString()
        },
        updatedPortfolio
      };
    } else {
      // Sell order
      const holding = portfolio.holdings.find(h => h.stockId === trade.stockId);
      if (!holding || holding.shares < trade.shares) {
        return {
          success: false,
          message: 'Insufficient shares to sell'
        };
      }

      const updatedPortfolio = executeSellOrder(portfolio, { ...stock, name: '', change: 0, volume: 0, marketCap: 0, subscribers: 0 }, trade.shares, executePrice);
      await updatePortfolio(updatedPortfolio);

      return {
        success: true,
        message: `Successfully sold ${trade.shares} shares of ${stock.symbol}`,
        trade: {
          id: generateTradeId(),
          stockId: stock.id,
          symbol: stock.symbol,
          type: 'sell',
          shares: trade.shares,
          price: executePrice,
          total: totalCost,
          timestamp: new Date().toISOString()
        },
        updatedPortfolio
      };
    }
  } catch (error) {
    console.error('Trade execution error:', error);
    return {
      success: false,
      message: 'Trade execution failed'
    };
  }
}

function executeBuyOrder(portfolio: Portfolio, stock: SubredditStock, shares: number, price: number): Portfolio {
  const totalCost = shares * price;
  const newCash = portfolio.cash - totalCost;
  
  const existingHolding = portfolio.holdings.find(h => h.stockId === stock.id);
  let newHoldings: Holding[];

  if (existingHolding) {
    const totalShares = existingHolding.shares + shares;
    const newAvgPrice = ((existingHolding.avgPrice * existingHolding.shares) + totalCost) / totalShares;
    
    newHoldings = portfolio.holdings.map(h => 
      h.stockId === stock.id 
        ? {
            ...h,
            shares: totalShares,
            avgPrice: newAvgPrice,
            currentPrice: stock.price,
            value: totalShares * stock.price,
            unrealizedPnL: (stock.price - newAvgPrice) * totalShares,
            unrealizedPnLPercent: ((stock.price - newAvgPrice) / newAvgPrice) * 100
          }
        : h
    );
  } else {
    const newHolding: Holding = {
      stockId: stock.id,
      symbol: stock.symbol,
      shares,
      avgPrice: price,
      currentPrice: stock.price,
      value: shares * stock.price,
      unrealizedPnL: (stock.price - price) * shares,
      unrealizedPnLPercent: ((stock.price - price) / price) * 100
    };
    newHoldings = [...portfolio.holdings, newHolding];
  }

  return calculatePortfolioMetrics({
    ...portfolio,
    cash: newCash,
    holdings: newHoldings
  });
}

function executeSellOrder(portfolio: Portfolio, stock: SubredditStock, shares: number, price: number): Portfolio {
  const totalProceeds = shares * price;
  const newCash = portfolio.cash + totalProceeds;
  
  const newHoldings = portfolio.holdings.map(holding => {
    if (holding.stockId === stock.id) {
      const remainingShares = holding.shares - shares;
      if (remainingShares === 0) {
        return null;
      }
      
      return {
        ...holding,
        shares: remainingShares,
        currentPrice: stock.price,
        value: remainingShares * stock.price,
        unrealizedPnL: (stock.price - holding.avgPrice) * remainingShares,
        unrealizedPnLPercent: ((stock.price - holding.avgPrice) / holding.avgPrice) * 100
      };
    }
    return holding;
  }).filter(Boolean) as Holding[];

  return calculatePortfolioMetrics({
    ...portfolio,
    cash: newCash,
    holdings: newHoldings
  });
}

function calculatePortfolioMetrics(portfolio: Portfolio): Portfolio {
  const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + h.value, 0);
  const totalValue = holdingsValue + portfolio.cash;
  const totalReturn = totalValue - STARTING_CASH;
  const totalReturnPercent = (totalReturn / STARTING_CASH) * 100;

  return {
    ...portfolio,
    totalValue,
    totalReturn,
    totalReturnPercent
  };
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  try {
    // Use in-memory leaderboard
    const sortedEntries = Array.from(inMemoryLeaderboard.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const leaderboard: LeaderboardEntry[] = [];
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (!entry) continue;
      const [userId, portfolioValue] = entry;
      const portfolio = await getOrCreatePortfolio(userId);
      
      leaderboard.push({
        rank: i + 1,
        username: userId,
        portfolioValue,
        totalReturn: portfolio.totalReturn,
        totalReturnPercent: portfolio.totalReturnPercent
      });
    }

    return {
      leaderboard,
      totalUsers: inMemoryLeaderboard.size
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      leaderboard: [],
      totalUsers: 0
    };
  }
}

export async function setMarketData(marketData: any): Promise<void> {
  // For demo purposes, we'll just log that we received market data
  console.log('Market data updated:', marketData.stocks.length, 'stocks');
}

function generateTradeId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}