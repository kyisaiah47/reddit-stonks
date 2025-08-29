import { useState } from 'react';
import { motion } from 'framer-motion';
import { SubredditStock, Portfolio } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';
import { formatNumber } from '../utils/formatNumber';

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
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/30 relative cursor-grab active:cursor-grabbing transition-colors"
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

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {stock.change > 2 ? (
                        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : stock.change > 0 ? (
                        <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : stock.change === 0 ? (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : stock.change > -2 ? (
                        <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      ) : stock.change > -5 ? (
                        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xl text-white">
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {stock.name}
                      </div>
                      {holding && (
                        <div className="text-xs text-orange-400 mt-1">
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
                      format="price"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {formatNumber(stock.subscribers)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress indicators for market activity */}
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(stock.change) * 10)}%` 
                      }}
                    />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-900 text-orange-300 border border-orange-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    {(stock.volume / 1000).toFixed(0)}K
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};