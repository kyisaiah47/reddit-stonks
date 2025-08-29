import { useState, useEffect } from 'react';

interface MemeMessageProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

interface MemeMessagesProps {
  messages: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>;
  onDismiss: (id: string) => void;
}

const MEME_MESSAGES = {
  buy_success: [
    '💎🙌 DIAMOND HANDS ACTIVATED',
    '🚀 TO THE MOON!',
    '📈 STONKS ONLY GO UP',
    '🦍 APE TOGETHER STRONG',
    '💰 THIS IS THE WAY',
    '🎯 BULLISH AF',
    '🔥 LET\'S GOOO!',
    '⚡ BUY THE DIP',
    '🌙 MOON MISSION INITIATED'
  ],
  sell_success: [
    '📄🙌 PAPER HANDS ACTIVATED',
    '💵 SECURING THE BAG',
    '📉 PROFIT TAKING TIME',
    '🧻 TOILET PAPER HANDS',
    '💸 TAKING PROFITS',
    '📊 SMART EXIT',
    '🎪 LEAVING THE CIRCUS',
    '💡 BIG BRAIN MOVE',
    '🏃‍♂️ RUNNING AWAY WITH GAINS'
  ],
  error: [
    '😵 SMOOTH BRAIN MOMENT',
    '🤡 CLOWN MARKET STRIKES AGAIN',
    '💥 OOPSIE DAISY',
    '🚫 NOT FINANCIAL ADVICE',
    '😅 WHOOPS WRONG BUTTON',
    '🎭 COMEDY GOLD',
    '🤪 RETARD STRENGTH NEEDED',
    '🎲 RNG GODS SAY NO'
  ],
  warning: [
    '⚠️ SIR, THIS IS A CASINO',
    '🚨 DANGER ZONE',
    '🔔 WAKE UP CALL',
    '⏰ TIME TO PANIC?',
    '🧐 THINK AGAIN',
    '🤔 ARE YOU SURE?',
    '💭 SECOND THOUGHTS?',
    '🎪 WELCOME TO THE CIRCUS'
  ]
};

const MemeMessage = ({ message, type, onClose, duration = 3000 }: MemeMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose, duration]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900',
          border: 'border-green-500',
          text: 'text-green-400',
          shadow: 'shadow-green-500/50'
        };
      case 'error':
        return {
          bg: 'bg-red-900',
          border: 'border-red-500', 
          text: 'text-red-400',
          shadow: 'shadow-red-500/50'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          shadow: 'shadow-yellow-500/50'
        };
      case 'info':
        return {
          bg: 'bg-blue-900',
          border: 'border-blue-500',
          text: 'text-blue-400', 
          shadow: 'shadow-blue-500/50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`${styles.bg} ${styles.border} border-2 rounded-lg p-4 shadow-lg ${styles.shadow} transform transition-all duration-300 ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      }`}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => onClose(), 300);
      }}
    >
      <div className={`${styles.text} font-bold text-center cursor-pointer hover:scale-105 transition-transform`}>
        {message}
      </div>
      
      {/* Animated sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        {type === 'success' && [...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-yellow-400 animate-ping"
            style={{
              left: `${10 + (i * 15)}%`,
              top: `${20 + (i % 2) * 40}%`,
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.5s'
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </div>
  );
};

export const MemeMessages = ({ messages, onDismiss }: MemeMessagesProps) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {messages.map((msg) => (
        <MemeMessage
          key={msg.id}
          message={msg.message}
          type={msg.type}
          onClose={() => onDismiss(msg.id)}
        />
      ))}
    </div>
  );
};

export const generateMemeMessage = (
  type: 'buy_success' | 'sell_success' | 'error' | 'warning'
): string => {
  const messages = MEME_MESSAGES[type] || MEME_MESSAGES.error;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Hook for managing meme messages
export const useMemeMessages = () => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>>([]);

  const addMessage = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => [...prev, { id, message, type }]);
  };

  const addMemeMessage = (
    type: 'buy_success' | 'sell_success' | 'error' | 'warning'
  ) => {
    const message = generateMemeMessage(type);
    const messageType = type.includes('success') ? 'success' : 
                       type === 'error' ? 'error' : 'warning';
    addMessage(message, messageType);
  };

  const dismissMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return {
    messages,
    addMessage,
    addMemeMessage,
    dismissMessage
  };
};