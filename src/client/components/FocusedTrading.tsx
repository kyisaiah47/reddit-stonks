import { useState } from 'react';
import { motion } from 'framer-motion';
import { SubredditStock, Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';

interface FocusedTradingProps {
  selectedStock: SubredditStock | null;
  portfolio: Portfolio | null;
  onTrade: (type: 'buy' | 'sell', shares: number) => void;
  onBack: () => void;
}

export const FocusedTrading = ({ selectedStock, portfolio, onTrade, onBack }: FocusedTradingProps) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!selectedStock) return null;

  const maxBuyShares = portfolio ? Math.floor(portfolio.cash / selectedStock.price) : 0;
  const holding = portfolio?.holdings.find(h => h.stockId === selectedStock.id);
  const maxSellShares = holding ? holding.shares : 0;

  const tradeValue = shares * selectedStock.price;
  const canTrade = tradeType === 'buy' ? 
    portfolio && portfolio.cash >= tradeValue : 
    maxSellShares >= shares;

  const handleConfirm = () => {
    onTrade(tradeType, shares);
    setShowConfirm(false);
    setShares(1);
  };

  const presetAmounts = tradeType === 'buy' 
    ? [1, 5, 10, Math.floor(maxBuyShares / 4), Math.floor(maxBuyShares / 2), maxBuyShares].filter(n => n > 0)
    : [1, Math.floor(maxSellShares / 4), Math.floor(maxSellShares / 2), maxSellShares].filter(n => n > 0);

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <motion.button
          onClick={onBack}
          className="text-blue-400 text-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="flex-1">
          <div className="font-bold text-lg">{selectedStock.symbol}</div>
          <div className="text-sm text-gray-400">{selectedStock.name}</div>
        </div>
      </div>

      {/* Stock Info Card */}
      <div className="p-4 flex-shrink-0">
        <motion.div
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">
              {selectedStock.change > 5 ? '🚀' : 
               selectedStock.change > 2 ? '📈' : 
               selectedStock.change > 0 ? '↗️' : 
               selectedStock.change === 0 ? '➡️' : 
               selectedStock.change > -2 ? '↘️' : 
               selectedStock.change > -5 ? '📉' : '💀'}
            </div>
            <AnimatedPrice
              value={selectedStock.price}
              change={selectedStock.change}
              className="text-3xl font-bold"
            />
            <div className="text-sm text-gray-400 mt-2">
              {selectedStock.subscribers.toLocaleString()} members
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trading Interface */}
      <div className="px-4 pb-4">
        {!showConfirm ? (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Buy/Sell Toggle */}
            <div className="bg-gray-800 rounded-xl p-1 flex">
              <button
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  tradeType === 'buy' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => {
                  setTradeType('buy');
                  setShares(1);
                }}
              >
                BUY 🚀
              </button>
              <button
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  tradeType === 'sell' 
                    ? 'bg-red-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => {
                  setTradeType('sell');
                  setShares(1);
                }}
              >
                SELL 📉
              </button>
            </div>

            {/* Quantity Section */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Shares</div>
                <div className="text-4xl font-bold">{shares.toLocaleString()}</div>
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {presetAmounts.slice(0, 6).map((amount) => (
                  <motion.button
                    key={amount}
                    onClick={() => setShares(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      shares === amount 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {amount.toLocaleString()}
                  </motion.button>
                ))}
              </div>

              {/* Custom Input */}
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max={tradeType === 'buy' ? maxBuyShares : maxSellShares}
              />
            </div>

            {/* Trade Summary */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Total Value</span>
                <span className="text-xl font-bold">${tradeValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Available</span>
                <span>
                  {tradeType === 'buy' ? 
                    `$${portfolio?.cash.toLocaleString() || '0'}` : 
                    `${maxSellShares} shares`
                  }
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <motion.button
              onClick={() => setShowConfirm(true)}
              disabled={!canTrade || shares <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canTrade && shares > 0
                  ? tradeType === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={canTrade ? { scale: 1.02 } : {}}
              whileTap={canTrade ? { scale: 0.98 } : {}}
            >
              {tradeType === 'buy' ? 'Review Buy Order' : 'Review Sell Order'}
            </motion.button>
          </motion.div>
        ) : (
          // Confirmation Screen
          <motion.div
            className="flex flex-col justify-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {tradeType === 'buy' ? '🚀' : '📉'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
              </h2>
              <div className="text-gray-400">
                {shares.toLocaleString()} shares of {selectedStock.symbol}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="space-y-3 text-lg">
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span className="font-bold">{shares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-bold">${selectedStock.price}</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-xl">${tradeValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 bg-gray-600 rounded-xl font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className={`flex-1 py-4 rounded-xl font-bold ${
                  tradeType === 'buy' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};