# Reddit Stonks - Complete Setup Guide

## 🚀 Overview

Reddit Stonks is a real-time stock trading simulation that uses the official Reddit API to power stock prices based on subreddit activity. The platform features 100+ subreddit "stocks" with realistic price movements driven by:

- **Real Reddit Data**: Subscriber growth, post activity, engagement metrics
- **Sentiment Analysis**: AI-powered analysis of post titles and comments  
- **Live Trading Engine**: Order book system with market & limit orders
- **Real-time Updates**: WebSocket-powered live price feeds
- **Portfolio Management**: Full trading interface with P&L tracking

## 📋 Prerequisites

- Node.js 18+ and npm
- Reddit account and API credentials
- Basic knowledge of TypeScript/React

## 🔧 Setup Instructions

### 1. Reddit API Setup

1. **Create a Reddit App**:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "script" app type
   - Set redirect URI to `http://localhost:3000` (for development)
   - Note your `client_id` and `client_secret`

2. **Get Your Credentials**:
   ```
   Client ID: Found under your app name
   Client Secret: The "secret" field
   User Agent: Format: YourAppName/1.0.0 (by /u/YourUsername)
   ```

### 2. Environment Configuration

1. **Copy Environment Template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure Your .env File**:
   ```bash
   # Reddit API Configuration
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here  
   REDDIT_USER_AGENT=RedditStonks/1.0.0 (by /u/yourusername)

   # Optional: For enhanced API access (script app)
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

### 3. Installation & Build

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

## 🎮 How It Works

### Stock Universe (100+ Subreddits)

The platform tracks real subreddit data for stocks across categories:

- **Meme Stocks** (High Volatility): r/wallstreetbets, r/dogecoin, r/superstonk
- **Blue Chips** (Stable): r/askreddit, r/aww, r/funny  
- **Tech Growth**: r/technology, r/programming, r/artificial
- **Entertainment**: r/movies, r/gaming, r/netflix
- **Sports**: r/nfl, r/nba, r/soccer
- **Science**: r/science, r/space, r/physics
- **And many more...**

### Real-time Price Calculation

Prices update every 30 seconds using:

**70% Reddit Engagement Impact:**
- Subscriber growth rate
- Post activity (posts per hour vs average)
- Engagement score (upvotes, comments, ratios)
- Viral boost (trending posts)
- Sentiment analysis (positive/negative keywords)

**30% Trading Impact:**
- User buy/sell pressure
- Order book dynamics  
- Volume-based price impact
- Market maker spreads

### Trading Features

- **Market Orders**: Execute immediately at current price
- **Limit Orders**: Execute when price reaches your target
- **Order Book**: See all pending buy/sell orders
- **Portfolio Tracking**: Real-time P&L, holdings, cash balance
- **Trade History**: Complete transaction log
- **Risk Metrics**: Beta, Sharpe ratio, diversification scores

## 🌐 API Endpoints

### Market Data
- `GET /api/market-data` - All stocks with current prices
- `GET /api/stocks/:stockId` - Detailed stock data + order book
- `GET /api/system/status` - System health & Reddit API status

### Trading  
- `GET /api/portfolio?userId=X` - User's portfolio
- `POST /api/trade` - Execute buy/sell orders
- `GET /api/orders?userId=X` - User's open orders
- `POST /api/orders/:orderId/cancel` - Cancel pending order
- `GET /api/orderbook/:stockId` - Order book for stock
- `GET /api/trades?stockId=X` - Recent trade history

### Admin (Development)
- `POST /api/market-event` - Trigger market events (drama, AMAs, etc)

## 📡 WebSocket Events

Real-time updates via Socket.io:

**Client → Server:**
```javascript
socket.emit('subscribe', { stockIds: ['wsb', 'tech'], channels: ['all_trades'] })
socket.emit('get_portfolio')
socket.emit('get_order_book', 'wsb')
```

**Server → Client:**
```javascript  
socket.on('market_data', (allStocks) => { ... })
socket.on('price_update', ({ stockId, price, change }) => { ... })
socket.on('trade_executed', ({ symbol, price, shares }) => { ... })
socket.on('portfolio_update', (portfolio) => { ... })
socket.on('market_event', ({ type, title, impact }) => { ... })
```

## 🧪 Testing the Implementation

### 1. Start the Server
```bash
npm run dev
```

### 2. Check System Status
```bash
curl http://localhost:3000/api/system/status
```

Expected response:
```json
{
  "server": "running",
  "reddit": { "authenticated": true },
  "marketData": { "totalStocks": 130+ },
  "trading": { "totalOrders": 0 },
  "websocket": { "totalConnections": 0 }
}
```

### 3. Test Market Data
```bash
curl http://localhost:3000/api/market-data
```

### 4. Test Trading (POST request)
```bash
curl -X POST http://localhost:3000/api/trade \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "stockId": "wsb", 
    "type": "buy",
    "shares": 10,
    "orderType": "market"
  }'
```

## 🎯 Key Features Implemented

### ✅ Reddit API Integration
- OAuth2 authentication with Reddit
- Real-time subreddit data fetching
- Rate limiting and error handling
- Fallback data for unavailable subreddits

### ✅ Sophisticated Pricing Engine  
- Multi-factor price calculation
- Volatility modeling by subreddit category
- Time-based patterns (hourly/weekly cycles)
- Circuit breakers to prevent manipulation
- Sector correlation effects

### ✅ Full Trading System
- Order matching engine
- Market and limit orders
- Bid/ask spreads and slippage
- Portfolio management with P&L tracking
- Real-time balance updates

### ✅ Real-time Infrastructure
- WebSocket server with Socket.io
- Live price broadcasts
- Trade execution notifications  
- Portfolio sync across sessions
- Connection management & heartbeat

### ✅ Market Events System
- Drama events (mod changes, controversies)
- AMA events (celebrity Reddit AMAs)
- Admin actions (bans, quarantines)
- Viral content detection
- Configurable impact and duration

## 📊 Data Flow Architecture

```
Reddit API → Price Calculation → Trading Engine → WebSocket Broadcast
     ↑              ↑                   ↑               ↓
Rate Limited    Every 30s         Order Matching   Live Updates
Batch Fetches   Price Updates     Real-time Exec   All Clients
```

## 🔍 Troubleshooting

### Reddit API Issues
- **401 Unauthorized**: Check CLIENT_ID and CLIENT_SECRET
- **403 Forbidden**: Verify USER_AGENT format  
- **429 Rate Limited**: API is automatically rate-limited, wait and retry

### WebSocket Issues  
- **Connection Failed**: Check if server is running on correct port
- **No Price Updates**: Verify Reddit API credentials are working
- **Trade Failures**: Check user has sufficient cash/shares

### Performance Issues
- **Slow Price Updates**: Increase cache duration in marketDataService.ts
- **High Memory**: Reduce order book size in tradingEngine.ts
- **API Rate Limits**: Decrease batch size in redditApiService.ts

## 🚦 Production Deployment

For production deployment:

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=443  
   REDDIT_CLIENT_ID=prod_client_id
   # etc...
   ```

2. **Database Integration**: 
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Add Redis for caching and sessions
   - Implement user authentication

3. **Scaling Considerations**:
   - Load balance WebSocket connections  
   - Separate Reddit API service
   - CDN for static assets
   - Monitoring and logging

4. **Security**:
   - Rate limiting per user
   - Input validation and sanitization
   - HTTPS enforcement
   - API key rotation

## 🎮 Ready to Trade!

Your Reddit-powered stock exchange is now fully operational! Users can:

- **Trade 100+ subreddit stocks** with real Reddit data
- **See live price movements** based on community activity  
- **Execute market and limit orders** with full order books
- **Track portfolio performance** with real-time updates
- **Experience market events** that affect stock prices
- **Compete on leaderboards** with other traders

The system runs completely autonomously, fetching fresh Reddit data every 30 seconds and updating all connected clients in real-time. 

**Happy Trading! 📈🚀💎**