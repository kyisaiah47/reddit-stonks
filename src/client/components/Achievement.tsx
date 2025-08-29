import { useEffect, useState } from 'react';

export type AchievementType = 
  | 'first_trade'
  | 'paper_hands' 
  | 'diamond_hands'
  | 'profitable_week'
  | 'moon_mission'
  | 'crash_survivor'
  | 'day_trader'
  | 'hodler'
  | 'diversified'
  | 'yolo';

interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  dateUnlocked?: Date;
}

interface AchievementPopupProps {
  achievement: Achievement;
  onClose: () => void;
}

interface AchievementSystemProps {
  portfolio?: {
    totalReturn: number;
    totalReturnPercent: number;
    holdings: Array<{ symbol: string }>;
  };
  recentTrades?: Array<{ type: 'buy' | 'sell'; timestamp: string }>;
}

const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, 'unlocked' | 'dateUnlocked'>> = {
  first_trade: {
    id: 'first_trade',
    title: 'Welcome to the Casino',
    description: 'Made your first trade',
    icon: '🎰',
    rarity: 'common'
  },
  paper_hands: {
    id: 'paper_hands',
    title: 'Paper Hands 📄🙌',
    description: 'Sold at a loss within 24 hours',
    icon: '📄',
    rarity: 'common'
  },
  diamond_hands: {
    id: 'diamond_hands',
    title: 'Diamond Hands 💎🙌',
    description: 'Held through a 20% dip and recovered',
    icon: '💎',
    rarity: 'epic'
  },
  profitable_week: {
    id: 'profitable_week',
    title: 'Week Winner',
    description: 'Profitable for 7 consecutive days',
    icon: '📈',
    rarity: 'rare'
  },
  moon_mission: {
    id: 'moon_mission',
    title: 'To the Moon! 🚀',
    description: 'Portfolio gained 50% in a single day',
    icon: '🚀',
    rarity: 'legendary'
  },
  crash_survivor: {
    id: 'crash_survivor',
    title: 'Crash Survivor',
    description: 'Maintained portfolio during market crash',
    icon: '🛡️',
    rarity: 'epic'
  },
  day_trader: {
    id: 'day_trader',
    title: 'Day Trader',
    description: 'Made 10 trades in a single day',
    icon: '⚡',
    rarity: 'rare'
  },
  hodler: {
    id: 'hodler',
    title: 'HODLER',
    description: 'Held the same position for 30 days',
    icon: '🗿',
    rarity: 'rare'
  },
  diversified: {
    id: 'diversified',
    title: 'Diversified Investor',
    description: 'Own shares in all 5 subreddits',
    icon: '📊',
    rarity: 'rare'
  },
  yolo: {
    id: 'yolo',
    title: 'YOLO',
    description: 'Put 90% of portfolio in a single stock',
    icon: '🎯',
    rarity: 'legendary'
  }
};

const AchievementPopup = ({ achievement, onClose }: AchievementPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
    }
  };

  const getRarityBg = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-800 border-gray-600';
      case 'rare': return 'bg-blue-900 border-blue-600';
      case 'epic': return 'bg-purple-900 border-purple-600';
      case 'legendary': return 'bg-yellow-900 border-yellow-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`${getRarityBg(achievement.rarity)} border-2 rounded-lg p-6 max-w-sm mx-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          boxShadow: `0 0 30px ${achievement.rarity === 'legendary' ? '#fbbf24' : achievement.rarity === 'epic' ? '#a855f7' : achievement.rarity === 'rare' ? '#3b82f6' : '#6b7280'}`
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">{achievement.icon}</div>
          <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-clip-text text-transparent`}>
            Achievement Unlocked!
          </h3>
          <h4 className="text-lg font-semibold text-white mb-2">
            {achievement.title}
          </h4>
          <p className="text-sm text-gray-300 mb-4">
            {achievement.description}
          </p>
          <div className={`text-xs uppercase font-bold ${getRarityColor(achievement.rarity)} bg-gradient-to-r bg-clip-text text-transparent`}>
            {achievement.rarity}
          </div>
        </div>
        
        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${10 + (i * 8)}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const AchievementSystem = ({ portfolio, recentTrades = [] }: AchievementSystemProps) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementType>>(new Set());
  const [currentPopup, setCurrentPopup] = useState<Achievement | null>(null);

  const checkAchievements = () => {
    const newAchievements: AchievementType[] = [];

    // First Trade
    if (recentTrades.length > 0 && !unlockedAchievements.has('first_trade')) {
      newAchievements.push('first_trade');
    }

    // Day Trader - 10 trades in a day
    if (recentTrades.length >= 10 && !unlockedAchievements.has('day_trader')) {
      const today = new Date().toDateString();
      const todayTrades = recentTrades.filter(trade => 
        new Date(trade.timestamp).toDateString() === today
      );
      if (todayTrades.length >= 10) {
        newAchievements.push('day_trader');
      }
    }

    if (portfolio) {
      // Moon Mission - 50% gain
      if (portfolio.totalReturnPercent >= 50 && !unlockedAchievements.has('moon_mission')) {
        newAchievements.push('moon_mission');
      }

      // YOLO - 90% in one stock
      if (portfolio.holdings.length > 0 && !unlockedAchievements.has('yolo')) {
        // This would require more detailed portfolio data in practice
      }

      // Diversified - own all 5 subreddits
      if (portfolio.holdings.length >= 5 && !unlockedAchievements.has('diversified')) {
        const uniqueSymbols = new Set(portfolio.holdings.map(h => h.symbol));
        if (uniqueSymbols.size >= 5) {
          newAchievements.push('diversified');
        }
      }

      // Profitable Week (simplified)
      if (portfolio.totalReturnPercent > 0 && portfolio.totalReturn > 100 && !unlockedAchievements.has('profitable_week')) {
        newAchievements.push('profitable_week');
      }
    }

    // Show first new achievement
    if (newAchievements.length > 0 && !currentPopup) {
      const achievementId = newAchievements[0];
      const achievement = {
        ...ACHIEVEMENTS[achievementId],
        unlocked: true,
        dateUnlocked: new Date()
      };
      
      setCurrentPopup(achievement);
      setUnlockedAchievements(prev => new Set([...prev, achievementId]));
    }
  };

  useEffect(() => {
    checkAchievements();
  }, [portfolio, recentTrades]);

  return (
    <>
      {currentPopup && (
        <AchievementPopup
          achievement={currentPopup}
          onClose={() => setCurrentPopup(null)}
        />
      )}
    </>
  );
};

export const AchievementDisplay = ({ achievements }: { achievements: Achievement[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Object.values(ACHIEVEMENTS).map(achievement => {
        const isUnlocked = achievements.some(a => a.id === achievement.id && a.unlocked);
        
        return (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border text-center transition-all duration-200 ${
              isUnlocked
                ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                : 'bg-gray-800 border-gray-700 opacity-50'
            }`}
          >
            <div className={`text-2xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
              {achievement.icon}
            </div>
            <div className={`text-xs font-medium ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
              {achievement.title}
            </div>
            <div className={`text-xs mt-1 ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
              {achievement.description}
            </div>
          </div>
        );
      })}
    </div>
  );
};