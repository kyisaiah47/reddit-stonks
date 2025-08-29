import { useState } from 'react';
import { motion } from 'framer-motion';
import { SubredditStock, Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';

interface SimpleStocksProps {
  stocks: SubredditStock[];
  portfolio: Portfolio | null;
  onTrade: (stockId: string, type: 'buy' | 'sell', shares: number) => void;
}

export const SimpleStocks = ({ stocks, portfolio, onTrade }: SimpleStocksProps) => {
  const [draggedStock, setDraggedStock] = useState<string | null>(null);

  const handleSwipe = (stockId: string, direction: 'left' | 'right') => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    // Calculate default shares (1 for now, could be smarter)
    const shares = 1;
    
    if (direction === 'right') {
      // Buy
      if (portfolio && portfolio.cash >= stock.price * shares) {
        onTrade(stockId, 'buy', shares);
      }
    } else {
      // Sell
      const holding = portfolio?.holdings.find(h => h.stockId === stockId);
      if (holding && holding.shares >= shares) {
        onTrade(stockId, 'sell', shares);
      }
    }
  };

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-center">Browse Stocks</h1>
        <p className="text-sm text-gray-400 text-center mt-1">
          Swipe right to buy • Swipe left to sell
        </p>
      </div>

      {/* Stocks Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4">
          {stocks.map((stock, index) => {
            const holding = portfolio?.holdings.find(h => h.stockId === stock.id);
            
            return (
              <motion.div
                key={stock.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 relative cursor-grab active:cursor-grabbing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => setDraggedStock(stock.id)}
                onDragEnd={(_, info) => {
                  setDraggedStock(null);
                  const threshold = 50;
                  if (info.offset.x > threshold) {
                    handleSwipe(stock.id, 'right'); // Buy
                  } else if (info.offset.x < -threshold) {
                    handleSwipe(stock.id, 'left'); // Sell
                  }
                }}
                whileHover={{ scale: 1.01 }}
                style={{
                  opacity: draggedStock === stock.id ? 0.8 : 1,
                }}
              >
                {/* Swipe Indicators */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-2xl opacity-30">
                  📉
                </div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-2xl opacity-30">
                  🚀
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {stock.change > 5 ? '🚀' : 
                       stock.change > 2 ? '📈' : 
                       stock.change > 0 ? '↗️' : 
                       stock.change === 0 ? '➡️' : 
                       stock.change > -2 ? '↘️' : 
                       stock.change > -5 ? '📉' : '💀'}
                    </div>
                    <div>
                      <div className="font-bold text-xl text-white">
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {stock.name}
                      </div>
                      {holding && (
                        <div className="text-xs text-blue-400 mt-1">
                          Own {holding.shares} shares
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <AnimatedPrice
                      value={stock.price}
                      change={stock.change}
                      className="text-lg"
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      {stock.subscribers.toLocaleString()} members
                    </div>
                  </div>
                </div>

                {/* Progress indicators for market activity */}
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(stock.change) * 10)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 min-w-[40px]">
                    Vol: {(stock.volume / 1000).toFixed(0)}K
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};