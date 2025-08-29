import { useEffect, useState, useRef } from 'react';
import { formatNumber } from '../utils/formatNumber';

interface AnimatedPriceProps {
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  showChange?: boolean;
  animate?: boolean;
  format?: 'currency' | 'price' | 'number' | 'none';
}

export const AnimatedPrice = ({ 
  value, 
  change = 0, 
  prefix = '', 
  suffix = ' Ⓒ', 
  className = '',
  showChange = true,
  animate = true,
  format = 'currency'
}: AnimatedPriceProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashType, setFlashType] = useState<'up' | 'down' | null>(null);
  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!animate || Math.abs(value - previousValueRef.current) < 0.01) {
      setDisplayValue(value);
      return;
    }

    const previousValue = previousValueRef.current;
    const difference = value - previousValue;
    const isIncrease = difference > 0;
    
    // Set flash effect
    setFlashType(isIncrease ? 'up' : 'down');
    setIsAnimating(true);

    // Animate the number counting up/down
    const startTime = Date.now();
    const duration = 800; // Animation duration in ms
    
    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOut curve for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = previousValue + (difference * easeOut);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateValue);
      } else {
        setDisplayValue(value);
        setIsAnimating(false);
        setTimeout(() => setFlashType(null), 200);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateValue);
    previousValueRef.current = value;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, animate]);

  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return formatNumber(val);
      case 'price':
        return val.toFixed(2);
      case 'number':
        return formatNumber(val);
      case 'none':
        return val.toFixed(2);
      default:
        return formatNumber(val);
    }
  };

  const getChangeColor = (): string => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };


  const getPulseClass = (): string => {
    if (!isAnimating || !flashType) return '';
    return flashType === 'up' ? 'animate-pulseGreen' : 'animate-pulseRed';
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span 
        className={`font-bold transition-all duration-300 ${getPulseClass()}`}
        style={{
          textShadow: flashType ? '0 0 10px currentColor' : 'none',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {prefix}{formatValue(displayValue)}{suffix}
      </span>
      
      {showChange && change !== 0 && (
        <span className={`text-sm font-medium ${getChangeColor()}`}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
      
      {isAnimating && (
        <div className="flex items-center">
          {/* Floating animation particles */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${
                flashType === 'up' ? 'bg-green-400' : 'bg-red-400'
              } animate-floatUp`}
              style={{
                animationDelay: `${i * 100}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulseGreen {
          0%, 100% { 
            color: rgb(74, 222, 128);
            text-shadow: 0 0 10px rgba(74, 222, 128, 0.8);
          }
          50% { 
            color: rgb(34, 197, 94);
            text-shadow: 0 0 20px rgba(34, 197, 94, 0.9);
          }
        }
        
        @keyframes pulseRed {
          0%, 100% { 
            color: rgb(248, 113, 113);
            text-shadow: 0 0 10px rgba(248, 113, 113, 0.8);
          }
          50% { 
            color: rgb(239, 68, 68);
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.9);
          }
        }
        
        @keyframes floatUp {
          0% { 
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          100% { 
            opacity: 0;
            transform: translateY(-20px) scale(0.5);
          }
        }
        
        .animate-pulseGreen {
          animation: pulseGreen 0.8s ease-in-out;
        }
        
        .animate-pulseRed {
          animation: pulseRed 0.8s ease-in-out;
        }
        
        .animate-floatUp {
          animation: floatUp 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};