import { Portfolio, Holding, TradeRequest, TradeResponse, SubredditStock } from '../../shared/types/api';

class TradingService {
  private readonly STARTING_CASH = 10000;

  async getPortfolio(userId: string): Promise<Portfolio> {
    try {
      const response = await fetch(`/api/portfolio?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.portfolio;
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }

    // Return default portfolio if fetch fails
    return this.createDefaultPortfolio(userId);
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
        return await response.json();
      }
    } catch (error) {
      console.error('Error executing trade:', error);
    }

    // Fallback to local execution for demo purposes
    return this.executeTradeLocally(userId, trade, currentStocks);
  }

  private async executeTradeLocally(userId: string, trade: TradeRequest, currentStocks: SubredditStock[]): Promise<TradeResponse> {
    const stock = currentStocks.find(s => s.id === trade.stockId);
    if (!stock) {
      return {
        success: false,
        message: 'Stock not found'
      };
    }

    const currentPortfolio = await this.getPortfolio(userId);
    const executePrice = trade.orderType === 'market' ? stock.price : trade.limitPrice || stock.price;
    const totalCost = executePrice * trade.shares;

    if (trade.type === 'buy') {
      if (currentPortfolio.cash < totalCost) {
        return {
          success: false,
          message: 'Insufficient funds'
        };
      }

      // Execute buy order
      const newPortfolio = this.executeBuyOrder(currentPortfolio, stock, trade.shares, executePrice);
      
      return {
        success: true,
        message: `Successfully bought ${trade.shares} shares of ${stock.symbol}`,
        trade: {
          id: this.generateTradeId(),
          stockId: stock.id,
          symbol: stock.symbol,
          type: 'buy',
          shares: trade.shares,
          price: executePrice,
          total: totalCost,
          timestamp: new Date().toISOString()
        },
        updatedPortfolio: newPortfolio
      };
    } else {
      // Sell order
      const holding = currentPortfolio.holdings.find(h => h.stockId === trade.stockId);
      if (!holding || holding.shares < trade.shares) {
        return {
          success: false,
          message: 'Insufficient shares to sell'
        };
      }

      const newPortfolio = this.executeSellOrder(currentPortfolio, stock, trade.shares, executePrice);
      
      return {
        success: true,
        message: `Successfully sold ${trade.shares} shares of ${stock.symbol}`,
        trade: {
          id: this.generateTradeId(),
          stockId: stock.id,
          symbol: stock.symbol,
          type: 'sell',
          shares: trade.shares,
          price: executePrice,
          total: totalCost,
          timestamp: new Date().toISOString()
        },
        updatedPortfolio: newPortfolio
      };
    }
  }

  private executeBuyOrder(portfolio: Portfolio, stock: SubredditStock, shares: number, price: number): Portfolio {
    const totalCost = shares * price;
    const newCash = portfolio.cash - totalCost;
    
    const existingHolding = portfolio.holdings.find(h => h.stockId === stock.id);
    let newHoldings: Holding[];

    if (existingHolding) {
      // Update existing holding
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
      // Create new holding
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

    return this.calculatePortfolioMetrics({
      ...portfolio,
      cash: newCash,
      holdings: newHoldings
    });
  }

  private executeSellOrder(portfolio: Portfolio, stock: SubredditStock, shares: number, price: number): Portfolio {
    const totalProceeds = shares * price;
    const newCash = portfolio.cash + totalProceeds;
    
    const newHoldings = portfolio.holdings.map(holding => {
      if (holding.stockId === stock.id) {
        const remainingShares = holding.shares - shares;
        if (remainingShares === 0) {
          return null; // Will be filtered out
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

    return this.calculatePortfolioMetrics({
      ...portfolio,
      cash: newCash,
      holdings: newHoldings
    });
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