import { motion } from 'framer-motion';
import { MarketDataResponse, Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';

interface SimpleDashboardProps {
  portfolio: Portfolio | null;
  marketData: MarketDataResponse | null;
  onStockClick: (stockId: string) => void;
}

export const SimpleDashboard = ({ portfolio, marketData, onStockClick }: SimpleDashboardProps) => {
  if (!marketData) return null;

  const topMover = marketData.stocks
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  const topGainer = marketData.stocks
    .filter(s => s.change > 0)
    .sort((a, b) => b.change - a.change)[0];

  const topLoser = marketData.stocks
    .filter(s => s.change < 0)
    .sort((a, b) => a.change - b.change)[0];

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Market Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex-shrink-0">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-bold">MARKET OPEN</span>
            </div>
            <span className={`font-medium ${
              marketData.marketSentiment === 'bullish' ? 'text-green-300' :
              marketData.marketSentiment === 'bearish' ? 'text-red-300' :
              'text-yellow-300'
            }`}>
              {marketData.marketSentiment === 'bullish' && '🚀 BULLISH'}
              {marketData.marketSentiment === 'bearish' && '🐻 BEARISH'}  
              {marketData.marketSentiment === 'neutral' && '😐 NEUTRAL'}
            </span>
          </div>
          <span className="text-xs opacity-75">
            {new Date(marketData.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main Content - No Scrolling */}
      <div className="flex-1 flex flex-col p-4 gap-6 min-h-0">
        {/* Portfolio Summary - Big Numbers */}
        <motion.div
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-lg font-bold text-center mb-6 text-gray-300">Your Portfolio</h2>
          
          {portfolio ? (
            <div className="space-y-4">
              {/* Total Value - Hero Number */}
              <div className="text-center">
                <AnimatedPrice
                  value={portfolio.totalValue}
                  className="text-5xl font-black text-white block mb-2"
                />
                <span className="text-gray-400 text-sm">Total Portfolio Value</span>
              </div>

              {/* Return - Secondary Focus */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <AnimatedPrice
                      value={portfolio.totalReturn}
                      className={`text-2xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    />
                    <div className="text-xs text-gray-500">Return</div>
                  </div>
                  <div>
                    <AnimatedPrice
                      value={portfolio.totalReturnPercent}
                      suffix="%"
                      prefix=""
                      className={`text-2xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    />
                    <div className="text-xs text-gray-500">Return %</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💰</div>
              <div className="text-2xl font-bold mb-2">$10,000</div>
              <div className="text-gray-400">Ready to trade!</div>
            </div>
          )}
        </motion.div>

        {/* Top Movers - Just 3 Cards */}
        <motion.div
          className="p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-4 text-gray-300">Market Highlights</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Top Mover */}
            {topMover && (
              <motion.div
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer"
                onClick={() => onStockClick(topMover.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {Math.abs(topMover.change) > 5 ? '🚀' : '📈'}
                    </span>
                    <div>
                      <div className="font-bold text-white">{topMover.symbol}</div>
                      <div className="text-xs text-gray-400">Most Active</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <AnimatedPrice
                      value={topMover.price}
                      change={topMover.change}
                      className="text-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Gainer */}
            {topGainer && (
              <motion.div
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer"
                onClick={() => onStockClick(topGainer.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="font-bold text-white">{topGainer.symbol}</div>
                      <div className="text-xs text-green-400">Top Gainer</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <AnimatedPrice
                      value={topGainer.price}
                      change={topGainer.change}
                      className="text-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Loser */}
            {topLoser && (
              <motion.div
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer"
                onClick={() => onStockClick(topLoser.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📉</span>
                    <div>
                      <div className="font-bold text-white">{topLoser.symbol}</div>
                      <div className="text-xs text-red-400">Top Loser</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <AnimatedPrice
                      value={topLoser.price}
                      change={topLoser.change}
                      className="text-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};