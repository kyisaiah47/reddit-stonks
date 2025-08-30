import { SubredditStock, MarketDataResponse, MarketEvent, SectorPerformance, StockCategory } from '../../shared/types/api';
import { STOCK_UNIVERSE, StockDefinition } from '../data/stockUniverse';
import { RedditSubredditData } from './redditApiService';
import { devvitRedditService } from './devvitRedditService';
import { pricingEngine, PriceCalculationResult } from './pricingEngine';

export interface TradingData {
  volume: number;
  buyPressure: number;
  sellPressure: number;
}

export class MarketDataService {
  private stockCache: Map<string, SubredditStock> = new Map();
  private tradingData: Map<string, TradingData> = new Map();
  private marketEvents: MarketEvent[] = [];
  private isUpdating = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;

  constructor() {
    this.initializeStocksBasic();
    this.startRealTimeUpdates();
  }

  private initializeStocksBasic(): void {
    console.log('Initializing stock universe with basic data - Reddit API will be fetched on request...');
    
    // Initialize stocks with minimal data - Reddit API requires request context
    for (const stockDef of STOCK_UNIVERSE) {
      // Create basic stock with default price
      const stock: SubredditStock = {
        id: stockDef.id,
        symbol: stockDef.symbol,
        name: stockDef.name,
        price: stockDef.basePrice,
        change: 0,
        volume: 0,
        marketCap: 0,
        subscribers: 0,
        dailyActiveUsers: 0,
        category: stockDef.category,
        volatilityMultiplier: stockDef.volatilityMultiplier,
        isDividendStock: stockDef.isDividendStock,
        basePrice: stockDef.basePrice,
        priceDrivers: {
          subscribers: 0,
          activeUsers: 0,
          engagement: 0,
          sentiment: 0,
          viral: 0,
          trading: 0
        }
      };
      
      this.stockCache.set(stockDef.id, stock);
      pricingEngine.initializePrice(stockDef.id, stock.price);
      
      // Initialize trading data
      this.tradingData.set(stockDef.id, {
        volume: 0,
        buyPressure: 0,
        sellPressure: 0
      });
    }

    console.log(`✅ Initialized ${this.stockCache.size} stocks with basic data - Reddit API pending request context`);
  }

  private createFallbackRedditData(stockDef: StockDefinition): RedditSubredditData {
    // Generate realistic fallback data based on stock category and size
    let baseSubscribers = 50000;
    let activeUsersRatio = 0.01;
    let engagementBase = 0.3;
    
    switch (stockDef.category) {
      case 'meme':
        baseSubscribers = Math.floor(Math.random() * 2000000) + 500000; // 0.5M-2.5M
        activeUsersRatio = 0.03; // Higher engagement
        engagementBase = 0.6;
        break;
      case 'blue-chip':
        baseSubscribers = Math.floor(Math.random() * 1000000) + 200000; // 0.2M-1.2M
        activeUsersRatio = 0.015;
        engagementBase = 0.4;
        break;
      case 'tech-growth':
        baseSubscribers = Math.floor(Math.random() * 800000) + 100000; // 0.1M-0.9M
        activeUsersRatio = 0.02;
        engagementBase = 0.5;
        break;
      default:
        baseSubscribers = Math.floor(Math.random() * 300000) + 50000; // 50K-350K
        activeUsersRatio = 0.01;
        engagementBase = 0.3;
    }
    
    const subscribers = baseSubscribers;
    const activeUsers = Math.floor(subscribers * activeUsersRatio);
    
    return {
      subreddit: stockDef.subreddit,
      subscribers,
      activeUsers,
      subscriberGrowth: (Math.random() - 0.5) * 0.1, // -5% to +5% growth
      postActivity: 0.5 + Math.random() * 0.5, // 0.5-1.0 activity level
      engagementScore: engagementBase + (Math.random() - 0.5) * 0.2,
      viralBoost: Math.random() * 0.3, // 0-0.3 viral boost
      sentiment: (Math.random() - 0.5) * 1.5, // -0.75 to +0.75 sentiment
      lastUpdated: new Date()
    };
  }

  private createStockFromData(
    stockDef: StockDefinition, 
    redditData: RedditSubredditData, 
    priceResult: PriceCalculationResult
  ): SubredditStock {
    const trading = this.tradingData.get(stockDef.id);
    
    return {
      id: stockDef.id,
      symbol: stockDef.symbol,
      name: stockDef.name,
      price: priceResult.finalPrice,
      change: priceResult.change,
      volume: trading?.volume || 1000,
      marketCap: priceResult.finalPrice * redditData.subscribers / 1000, // Simplified market cap
      subscribers: redditData.subscribers,
      dailyActiveUsers: redditData.activeUsers,
      category: stockDef.category,
      volatilityMultiplier: stockDef.volatilityMultiplier,
      isDividendStock: stockDef.isDividendStock,
      basePrice: priceResult.basePrice,
      priceDrivers: priceResult.priceDrivers
    };
  }

  private startRealTimeUpdates(): void {
    // Update every 30 seconds during market hours, 5 minutes off-peak
    const updateFrequency = this.getUpdateFrequency();
    
    this.updateInterval = setInterval(async () => {
      await this.updateAllStockPrices();
    }, updateFrequency);

    console.log(`Started real-time updates every ${updateFrequency / 1000} seconds`);
  }

  private getUpdateFrequency(): number {
    const hour = new Date().getHours();
    // Peak trading hours (10 AM - 4 PM): 30 seconds
    // Other times: 5 minutes
    return (hour >= 10 && hour < 16) ? 30000 : 300000;
  }

  private async updateAllStockPrices(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    const startTime = Date.now();

    try {
      console.log('⏰ Periodic price update - simulating trading activity only (Reddit API requires request context)');
      
      // Only simulate trading activity during periodic updates
      // Reddit API data will be fetched during actual API requests
      this.simulateTradingActivity();

      this.lastUpdateTime = Date.now();
      const elapsed = this.lastUpdateTime - startTime;
      console.log(`✅ Simulated trading activity in ${elapsed}ms - waiting for API request to fetch Reddit data`);

    } catch (error) {
      console.error('❌ Failed to update trading activity:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private simulateTradingActivity(): void {
    // Simulate realistic trading activity
    for (const [stockId, trading] of this.tradingData) {
      const stock = this.stockCache.get(stockId);
      if (!stock) continue;

      // Base volume varies by category and time
      let baseVolume = 1000;
      switch (stock.category) {
        case 'meme':
          baseVolume = 5000 + Math.random() * 15000;
          break;
        case 'blue-chip':
          baseVolume = 2000 + Math.random() * 8000;
          break;
        case 'tech-growth':
          baseVolume = 1500 + Math.random() * 6000;
          break;
        default:
          baseVolume = 500 + Math.random() * 3000;
      }

      // Apply volatility multiplier to volume
      baseVolume *= stock.volatilityMultiplier;

      // Apply time-based activity
      const hourlyMultiplier = pricingEngine.getHourlyVolatilityMultiplier();
      baseVolume *= hourlyMultiplier;

      // Random walk for buy/sell pressure
      const pressureChange = (Math.random() - 0.5) * 200;
      const netPressure = trading.buyPressure - trading.sellPressure + pressureChange;
      
      trading.volume = Math.floor(baseVolume);
      trading.buyPressure = Math.max(0, Math.floor(baseVolume * 0.5 + netPressure * 0.5));
      trading.sellPressure = Math.max(0, Math.floor(baseVolume * 0.5 - netPressure * 0.5));
    }
  }

  public async getMarketData(): Promise<MarketDataResponse> {
    console.log('📊 Market data requested - attempting to fetch fresh Reddit API data...');
    
    // Try to refresh Reddit data now that we have request context
    await this.refreshAllRedditData();
    
    const stocks = Array.from(this.stockCache.values());
    
    // Calculate market sentiment
    const totalChange = stocks.reduce((sum, stock) => sum + stock.change, 0);
    const avgChange = totalChange / stocks.length;
    
    let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (avgChange > 1) marketSentiment = 'bullish';
    else if (avgChange < -1) marketSentiment = 'bearish';

    // Calculate sector performance
    const sectorPerformance = this.calculateSectorPerformance(stocks);

    return {
      stocks,
      marketSentiment,
      lastUpdated: new Date(this.lastUpdateTime).toISOString(),
      marketEvents: this.marketEvents,
      sectorPerformance
    };
  }

  private calculateSectorPerformance(stocks: SubredditStock[]): SectorPerformance[] {
    const sectorMap = new Map<StockCategory, SubredditStock[]>();
    
    // Group stocks by sector
    stocks.forEach(stock => {
      if (!sectorMap.has(stock.category)) {
        sectorMap.set(stock.category, []);
      }
      sectorMap.get(stock.category)!.push(stock);
    });

    // Calculate performance for each sector
    return Array.from(sectorMap.entries()).map(([category, sectorStocks]) => {
      const avgChange = sectorStocks.reduce((sum, stock) => sum + stock.change, 0) / sectorStocks.length;
      const totalVolume = sectorStocks.reduce((sum, stock) => sum + stock.volume, 0);
      
      const sortedByChange = [...sectorStocks].sort((a, b) => b.change - a.change);
      
      return {
        category,
        avgChange,
        volume: totalVolume,
        topGainer: sortedByChange[0]?.symbol || '',
        topLoser: sortedByChange[sortedByChange.length - 1]?.symbol || ''
      };
    });
  }

  public getStock(stockId: string): SubredditStock | undefined {
    return this.stockCache.get(stockId);
  }

  public getAllStocks(): SubredditStock[] {
    return Array.from(this.stockCache.values());
  }

  public addTradingImpact(stockId: string, volume: number, type: 'buy' | 'sell'): void {
    const trading = this.tradingData.get(stockId);
    if (trading) {
      trading.volume += volume;
      if (type === 'buy') {
        trading.buyPressure += volume;
      } else {
        trading.sellPressure += volume;
      }
    }
  }

  public triggerMarketEvent(
    subredditId: string,
    eventType: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news',
    impact: number,
    durationMinutes: number,
    title: string
  ): void {
    const event: MarketEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      subredditId,
      title,
      impact,
      duration: durationMinutes,
      timestamp: new Date().toISOString()
    };

    this.marketEvents.unshift(event);
    
    // Keep only recent events
    this.marketEvents = this.marketEvents.slice(0, 50);

    // Trigger the event in the pricing engine
    pricingEngine.triggerMarketEvent(subredditId, eventType, impact, durationMinutes);

    console.log(`🚨 Market event triggered: ${eventType} for ${subredditId} (${impact}% impact for ${durationMinutes}min)`);
  }

  public getRecentEvents(limit: number = 10): MarketEvent[] {
    return this.marketEvents.slice(0, limit);
  }

  // Test Reddit API connection
  public async testRedditConnection(): Promise<boolean> {
    console.log('🧪 Testing Reddit API connection...');
    try {
      const testResult = await devvitRedditService.fetchSubredditData('test');
      console.log(`🧪 Reddit API test result:`, testResult ? '✅ CONNECTED' : '❌ NO DATA');
      return testResult !== null;
    } catch (error) {
      console.log(`🧪 Reddit API test error:`, error);
      return false;
    }
  }

  // Method to refresh Reddit data for ALL stocks
  public async refreshAllRedditData(): Promise<void> {
    console.log('🔄 Testing Reddit API connection first...');
    const isConnected = await this.testRedditConnection();
    
    if (!isConnected) {
      console.error('❌ Reddit API connection test failed - skipping data refresh');
      return;
    }

    console.log('✅ Reddit API connected - proceeding with data refresh...');
    const stocksToUpdate = STOCK_UNIVERSE;
      
    console.log(`🔄 Refreshing Reddit data for ${stocksToUpdate.length} stocks...`);
    
    for (const stockDef of stocksToUpdate) {
      try {
        const redditData = await devvitRedditService.fetchSubredditData(stockDef.subreddit);
        
        if (redditData) {
          const trading = this.tradingData.get(stockDef.id);
          if (trading) {
            const priceResult = pricingEngine.calculateStockPrice(
              stockDef,
              redditData,
              trading.volume,
              trading.buyPressure,
              trading.sellPressure
            );
            
            const updatedStock = this.createStockFromData(stockDef, redditData, priceResult);
            this.stockCache.set(stockDef.id, updatedStock);
            
            console.log(`✅ Updated ${stockDef.symbol} with fresh Reddit data at $${updatedStock.price.toFixed(2)}`);
          }
        } else {
          console.warn(`❌ No Reddit data for ${stockDef.symbol}`);
        }
      } catch (error) {
        console.error(`❌ Failed to refresh Reddit data for ${stockDef.symbol}: ${error}`);
        // Keep existing data - don't log as error since this is expected
      }
    }
  }

  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getSystemStatus() {
    return {
      totalStocks: this.stockCache.size,
      isUpdating: this.isUpdating,
      lastUpdate: new Date(this.lastUpdateTime).toISOString(),
      cacheSize: this.stockCache.size,
      activeEvents: this.marketEvents.length,
      updateFrequency: this.getUpdateFrequency()
    };
  }
}

export const marketDataService = new MarketDataService();