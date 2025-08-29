import { motion } from 'framer-motion';

interface RedditTradingLogoProps {
  size?: number;
  className?: string;
}

export const RedditTradingLogo = ({ size = 40, className = "" }: RedditTradingLogoProps) => {
  return (
    <motion.div 
      className={`flex items-center ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Reddit Alien Head */}
        <circle cx="30" cy="35" r="18" fill="#FF4500" />
        
        {/* Reddit Alien Antenna */}
        <line x1="30" y1="17" x2="35" y2="8" stroke="#FF4500" strokeWidth="3" strokeLinecap="round" />
        <circle cx="35" cy="8" r="3" fill="#FF4500" />
        
        {/* Eyes */}
        <circle cx="26" cy="32" r="2" fill="#2D3748" />
        <circle cx="34" cy="32" r="2" fill="#2D3748" />
        
        {/* Smile */}
        <path d="M 24 40 Q 30 44 36 40" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" fill="none" />
        
        {/* Body */}
        <ellipse cx="30" cy="55" rx="12" ry="15" fill="#FF4500" />
        
        {/* Arms */}
        <ellipse cx="18" cy="50" rx="3" ry="8" fill="#FF4500" transform="rotate(-20 18 50)" />
        <ellipse cx="42" cy="50" rx="3" ry="8" fill="#FF4500" transform="rotate(20 42 50)" />
        
        {/* Trading Chart */}
        {/* Chart Bars */}
        <rect x="55" y="70" width="6" height="15" fill="#FF4500" />
        <rect x="65" y="60" width="6" height="25" fill="#FF4500" />
        <rect x="75" y="50" width="6" height="35" fill="#FF4500" />
        
        {/* Upward Arrow */}
        <motion.path 
          d="M 50 65 L 65 50 L 75 60 L 85 45"
          stroke="#FF4500"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        
        {/* Arrow Head */}
        <motion.path
          d="M 85 45 L 80 48 L 82 53"
          stroke="#FF4500"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        />
      </svg>
    </motion.div>
  );
};