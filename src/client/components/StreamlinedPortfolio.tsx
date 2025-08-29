import { motion } from 'framer-motion';
import { Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';
import { formatNumber } from '../utils/formatNumber';

interface StreamlinedPortfolioProps {
  portfolio: Portfolio | null;
  onStockClick: (stockId: string) => void;
}

export const StreamlinedPortfolio = ({ portfolio, onStockClick }: StreamlinedPortfolioProps) => {
  if (!portfolio) {
    return (
      <div className="w-full bg-gray-900 text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💼</div>
          <div className="text-2xl font-bold mb-2">No Portfolio Yet</div>
          <div className="text-gray-400">Start trading to build your portfolio!</div>
        </div>
      </div>
    );
  }

  // Sort holdings by value descending, show all since we can scroll
  const sortedHoldings = [...portfolio.holdings]
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-center">Your Portfolio</h1>
      </div>

      {/* Portfolio Summary */}
      <div className="p-4 flex-shrink-0">
        <motion.div
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-orange-500/30 transition-colors"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center mb-6">
            <AnimatedPrice
              value={portfolio.totalValue}
              className="text-4xl font-black text-white block"
              format="currency"
            />
            <span className="text-gray-400 text-sm">Total Value</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <AnimatedPrice
                value={portfolio.cash}
                className="text-lg font-bold text-white block"
                format="currency"
              />
              <span className="text-xs text-gray-400">Cash</span>
            </div>
            <div>
              <AnimatedPrice
                value={portfolio.totalReturn}
                className={`text-lg font-bold block ${
                  portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
                format="currency"
              />
              <span className="text-xs text-gray-400">Return</span>
            </div>
            <div>
              <AnimatedPrice
                value={portfolio.totalReturnPercent}
                suffix="%"
                prefix=""
                className={`text-lg font-bold block ${
                  portfolio.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
                format="none"
              />
              <span className="text-xs text-gray-400">Return %</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Holdings List */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-bold mb-3 text-gray-300">
          Your Holdings {portfolio.holdings.length > 0 && `(${portfolio.holdings.length})`}
        </h3>
        
        {portfolio.holdings.length > 0 ? (
          <div className="space-y-3">
            {sortedHoldings.map((holding, index) => (
              <motion.div
                key={holding.stockId}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/40 cursor-pointer transition-colors"
                onClick={() => onStockClick(holding.stockId)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="text-xl">
                        {holding.unrealizedPnL >= 0 ? '📈' : '📉'}
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full opacity-60"></div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-white">
                        {holding.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {holding.shares} shares @ <span className="text-orange-400">{holding.avgPrice.toFixed(2)} Ⓒ</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {formatNumber(holding.value)} Ⓒ
                    </div>
                    <div className={`text-sm font-medium ${
                      holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {holding.unrealizedPnL >= 0 ? '+' : ''}
                      {formatNumber(holding.unrealizedPnL)} Ⓒ 
                      ({holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                      {holding.unrealizedPnLPercent.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Show all holdings now that we can scroll */}
          </div>
        ) : (
          <motion.div
            className="py-20 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-xl font-bold mb-2 text-gray-300">No Holdings</div>
              <div className="text-gray-400">Your cash is ready to invest!</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};