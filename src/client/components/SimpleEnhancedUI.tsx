import { motion } from 'framer-motion';
import { MarketDataResponse, Portfolio } from '../../shared/types/api';
import { StockTicker } from './StockTicker';
import { MarketSentimentMeter } from './MarketSentimentMeter';
import { LiveActivityFeed } from './LiveActivityFeed';
import { AnimatedPrice } from './AnimatedPrice';

interface SimpleEnhancedUIProps {
  portfolio: Portfolio | null;
  marketData: MarketDataResponse | null;
  onStockClick: (stockId: string) => void;
}

export const SimpleEnhancedUI = ({ portfolio, marketData, onStockClick }: SimpleEnhancedUIProps) => {
  if (!marketData) return null;

  const topGainers = marketData.stocks
    .filter(stock => stock.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  const topLosers = marketData.stocks
    .filter(stock => stock.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Animated Stock Ticker */}
      <StockTicker stocks={marketData.stocks} />

      {/* Header */}
      <motion.div
        className="text-center py-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          📊 REDDIT STONKS 🚀
        </h1>
        <p className="text-xl text-gray-400">
          Trade subreddits like stocks • {new Date(marketData.lastUpdated).toLocaleTimeString()}
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Portfolio Summary */}
        {portfolio && (
          <motion.div 
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Your Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <AnimatedPrice
                  value={portfolio.totalValue}
                  className="text-3xl font-bold text-white"
                />
                <div className="text-sm text-gray-400 mt-1">Total Value</div>
              </div>
              <div className="text-center">
                <AnimatedPrice
                  value={portfolio.cash}
                  className="text-3xl font-bold text-white"
                />
                <div className="text-sm text-gray-400 mt-1">Cash</div>
              </div>
              <div className="text-center">
                <AnimatedPrice
                  value={portfolio.totalReturn}
                  className={`text-3xl font-bold ${portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}
                />
                <div className="text-sm text-gray-400 mt-1">Total Return</div>
              </div>
              <div className="text-center">
                <AnimatedPrice
                  value={portfolio.totalReturnPercent}
                  suffix="%"
                  prefix=""
                  className={`text-3xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                />
                <div className="text-sm text-gray-400 mt-1">Return %</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Sentiment */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MarketSentimentMeter 
              sentiment={marketData.marketSentiment}
              stocks={marketData.stocks}
            />
          </motion.div>

          {/* Top Movers */}
          <motion.div 
            className="space-y-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Top Gainers */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-green-400">📈 Top Gainers</h3>
              <div className="space-y-3">
                {topGainers.map((stock, index) => (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => onStockClick(stock.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-gray-400">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <AnimatedPrice 
                        value={stock.price} 
                        change={stock.change}
                        className="text-sm"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-red-400">📉 Top Losers</h3>
              <div className="space-y-3">
                {topLosers.map((stock, index) => (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => onStockClick(stock.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-gray-400">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <AnimatedPrice 
                        value={stock.price} 
                        change={stock.change}
                        className="text-sm"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <LiveActivityFeed />
          </motion.div>
        </div>

        {/* All Stocks Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">All Stocks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {marketData.stocks.map((stock, index) => (
              <motion.div
                key={stock.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => onStockClick(stock.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">
                        {stock.change > 5 ? '🚀' : 
                         stock.change > 2 ? '📈' : 
                         stock.change > 0 ? '↗️' : 
                         stock.change === 0 ? '➡️' : 
                         stock.change > -2 ? '↘️' : 
                         stock.change > -5 ? '📉' : '💀'}
                      </span>
                      <h3 className="font-bold text-xl text-white">{stock.symbol}</h3>
                    </div>
                    <p className="text-sm text-gray-400">{stock.name}</p>
                  </div>
                  
                  <div className="text-right">
                    <AnimatedPrice
                      value={stock.price}
                      change={stock.change}
                      className="text-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <div className="text-gray-500">Volume</div>
                    <div className="text-white font-medium">
                      {stock.volume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Members</div>
                    <div className="text-white font-medium">
                      {stock.subscribers.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating Background Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};