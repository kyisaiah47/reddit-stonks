import { useState, useEffect } from 'react';
import { SubredditStock, TradeRequest, TradeResponse, Portfolio } from '../../shared/types/api';

interface TradingProps {
  stocks: SubredditStock[];
  portfolio: Portfolio | null;
  onTradeComplete: (updatedPortfolio: Portfolio) => void;
}

export const Trading = ({ stocks, portfolio, onTradeComplete }: TradingProps) => {
  const [selectedStock, setSelectedStock] = useState<SubredditStock | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState<number>(1);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (selectedStock) {
      setLimitPrice(selectedStock.price);
    }
  }, [selectedStock]);

  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('en-US').format(value);

  const calculateTradeValue = () => {
    if (!selectedStock) return 0;
    const price = orderType === 'market' ? selectedStock.price : limitPrice;
    return shares * price;
  };

  const canAffordTrade = () => {
    if (!portfolio || !selectedStock) return false;
    if (tradeType === 'buy') {
      return portfolio.cash >= calculateTradeValue();
    } else {
      const holding = portfolio.holdings.find(h => h.stockId === selectedStock.id);
      return holding && holding.shares >= shares;
    }
  };

  const getMaxShares = () => {
    if (!portfolio || !selectedStock) return 0;
    if (tradeType === 'buy') {
      const price = orderType === 'market' ? selectedStock.price : limitPrice;
      return Math.floor(portfolio.cash / price);
    } else {
      const holding = portfolio.holdings.find(h => h.stockId === selectedStock.id);
      return holding ? holding.shares : 0;
    }
  };

  const executeTrade = async () => {
    if (!selectedStock || !canAffordTrade()) return;

    setLoading(true);
    setMessage('');

    const tradeRequest: TradeRequest = {
      stockId: selectedStock.id,
      type: tradeType,
      shares,
      orderType,
      ...(orderType === 'limit' && { limitPrice })
    };

    try {
      // No API calls - mock trade execution
      console.log('📊 API calls disabled - mock trade execution');
      
      // Mock successful trade
      const mockResult: TradeResponse = {
        success: true,
        message: `Mock trade executed: ${tradeType} ${shares} shares`
      };

      if (mockResult.success) {
        setMessage(`✅ ${tradeType.toUpperCase()} order executed: ${shares} shares of ${selectedStock.symbol} at ${formatCurrency(selectedStock.price)}`);
        setShares(1);
      } else {
        setMessage(`❌ Trade failed: ${mockResult.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error executing trade: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Trading Floor</h1>
        <p className="text-lg text-gray-600">Buy and sell subreddit shares</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <input
                type="text"
                placeholder="Search subreddits..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedStock?.id === stock.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{stock.symbol}</span>
                        <span className="text-sm text-gray-500">{stock.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatNumber(stock.subscribers)} members • Vol: {formatNumber(stock.volume)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(stock.change)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="space-y-6">
          {selectedStock ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Trade {selectedStock.symbol}</h3>
              
              {/* Trade Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Order Type</label>
                <div className="flex rounded-lg border">
                  <button
                    className={`flex-1 py-2 px-4 rounded-l-lg font-medium ${
                      tradeType === 'buy' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setTradeType('buy')}
                  >
                    BUY
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-r-lg font-medium ${
                      tradeType === 'sell' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setTradeType('sell')}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Shares */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Shares</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={getMaxShares()}
                    value={shares}
                    onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setShares(getMaxShares())}
                    className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Max: {formatNumber(getMaxShares())} shares
                </div>
              </div>

              {/* Order Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Execution</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                </select>
              </div>

              {/* Limit Price */}
              {orderType === 'limit' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Limit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Trade Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Shares:</span>
                    <span>{formatNumber(shares)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per share:</span>
                    <span>{formatCurrency(orderType === 'market' ? selectedStock.price : limitPrice)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTradeValue())}</span>
                  </div>
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={executeTrade}
                disabled={loading || !canAffordTrade()}
                className={`w-full py-3 rounded-lg font-semibold ${
                  canAffordTrade() && !loading
                    ? tradeType === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Processing...' : `${tradeType.toUpperCase()} ${formatNumber(shares)} Shares`}
              </button>

              {/* Message */}
              {message && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  {message}
                </div>
              )}

              {/* Available Cash */}
              {portfolio && (
                <div className="mt-4 text-sm text-gray-600">
                  Available Cash: {formatCurrency(portfolio.cash)}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <div>Select a subreddit to start trading</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};