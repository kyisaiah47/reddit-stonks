import { useEffect, useState } from 'react';

interface ActivityFeedItem {
  id: string;
  type: 'trade' | 'market_event' | 'achievement';
  message: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface LiveActivityFeedProps {
  className?: string;
}

export const LiveActivityFeed = ({ className = '' }: LiveActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);

  const generateMockActivity = (): ActivityFeedItem => {
    const activities: Omit<ActivityFeedItem, 'id' | 'timestamp'>[] = [
      {
        type: 'trade',
        message: '💎 DiamondHands bought 100 WSB @ $45.67',
        icon: '💎',
        color: 'text-green-400'
      },
      {
        type: 'trade', 
        message: '📄 PaperHands sold 50 CRYP @ $78.34',
        icon: '📄',
        color: 'text-red-400'
      },
      {
        type: 'market_event',
        message: '🚨 r/wallstreetbets drama detected! +15% volatility',
        icon: '🚨',
        color: 'text-yellow-400'
      },
      {
        type: 'trade',
        message: '🦍 MonkeyBusiness bought 200 GAME @ $34.89',
        icon: '🦍',
        color: 'text-blue-400'
      },
      {
        type: 'achievement',
        message: '🏆 StonkMaster achieved "Diamond Hands" badge!',
        icon: '🏆',
        color: 'text-purple-400'
      },
      {
        type: 'market_event',
        message: '🚀 TECH breaks resistance level! New ATH incoming?',
        icon: '🚀',
        color: 'text-green-400'
      },
      {
        type: 'trade',
        message: '🧻 ToiletPaperHands panic sold 75 STCK @ $23.12',
        icon: '🧻',
        color: 'text-red-400'
      },
      {
        type: 'market_event',
        message: '📈 Market sentiment shifted to BULLISH AF',
        icon: '📈',
        color: 'text-green-400'
      },
      {
        type: 'achievement',
        message: '🎯 RetailTrader completed first profitable week!',
        icon: '🎯',
        color: 'text-cyan-400'
      }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    return {
      ...randomActivity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
  };

  useEffect(() => {
    // Initialize with some activities
    const initialActivities = Array.from({ length: 5 }, () => generateMockActivity());
    setActivities(initialActivities);

    // Add new activity every 8-15 seconds
    const interval = setInterval(() => {
      const newActivity = generateMockActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only 10 most recent
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          📡 Live Feed
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </h3>
      </div>
      
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            className={`p-3 border-b border-gray-700 hover:bg-gray-750 transition-colors duration-200 ${
              index === 0 ? 'animate-slideInLeft' : ''
            }`}
            style={{ 
              animationDelay: index === 0 ? '0ms' : `${index * 100}ms`,
              opacity: Math.max(0.3, 1 - (index * 0.1))
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${activity.color} font-medium mb-1`}>
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
              {activity.type === 'trade' && (
                <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  TRADE
                </div>
              )}
              {activity.type === 'market_event' && (
                <div className="text-xs text-yellow-400 bg-yellow-900 px-2 py-1 rounded">
                  EVENT
                </div>
              )}
              {activity.type === 'achievement' && (
                <div className="text-xs text-purple-400 bg-purple-900 px-2 py-1 rounded">
                  BADGE
                </div>
              )}
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-2xl mb-2">📡</div>
            <div>Waiting for market activity...</div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slideInLeft {
          0% { 
            transform: translateX(-100%); 
            opacity: 0; 
          }
          100% { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.8);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1);
        }
      `}</style>
    </div>
  );
};