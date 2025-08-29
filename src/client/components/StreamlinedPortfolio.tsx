import { motion } from 'framer-motion';
import { Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';

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
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center mb-6">
            <AnimatedPrice
              value={portfolio.totalValue}
              className="text-4xl font-black text-white block mb-2"
            />
            <span className="text-gray-400 text-sm">Total Value</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <AnimatedPrice
                value={portfolio.cash}
                className="text-lg font-bold text-white block"
              />
              <span className="text-xs text-gray-400">Cash</span>
            </div>
            <div>
              <AnimatedPrice
                value={portfolio.totalReturn}
                className={`text-lg font-bold block ${
                  portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
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
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer"
                onClick={() => onStockClick(holding.stockId)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">
                      {holding.unrealizedPnL >= 0 ? '📈' : '📉'}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-white">
                        {holding.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {holding.shares} shares @ ${holding.avgPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      ${holding.value.toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${
                      holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {holding.unrealizedPnL >= 0 ? '+' : ''}
                      ${holding.unrealizedPnL.toFixed(0)} 
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
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-bold mb-2 text-gray-300">No Holdings</div>
              <div className="text-gray-400">Your cash is ready to invest!</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};