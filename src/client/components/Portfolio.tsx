import { useState } from 'react';
import { Portfolio as PortfolioType } from '../../shared/types/api';

interface PortfolioProps {
  portfolio: PortfolioType | null;
  onStockClick: (stockId: string) => void;
}

export const Portfolio = ({ portfolio, onStockClick }: PortfolioProps) => {
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'pnlPercent'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (!portfolio) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">💼</div>
            <div className="text-xl mb-2">No portfolio data available</div>
            <div>Start trading to build your portfolio!</div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

  const sortedHoldings = [...portfolio.holdings].sort((a, b) => {
    let aValue: number, bValue: number;
    
    switch (sortBy) {
      case 'value':
        aValue = a.value;
        bValue = b.value;
        break;
      case 'pnl':
        aValue = a.unrealizedPnL;
        bValue = b.unrealizedPnL;
        break;
      case 'pnlPercent':
        aValue = a.unrealizedPnLPercent;
        bValue = b.unrealizedPnLPercent;
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ field, children }: { field: typeof sortBy; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-orange-500"
    >
      {children}
      {sortBy === field && (
        <span className="text-xs">
          {sortOrder === 'desc' ? '↓' : '↑'}
        </span>
      )}
    </button>
  );

  const allocationData = portfolio.holdings.map(holding => ({
    symbol: holding.symbol,
    value: holding.value,
    percentage: (holding.value / portfolio.totalValue) * 100
  }));

  // Add cash as allocation
  if (portfolio.cash > 0) {
    allocationData.push({
      symbol: 'CASH',
      value: portfolio.cash,
      percentage: (portfolio.cash / portfolio.totalValue) * 100
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Portfolio</h1>
        <p className="text-lg text-gray-600">Track your subreddit investments</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(portfolio.totalValue)}</div>
          <div className="text-sm text-gray-500">Total Portfolio Value</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(portfolio.cash)}</div>
          <div className="text-sm text-gray-500">Available Cash</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className={`text-3xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(portfolio.totalReturn)}
          </div>
          <div className="text-sm text-gray-500">Total Return</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className={`text-3xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(portfolio.totalReturnPercent)}
          </div>
          <div className="text-sm text-gray-500">Return %</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Holdings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="value">Market Value</SortButton>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="pnl">Unrealized P&L</SortButton>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <SortButton field="pnlPercent">% Return</SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedHoldings.map((holding) => (
                    <tr
                      key={holding.stockId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onStockClick(holding.stockId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{holding.symbol}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(holding.shares)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(holding.avgPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(holding.currentPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(holding.value)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(holding.unrealizedPnL)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        holding.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(holding.unrealizedPnLPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {portfolio.holdings.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <div>No holdings yet</div>
                <div className="text-sm">Start trading to build your portfolio!</div>
              </div>
            )}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Asset Allocation</h3>
            <div className="space-y-3">
              {allocationData
                .sort((a, b) => b.percentage - a.percentage)
                .map((item) => (
                <div key={item.symbol}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium ${item.symbol === 'CASH' ? 'text-gray-600' : 'text-gray-900'}`}>
                      {item.symbol}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.symbol === 'CASH' ? 'bg-gray-400' : 'bg-orange-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Positions:</span>
                <span className="font-medium">{portfolio.holdings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Largest Position:</span>
                <span className="font-medium">
                  {portfolio.holdings.length > 0 
                    ? formatCurrency(Math.max(...portfolio.holdings.map(h => h.value)))
                    : '$0.00'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Allocation:</span>
                <span className="font-medium">
                  {((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};