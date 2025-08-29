import { Portfolio, Holding, TradeRequest, TradeResponse, SubredditStock } from '../../shared/types/api';
import { storageService } from './storageService';

class TradingService {
  private readonly STARTING_CASH = 10000;

  async getPortfolio(userId: string): Promise<Portfolio> {
    try {
      const response = await fetch(`/api/portfolio?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const portfolio = data.portfolio;
        
        console.log(`📊 Loaded portfolio for ${userId} from Redis via API`);
        return portfolio;
      } else {
        console.error('Portfolio API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching portfolio from API:', error);
    }

    // Fallback to default portfolio (should rarely happen with Redis backend)
    const defaultPortfolio = this.createDefaultPortfolio(userId);
    console.log(`📊 Created fallback portfolio for ${userId}`);
    
    return defaultPortfolio;
  }

  async executeTrade(userId: string, trade: TradeRequest, currentStocks: SubredditStock[]): Promise<TradeResponse> {
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...trade, userId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📈 Trade executed for ${userId}: ${trade.type} ${trade.shares} ${result.trade?.symbol || 'shares'}`);
        return result;
      } else {
        const errorData = await response.json();
        console.error('Trade API error:', response.status, errorData);
        return {
          success: false,
          message: errorData.message || 'Trade execution failed'
        };
      }
    } catch (error) {
      console.error('Error executing trade via API:', error);
      return {
        success: false,
        message: 'Network error: Failed to execute trade'
      };
    }
  }

  updatePortfolioWithCurrentPrices(portfolio: Portfolio, currentStocks: SubredditStock[]): Portfolio {
    const updatedHoldings = portfolio.holdings.map(holding => {
      const currentStock = currentStocks.find(s => s.id === holding.stockId);
      if (!currentStock) return holding;

      return {
        ...holding,
        currentPrice: currentStock.price,
        value: holding.shares * currentStock.price,
        unrealizedPnL: (currentStock.price - holding.avgPrice) * holding.shares,
        unrealizedPnLPercent: ((currentStock.price - holding.avgPrice) / holding.avgPrice) * 100
      };
    });

    return this.calculatePortfolioMetrics({
      ...portfolio,
      holdings: updatedHoldings
    });
  }

  private calculatePortfolioMetrics(portfolio: Portfolio): Portfolio {
    const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + h.value, 0);
    const totalValue = holdingsValue + portfolio.cash;
    const totalReturn = totalValue - this.STARTING_CASH;
    const totalReturnPercent = (totalReturn / this.STARTING_CASH) * 100;

    return {
      ...portfolio,
      totalValue,
      totalReturn,
      totalReturnPercent
    };
  }

  private createDefaultPortfolio(userId: string): Portfolio {
    return {
      userId,
      totalValue: this.STARTING_CASH,
      cash: this.STARTING_CASH,
      holdings: [],
      totalReturn: 0,
      totalReturnPercent: 0
    };
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Portfolio analytics methods
  calculatePortfolioRisk(portfolio: Portfolio, _stocks: SubredditStock[]): {
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
  } {
    // Simplified risk calculations for demo
    const holdingsCount = portfolio.holdings.length;
    const diversificationFactor = Math.min(1, holdingsCount / 10); // More holdings = lower risk
    
    return {
      beta: 1.0 - (diversificationFactor * 0.3), // Beta decreases with diversification
      sharpeRatio: portfolio.totalReturnPercent / 10, // Simplified Sharpe ratio
      maxDrawdown: Math.abs(Math.min(0, portfolio.totalReturnPercent)) // Simplified max drawdown
    };
  }

  getRecommendedTrades(portfolio: Portfolio, stocks: SubredditStock[]): {
    action: 'buy' | 'sell';
    stockId: string;
    reason: string;
    confidence: number;
  }[] {
    const recommendations: {
      action: 'buy' | 'sell';
      stockId: string;
      reason: string;
      confidence: number;
    }[] = [];
    
    // Find undervalued stocks (price dropped significantly)
    const undervalued = stocks
      .filter(s => s.change < -5)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);
    
    undervalued.forEach(stock => {
      recommendations.push({
        action: 'buy' as const,
        stockId: stock.id,
        reason: `${stock.symbol} is down ${Math.abs(stock.change).toFixed(2)}% - potential buying opportunity`,
        confidence: Math.min(0.8, Math.abs(stock.change) / 10)
      });
    });

    // Find overperforming holdings to take profits
    const overperforming = portfolio.holdings
      .filter(h => h.unrealizedPnLPercent > 10)
      .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
      .slice(0, 2);
    
    overperforming.forEach(holding => {
      recommendations.push({
        action: 'sell' as const,
        stockId: holding.stockId,
        reason: `${holding.symbol} is up ${holding.unrealizedPnLPercent.toFixed(2)}% - consider taking profits`,
        confidence: Math.min(0.7, holding.unrealizedPnLPercent / 20)
      });
    });

    return recommendations;
  }
}

export const tradingService = new TradingService();