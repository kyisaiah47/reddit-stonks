# Reddit Stock Exchange
## Game Design Document

### Overview
A financial trading simulation game built on Reddit's Devvit Web platform where users buy and sell "shares" in subreddits, memes, and trending topics based on real Reddit engagement data. Players compete to build the most valuable portfolio by predicting and capitalizing on Reddit trends.

---

## Core Concept

Transform Reddit's social dynamics into a stock market where engagement metrics drive asset prices. Players become "Reddit investors" trading on the platform's social trends rather than traditional financial instruments.

### Categories
- **Primary**: UGC (users create investment strategies, DD posts, custom indices)
- **Secondary**: Daily Games (daily market opens, weekly earnings reports, trending topics)

---

## Game Mechanics

### Tradeable Assets

#### Subreddit Stocks (Primary Market)
- **Price Drivers**: Subscriber growth, daily active users, post quality scores
- **Volatility Events**: Drama, mod changes, admin actions, viral posts
- **Dividends**: Paid based on subreddit's consistent engagement metrics
- **Examples**: r/wallstreetbets (high volatility), r/aww (stable dividend payer)

#### Meme Futures Contracts
- **Mechanics**: Bet on which memes will trend in the next 7 days
- **Price Calculation**: Social media mentions, Reddit post frequency, sentiment analysis
- **Expiration**: Weekly contracts with settlement based on actual trend performance
- **Examples**: "Distracted Boyfriend Q4 2025", "New Template Discovery Rights"

#### User Creator Bonds
- **Concept**: Invest in specific Reddit power users/content creators
- **Returns**: Based on their karma accumulation and post performance
- **Risk Factors**: Account suspension, going inactive, controversy
- **Social Element**: Follow successful investors' portfolios

#### Topic Commodities
- **Types**: "AI Mentions", "Political Drama Index", "Crypto Sentiment", "Gaming Hype"
- **Trading**: Buy/sell based on Reddit discussion volume predictions
- **Seasonal Patterns**: Election years boost political commodity prices

### Trading Mechanics

#### Order Types
- **Market Orders**: Instant buy/sell at current price
- **Limit Orders**: Set target prices, execute when market hits them
- **Stop Loss**: Automatic selling to limit losses during crashes
- **Options Trading**: Calls/puts on subreddit volatility (advanced users)

#### Portfolio Management
- **Starting Capital**: $10,000 Reddit Coins (virtual currency)
- **Diversification Bonuses**: Rewards for balanced portfolios
- **Risk Metrics**: Portfolio beta, correlation analysis, volatility tracking
- **Margin Trading**: Borrow to amplify gains (and losses)

---

## Real Data Integration

### Reddit API Endpoints
- **Subreddit Data**: `/r/{subreddit}/about.json` for subscriber counts
- **Post Performance**: Hot/rising/top posts for engagement metrics
- **Comment Analysis**: Sentiment and engagement rate calculations
- **User Activity**: Public karma and posting frequency data

### Price Calculation Engine
```javascript
basePrice = f(subscribers, dailyActiveUsers, postQuality)
volatility = f(recentDramaEvents, modChanges, viralPosts)
currentPrice = basePrice * (1 + volatility * marketSentiment)
```

### Market Events System
- **Automatic Detection**: Unusual voting patterns, brigading, viral growth
- **Manual Triggers**: Admin announcements, major subreddit changes
- **Price Impact**: Immediate volatility spikes, gradual corrections

---

## User Experience Design

### Main Dashboard
- **Live Price Ticker**: Scrolling real-time prices of top assets
- **Portfolio Summary**: Total value, P&L, top performers/losers
- **Market Sentiment**: Overall Reddit mood indicators
- **News Feed**: Recent events affecting market prices

### Trading Interface
- **Asset Search**: Filter by category, performance, volatility
- **Chart Views**: 1D/1W/1M price history with volume indicators
- **Order Management**: Active orders, transaction history
- **Social Trading**: Follow other players, copy trades, share strategies

### Mobile Responsiveness
- **Swipe Trading**: Quick buy/sell gestures
- **Compact Charts**: Essential data in mobile-friendly format
- **Push Notifications**: Price alerts, order executions

---

## Social & UGC Elements

### Community Features
- **Investment Clubs**: Group portfolios for themed investing (gaming stocks, meme funds)
- **Due Diligence Posts**: Users write analysis posts about Reddit trends
- **Prediction Contests**: Weekly challenges to predict biggest movers
- **Strategy Sharing**: Export/import portfolio allocation strategies

### User-Generated Content
- **Custom Indices**: Users create themed baskets (e.g., "Wholesome Subreddits Index")
- **Market Commentary**: Users write "analyst reports" on Reddit trends
- **Trading Strategies**: Community-created algorithmic approaches
- **Meme Discovery**: Users nominate emerging memes for futures trading

---

## Technical Implementation

### Frontend (React + Devvit Web)
```
src/
├── components/
│   ├── Dashboard/
│   ├── Trading/
│   ├── Portfolio/
│   └── Social/
├── hooks/
│   ├── useMarketData.js
│   ├── usePortfolio.js
│   └── useRealTimeUpdates.js
├── services/
│   ├── tradingAPI.js
│   └── redditDataService.js
└── utils/
    ├── priceCalculations.js
    └── chartHelpers.js
```

### State Management
- **Redux Toolkit**: Complex trading state, real-time updates
- **React Query**: Caching Reddit API responses, optimistic updates
- **WebSocket Integration**: Live price feeds via Redis pub/sub

### Data Storage (Redis)
```
User Portfolios: user:{id}:portfolio
Market Prices: market:prices:{timestamp}
Order Book: orders:{asset_id}
Leaderboards: leaderboard:weekly
Transaction History: transactions:{user_id}
```

---

## Game Balance & Progression

### Preventing Exploitation
- **API Rate Limits**: Prevent users from manipulating source data
- **Trade Restrictions**: Cool-downs on major position changes
- **Market Makers**: Automated trading to prevent pump-and-dump schemes
- **Audit Trail**: Track all trades for fair play enforcement

### Skill vs Luck Balance
- **60% Skill**: Research, timing, portfolio management
- **40% Luck**: Unexpected viral posts, random Reddit drama
- **Learning Curve**: Tutorial mode with paper trading before real competition

### Progression Systems
- **Account Levels**: Unlock advanced trading features (options, margin)
- **Achievement Badges**: "Diamond Hands", "Perfect Timing", "Meme Prophet"
- **Seasonal Competitions**: Monthly trading contests with themes
- **Reputation System**: Top traders get verified checkmarks, followers

---

## MVP Feature Set

### Phase 1 (Hackathon Submission)
- [ ] 20 popular subreddits as tradeable assets
- [ ] Basic buy/sell interface with real-time prices
- [ ] Portfolio tracking with P&L calculations
- [ ] Simple price charts (daily performance)
- [ ] Leaderboard system
- [ ] Responsive React interface

### Phase 2 (Post-Hackathon)
- [ ] Meme futures contracts
- [ ] User creator bonds
- [ ] Advanced order types
- [ ] Social trading features
- [ ] Custom indices creation
- [ ] Mobile app optimization

### Phase 3 (Full Platform)
- [ ] Options trading
- [ ] Margin accounts
- [ ] API for third-party tools
- [ ] Advanced analytics dashboard
- [ ] Community governance features

---

## Success Metrics

### Engagement KPIs
- **Daily Active Traders**: Users making at least one trade per day
- **Portfolio Diversity**: Average number of assets per user
- **Social Interaction**: Comments on trades, strategy sharing
- **Return Visits**: Users checking portfolios multiple times daily

### Reddit Integration Success
- **Cross-Subreddit Discovery**: Users exploring new communities through trading
- **Content Quality**: Users researching communities before investing
- **Community Building**: Investment clubs forming around shared interests

---

## Technical Risks & Mitigations

### Reddit API Limitations
- **Risk**: Rate limiting affecting real-time price updates
- **Mitigation**: Pre-process data, cache aggressively, use webhooks where possible

### Market Manipulation
- **Risk**: Users coordinating to pump assets they own
- **Mitigation**: Trade volume limits, suspicious pattern detection, transparency requirements

### Data Accuracy
- **Risk**: Reddit metrics don't reflect true "value"
- **Mitigation**: Multiple data sources, community consensus mechanisms, regular recalibration

---

## Why This Wins

### Judging Criteria Alignment
- **Delightful UX**: Professional trading interface with smooth React interactions
- **Polish**: Complex but intuitive financial dashboard
- **Reddit-y**: Turns Reddit's core dynamics into gameplay
- **Quality UGC**: Investment analysis, strategy sharing, market commentary
- **Recurring Content**: Daily markets, weekly settlements, seasonal competitions

### Unique Value Proposition
- **Educational**: Teaches users about finance while exploring Reddit
- **Social**: Creates new reason for cross-community interaction
- **Engaging**: Real stakes (leaderboard positions) with real data
- **Scalable**: Can add new assets, features, and complexity over time

---

## Next Steps

1. **MVP Development** (Week 1-2): Core trading interface with 10-15 subreddits
2. **Data Integration** (Week 2): Reddit API connection and price calculation
3. **Polish Phase** (Week 3): UI refinement, mobile optimization, edge case handling
4. **Demo Preparation**: Create compelling demo posts showcasing key features