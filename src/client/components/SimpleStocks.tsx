import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubredditStock, Portfolio, StockCategory } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';
import { formatNumber } from '../utils/formatNumber';

interface SimpleStocksProps {
  stocks: SubredditStock[];
  portfolio: Portfolio | null;
  onTrade: (stockId: string, type: 'buy' | 'sell', shares: number) => void;
}

export const SimpleStocks = ({ stocks, portfolio, onTrade }: SimpleStocksProps) => {
  const [draggedStock, setDraggedStock] = useState<string | null>(null);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | null>(null);
  const [sortBy, setSortBy] = useState<'change' | 'price' | 'volume' | 'name'>('change');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Quantity selection modal
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{
    stockId: string;
    direction: 'left' | 'right';
    stock: SubredditStock;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);

  const categories: Array<{ key: StockCategory | null; label: string; icon: string }> = [
    { key: null, label: 'All', icon: '🌟' },
    { key: 'meme', label: 'Meme', icon: '🚀' },
    { key: 'blue-chip', label: 'Blue Chip', icon: '💎' },
    { key: 'tech-growth', label: 'Tech', icon: '💻' },
    { key: 'entertainment', label: 'Fun', icon: '🎮' },
    { key: 'sports', label: 'Sports', icon: '⚽' },
  ];

  // Filter and search stocks
  const filteredStocks = useMemo(() => {
    let filtered = [...stocks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(stock => stock.category === selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return b.change - a.change;
        case 'price':
          return b.price - a.price;
        case 'volume':
          return b.volume - a.volume;
        case 'name':
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

    return filtered;
  }, [stocks, searchQuery, selectedCategory, sortBy]);

  const handleSwipe = (stockId: string, direction: 'left' | 'right') => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    // Open quantity selection modal
    setPendingTrade({ stockId, direction, stock });
    setQuantity(1);
    setShowQuantityModal(true);
  };

  const executeTrade = () => {
    if (!pendingTrade) return;
    
    const { stockId, direction } = pendingTrade;
    
    if (direction === 'right') {
      // Buy
      if (portfolio && portfolio.cash >= pendingTrade.stock.price * quantity) {
        onTrade(stockId, 'buy', quantity);
      }
    } else {
      // Sell
      const holding = portfolio?.holdings.find(h => h.stockId === stockId);
      if (holding && holding.shares >= quantity) {
        onTrade(stockId, 'sell', quantity);
      }
    }
    
    // Close modal
    setShowQuantityModal(false);
    setPendingTrade(null);
  };

  const cancelTrade = () => {
    setShowQuantityModal(false);
    setPendingTrade(null);
  };

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Header with Toggle Buttons */}
      <div className="bg-gray-800 px-3 py-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-center">Browse Stocks</h1>
        <p className="text-xs text-gray-400 text-center">
          Swipe right to buy • Swipe left to sell
        </p>
        
        {/* Quick Toggle Buttons */}
        <div className="flex justify-center gap-1.5 mt-2">
          <motion.button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              showSearch || searchQuery
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔍 Search
          </motion.button>
          
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              showFilters || selectedCategory
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏷️ Filter
          </motion.button>
        </div>
      </div>

      {/* Collapsible Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            className="bg-gray-800 px-3 pb-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="bg-gray-800 px-3 pb-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Category Filter */}
            <div className="mb-2">
              <h3 className="text-xs font-medium text-gray-300 mb-1">Categories</h3>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {categories.map((category) => (
                  <motion.button
                    key={category.key || 'all'}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.key
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xs">{category.icon}</span>
                    {category.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-xs font-medium text-gray-300 mb-1">Sort by</h3>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {[
                  { key: 'change', label: 'Trending', icon: '📈' },
                  { key: 'price', label: 'Price', icon: '💰' },
                  { key: 'volume', label: 'Volume', icon: '📊' },
                  { key: 'name', label: 'A-Z', icon: '🔤' },
                ].map((sort) => (
                  <motion.button
                    key={sort.key}
                    onClick={() => setSortBy(sort.key as any)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      sortBy === sort.key
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xs">{sort.icon}</span>
                    {sort.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      {(searchQuery || selectedCategory) && (
        <div className="px-3 py-1 bg-gray-900">
          <p className="text-xs text-gray-400 text-center">
            Found {filteredStocks.length} of {stocks.length} stocks
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory && ` in ${categories.find(c => c.key === selectedCategory)?.label}`}
          </p>
        </div>
      )}

      {/* Stocks Grid */}
      <div className="p-3">
        <AnimatePresence>
          <div className="grid grid-cols-1 gap-3">
            {filteredStocks.map((stock, index) => {
            const holding = portfolio?.holdings.find(h => h.stockId === stock.id);
            
            return (
              <motion.div
                key={stock.id}
                className={`rounded-xl p-4 border relative cursor-grab active:cursor-grabbing transition-all duration-200 ${
                  draggedStock === stock.id && dragDirection === 'right'
                    ? 'bg-green-800/50 border-green-500/70 shadow-lg shadow-green-500/20'
                    : draggedStock === stock.id && dragDirection === 'left'
                    ? 'bg-orange-800/50 border-orange-500/70 shadow-lg shadow-orange-500/20'
                    : 'bg-gray-800 border-gray-700 hover:border-orange-500/30'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => {
                  setDraggedStock(stock.id);
                  setDragDirection(null);
                }}
                onDrag={(_, info) => {
                  const threshold = 30;
                  if (info.offset.x > threshold) {
                    setDragDirection('right'); // Buy direction
                  } else if (info.offset.x < -threshold) {
                    setDragDirection('left'); // Sell direction
                  } else {
                    setDragDirection(null);
                  }
                }}
                onDragEnd={(_, info) => {
                  setDraggedStock(null);
                  setDragDirection(null);
                  const threshold = 50;
                  if (info.offset.x > threshold) {
                    handleSwipe(stock.id, 'right'); // Buy
                  } else if (info.offset.x < -threshold) {
                    handleSwipe(stock.id, 'left'); // Sell
                  }
                }}
                whileHover={{ scale: 1.01 }}
                style={{
                  opacity: draggedStock === stock.id ? 0.9 : 1,
                }}
              >
                {/* Buy/Sell Action Indicators */}
                {draggedStock === stock.id && dragDirection === 'right' && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      💰 BUY
                    </div>
                  </div>
                )}
                
                {draggedStock === stock.id && dragDirection === 'left' && (
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                    <div className="bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      💸 SELL
                    </div>
                  </div>
                )}

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
                  
                  <div className="text-right flex flex-col items-end">
                    <div className="text-lg font-bold text-white">
                      {stock.price.toFixed(2)} Ⓒ
                    </div>
                    <div className={`text-sm font-medium ${
                      stock.change > 0 ? 'text-green-400' : 
                      stock.change < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar spanning full width */}
                <div className="mt-3">
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        stock.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(stock.change) * 10)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Chips row at bottom */}
                <div className="mt-3 flex justify-between items-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {formatNumber(stock.subscribers)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900 text-orange-300 border border-orange-600">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    {(stock.volume / 1000).toFixed(0)}K
                  </span>
                </div>
              </motion.div>
            );
          })}
          </div>
        </AnimatePresence>
      </div>

      {/* Quantity Selection Modal */}
      <AnimatePresence>
        {showQuantityModal && pendingTrade && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`bg-gray-800 rounded-xl p-4 mx-4 max-w-xs w-full border ${
                pendingTrade.direction === 'right' 
                  ? 'border-green-500/50 shadow-lg shadow-green-500/20' 
                  : 'border-orange-500/50 shadow-lg shadow-orange-500/20'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="text-center mb-3">
                <h3 className="text-base font-bold">
                  {pendingTrade.direction === 'right' ? '💰 Buy' : '💸 Sell'} {pendingTrade.stock.symbol}
                </h3>
              </div>

              {/* Quantity Selector */}
              <div className="mb-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center text-lg font-bold bg-gray-700 border border-gray-600 rounded-lg py-1 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Trade Details */}
              <div className="bg-gray-700/50 rounded-lg p-2 mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">{pendingTrade.stock.price.toFixed(2)} Ⓒ</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Qty:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-600">
                  <span>Total:</span>
                  <span className={pendingTrade.direction === 'right' ? 'text-green-400' : 'text-orange-400'}>
                    {(pendingTrade.stock.price * quantity).toFixed(2)} Ⓒ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={cancelTrade}
                  className="flex-1 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={executeTrade}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pendingTrade.direction === 'right'
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-orange-600 hover:bg-orange-500 text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {pendingTrade.direction === 'right' ? 'Buy' : 'Sell'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};