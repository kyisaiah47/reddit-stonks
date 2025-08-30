# Reddit Stock Exchange - Available API Endpoints

## Overview

This document outlines the Devvit Reddit API endpoints available for building the Reddit Stock Exchange game, organized by their use case in the trading simulation.

---

## Subreddit Data (Stock Prices & Metrics)

### Primary Market Data

- **`getSubredditInfoByName(name)`** - Get subreddit basic info including subscriber count
- **`getSubredditInfoById(id)`** - Same as above but by subreddit ID
- **`getCurrentSubreddit()`** - Get current subreddit context
- **`getCurrentSubredditName()`** - Get current subreddit name

### Post Activity (Engagement Metrics)

- **`getHotPosts(options)`** - Hot posts for current engagement analysis
- **`getNewPosts(options)`** - New posts for daily activity tracking
- **`getTopPosts(options)`** - Top posts for performance analysis
- **`getRisingPosts(options)`** - Rising posts for volatility/trending detection
- **`getControversialPosts(options)`** - Controversial posts for risk assessment

### Post Details

- **`getPostById(id)`** - Get specific post data
- **`getComments(options)`** - Get comments for engagement analysis

---

## User Data (Creator Bonds)

### User Information

- **`getUserByUsername(username)`** - Get user profile data
- **`getUserById(id)`** - Get user by ID
- **`getCurrentUser()`** - Get current logged-in user
- **`getCurrentUsername()`** - Get current username

### User Activity Tracking

- **`getPostsByUser(options)`** - Track user's posting activity for bond pricing
- **`getCommentsByUser(options)`** - Additional engagement metrics
- **`getCommentsAndPostsByUser(options)`** - Combined user activity

### User Avatar/Profile

- **`getSnoovatarUrl(username)`** - Get user avatar for UI display

---

## Market Events (Volatility Detection)

### Moderation Activity

- **`getModerationLog(options)`** - Track mod actions that could affect prices
- **`getReports(options)`** - Identify controversial content
- **`getModQueue(options)`** - Items pending moderation
- **`getSpam(options)`** - Spam/removed content

### Community Management

- **`getModerators(options)`** - Track moderator changes
- **`getApprovedUsers(options)`** - Community status changes
- **`getBannedUsers(options)`** - Ban activity affecting sentiment

---

## Trading Actions (User Interactions)

### Post Creation

- **`submitPost(options)`** - Create trading posts, DD analysis, market updates
- **`submitComment(options)`** - Comments on trades and analysis

### Content Management

- **`crosspost(options)`** - Share trading strategies across subreddits

---

## Data Storage & Management

### Redis Operations

- **`context.redis.set(key, value)`** - Store portfolio data
- **`context.redis.get(key)`** - Retrieve user portfolios
- **`context.redis.mSet(keyValues)`** - Batch store market data
- **`context.redis.mGet(keys)`** - Batch retrieve prices
- **`context.cache()`** - Cache API responses with TTL

---

## Useful Data Fields

### Subreddit Objects

```typescript
{
  name: string,
  subscribers: number,
  description: string,
  createdAt: Date,
  // ... other fields
}
```

### Post Objects

```typescript
{
  id: string,
  title: string,
  score: number,
  upvoteRatio: number,
  numComments: number,
  createdAt: Date,
  author: string,
  // ... other fields
}
```

### User Objects

```typescript
{
  username: string,
  linkKarma: number,
  commentKarma: number,
  createdAt: Date,
  // ... other fields
}
```

---

## Implementation Strategy

### Data Collection Pipeline

1. **`getSubredditInfoByName()`** - Get current subscriber counts
2. **`getHotPosts()` + `getNewPosts()`** - Calculate daily activity
3. **`getModerationLog()`** - Detect volatility events
4. **Store in Redis** - Build historical dataset

### Price Calculation

```typescript
// Pseudo-code for price calculation
const basePrice = calculateFromSubscribers(subreddit.subscribers);
const activityMultiplier = calculateFromPosts(hotPosts, newPosts);
const volatilityFactor = calculateFromModLog(modActions);
const currentPrice = basePrice * activityMultiplier * volatilityFactor;
```

### Real-time Updates

- **`useInterval()`** - Periodic price updates
- **`useChannel()`** - Real-time price broadcasting
- **Redis caching** - Store computed prices

---

## Limitations & Workarounds

### Missing Data

❌ **Not Available**: Historical subscriber growth rates
✅ **Workaround**: Start collecting data immediately, simulate historical data for demo

❌ **Not Available**: Daily active user counts
✅ **Workaround**: Use post activity as proxy metric

❌ **Not Available**: Direct sentiment analysis
✅ **Workaround**: Use upvote ratios and controversial post ratios

### Rate Limits

- **1000 post limit** per subreddit listing
- **API rate limiting** on requests
- **Mitigation**: Cache aggressively, batch requests, use Redis storage

---

## MVP Implementation Priority

### Phase 1 (Core Trading)

1. `getSubredditInfoByName()` - 20 popular subreddits
2. `getHotPosts()` - Basic engagement metrics
3. Redis storage - Portfolio management
4. `getCurrentUser()` - User authentication

### Phase 2 (Enhanced Features)

1. `getPostsByUser()` - Creator bonds
2. `getModerationLog()` - Volatility events
3. `submitPost()` - User-generated trading content
4. Real-time updates with `useChannel()`

### Phase 3 (Advanced Trading)

1. Comment analysis for sentiment
2. Cross-subreddit correlation analysis
3. Advanced portfolio analytics
4. Social trading features
