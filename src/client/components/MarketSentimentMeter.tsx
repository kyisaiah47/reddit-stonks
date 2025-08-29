import { useEffect, useState } from 'react';

interface MarketSentimentMeterProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  stocks: Array<{ change: number }>;
}

export const MarketSentimentMeter = ({ sentiment, stocks }: MarketSentimentMeterProps) => {
  const [bullishness, setBullishness] = useState(50);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useEffect(() => {
    // Calculate bullishness percentage based on stock performance
    const positiveStocks = stocks.filter(s => s.change > 0).length;
    const totalStocks = stocks.length;
    const avgChange = stocks.reduce((sum, s) => sum + s.change, 0) / totalStocks;
    
    // Convert to 0-100 scale
    const newBullishness = Math.max(0, Math.min(100, 50 + (avgChange * 5) + ((positiveStocks / totalStocks - 0.5) * 100)));
    setBullishness(newBullishness);
    
    // Set pulse intensity based on volatility
    const volatility = Math.abs(avgChange);
    setPulseIntensity(1 + (volatility / 10));
  }, [stocks]);

  const getSentimentDisplay = () => {
    if (bullishness > 80) return { text: '🚀 MOON MISSION', color: 'from-green-400 to-green-600', bg: 'bg-green-900' };
    if (bullishness > 65) return { text: '📈 BULLISH AF', color: 'from-green-400 to-green-500', bg: 'bg-green-800' };
    if (bullishness > 55) return { text: '📊 MILD BULL', color: 'from-green-300 to-green-400', bg: 'bg-green-700' };
    if (bullishness > 45) return { text: '😐 SIDEWAYS', color: 'from-yellow-400 to-yellow-500', bg: 'bg-yellow-600' };
    if (bullishness > 35) return { text: '📉 MILD BEAR', color: 'from-red-400 to-red-500', bg: 'bg-red-700' };
    if (bullishness > 20) return { text: '🐻 BEARISH', color: 'from-red-500 to-red-600', bg: 'bg-red-800' };
    return { text: '💀 CRASH MODE', color: 'from-red-600 to-red-800', bg: 'bg-red-900' };
  };

  const sentimentData = getSentimentDisplay();

  return (
    <div className="relative p-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className={`absolute inset-0 ${sentimentData.bg} animate-pulse`}
          style={{ 
            animationDuration: `${2 / pulseIntensity}s`,
            filter: 'blur(20px)'
          }}
        ></div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          Market Sentiment
        </h3>
        
        {/* Main sentiment display */}
        <div className="text-center mb-6">
          <div 
            className={`text-3xl font-black mb-2 bg-gradient-to-r ${sentimentData.color} bg-clip-text text-transparent animate-pulse`}
            style={{ animationDuration: `${1 / pulseIntensity}s` }}
          >
            {sentimentData.text}
          </div>
          <div className="text-sm text-gray-400">
            {bullishness.toFixed(0)}% Bullish
          </div>
        </div>

        {/* Sentiment meter bar */}
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full bg-gradient-to-r ${sentimentData.color} transition-all duration-1000 ease-out relative`}
            style={{ width: `${bullishness}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine"></div>
          </div>
          
          {/* Percentage indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 text-xs font-bold text-white"
            style={{ left: `${Math.max(5, Math.min(95, bullishness))}%` }}
          >
            {bullishness.toFixed(0)}%
          </div>
        </div>

        {/* Market stats */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div className="bg-gray-700 rounded p-2">
            <div className="text-green-400 font-bold">
              {stocks.filter(s => s.change > 0).length}
            </div>
            <div className="text-gray-400">Bulls</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-yellow-400 font-bold">
              {stocks.filter(s => s.change === 0).length}
            </div>
            <div className="text-gray-400">Neutral</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-red-400 font-bold">
              {stocks.filter(s => s.change < 0).length}
            </div>
            <div className="text-gray-400">Bears</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};