import { useState } from 'react';
import { motion } from 'framer-motion';
import { SubredditStock, Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';
import { formatNumber } from '../utils/formatNumber';

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
          className="text-orange-500 text-xl"
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
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-orange-500/30 transition-colors"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center">
            <div className="mb-2">
              {selectedStock.change > 2 ? (
                <svg className="w-12 h-12 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : selectedStock.change > 0 ? (
                <svg className="w-12 h-12 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : selectedStock.change === 0 ? (
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              ) : selectedStock.change > -2 ? (
                <svg className="w-12 h-12 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : selectedStock.change > -5 ? (
                <svg className="w-12 h-12 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-red-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
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
                BUY
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
                SELL
              </button>
            </div>

            {/* Quantity Section */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/20 transition-colors">
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
                        ? 'bg-orange-500 text-white' 
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
                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="1"
                max={tradeType === 'buy' ? maxBuyShares : maxSellShares}
              />
            </div>

            {/* Trade Summary */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/20 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Total Value</span>
                <span className="text-xl font-bold">{formatNumber(tradeValue)} Ⓒ</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Available</span>
                <span>
                  {tradeType === 'buy' ? 
                    `${formatNumber(portfolio?.cash || 0)} Ⓒ` : 
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
              <div className="mb-4">
                {tradeType === 'buy' ? (
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16 mx-auto text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
              </h2>
              <div className="text-gray-400">
                {shares.toLocaleString()} shares of {selectedStock.symbol}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/30 transition-colors">
              <div className="space-y-3 text-lg">
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span className="font-bold">{shares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-bold">{selectedStock.price.toFixed(2)} Ⓒ</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-xl">{formatNumber(tradeValue)} Ⓒ</span>
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