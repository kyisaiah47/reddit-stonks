import { redis, reddit } from '@devvit/web/server';
import { Portfolio, Holding } from '../../shared/types/api';

class UserDataService {
  private readonly STARTING_CASH = 10000;
  private readonly KEY_PREFIXES = {
    PORTFOLIO: 'portfolio:',
    TRADES: 'trades:',
    SETTINGS: 'settings:',
    STATS: 'stats:',
  };

  // Portfolio Management
  async getPortfolio(username: string): Promise<Portfolio> {
    try {
      const key = `${this.KEY_PREFIXES.PORTFOLIO}${username}`;
      const portfolioData = await redis.get(key);
      
      if (portfolioData) {
        const portfolio = JSON.parse(portfolioData);
        console.log(`📊 Loaded portfolio for Reddit user: ${username}`);
        return portfolio;
      }
    } catch (error) {
      console.error(`Error loading portfolio for ${username}:`, error);
    }

    // Create and save default portfolio
    const defaultPortfolio = this.createDefaultPortfolio(username);
    await this.savePortfolio(username, defaultPortfolio);
    console.log(`🆕 Created new portfolio for Reddit user: ${username}`);
    
    return defaultPortfolio;
  }

  async savePortfolio(username: string, portfolio: Portfolio): Promise<void> {
    try {
      const key = `${this.KEY_PREFIXES.PORTFOLIO}${username}`;
      const portfolioData = {
        ...portfolio,
        lastUpdated: new Date().toISOString(),
      };
      
      await redis.set(key, JSON.stringify(portfolioData));
      console.log(`💾 Saved portfolio for Reddit user: ${username}`);
    } catch (error) {
      console.error(`Error saving portfolio for ${username}:`, error);
    }
  }

  // Trade History Management
  async saveTradeHistory(username: string, trade: {
    id: string;
    stockId: string;
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    total: number;
    timestamp: string;
  }): Promise<void> {
    try {
      const key = `${this.KEY_PREFIXES.TRADES}${username}`;
      
      // Get existing trades
      const existingTrades = await redis.get(key);
      const trades = existingTrades ? JSON.parse(existingTrades) : [];
      
      // Add new trade to beginning (most recent first)
      trades.unshift(trade);
      
      // Keep only last 100 trades per user
      if (trades.length > 100) {
        trades.splice(100);
      }
      
      await redis.set(key, JSON.stringify(trades));
      console.log(`📈 Saved trade for ${username}: ${trade.type} ${trade.shares} ${trade.symbol}`);
    } catch (error) {
      console.error(`Error saving trade for ${username}:`, error);
    }
  }

  async getTradeHistory(username: string, limit: number = 20): Promise<any[]> {
    try {
      const key = `${this.KEY_PREFIXES.TRADES}${username}`;
      const tradesData = await redis.get(key);
      
      if (tradesData) {
        const trades = JSON.parse(tradesData);
        return trades.slice(0, limit);
      }
    } catch (error) {
      console.error(`Error loading trades for ${username}:`, error);
    }
    
    return [];
  }

  // User Settings Management  
  async saveUserSettings(username: string, settings: Record<string, any>): Promise<void> {
    try {
      const key = `${this.KEY_PREFIXES.SETTINGS}${username}`;
      const settingsData = {
        ...settings,
        lastUpdated: new Date().toISOString(),
      };
      
      await redis.set(key, JSON.stringify(settingsData));
      console.log(`⚙️ Saved settings for Reddit user: ${username}`);
    } catch (error) {
      console.error(`Error saving settings for ${username}:`, error);
    }
  }

  async getUserSettings(username: string): Promise<Record<string, any>> {
    try {
      const key = `${this.KEY_PREFIXES.SETTINGS}${username}`;
      const settingsData = await redis.get(key);
      
      if (settingsData) {
        const { lastUpdated, ...settings } = JSON.parse(settingsData);
        return settings;
      }
    } catch (error) {
      console.error(`Error loading settings for ${username}:`, error);
    }
    
    return {};
  }

  // User Statistics
  async updateUserStats(username: string, statsUpdate: {
    totalTrades?: number;
    totalVolume?: number;
    bestReturn?: number;
    worstReturn?: number;
    daysActive?: number;
  }): Promise<void> {
    try {
      const key = `${this.KEY_PREFIXES.STATS}${username}`;
      
      // Get existing stats
      const existingStats = await redis.get(key);
      const currentStats = existingStats ? JSON.parse(existingStats) : {
        totalTrades: 0,
        totalVolume: 0,
        bestReturn: 0,
        worstReturn: 0,
        daysActive: 0,
        firstTradeDate: new Date().toISOString(),
      };
      
      // Update stats
      const updatedStats = {
        ...currentStats,
        ...statsUpdate,
        lastUpdated: new Date().toISOString(),
      };
      
      await redis.set(key, JSON.stringify(updatedStats));
    } catch (error) {
      console.error(`Error updating stats for ${username}:`, error);
    }
  }

  async getUserStats(username: string): Promise<any> {
    try {
      const key = `${this.KEY_PREFIXES.STATS}${username}`;
      const statsData = await redis.get(key);
      
      if (statsData) {
        return JSON.parse(statsData);
      }
    } catch (error) {
      console.error(`Error loading stats for ${username}:`, error);
    }
    
    return {
      totalTrades: 0,
      totalVolume: 0,
      bestReturn: 0,
      worstReturn: 0,
      daysActive: 0,
    };
  }

  // Leaderboard Management
  async updateLeaderboard(username: string, portfolioValue: number, totalReturn: number): Promise<void> {
    try {
      // Use sorted sets for efficient leaderboard queries
      await redis.zadd('leaderboard:value', portfolioValue, username);
      await redis.zadd('leaderboard:return', totalReturn, username);
      
      // Keep only top 100 users in leaderboards
      await redis.zremrangebyrank('leaderboard:value', 0, -101);
      await redis.zremrangebyrank('leaderboard:return', 0, -101);
    } catch (error) {
      console.error(`Error updating leaderboard for ${username}:`, error);
    }
  }

  async getLeaderboard(type: 'value' | 'return' = 'value', limit: number = 10): Promise<Array<{
    username: string;
    value: number;
    rank: number;
  }>> {
    try {
      const key = `leaderboard:${type}`;
      const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      
      const leaderboard: Array<{ username: string; value: number; rank: number }> = [];
      
      for (let i = 0; i < results.length; i += 2) {
        leaderboard.push({
          username: results[i],
          value: parseFloat(results[i + 1]),
          rank: Math.floor(i / 2) + 1,
        });
      }
      
      return leaderboard;
    } catch (error) {
      console.error(`Error getting leaderboard:`, error);
      return [];
    }
  }

  // Utility Methods
  private createDefaultPortfolio(username: string): Portfolio {
    return {
      userId: username,
      totalValue: this.STARTING_CASH,
      cash: this.STARTING_CASH,
      holdings: [],
      totalReturn: 0,
      totalReturnPercent: 0,
    };
  }

  async clearUserData(username: string): Promise<void> {
    try {
      const keys = [
        `${this.KEY_PREFIXES.PORTFOLIO}${username}`,
        `${this.KEY_PREFIXES.TRADES}${username}`,
        `${this.KEY_PREFIXES.SETTINGS}${username}`,
        `${this.KEY_PREFIXES.STATS}${username}`,
      ];
      
      for (const key of keys) {
        await redis.del(key);
      }
      
      // Remove from leaderboards
      await redis.zrem('leaderboard:value', username);
      await redis.zrem('leaderboard:return', username);
      
      console.log(`🗑️ Cleared all data for Reddit user: ${username}`);
    } catch (error) {
      console.error(`Error clearing data for ${username}:`, error);
    }
  }

  // Admin/Debug Methods
  async getAllUsernames(): Promise<string[]> {
    try {
      const keys = await redis.keys(`${this.KEY_PREFIXES.PORTFOLIO}*`);
      return keys.map(key => key.replace(this.KEY_PREFIXES.PORTFOLIO, ''));
    } catch (error) {
      console.error('Error getting all usernames:', error);
      return [];
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalTrades: number;
    totalVolume: number;
  }> {
    try {
      const usernames = await this.getAllUsernames();
      let totalTrades = 0;
      let totalVolume = 0;
      
      for (const username of usernames) {
        const stats = await this.getUserStats(username);
        totalTrades += stats.totalTrades || 0;
        totalVolume += stats.totalVolume || 0;
      }
      
      return {
        totalUsers: usernames.length,
        totalTrades,
        totalVolume,
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return { totalUsers: 0, totalTrades: 0, totalVolume: 0 };
    }
  }
}

export const userDataService = new UserDataService();