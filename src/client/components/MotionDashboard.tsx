import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { MarketDataResponse, Portfolio } from '../../shared/types/api';
import { StockTicker } from './StockTicker';
import { MarketSentimentMeter } from './MarketSentimentMeter';
import { LiveActivityFeed } from './LiveActivityFeed';
import { EnhancedStockCard } from './EnhancedStockCard';
import { AnimatedPrice } from './AnimatedPrice';

interface MotionDashboardProps {
  portfolio: Portfolio | null;
  marketData: MarketDataResponse | null;
  onStockClick: (stockId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20
    }
  }
};

export const MotionDashboard = ({ portfolio, marketData, onStockClick }: MotionDashboardProps) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'stocks' | 'portfolio'>('overview');

  if (!marketData) return null;

  const topGainers = marketData.stocks
    .filter(stock => stock.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  const topLosers = marketData.stocks
    .filter(stock => stock.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 3);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Animated Stock Ticker */}
      <StockTicker stocks={marketData.stocks} />

      {/* Header with animated title */}
      <motion.div
        className="text-center py-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-6xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent"
          animate={{
            backgroundPosition: ['0%', '100%', '0%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          📊 REDDIT STONKS 🚀
        </motion.h1>
        <motion.p
          className="text-xl text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Trade subreddits like stocks • {new Date(marketData.lastUpdated).toLocaleTimeString()}
        </motion.p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
          {['overview', 'stocks', 'portfolio'].map((view) => (
            <motion.button
              key={view}
              onClick={() => setSelectedView(view as typeof selectedView)}
              className={`px-6 py-2 rounded-md font-medium capitalize transition-colors ${
                selectedView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {view}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Portfolio Summary */}
              {portfolio && (
                <motion.div 
                  variants={itemVariants}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                  whileHover={cardHoverVariants.hover}
                >
                  <h2 className="text-2xl font-bold mb-6 text-center">Your Portfolio</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <AnimatedPrice
                        value={portfolio.totalValue}
                        className="text-3xl font-bold text-white block"
                        animate={true}
                      />
                      <div className="text-sm text-gray-400 mt-1">Total Value</div>
                    </div>
                    <div className="text-center">
                      <AnimatedPrice
                        value={portfolio.cash}
                        className="text-3xl font-bold text-white block"
                        animate={true}
                      />
                      <div className="text-sm text-gray-400 mt-1">Cash</div>
                    </div>
                    <div className="text-center">
                      <AnimatedPrice
                        value={portfolio.totalReturn}
                        className={`text-3xl font-bold block ${portfolio.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        animate={true}
                      />
                      <div className="text-sm text-gray-400 mt-1">Total Return</div>
                    </div>
                    <div className="text-center">
                      <AnimatedPrice
                        value={portfolio.totalReturnPercent}
                        suffix="%"
                        prefix=""
                        className={`text-3xl font-bold block ${portfolio.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        animate={true}
                      />
                      <div className="text-sm text-gray-400 mt-1">Return %</div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Market Sentiment */}
                <motion.div variants={itemVariants}>
                  <MarketSentimentMeter 
                    sentiment={marketData.marketSentiment}
                    stocks={marketData.stocks}
                  />
                </motion.div>

                {/* Top Movers */}
                <motion.div 
                  variants={itemVariants}
                  className="space-y-6"
                >
                  {/* Top Gainers */}
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                      📈 Top Gainers
                    </h3>
                    <div className="space-y-3">
                      {topGainers.map((stock, index) => (
                        <motion.div
                          key={stock.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
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
                    <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
                      📉 Top Losers
                    </h3>
                    <div className="space-y-3">
                      {topLosers.map((stock, index) => (
                        <motion.div
                          key={stock.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
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
                <motion.div variants={itemVariants}>
                  <LiveActivityFeed />
                </motion.div>
              </div>
            </motion.div>
          )}

          {selectedView === 'stocks' && (
            <motion.div
              key="stocks"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-center mb-8">All Stocks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {marketData.stocks.map((stock, index) => (
                  <motion.div
                    key={stock.id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <EnhancedStockCard
                      stock={stock}
                      onSwipeLeft={() => console.log('Sell', stock.symbol)}
                      onSwipeRight={() => console.log('Buy', stock.symbol)}
                      onTap={() => onStockClick(stock.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedView === 'portfolio' && portfolio && (
            <motion.div
              key="portfolio"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-center mb-8">Your Holdings</h2>
              {portfolio.holdings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {portfolio.holdings.map((holding, index) => (
                    <motion.div
                      key={holding.stockId}
                      variants={itemVariants}
                      custom={index}
                      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                      whileHover={cardHoverVariants.hover}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{holding.symbol}</h3>
                          <p className="text-gray-400">{holding.shares} shares</p>
                        </div>
                        <div className="text-right">
                          <AnimatedPrice
                            value={holding.value}
                            className="text-lg font-bold"
                          />
                          <div className={`text-sm ${holding.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(holding.unrealizedPnL)} ({formatPercent(holding.unrealizedPnLPercent)})
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Avg Cost: {formatCurrency(holding.avgPrice)} • Current: {formatCurrency(holding.currentPrice)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-2xl font-bold mb-2">No Holdings Yet</h3>
                  <p className="text-gray-400">Start trading to build your portfolio!</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(20)].map((_, i) => (
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
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};