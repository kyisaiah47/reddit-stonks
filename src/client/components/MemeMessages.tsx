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

const MemeMessage = ({ message, type, onClose, duration = 2000 }: MemeMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss (shorter duration)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(), 200);
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
          bg: 'bg-green-900/80',
          border: 'border-green-500/50',
          text: 'text-green-300',
          shadow: 'shadow-lg shadow-green-500/20'
        };
      case 'error':
        return {
          bg: 'bg-red-900/80',
          border: 'border-red-500/50', 
          text: 'text-red-300',
          shadow: 'shadow-lg shadow-red-500/20'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/80',
          border: 'border-yellow-500/50',
          text: 'text-yellow-300',
          shadow: 'shadow-lg shadow-yellow-500/20'
        };
      case 'info':
        return {
          bg: 'bg-orange-900/80',
          border: 'border-orange-500/50',
          text: 'text-orange-300', 
          shadow: 'shadow-lg shadow-orange-500/20'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg px-3 py-2 ${styles.shadow} transform transition-all duration-200 ${
        isVisible && !isExiting ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => onClose(), 200);
      }}
    >
      <div className={`${styles.text} font-medium text-sm text-center cursor-pointer hover:scale-105 transition-transform`}>
        {message}
      </div>
      
      {/* Subtle sparkles only for success */}
      {type === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400/60 animate-pulse text-xs"
              style={{
                left: `${20 + (i * 30)}%`,
                top: `${30 + (i % 2) * 20}%`,
                animationDelay: `${i * 400}ms`,
                animationDuration: '2s'
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MemeMessages = ({ messages, onDismiss }: MemeMessagesProps) => {
  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 space-y-2 max-w-xs">
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