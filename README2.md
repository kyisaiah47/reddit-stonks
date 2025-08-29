# Reddit Stonks 📈🚀

> Trade subreddits like stocks in the ultimate Reddit Stock Exchange

## Overview

**Reddit Stonks** transforms Reddit's social dynamics into a financial trading simulation where users buy and sell "shares" in subreddits, memes, and trending topics based on real Reddit engagement data. Players compete to build the most valuable portfolio by predicting and capitalizing on Reddit trends.

## 🎯 Game Concept

Turn Reddit engagement metrics into tradeable assets where:

- **Subreddit subscriber growth** drives stock prices
- **Post engagement** creates market volatility
- **Community drama** triggers price swings
- **Viral content** causes trading frenzies

## 🎮 How to Play

### Starting Out

1. **Get $10,000 virtual Reddit Coins** to start trading
2. **Research subreddit trends** and community activity
3. **Buy shares** in subreddits you think will grow
4. **Watch your portfolio** as real Reddit data drives prices
5. **Compete on leaderboards** with other Reddit investors

### Trading Mechanics

- **Buy/Sell Orders**: Instant trades at current market prices
- **Portfolio Tracking**: Real-time P&L and performance metrics
- **Market Sentiment**: Overall Reddit mood affects all prices
- **Price Discovery**: Algorithm combines subscriber growth, engagement rates, and activity levels

## 📊 Tradeable Assets

### Subreddit Stocks

- **r/wallstreetbets** - High volatility meme stock
- **r/cryptocurrency** - Crypto sentiment indicator
- **r/gaming** - Gaming industry bellwether
- **r/memes** - Pure meme economy play
- **r/aww** - Stable "blue chip" wholesome dividend stock

### Market Drivers

- **Subscriber Growth**: Daily new member rates
- **Post Quality**: Upvote ratios and engagement
- **Comment Activity**: Discussion volume and sentiment
- **Viral Events**: When posts hit r/all

## 🏆 Competition Features

### Leaderboards

- **Daily Top Performers** - Biggest % gains
- **Weekly Champions** - Consistent performers
- **Diamond Hands** - Best long-term holds
- **Paper Hands** - Most active day traders

### Social Trading

- **Follow successful investors** and copy their strategies
- **Share your portfolio** and trading rationale
- **Create investment clubs** around themes (gaming stocks, meme funds)
- **Post DD (Due Diligence)** analysis on subreddit trends

## 🔧 Technical Features

### Real-Time Data Integration

- **Reddit API** for live subscriber counts and engagement metrics
- **WebSocket connections** for instant price updates
- **Sentiment analysis** of comment threads and post titles
- **Volatility detection** for unusual activity patterns

### User Experience

- **Mobile-optimized interface** (375×584 viewport)
- **Desktop trading dashboard** with advanced charts
- **One-click trading** with swipe gestures on mobile
- **Push notifications** for price alerts and market events

### Performance Optimized

- **Responsive design** - no scrollbars, fits all screen sizes
- **Fast loading** with optimized Reddit API calls
- **Smooth animations** for price changes and trades
- **Offline support** with cached portfolio data

## 🎨 Design Philosophy

**"Bloomberg Terminal meets Reddit"** - Dynamic, Living Market Experience

### Core Visual Principles

- **Professional trading interface** with financial-grade charts and data
- **Reddit-native elements** like upvote/downvote trading buttons
- **Playful "stonks" branding** that appeals to Reddit culture
- **Dark theme** optimized for extended trading sessions

### Dynamic UI Elements

#### 📈 Animated Stock Ticker Bar

```jsx
// Continuous scrolling ticker with live prices
<div className="ticker-container">
  <div className="ticker-scroll">
    WSB $45.67 ↗️ +2.34 • CRYP $78.34 🚀 +4.12 • MEMES $23.45 📉 -1.23 • GME $156.78 💎 +8.90 • DOGE
    $0.42 🐕 +0.05 • STONKS $99.99 📈 +15.67
  </div>
</div>
```

#### ⚡ Real-Time Price Animations

- **Pulsing updates** - Prices flash green/red on changes
- **Number counters** - Values animate up/down smoothly
- **Volatility effects** - Screen shake on major movements
- **Particle effects** - Floating stonks emojis and sparkles

#### 🎭 Dynamic Market Sentiment

```jsx
// Live sentiment meter with personality
<div className="sentiment-meter">
  <div className="sentiment-bar" style={{ width: `${bullishness}%` }}>
    {sentiment > 80
      ? '🚀 MOON MISSION'
      : sentiment > 60
        ? '📈 BULLISH AF'
        : sentiment > 40
          ? '😐 SIDEWAYS'
          : sentiment > 20
            ? '📉 BEARISH'
            : '💀 CRASH MODE'}
  </div>
</div>
```

#### 📱 Live Activity Feed

```jsx
// Scrolling trade alerts and market events
<div className="activity-feed">
  <div className="trade-alert">💎 DiamondHands bought 100 WSB @ $45.67</div>
  <div className="trade-alert">📄 PaperHands sold 50 CRYP @ $78.34</div>
  <div className="market-event">🚨 r/wallstreetbets drama detected! +15% volatility</div>
</div>
```

### Reddit-Specific Interactions

#### 🎯 Meme-Powered Trading

```jsx
// Status messages with Reddit personality
const statusMessages = [
  '💎🙌 DIAMOND HANDS ACTIVATED',
  '🚀 TO THE MOON',
  '📈 STONKS ONLY GO UP',
  '🦍 APE TOGETHER STRONG',
  '💰 THIS IS THE WAY',
];
```

#### 🎮 Gamified Elements

- **Achievement popups** - "First Trade!", "Paper Hands", "Diamond Hands"
- **Streak counters** - Days of consecutive gains
- **Rank badges** - From "Smooth Brain" to "Wrinkled Brain"
- **Sound effects** - Satisfying trading confirmations

### Visual Polish Features

#### ✨ Micro-Animations

```css
/* Hover effects and state transitions */
.trading-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 69, 0, 0.3);
}

.price-change {
  animation: priceFlash 0.8s ease-out;
}

.portfolio-gain {
  animation: celebrationPulse 1.2s ease-in-out;
}
```

#### 🌊 Background Dynamics

- **Market grid animation** - Subtle moving background pattern
- **Color-coded themes** - Interface tints based on market sentiment
- **Parallax scrolling** - Depth and movement in design layers
- **Responsive particles** - Background reacts to trading activity

### Mobile-First Polish

- **Swipe gestures** - Quick buy/sell with finger gestures
- **Haptic feedback** - Phone vibration on successful trades
- **Pull-to-refresh** - Update market data with native gestures
- **One-handed operation** - All key functions easily accessible

## 🚀 Getting Started

### For Players

1. Visit any participating subreddit
2. Look for Reddit Stonks posts
3. Click to open the trading interface
4. Start with your $10K virtual portfolio
5. Research, trade, and compete!

### For Developers

```bash
npm create devvit@latest
cd reddit-stonks
npm run dev
```

## 📈 Future Roadmap

### Phase 1 (MVP)

- [x] Basic trading interface
- [x] 15 popular subreddit stocks
- [x] Real-time price calculation
- [x] Portfolio tracking
- [x] Mobile-responsive design

### Phase 2 (Enhanced)

- [ ] Meme futures contracts
- [ ] User creator bonds
- [ ] Options trading
- [ ] Custom indices creation
- [ ] Advanced charting tools

### Phase 3 (Social)

- [ ] Investment clubs and groups
- [ ] Strategy sharing and copying
- [ ] Community-driven DD posts
- [ ] Cross-subreddit tournaments

## 🏅 Contest Categories

### UGC (User-Generated Content)

- **Due Diligence Posts** - Users write investment analysis
- **Custom Indices** - Community-created subreddit baskets
- **Trading Strategies** - Shared algorithmic approaches
- **Market Commentary** - User-generated market insights

### Daily Games Elements

- **Daily market opens/closes** with fresh data
- **Weekly earnings reports** for subreddit performance
- **Trending topic alerts** create trading opportunities
- **Seasonal competitions** and themed trading contests

## 📊 Success Metrics

- **Daily Active Traders**: Users making at least one trade per day
- **Cross-Subreddit Discovery**: Users exploring new communities through trading
- **Content Quality**: Research-driven investment decisions
- **Community Building**: Investment clubs forming around shared interests

## 🛠 Built With

- **Devvit Web Platform** - Reddit's native app framework
- **React** - Modern UI components and state management
- **Reddit API** - Real-time subreddit data and user integration
- **WebSocket** - Live price feeds and real-time updates
- **Responsive CSS** - Mobile-first design approach

## 🎯 Why This Wins

### Judging Criteria Alignment

- ✅ **Delightful UX**: Professional trading interface with smooth interactions
- ✅ **Polish**: Production-ready financial dashboard
- ✅ **Reddit-y**: Transforms Reddit's core social dynamics into gameplay
- ✅ **Quality UGC**: Investment analysis, strategy sharing, market commentary

### Unique Value Proposition

- **Educational**: Teaches finance while exploring Reddit communities
- **Social**: Creates new reasons for cross-community interaction
- **Engaging**: Real stakes with real Reddit data driving gameplay
- **Scalable**: Can add unlimited assets, features, and complexity

## 📞 Support

- **Discord**: Join the Devvit community for development support
- **Reddit**: r/devvit for questions and feedback
- **Issues**: Report bugs and suggest features

## 📜 License

Built for the Reddit Fun and Games with Devvit Web Hackathon 2025.

---

**Ready to trade some Reddit stonks?** 🚀📈💎🙌

_Remember: This is a simulation game. No real money or securities are involved. Past performance of subreddits does not guarantee future results. Always do your own research before making investment decisions._
