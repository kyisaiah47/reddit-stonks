import { useState, useRef, useEffect } from 'react';
import { SubredditStock } from '../../shared/types/api';

interface SwipeableCardProps {
  stock: SubredditStock;
  onSwipeLeft: () => void;  // Sell action
  onSwipeRight: () => void; // Buy action  
  onTap: () => void;        // View details
  children?: React.ReactNode;
  className?: string;
}

export const SwipeableCard = ({ 
  stock, 
  onSwipeLeft, 
  onSwipeRight, 
  onTap, 
  children,
  className = ''
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const SWIPE_THRESHOLD = 100;
  const MAX_ROTATION = 15;

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startPos.x;
    const deltaY = Math.abs(clientY - startPos.y);
    
    // Only allow horizontal swiping if vertical movement is minimal
    if (deltaY < 50) {
      setDragOffset(deltaX);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      if (dragOffset > 0) {
        // Swipe right - Buy
        onSwipeRight();
        triggerHapticFeedback();
      } else {
        // Swipe left - Sell
        onSwipeLeft();
        triggerHapticFeedback();
      }
    }

    // Animate back to center
    animateToPosition(0);
  };

  const animateToPosition = (targetOffset: number) => {
    const startOffset = dragOffset;
    const startTime = Date.now();
    const duration = 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset + (targetOffset - startOffset) * easeOut;
      
      setDragOffset(currentOffset);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const triggerHapticFeedback = () => {
    // Trigger haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const getRotation = () => {
    return (dragOffset / 200) * MAX_ROTATION;
  };

  const getOpacity = () => {
    return Math.max(0.7, 1 - (Math.abs(dragOffset) / 300));
  };

  const getSwipeIndicator = () => {
    if (Math.abs(dragOffset) < 50) return null;
    
    if (dragOffset > 0) {
      return (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          BUY 🚀
        </div>
      );
    } else {
      return (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          SELL 📉
        </div>
      );
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={cardRef}
        className={`relative bg-gray-800 rounded-lg border border-gray-700 cursor-grab active:cursor-grabbing transition-shadow duration-200 ${className} ${
          isDragging ? 'shadow-xl shadow-blue-500/20' : 'hover:shadow-lg hover:shadow-gray-500/20'
        }`}
        style={{
          transform: `translateX(${dragOffset}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
        }}
        
        // Mouse events
        onMouseDown={(e) => {
          e.preventDefault();
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        
        // Touch events
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleEnd}
        
        // Click/tap for details
        onClick={(e) => {
          if (Math.abs(dragOffset) < 10 && !isDragging) {
            onTap();
          }
        }}
      >
        {getSwipeIndicator()}
        
        {children}
        
        {/* Swipe hint indicators on sides */}
        <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-green-500/20 to-transparent rounded-l-lg transition-opacity duration-200 ${
          dragOffset > 30 ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-center h-full text-green-400 text-2xl">
            🚀
          </div>
        </div>
        
        <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-red-500/20 to-transparent rounded-r-lg transition-opacity duration-200 ${
          dragOffset < -30 ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-center h-full text-red-400 text-2xl">
            📉
          </div>
        </div>
      </div>
      
      {/* Swipe instruction hint */}
      {!isDragging && Math.abs(dragOffset) < 10 && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center">
          ← Swipe to trade →
        </div>
      )}
    </div>
  );
};