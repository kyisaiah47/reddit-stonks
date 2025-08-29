import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState } from 'react';
import { SubredditStock } from '../../shared/types/api';
import { AnimatedPrice } from './AnimatedPrice';

interface EnhancedStockCardProps {
  stock: SubredditStock;
  onSwipeLeft: () => void;  // Sell
  onSwipeRight: () => void; // Buy
  onTap: () => void;
  className?: string;
}

export const EnhancedStockCard = ({ 
  stock, 
  onSwipeLeft, 
  onSwipeRight, 
  onTap,
  className = ''
}: EnhancedStockCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  // Color transforms for swipe feedback
  const leftBackground = useTransform(
    x,
    [-100, 0],
    ['rgba(239, 68, 68, 0.2)', 'rgba(0, 0, 0, 0)']
  );
  const rightBackground = useTransform(
    x,
    [0, 100],
    ['rgba(0, 0, 0, 0)', 'rgba(34, 197, 94, 0.2)']
  );

  const handleDragEnd = (_: Event, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swipe right - Buy
      onSwipeRight();
      triggerHapticFeedback();
    } else if (info.offset.x < -threshold) {
      // Swipe left - Sell
      onSwipeLeft();
      triggerHapticFeedback();
    }
    
    setIsDragging(false);
  };

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const getStockEmoji = (change: number) => {
    if (change > 5) return '🚀';
    if (change > 2) return '📈';
    if (change > 0) return '↗️';
    if (change === 0) return '➡️';
    if (change > -2) return '↘️';
    if (change > -5) return '📉';
    return '💀';
  };

  return (
    <motion.div
      className={`relative bg-gray-800 rounded-lg border border-gray-700 p-4 cursor-grab select-none ${className}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{
        x,
        rotate,
        opacity,
        background: isDragging ? 
          `linear-gradient(90deg, ${leftBackground.get()}, ${rightBackground.get()})` : 
          undefined
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onTap={() => !isDragging && onTap()}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      {/* Swipe indicators */}
      <motion.div
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold"
        style={{ opacity: useTransform(x, [50, 100], [0, 1]) }}
      >
        BUY 🚀
      </motion.div>
      
      <motion.div
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
        style={{ opacity: useTransform(x, [-100, -50], [1, 0]) }}
      >
        SELL 📉
      </motion.div>

      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getStockEmoji(stock.change)}</span>
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

      {/* Background particles for visual interest */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
        style={{ opacity: useTransform(x, [-100, -50, 0, 50, 100], [0.8, 0.4, 0, 0.4, 0.8]) }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i % 2) * 20}%`,
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + (i * 0.2),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Swipe instruction hint */}
      <motion.div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center whitespace-nowrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        ← Swipe to trade →
      </motion.div>
    </motion.div>
  );
};