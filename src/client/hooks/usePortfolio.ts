import { useState, useEffect, useCallback } from 'react';
import { Portfolio, TradeRequest, SubredditStock } from '../../shared/types/api';
import { tradingService } from '../services/tradingService';

export const usePortfolio = (userId: string | null, currentStocks: SubredditStock[] = []) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const portfolioData = await tradingService.getPortfolio(userId);
      
      // Update portfolio with current stock prices
      const updatedPortfolio = tradingService.updatePortfolioWithCurrentPrices(portfolioData, currentStocks);
      
      setPortfolio(updatedPortfolio);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
      setLoading(false);
    }
  }, [userId, currentStocks]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Update portfolio prices when market data changes
  useEffect(() => {
    if (portfolio && currentStocks.length > 0) {
      const updatedPortfolio = tradingService.updatePortfolioWithCurrentPrices(portfolio, currentStocks);
      setPortfolio(updatedPortfolio);
    }
  }, [currentStocks]); // Remove portfolio from dependencies to avoid infinite loops

  const executeTrade = useCallback(async (tradeRequest: TradeRequest) => {
    if (!userId || !portfolio) {
      throw new Error('User ID and portfolio required for trading');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await tradingService.executeTrade(userId, tradeRequest, currentStocks);
      
      if (result.success && result.updatedPortfolio) {
        setPortfolio(result.updatedPortfolio);
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Trade execution failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [userId, portfolio, currentStocks]);

  const getHolding = useCallback((stockId: string) => {
    return portfolio?.holdings.find(h => h.stockId === stockId);
  }, [portfolio]);

  const canAffordTrade = useCallback((shares: number, price: number, type: 'buy' | 'sell', stockId?: string) => {
    if (!portfolio) return false;

    if (type === 'buy') {
      const totalCost = shares * price;
      return portfolio.cash >= totalCost;
    } else {
      const holding = stockId ? getHolding(stockId) : null;
      return holding ? holding.shares >= shares : false;
    }
  }, [portfolio, getHolding]);

  const getMaxAffordableShares = useCallback((_stockId: string, price: number) => {
    if (!portfolio) return 0;
    return Math.floor(portfolio.cash / price);
  }, [portfolio]);

  const getMaxSellableShares = useCallback((stockId: string) => {
    const holding = getHolding(stockId);
    return holding ? holding.shares : 0;
  }, [getHolding]);

  const getPortfolioMetrics = useCallback(() => {
    if (!portfolio) return null;

    const risk = tradingService.calculatePortfolioRisk(portfolio, currentStocks);
    const recommendations = tradingService.getRecommendedTrades(portfolio, currentStocks);

    return {
      ...risk,
      recommendations,
      diversificationScore: Math.min(1, portfolio.holdings.length / 10), // 0-1 scale
      cashAllocation: (portfolio.cash / portfolio.totalValue) * 100,
      largestPosition: portfolio.holdings.length > 0 
        ? Math.max(...portfolio.holdings.map(h => (h.value / portfolio.totalValue) * 100))
        : 0
    };
  }, [portfolio, currentStocks]);

  const getTopHoldings = useCallback((limit: number = 5) => {
    if (!portfolio) return [];
    
    return [...portfolio.holdings]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }, [portfolio]);

  const getBestPerformers = useCallback((limit: number = 5) => {
    if (!portfolio) return [];
    
    return [...portfolio.holdings]
      .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
      .slice(0, limit);
  }, [portfolio]);

  const getWorstPerformers = useCallback((limit: number = 5) => {
    if (!portfolio) return [];
    
    return [...portfolio.holdings]
      .sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent)
      .slice(0, limit);
  }, [portfolio]);

  const refreshPortfolio = useCallback(() => {
    setLoading(true);
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    portfolio,
    loading,
    error,
    executeTrade,
    getHolding,
    canAffordTrade,
    getMaxAffordableShares,
    getMaxSellableShares,
    getPortfolioMetrics,
    getTopHoldings,
    getBestPerformers,
    getWorstPerformers,
    refreshPortfolio
  };
};