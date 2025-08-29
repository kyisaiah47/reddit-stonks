import { useState, useEffect } from 'react';
import { MarketDataResponse, Portfolio, LeaderboardResponse } from '../../shared/types/api';

interface DashboardProps {
  portfolio: Portfolio | null;
  marketData: MarketDataResponse | null;
  onStockClick: (stockId: string) => void;
}

export const Dashboard = ({ portfolio, marketData, onStockClick }: DashboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    // Fetch leaderboard data
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(setLeaderboard)
      .catch(console.error);
  }, []);

  const topGainers = marketData?.stocks
    .filter(stock => stock.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 5) || [];

  const topLosers = marketData?.stocks
    .filter(stock => stock.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5) || [];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reddit Stock Exchange</h1>
        <p className="text-lg text-gray-600">Trade subreddits like stocks • {marketData?.lastUpdated}</p>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(portfolio.totalValue)}</div>
              <div className="text-sm text-gray-500">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(portfolio.cash)}</div>
              <div className="text-sm text-gray-500">Cash</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolio.totalReturn)}
              </div>
              <div className="text-sm text-gray-500">Total Return</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolio.totalReturnPercent)}
              </div>
              <div className="text-sm text-gray-500">Return %</div>
            </div>
          </div>
        </div>
      )}

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-green-600">📈 Top Gainers</h3>
          <div className="space-y-2">
            {topGainers.map((stock) => (
              <div 
                key={stock.id}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => onStockClick(stock.id)}
              >
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-gray-500">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(stock.price)}</div>
                  <div className="text-green-600 text-sm">{formatPercent(stock.change)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-600">📉 Top Losers</h3>
          <div className="space-y-2">
            {topLosers.map((stock) => (
              <div 
                key={stock.id}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => onStockClick(stock.id)}
              >
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-gray-500">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(stock.price)}</div>
                  <div className="text-red-600 text-sm">{formatPercent(stock.change)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment */}
      {marketData && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Market Sentiment</h3>
          <div className={`text-3xl font-bold ${
            marketData.marketSentiment === 'bullish' ? 'text-green-600' : 
            marketData.marketSentiment === 'bearish' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {marketData.marketSentiment === 'bullish' ? '🐂 BULLISH' : 
             marketData.marketSentiment === 'bearish' ? '🐻 BEARISH' : 
             '😐 NEUTRAL'}
          </div>
        </div>
      )}

      {/* Leaderboard Preview */}
      {leaderboard && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">🏆 Top Traders</h3>
          <div className="space-y-2">
            {leaderboard.leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.rank} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="font-bold text-lg mr-3">#{entry.rank}</span>
                  <span className="font-medium">{entry.username}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(entry.portfolioValue)}</div>
                  <div className={`text-sm ${entry.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(entry.totalReturnPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {leaderboard.userRank && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-center text-gray-600">
                Your Rank: #{leaderboard.userRank} of {leaderboard.totalUsers}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};