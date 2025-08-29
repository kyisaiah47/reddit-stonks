import { Portfolio } from '../../shared/types/api';

class StorageService {
  private readonly STORAGE_KEYS = {
    PORTFOLIO: 'reddit_stonks_portfolio',
    USER_ID: 'reddit_stonks_user_id',
    SETTINGS: 'reddit_stonks_settings',
  };

  // Portfolio Management
  savePortfolio(userId: string, portfolio: Portfolio): void {
    try {
      const storageKey = `${this.STORAGE_KEYS.PORTFOLIO}_${userId}`;
      const portfolioData = {
        ...portfolio,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(portfolioData));
    } catch (error) {
      console.warn('Failed to save portfolio to localStorage:', error);
    }
  }

  getPortfolio(userId: string): Portfolio | null {
    try {
      const storageKey = `${this.STORAGE_KEYS.PORTFOLIO}_${userId}`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const portfolioData = JSON.parse(stored);
      
      // Check if data is stale (older than 24 hours)
      if (portfolioData.lastUpdated) {
        const lastUpdated = new Date(portfolioData.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) {
          console.log('Portfolio data is stale, clearing...');
          this.clearPortfolio(userId);
          return null;
        }
      }

      // Remove metadata before returning
      const { lastUpdated, ...portfolio } = portfolioData;
      return portfolio;
    } catch (error) {
      console.warn('Failed to load portfolio from localStorage:', error);
      return null;
    }
  }

  clearPortfolio(userId: string): void {
    try {
      const storageKey = `${this.STORAGE_KEYS.PORTFOLIO}_${userId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear portfolio from localStorage:', error);
    }
  }

  // User ID Management
  saveUserId(userId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.warn('Failed to save user ID to localStorage:', error);
    }
  }

  getUserId(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.warn('Failed to load user ID from localStorage:', error);
      return null;
    }
  }

  generateUserId(): string {
    // For Devvit apps, we should use the Reddit username
    // This is a fallback for when Reddit user is not available
    const userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    this.saveUserId(userId);
    return userId;
  }

  // Devvit-specific methods
  getRedditUserId(username: string): string {
    // Use Reddit username as the primary user identifier
    return `reddit_${username}`;
  }

  // Settings Management
  saveSettings(settings: Record<string, any>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  getSettings(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      return {};
    }
  }

  // Utility Methods
  clearAllUserData(): void {
    try {
      // Clear all reddit-stonks related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reddit_stonks_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear user data from localStorage:', error);
    }
  }

  getStorageUsage(): {
    used: number;
    available: number;
    percentage: number;
  } {
    try {
      let totalSize = 0;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reddit_stonks_')) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      });

      // localStorage typically has ~5-10MB limit
      const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (totalSize / estimatedLimit) * 100;

      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        percentage: Math.min(percentage, 100)
      };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Export/Import for backup
  exportUserData(): string {
    try {
      const userData: Record<string, string> = {};
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reddit_stonks_')) {
          userData[key] = localStorage.getItem(key) || '';
        }
      });
      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.warn('Failed to export user data:', error);
      return '{}';
    }
  }

  importUserData(data: string): boolean {
    try {
      const userData = JSON.parse(data);
      Object.entries(userData).forEach(([key, value]) => {
        if (key.startsWith('reddit_stonks_') && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });
      return true;
    } catch (error) {
      console.warn('Failed to import user data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();