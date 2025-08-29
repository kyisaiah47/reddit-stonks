# Reddit Stonks - 100 Subreddit Stock Exchange

## Stock Universe & Price Discovery Algorithm

### Overview

Reddit Stonks features 100+ carefully selected subreddit stocks across all major categories, each with unique characteristics that drive realistic price movements based on community activity and user trading behavior.

---

## 🏢 Stock Categories & Examples

### **Meme Stocks (High Volatility)**

- **r/wallstreetbets** (WSB) - $45.67 - The flagship meme stock, extreme volatility
- **r/dogecoin** (DOGE) - $0.42 - Crypto meme play
- **r/superstonk** (GME) - $156.78 - Diamond hands community
- **r/amcstock** (AMC) - $12.34 - Movie theater apes
- **r/cryptocurrency** (CRYP) - $78.34 - Crypto sentiment indicator
- **r/robinhoodpennystocks** (HOOD) - $8.90 - Penny stock plays
- **r/memeeconomy** (MEME) - $23.45 - Literal meme trading
- **r/stockmarket** (STCK) - $67.89 - General trading community

### **Blue Chip Stocks (Stable Growth)**

- **r/askreddit** (ASK) - $234.56 - Largest community, stable
- **r/aww** (AWW) - $89.12 - Wholesome dividend stock
- **r/funny** (LOL) - $156.78 - Entertainment blue chip
- **r/pics** (PICS) - $123.45 - Visual content giant
- **r/worldnews** (NEWS) - $345.67 - Global news leader
- **r/todayilearned** (TIL) - $98.76 - Educational content
- **r/explainlikeimfive** (ELI5) - $54.32 - Knowledge sharing
- **r/lifeprotips** (LPT) - $76.54 - Practical advice

### **Tech Growth Stocks**

- **r/technology** (TECH) - $432.10 - Tech sector bellwether
- **r/programming** (CODE) - $287.65 - Developer community
- **r/pcmasterrace** (PCMR) - $198.43 - Gaming hardware
- **r/linux** (LINUX) - $165.43 - Open source play
- **r/cryptocurrency** (CRYPTO) - $543.21 - Digital currency
- **r/artificial** (AI) - $876.54 - AI/ML community
- **r/gadgets** (GADG) - $234.87 - Consumer tech
- **r/startups** (START) - $123.98 - Entrepreneurship

### **Entertainment Sector**

- **r/movies** (MOVS) - $167.89 - Film industry
- **r/television** (TV) - $134.56 - TV/streaming
- **r/music** (MUSIC) - $98.76 - Music industry
- **r/gaming** (GAME) - $345.67 - Gaming sector leader
- **r/netflix** (NFLX) - $456.78 - Streaming giant
- **r/marvel** (MRVL) - $234.56 - Superhero franchise
- **r/starwars** (SWRS) - $187.65 - Sci-fi franchise
- **r/anime** (ANIME) - $143.21 - Japanese animation

### **Lifestyle & Health**

- **r/fitness** (FIT) - $87.65 - Health & wellness
- **r/loseit** (DIET) - $54.32 - Weight loss community
- **r/meditation** (ZEN) - $76.54 - Mental health
- **r/personalfinance** (PF) - $198.76 - Financial advice
- **r/frugal** (SAVE) - $43.21 - Money saving
- **r/investing** (INVST) - $287.65 - Investment education
- **r/fire** (FIRE) - $156.78 - Financial independence
- **r/entrepreneur** (BIZ) - $234.56 - Business building

### **Sports Sector**

- **r/nfl** (NFL) - $234.56 - Professional football
- **r/nba** (NBA) - $198.76 - Professional basketball
- **r/soccer** (SOCC) - $176.54 - World football
- **r/baseball** (MLB) - $143.21 - Professional baseball
- **r/hockey** (NHL) - $123.45 - Professional hockey
- **r/mma** (MMA) - $87.65 - Mixed martial arts
- **r/formula1** (F1) - $345.67 - Formula 1 racing
- **r/olympics** (OLYM) - $98.76 - Olympic games

### **Creative Communities**

- **r/art** (ART) - $167.89 - Visual arts
- **r/photography** (FOTO) - $134.56 - Photography
- **r/diy** (DIY) - $98.76 - Do it yourself
- **r/cooking** (COOK) - $87.65 - Culinary arts
- **r/woodworking** (WOOD) - $76.54 - Craftsmanship
- **r/3dprinting** (3DP) - $156.78 - Additive manufacturing
- **r/crafts** (CRAFT) - $54.32 - Handmade goods
- **r/design** (DSGN) - $123.45 - Graphic design

### **Science & Education**

- **r/science** (SCI) - $345.67 - Scientific research
- **r/askscience** (ASCI) - $234.56 - Science Q&A
- **r/space** (SPCE) - $456.78 - Space exploration
- **r/physics** (PHYS) - $287.65 - Physics community
- **r/chemistry** (CHEM) - $198.76 - Chemistry
- **r/biology** (BIO) - $167.89 - Life sciences
- **r/medicine** (MED) - $543.21 - Medical community
- **r/engineering** (ENG) - $321.45 - Engineering

### **Niche/Specialty**

- **r/mechanicalkeyboards** (KEYS) - $234.56 - Enthusiast community
- **r/houseplants** (PLNT) - $43.21 - Plant parenting
- **r/coffee** (COFF) - $67.89 - Coffee culture
- **r/whiskey** (WHSK) - $123.45 - Spirits community
- **r/watches** (WTCH) - $345.67 - Timepiece collectors
- **r/cars** (CARS) - $234.56 - Automotive
- **r/motorcycles** (MOTO) - $156.78 - Two wheels
- **r/camping** (CAMP) - $87.65 - Outdoor recreation

---

## 📊 Price Calculation Algorithm

### **Base Price Formula**

```javascript
basePrice = (subscribers / 1000) * multiplier + (activeUsers / 100) * activityWeight;

// Category multipliers:
// Meme stocks: 0.5x (high volume, lower base)
// Blue chips: 2.0x (established communities)
// Tech growth: 3.0x (premium valuation)
// Niche: 1.5x (specialty premium)
```

### **Real-Time Price Drivers (70% of price movement)**

#### **Reddit Engagement Metrics**

- **Subscriber Growth Rate** - Daily new member velocity

  ```javascript
  subscriberGrowth = (todaySubscribers - yesterdaySubscribers) / yesterdaySubscribers;
  priceImpact = subscriberGrowth * 0.3;
  ```

- **Post Activity** - Posts per hour vs historical average

  ```javascript
  postVelocity = currentHourPosts / averageHourlyPosts;
  volatilityBoost = Math.abs(postVelocity - 1.0) * 0.2;
  ```

- **Engagement Quality** - Upvote ratio and comment engagement

  ```javascript
  engagementScore = (averageUpvotes / averageViews) * commentRatio;
  qualityMultiplier = 0.8 + engagementScore * 0.4;
  ```

- **Viral Detection** - Posts hitting r/all or trending
  ```javascript
  viralBoost = postsInTop100 * 0.15 + postsInAll * 0.25;
  ```

#### **Sentiment Analysis**

- **Comment Sentiment** - Positive/negative comment analysis
- **Title Sentiment** - Post title mood detection
- **Cross-posting Activity** - Mentions in other subreddits
- **Media Coverage** - External mentions driving traffic

### **User Trading Impact (30% of price movement)**

#### **Supply & Demand Mechanics**

```javascript
// Order book simulation
buyPressure = totalBuyOrders / dailyVolume;
sellPressure = totalSellOrders / dailyVolume;
tradingImpact = (buyPressure - sellPressure) * 0.3;

// Volume-based price impact
priceImpact = orderSize / (dailyVolume * liquidityFactor);
```

#### **Market Maker System**

- **Bid-Ask Spread** - Based on volatility and volume
- **Slippage** - Large orders move price more
- **Circuit Breakers** - Prevent manipulation/crashes

### **Volatility Modifiers**

#### **Subreddit-Specific Volatility**

- **r/wallstreetbets**: 2.5x volatility multiplier (maximum chaos)
- **r/aww**: 0.3x volatility multiplier (stable dividend stock)
- **r/technology**: 1.2x volatility (growth stock behavior)
- **r/askreddit**: 0.5x volatility (blue chip stability)

#### **Event-Driven Volatility**

- **Drama Events** - Mod changes, controversies → +50% volatility
- **AMAs** - Celebrity AMAs → temporary price spike
- **Reddit Admin Actions** - Quarantines, bans → price crash
- **Meme Cycles** - Trending memes → correlated price movements

### **Time-Based Patterns**

#### **Market Hours Effect**

```javascript
// Peak Reddit usage = higher volatility
const hourlyMultipliers = {
  0-6: 0.3,   // Low activity overnight
  7-9: 0.8,   // Morning ramp-up
  10-16: 1.2, // Peak day trading hours
  17-23: 1.0, // Evening activity
}
```

#### **Weekly Cycles**

- **Monday**: Market open effect (+10% volatility)
- **Wednesday**: Mid-week stability
- **Friday**: Profit-taking behavior
- **Weekend**: Lower volume, higher spreads

---

## 🎯 Market Dynamics

### **Sector Correlation**

- **Tech stocks** move together on tech news
- **Meme stocks** have high correlation during market events
- **Entertainment** stocks react to industry announcements
- **Sports stocks** spike during seasons/playoffs

### **Cross-Subreddit Events**

- **Reddit-wide events** affect all stocks
- **Brigadding detection** triggers volatility warnings
- **Trending topics** create sector rotation
- **Admin announcements** cause market-wide movements

### **Economic Indicators**

- **Reddit Gold purchases** - Platform health metric
- **New user signups** - Growth indicator
- **Mobile vs desktop usage** - Engagement quality
- **International growth** - Global expansion metrics

---

## 🔄 Price Update Frequency

### **Real-Time Updates**

- **Every 30 seconds** during market hours
- **Every 5 minutes** during off-peak times
- **Instant updates** on major events/news
- **Batch updates** for efficiency

### **Data Sources Priority**

1. **Reddit API** - Primary data source
2. **User trading activity** - Internal order book
3. **External sentiment** - Social media mentions
4. **Manual events** - Admin-triggered market events

---

## 📈 Special Stock Features

### **Dividend Stocks**

- **r/aww, r/wholesomememes** - Pay regular "karma dividends"
- **r/personalfinance** - Bonus dividends for educational value
- **r/investing** - Performance-based dividend payments

### **Stock Splits**

- **High-growth subreddits** automatically split when price > $1000
- **Maintains accessibility** for new traders
- **Preserves relative value** while increasing liquidity

### **Delisting Events**

- **Quarantined subreddits** - Trading suspended
- **Banned communities** - Stock delisted, positions liquidated
- **Inactive communities** - Moved to "penny stock" category

---

## 🎮 Gamification Elements

### **Achievement Triggers**

- **"Diamond Hands"** - Hold through 20% volatility
- **"Paper Hands"** - Sell at first 5% loss
- **"Diversification King"** - Own stocks from 10+ categories
- **"Sector Specialist"** - 80%+ portfolio in one sector

### **Leaderboard Categories**

- **Daily Top Gainers** - Best single-day performance
- **Weekly Champions** - Consistent weekly performance
- **Monthly Legends** - Long-term portfolio builders
- **Risk Takers** - Highest volatility portfolios
- **Value Investors** - Best risk-adjusted returns

---

## 🔧 Technical Implementation

### **Data Pipeline**

```javascript
// Every 30 seconds
1. Fetch Reddit API data for all 100 subreddits
2. Calculate base price adjustments
3. Apply user trading impact
4. Update volatility modifiers
5. Broadcast price changes to all users
```

### **Scalability Considerations**

- **Redis caching** for fast price lookups
- **WebSocket connections** for real-time updates
- **Rate limiting** to prevent Reddit API abuse
- **Fallback data sources** if primary APIs fail

### **Performance Optimization**

- **Efficient polling** of only changed metrics
- **Smart caching** of expensive calculations
- **Batch processing** of user trades
- **CDN delivery** of static stock data

---

## 🎯 Why 100 Stocks Works

### **User Benefits**

- **Personalized portfolios** - Everyone finds communities they know
- **Discovery mechanism** - Learn about new subreddits through trading
- **Diversification opportunities** - Build balanced portfolios
- **Replayability** - Different strategies each game

### **Contest Advantages**

- **Scale demonstration** - Shows technical capability
- **Reddit integration depth** - Comprehensive platform usage
- **UGC potential** - Research and analysis content
- **Community building** - Cross-subreddit engagement

### **Business Model**

- **Network effects** - More stocks = more user engagement
- **Data monetization** - Rich analytics on community trends
- **Premium features** - Advanced tools for active traders
- **Developer fund potential** - High daily engagement from variety

---

**The 100-stock universe creates a comprehensive Reddit economy where every type of user can find communities they're passionate about while driving real cross-platform discovery and engagement.** 🚀📈💎
