import { useEffect, useState } from 'react';
import { SubredditStock } from '../../shared/types/api';

interface StockTickerProps {
  stocks: SubredditStock[];
}

export const StockTicker = ({ stocks }: StockTickerProps) => {
  const [tickerText, setTickerText] = useState('');

  useEffect(() => {
    const generateTickerText = () => {
      const tickerItems = stocks.map(stock => {
        const changeEmoji = stock.change >= 0 ? 
          (stock.change > 5 ? '🚀' : stock.change > 2 ? '📈' : '↗️') :
          (stock.change < -5 ? '💀' : stock.change < -2 ? '📉' : '↘️');
        
        const changeText = stock.change >= 0 ? `+${stock.change.toFixed(2)}` : stock.change.toFixed(2);
        
        return `${stock.symbol} $${stock.price.toFixed(2)} ${changeEmoji} ${changeText}%`;
      });
      
      // Add some Reddit meme elements
      const memeElements = [
        '💎🙌 DIAMOND HANDS',
        '🦍 APE STRONG',
        '📈 STONKS',
        '🚀 TO THE MOON',
        '💰 TENDIES'
      ];
      
      const randomMeme = memeElements[Math.floor(Math.random() * memeElements.length)];
      
      return [...tickerItems, randomMeme].join(' • ') + ' • ';
    };

    setTickerText(generateTickerText());
    
    // Update ticker every 30 seconds
    const interval = setInterval(() => {
      setTickerText(generateTickerText());
    }, 30000);

    return () => clearInterval(interval);
  }, [stocks]);

  return (
    <div className="bg-gray-900 text-green-400 py-2 overflow-hidden relative border-b border-gray-700">
      <div className="ticker-container">
        <div 
          className="ticker-scroll whitespace-nowrap inline-block animate-scroll font-mono text-sm font-bold"
          style={{ 
            animationDuration: '120s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear'
          }}
        >
          {tickerText.repeat(3)}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-scroll {
          animation-name: scroll;
        }
        
        .ticker-container {
          background: linear-gradient(90deg, 
            rgba(17, 24, 39, 1) 0%, 
            rgba(17, 24, 39, 0) 10%, 
            rgba(17, 24, 39, 0) 90%, 
            rgba(17, 24, 39, 1) 100%
          );
        }
      `}</style>
    </div>
  );
};