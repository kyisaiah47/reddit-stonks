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
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 flex-shrink-0">
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
              {marketData.marketSentiment === 'bullish' && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  BULLISH
                </div>
              )}
              {marketData.marketSentiment === 'bearish' && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  BEARISH
                </div>
              )}  
              {marketData.marketSentiment === 'neutral' && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  NEUTRAL
                </div>
              )}
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
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-orange-500/30 transition-colors"
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
                  className="text-5xl font-black text-white block"
                  format="currency"
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
                      format="currency"
                    />
                    <div className="text-xs text-gray-500">Return</div>
                  </div>
                  <div>
                    <AnimatedPrice
                      value={portfolio.totalReturnPercent}
                      suffix="%"
                      prefix=""
                      className={`text-2xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      format="none"
                    />
                    <div className="text-xs text-gray-500">Return %</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <div className="text-2xl font-bold mb-2">10K Ⓒ</div>
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
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/40 cursor-pointer transition-colors"
                onClick={() => onStockClick(topMover.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-orange-500">
                      {Math.abs(topMover.change) > 5 ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.414L14.586 7H12z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.414L14.586 7H12z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white">{topMover.symbol}</div>
                      <div className="text-xs text-orange-400">Most Active</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <AnimatedPrice
                      value={topMover.price}
                      change={topMover.change}
                      className="text-lg"
                      format="price"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Gainer */}
            {topGainer && (
              <motion.div
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/40 cursor-pointer transition-colors"
                onClick={() => onStockClick(topGainer.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
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
                      format="price"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Loser */}
            {topLoser && (
              <motion.div
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/40 cursor-pointer transition-colors"
                onClick={() => onStockClick(topLoser.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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
                      format="price"
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