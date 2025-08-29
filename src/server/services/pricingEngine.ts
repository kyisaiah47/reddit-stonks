import { SubredditStock, StockCategory } from '../../shared/types/api';
import { StockDefinition } from '../data/stockUniverse';
import { RedditSubredditData } from './redditApiService';

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  change: number;
  priceDrivers: {
    subscriberGrowth: number;
    postActivity: number;
    engagementScore: number;
    viralBoost: number;
    sentiment: number;
    tradingImpact: number;
  };
  volatilityAdjustedChange: number;
}

export class PricingEngine {
  private previousPrices: Map<string, number> = new Map();
  private tradingImpacts: Map<string, number> = new Map();
  private marketEvents: Map<string, { impact: number; expiry: Date }> = new Map();

  calculateStockPrice(
    stockDef: StockDefinition, 
    redditData: RedditSubredditData,
    tradingVolume: number = 0,
    buyPressure: number = 0,
    sellPressure: number = 0
  ): PriceCalculationResult {
    
    // 1. Calculate Base Price
    const basePrice = this.calculateBasePrice(stockDef, redditData);

    // 2. Calculate Reddit Engagement Impact (70% of price movement)
    const redditImpact = this.calculateRedditImpact(redditData, stockDef.volatilityMultiplier);

    // 3. Calculate Trading Impact (30% of price movement)
    const tradingImpact = this.calculateTradingImpact(
      stockDef.id, 
      tradingVolume, 
      buyPressure, 
      sellPressure
    );

    // 4. Apply Market Events
    const eventImpact = this.getMarketEventImpact(stockDef.id);

    // 5. Calculate Final Price
    const totalImpact = (redditImpact * 0.7) + (tradingImpact * 0.3) + eventImpact;
    const finalPrice = basePrice * (1 + totalImpact);

    // 6. Calculate Change from Previous Price
    const previousPrice = this.previousPrices.get(stockDef.id) || basePrice;
    const change = ((finalPrice - previousPrice) / previousPrice) * 100;

    // 7. Apply Volatility Adjustment
    const volatilityAdjustedChange = change * stockDef.volatilityMultiplier;
    const volatilityAdjustedPrice = previousPrice * (1 + (volatilityAdjustedChange / 100));

    // Update cache
    this.previousPrices.set(stockDef.id, volatilityAdjustedPrice);
    this.tradingImpacts.set(stockDef.id, tradingImpact);

    return {
      basePrice,
      finalPrice: Math.max(0.01, volatilityAdjustedPrice), // Prevent negative prices
      change: volatilityAdjustedChange,
      priceDrivers: {
        subscriberGrowth: redditData.subscriberGrowth,
        postActivity: redditData.postActivity,
        engagementScore: redditData.engagementScore,
        viralBoost: redditData.viralBoost,
        sentiment: redditData.sentiment,
        tradingImpact
      },
      volatilityAdjustedChange
    };
  }

  private calculateBasePrice(stockDef: StockDefinition, redditData: RedditSubredditData): number {
    // Base price formula from README3.md
    const subscriberComponent = (redditData.subscribers / 1000) * stockDef.categoryMultiplier;
    const activityComponent = (redditData.activeUsers / 100) * 0.5; // Activity weight
    
    return Math.max(1, subscriberComponent + activityComponent);
  }

  private calculateRedditImpact(redditData: RedditSubredditData, volatilityMultiplier: number): number {
    // Subscriber Growth Impact (0.3 weight)
    const subscriberImpact = redditData.subscriberGrowth * 0.3;

    // Post Activity Impact (0.2 weight)
    const activityImpact = (redditData.postActivity - 1.0) * 0.2;

    // Engagement Quality Impact (0.4 weight for quality multiplier)
    const qualityMultiplier = 0.8 + (redditData.engagementScore * 0.4);
    const engagementImpact = (qualityMultiplier - 1.0) * 0.15;

    // Viral Boost Impact
    const viralImpact = redditData.viralBoost;

    // Sentiment Impact
    const sentimentImpact = redditData.sentiment * 0.1;

    const totalRedditImpact = subscriberImpact + activityImpact + engagementImpact + viralImpact + sentimentImpact;

    // Apply volatility boost
    const volatilityBoost = Math.abs(redditData.postActivity - 1.0) * 0.2;
    
    return totalRedditImpact * (1 + volatilityBoost);
  }

  private calculateTradingImpact(
    stockId: string, 
    volume: number, 
    buyPressure: number, 
    sellPressure: number
  ): number {
    if (volume === 0) return 0;

    // Order book simulation
    const netPressure = (buyPressure - sellPressure) / volume;
    const pressureImpact = netPressure * 0.3;

    // Volume-based price impact with liquidity factor
    const liquidityFactor = this.getLiquidityFactor(stockId);
    const volumeImpact = (volume / 1000) / liquidityFactor;

    return pressureImpact + (volumeImpact * 0.1);
  }

  private getLiquidityFactor(stockId: string): number {
    // Higher liquidity = lower price impact from trades
    // This would be based on historical trading volume and market cap
    return 1.0; // Simplified for now
  }

  private getMarketEventImpact(stockId: string): number {
    const event = this.marketEvents.get(stockId);
    if (!event || event.expiry < new Date()) {
      this.marketEvents.delete(stockId);
      return 0;
    }
    return event.impact;
  }

  // Market Events Management
  triggerMarketEvent(
    stockId: string, 
    eventType: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news',
    impact: number,
    durationMinutes: number
  ): void {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + durationMinutes);

    this.marketEvents.set(stockId, { impact, expiry });
  }

  // Time-based patterns
  getHourlyVolatilityMultiplier(): number {
    const hour = new Date().getHours();
    
    // Peak Reddit usage = higher volatility
    if (hour >= 0 && hour < 6) return 0.3;   // Low activity overnight
    if (hour >= 7 && hour < 9) return 0.8;   // Morning ramp-up
    if (hour >= 10 && hour < 16) return 1.2; // Peak day trading hours
    if (hour >= 17 && hour < 23) return 1.0; // Evening activity
    return 0.5; // Default
  }

  getWeeklyVolatilityMultiplier(): number {
    const day = new Date().getDay();
    
    switch (day) {
      case 1: return 1.1; // Monday - market open effect
      case 2: 
      case 3: return 1.0; // Tuesday/Wednesday - stability
      case 4: 
      case 5: return 0.9; // Thursday/Friday - profit taking
      case 0: 
      case 6: return 0.7; // Weekend - lower volume
      default: return 1.0;
    }
  }

  // Sector Correlation
  applySectorCorrelation(stocks: Map<string, PriceCalculationResult>, categories: Map<string, StockCategory>): void {
    const sectorMovements = new Map<StockCategory, number>();
    const sectorCounts = new Map<StockCategory, number>();

    // Calculate average sector movements
    stocks.forEach((result, stockId) => {
      const category = categories.get(stockId);
      if (category) {
        const current = sectorMovements.get(category) || 0;
        const count = sectorCounts.get(category) || 0;
        sectorMovements.set(category, current + result.change);
        sectorCounts.set(category, count + 1);
      }
    });

    // Apply correlation effect (10% of sector average)
    stocks.forEach((result, stockId) => {
      const category = categories.get(stockId);
      if (category) {
        const sectorAvg = (sectorMovements.get(category) || 0) / (sectorCounts.get(category) || 1);
        const correlationEffect = sectorAvg * 0.1;
        result.change += correlationEffect;
        result.finalPrice *= (1 + correlationEffect / 100);
      }
    });
  }

  // Circuit Breakers
  applyCircuitBreakers(change: number, stockId: string): number {
    const maxDailyChange = 50; // Maximum 50% daily change
    
    if (Math.abs(change) > maxDailyChange) {
      console.warn(`Circuit breaker triggered for ${stockId}: ${change}% -> ${maxDailyChange}%`);
      return change > 0 ? maxDailyChange : -maxDailyChange;
    }
    
    return change;
  }

  // Initialize historical prices
  initializePrice(stockId: string, price: number): void {
    this.previousPrices.set(stockId, price);
  }

  // Get current cached price
  getCurrentPrice(stockId: string): number | undefined {
    return this.previousPrices.get(stockId);
  }

  // Reset pricing engine
  reset(): void {
    this.previousPrices.clear();
    this.tradingImpacts.clear();
    this.marketEvents.clear();
  }
}

export const pricingEngine = new PricingEngine();