import { SubredditStock, MarketDataResponse, MarketEvent, SectorPerformance, StockCategory } from '../../shared/types/api';
import { STOCK_UNIVERSE, StockDefinition } from '../data/stockUniverse';
import { redditApiService, RedditSubredditData } from './redditApiService';
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
    this.initializeStocks();
    this.startRealTimeUpdates();
  }

  private async initializeStocks(): Promise<void> {
    console.log('Initializing stock universe with base prices...');
    
    // Initialize all stocks with base prices
    for (const stockDef of STOCK_UNIVERSE) {
      try {
        // Try to get real Reddit data first
        const redditData = await redditApiService.fetchSubredditData(stockDef.subreddit);
        
        if (redditData) {
          const priceResult = pricingEngine.calculateStockPrice(stockDef, redditData);
          const stock = this.createStockFromData(stockDef, redditData, priceResult);
          this.stockCache.set(stockDef.id, stock);
          pricingEngine.initializePrice(stockDef.id, stock.price);
          console.log(`✓ Initialized ${stockDef.symbol} at $${stock.price.toFixed(2)}`);
        } else {
          // Fallback to estimated data
          const fallbackData = this.createFallbackRedditData(stockDef);
          const priceResult = pricingEngine.calculateStockPrice(stockDef, fallbackData);
          const stock = this.createStockFromData(stockDef, fallbackData, priceResult);
          this.stockCache.set(stockDef.id, stock);
          pricingEngine.initializePrice(stockDef.id, stock.price);
          console.log(`⚠ Initialized ${stockDef.symbol} with fallback data at $${stock.price.toFixed(2)}`);
        }

        // Initialize trading data
        this.tradingData.set(stockDef.id, {
          volume: Math.floor(Math.random() * 10000) + 1000,
          buyPressure: 0,
          sellPressure: 0
        });

      } catch (error) {
        console.error(`Failed to initialize ${stockDef.symbol}:`, error);
        // Use fallback initialization
        const fallbackData = this.createFallbackRedditData(stockDef);
        const priceResult = pricingEngine.calculateStockPrice(stockDef, fallbackData);
        const stock = this.createStockFromData(stockDef, fallbackData, priceResult);
        this.stockCache.set(stockDef.id, stock);
        pricingEngine.initializePrice(stockDef.id, stock.price);
      }
    }

    console.log(`Initialized ${this.stockCache.size} stocks successfully`);
  }

  private createFallbackRedditData(stockDef: StockDefinition): RedditSubredditData {
    // Create realistic fallback data based on category and size
    let baseSubscribers = 100000;
    
    // Adjust base subscribers by category
    switch (stockDef.category) {
      case 'blue-chip':
        baseSubscribers = Math.floor(Math.random() * 10000000) + 5000000; // 5M-15M
        break;
      case 'meme':
        baseSubscribers = Math.floor(Math.random() * 3000000) + 1000000; // 1M-4M
        break;
      case 'tech-growth':
        baseSubscribers = Math.floor(Math.random() * 2000000) + 500000; // 500K-2.5M
        break;
      case 'entertainment':
        baseSubscribers = Math.floor(Math.random() * 5000000) + 1000000; // 1M-6M
        break;
      default:
        baseSubscribers = Math.floor(Math.random() * 1000000) + 100000; // 100K-1.1M
    }

    return {
      subreddit: stockDef.subreddit,
      subscribers: baseSubscribers,
      activeUsers: Math.floor(baseSubscribers * (0.001 + Math.random() * 0.01)), // 0.1%-1.1% active
      subscriberGrowth: (Math.random() - 0.5) * 0.02, // -1% to +1% daily growth
      postActivity: 0.5 + Math.random() * 1.5, // 0.5x to 2.0x normal activity
      engagementScore: Math.random() * 0.8 + 0.1, // 0.1 to 0.9 engagement
      viralBoost: Math.random() * 0.3, // 0 to 0.3 viral boost
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
      console.log('🔄 Updating all stock prices...');
      
      // Batch fetch Reddit data (respecting rate limits)
      const subredditNames = STOCK_UNIVERSE.map(stock => stock.subreddit);
      const redditDataMap = await redditApiService.fetchBatchSubredditData(subredditNames);

      const priceResults = new Map<string, PriceCalculationResult>();
      const categoryMap = new Map<string, StockCategory>();

      // Calculate new prices for all stocks
      for (const stockDef of STOCK_UNIVERSE) {
        const redditData = redditDataMap.get(stockDef.subreddit) || this.createFallbackRedditData(stockDef);
        const trading = this.tradingData.get(stockDef.id)!;
        
        const priceResult = pricingEngine.calculateStockPrice(
          stockDef,
          redditData,
          trading.volume,
          trading.buyPressure,
          trading.sellPressure
        );

        priceResults.set(stockDef.id, priceResult);
        categoryMap.set(stockDef.id, stockDef.category);

        // Apply time-based volatility
        const hourlyMultiplier = pricingEngine.getHourlyVolatilityMultiplier();
        const weeklyMultiplier = pricingEngine.getWeeklyVolatilityMultiplier();
        priceResult.change *= hourlyMultiplier * weeklyMultiplier;

        // Apply circuit breakers
        priceResult.change = pricingEngine.applyCircuitBreakers(priceResult.change, stockDef.id);
      }

      // Apply sector correlation
      pricingEngine.applySectorCorrelation(priceResults, categoryMap);

      // Update stock cache
      for (const stockDef of STOCK_UNIVERSE) {
        const priceResult = priceResults.get(stockDef.id)!;
        const redditData = redditDataMap.get(stockDef.subreddit) || this.createFallbackRedditData(stockDef);
        const updatedStock = this.createStockFromData(stockDef, redditData, priceResult);
        
        this.stockCache.set(stockDef.id, updatedStock);
      }

      // Update trading volumes (simulate some trading activity)
      this.simulateTradingActivity();

      this.lastUpdateTime = Date.now();
      const elapsed = this.lastUpdateTime - startTime;
      console.log(`✅ Updated ${STOCK_UNIVERSE.length} stocks in ${elapsed}ms`);

    } catch (error) {
      console.error('❌ Failed to update stock prices:', error);
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