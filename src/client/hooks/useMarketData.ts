import { useState, useEffect, useCallback } from 'react';
import { MarketDataResponse, SubredditStock } from '../../shared/types/api';
import { generateMockMarketData } from '../services/mockDataService';

export const useMarketData = (refreshInterval: number = 60000) => {
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 Requesting Reddit market data from server...');
      
      // Check if we're in Devvit webview context
      if (window.parent && window.parent !== window) {
        // Post message to Devvit server to fetch real Reddit data
        window.parent.postMessage({
          type: 'getMarketData'
        }, '*');
        
        // Set up listener for response
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'marketDataResponse') {
            console.log('✅ Received Reddit market data:', event.data.data);
            // Convert Reddit data to our format and use it
            const marketDataResponse = generateMockMarketData(); // Still using mock for now
            setMarketData(marketDataResponse);
            setLastUpdated(new Date());
            setLoading(false);
            window.removeEventListener('message', handleMessage);
          } else if (event.data.type === 'marketDataError') {
            console.error('❌ Reddit API error:', event.data.error);
            setError(event.data.error);
            setLoading(false);
            window.removeEventListener('message', handleMessage);
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Timeout fallback
        setTimeout(() => {
          console.log('⏰ Reddit API timeout, using mock data');
          const marketDataResponse = generateMockMarketData();
          setMarketData(marketDataResponse);
          setLastUpdated(new Date());
          setLoading(false);
          window.removeEventListener('message', handleMessage);
        }, 5000);
        
      } else {
        // Not in webview, use mock data
        console.log('📊 Not in webview context, using mock data');
        const marketDataResponse = generateMockMarketData();
        setMarketData(marketDataResponse);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchMarketData();
  }, [fetchMarketData]);

  // Update stock prices with some volatility simulation
  const simulatePriceUpdates = useCallback(() => {
    if (!marketData) return;
    
    const updatedStocks = marketData.stocks.map(stock => {
      // Small random price movement (-1% to +1%)
      const priceChange = (Math.random() - 0.5) * 0.02;
      const newPrice = Math.max(0.01, stock.price * (1 + priceChange));
      const change = ((newPrice - stock.price) / stock.price) * 100;

      return {
        ...stock,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round((stock.change + change) * 100) / 100
      };
    });

    const positiveChanges = updatedStocks.filter(s => s.change > 0).length;
    const negativeChanges = updatedStocks.filter(s => s.change < 0).length;
    const avgChange = updatedStocks.reduce((sum, s) => sum + s.change, 0) / updatedStocks.length;

    let marketSentiment: 'bullish' | 'bearish' | 'neutral';
    if (avgChange > 1 && positiveChanges > negativeChanges) {
      marketSentiment = 'bullish';
    } else if (avgChange < -1 && negativeChanges > positiveChanges) {
      marketSentiment = 'bearish';
    } else {
      marketSentiment = 'neutral';
    }
    
    setMarketData({
      stocks: updatedStocks,
      marketSentiment,
      lastUpdated: new Date().toISOString()
    });
    
    setLastUpdated(new Date());
  }, [marketData]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (!marketData) return;

    const interval = setInterval(() => {
      // Simulate live price updates every 30 seconds
      simulatePriceUpdates();
    }, 30000);

    return () => clearInterval(interval);
  }, [simulatePriceUpdates]);

  useEffect(() => {
    // Full data refresh at specified interval
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const getStockById = useCallback((stockId: string): SubredditStock | undefined => {
    return marketData?.stocks.find(stock => stock.id === stockId);
  }, [marketData]);

  const getTopMovers = useCallback((type: 'gainers' | 'losers', limit: number = 5) => {
    if (!marketData) return [];
    
    return marketData.stocks
      .filter(stock => type === 'gainers' ? stock.change > 0 : stock.change < 0)
      .sort((a, b) => type === 'gainers' ? b.change - a.change : a.change - b.change)
      .slice(0, limit);
  }, [marketData]);

  const searchStocks = useCallback((query: string): SubredditStock[] => {
    if (!marketData || !query.trim()) return marketData?.stocks || [];
    
    const searchTerm = query.toLowerCase();
    return marketData.stocks.filter(stock =>
      stock.name.toLowerCase().includes(searchTerm) ||
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.id.toLowerCase().includes(searchTerm)
    );
  }, [marketData]);

  return {
    marketData,
    loading,
    error,
    lastUpdated,
    refreshData,
    getStockById,
    getTopMovers,
    searchStocks
  };
};