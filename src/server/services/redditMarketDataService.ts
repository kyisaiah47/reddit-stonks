import { reddit } from '@devvit/web/server';

// Reddit API Service for Market Data
// Uses the actual Reddit API endpoints you specified

export interface RedditStockData {
  subreddit: string;
  subscribers: number;
  activeUsers: number;
  subscriberGrowth: number;
  postActivity: number;
  engagementScore: number;
  viralBoost: number;
  sentiment: number;
  volatility: number;
  lastUpdated: Date;
}

export class RedditMarketDataService {
  
  // Get subreddit stock data using Devvit's Reddit API
  async getSubredditStockData(subredditName: string): Promise<RedditStockData | null> {
    try {
      console.log(`📊 Fetching live Reddit data for r/${subredditName}`);

      // 1. Get basic subreddit info - subscriber counts and metrics
      const subredditInfo = await reddit.getSubredditInfoByName(subredditName);
      if (!subredditInfo) {
        console.warn(`❌ No subreddit info found for r/${subredditName}`);
        return null;
      }

      const subscribers = subredditInfo.numberOfSubscribers || 0;
      const activeUsers = subredditInfo.numberOfActiveUsers || 0;

      // 2. Get hot posts for engagement/activity analysis
      const hotPosts = await reddit.getHotPosts({ 
        subredditName, 
        limit: 25 
      }).all();

      // 3. Get new posts for daily activity tracking
      const newPosts = await reddit.getNewPosts({
        subredditName,
        limit: 25
      }).all();

      // 4. Get rising posts for trending/volatility detection
      const risingPosts = await reddit.getRisingPosts({
        subredditName,
        limit: 10
      }).all();

      // Calculate metrics
      const metrics = this.calculateStockMetrics(
        subredditInfo,
        hotPosts,
        newPosts,
        risingPosts
      );

      console.log(`✅ Successfully fetched data for r/${subredditName}: ${subscribers} subscribers, ${activeUsers} active`);

      return {
        subreddit: subredditName,
        subscribers,
        activeUsers,
        ...metrics,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`❌ Error fetching Reddit data for r/${subredditName}:`, error);
      return null;
    }
  }

  // Calculate stock-like metrics from Reddit data
  private calculateStockMetrics(
    subredditInfo: any,
    hotPosts: any[],
    newPosts: any[],
    risingPosts: any[]
  ) {
    const subscribers = subredditInfo.numberOfSubscribers || 0;
    
    // 1. Subscriber Growth (estimated - we'd need historical data for real growth)
    const subscriberGrowth = this.estimateGrowthRate(subscribers, subredditInfo.createdAt);

    // 2. Post Activity - based on recent posts vs subreddit size
    const postActivity = this.calculatePostActivity(newPosts, subscribers);

    // 3. Engagement Score - based on hot post metrics
    const engagementScore = this.calculateEngagementScore(hotPosts);

    // 4. Viral Boost - based on rising posts
    const viralBoost = this.calculateViralBoost(risingPosts, subscribers);

    // 5. Sentiment - based on post upvote ratios and titles
    const sentiment = this.calculateSentiment(hotPosts);

    // 6. Volatility - based on post score variance and rising activity
    const volatility = this.calculateVolatility(hotPosts, risingPosts);

    return {
      subscriberGrowth,
      postActivity,
      engagementScore,
      viralBoost,
      sentiment,
      volatility
    };
  }

  private estimateGrowthRate(subscribers: number, createdAt: Date | null): number {
    if (!createdAt) return 0.001;
    
    const ageInYears = (Date.now() - createdAt.getTime()) / (365 * 24 * 3600 * 1000);
    
    // Estimate daily growth rate based on size and age
    let baseGrowthRate = 0.001; // 0.1% daily
    
    if (subscribers < 10000) baseGrowthRate = 0.05;      // 5% daily for small subs
    else if (subscribers < 100000) baseGrowthRate = 0.02; // 2% daily for medium subs
    else if (subscribers < 1000000) baseGrowthRate = 0.01; // 1% daily for large subs
    else baseGrowthRate = 0.001;                          // 0.1% daily for huge subs
    
    // Adjust for age (older subs grow slower)
    if (ageInYears > 5) baseGrowthRate *= 0.5;
    else if (ageInYears > 2) baseGrowthRate *= 0.7;
    
    // Add random variation
    const variation = (Math.random() - 0.5) * 2; // -100% to +100%
    return Math.max(-0.1, Math.min(0.2, baseGrowthRate * (1 + variation)));
  }

  private calculatePostActivity(newPosts: any[], subscribers: number): number {
    // Count posts from last 6 hours
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    const recentPosts = newPosts.filter(post => 
      (post.createdAt?.getTime() || 0) > sixHoursAgo
    ).length;

    // Expected posts per 6 hours based on subscriber count
    let expectedPosts = Math.max(1, subscribers / 50000); // 1 post per 50k subscribers per 6h
    expectedPosts = Math.min(expectedPosts, 25); // Cap at 25 posts

    return Math.max(0.1, Math.min(3.0, recentPosts / expectedPosts));
  }

  private calculateEngagementScore(hotPosts: any[]): number {
    if (!hotPosts.length) return 0.3;

    let totalScore = 0;
    let totalComments = 0;
    let totalUpvoteRatio = 0;
    let validPosts = 0;

    hotPosts.forEach(post => {
      if (post.stickied) return; // Skip stickied posts

      totalScore += post.score || 0;
      totalComments += post.numberOfComments || 0;
      totalUpvoteRatio += post.upvoteRatio || 0.5;
      validPosts++;
    });

    if (validPosts === 0) return 0.3;

    const avgScore = totalScore / validPosts;
    const avgComments = totalComments / validPosts;
    const avgUpvoteRatio = totalUpvoteRatio / validPosts;

    // Normalized engagement (0-1 scale)
    const scoreWeight = Math.min(avgScore / 100, 1); // 100+ score is high
    const commentWeight = Math.min(avgComments / 20, 1); // 20+ comments is high
    const ratioWeight = Math.max(0, (avgUpvoteRatio - 0.5) * 2); // Convert 0.5-1.0 to 0-1.0

    return Math.max(0, Math.min(1, (scoreWeight * 0.4) + (commentWeight * 0.3) + (ratioWeight * 0.3)));
  }

  private calculateViralBoost(risingPosts: any[], subscribers: number): number {
    if (!risingPosts.length) return 0;

    let viralCount = 0;
    const threshold = Math.max(100, subscribers / 1000); // Viral threshold based on sub size

    risingPosts.forEach(post => {
      const engagement = (post.score || 0) + (post.numberOfComments || 0);
      if (engagement > threshold) {
        viralCount++;
      }
    });

    return Math.min(1.0, viralCount * 0.2); // 0-1.0 scale
  }

  private calculateSentiment(hotPosts: any[]): number {
    if (!hotPosts.length) return 0;

    let sentimentSum = 0;
    let validPosts = 0;

    hotPosts.forEach(post => {
      if (post.stickied) return;

      // Base sentiment on upvote ratio
      const upvoteRatio = post.upvoteRatio || 0.5;
      let postSentiment = (upvoteRatio - 0.5) * 2; // Convert 0.5-1.0 to 0-1.0

      // Simple keyword sentiment analysis
      const title = (post.title || '').toLowerCase();
      const positiveWords = ['good', 'great', 'amazing', 'love', 'best', 'win', 'up', 'gain'];
      const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'lose', 'down', 'crash', 'fall'];

      positiveWords.forEach(word => {
        if (title.includes(word)) postSentiment += 0.1;
      });

      negativeWords.forEach(word => {
        if (title.includes(word)) postSentiment -= 0.1;
      });

      sentimentSum += postSentiment;
      validPosts++;
    });

    return validPosts > 0 ? Math.max(-1, Math.min(1, sentimentSum / validPosts)) : 0;
  }

  private calculateVolatility(hotPosts: any[], risingPosts: any[]): number {
    // Calculate score variance in hot posts
    const scores = hotPosts
      .filter(post => !post.stickied)
      .map(post => post.score || 0);

    if (scores.length < 2) return 0.5;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const scoreVolatility = Math.min(1, Math.sqrt(variance) / (mean + 1));

    // Factor in rising post activity (more rising = more volatile)
    const risingBoost = Math.min(0.3, risingPosts.length * 0.03);

    return Math.max(0.1, Math.min(1.5, scoreVolatility + risingBoost));
  }

  // Batch fetch multiple subreddit data
  async getBatchStockData(subredditNames: string[]): Promise<Map<string, RedditStockData>> {
    const results = new Map<string, RedditStockData>();
    
    console.log(`📊 Fetching batch Reddit data for ${subredditNames.length} subreddits...`);

    // Process in small batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < subredditNames.length; i += batchSize) {
      const batch = subredditNames.slice(i, i + batchSize);
      
      const promises = batch.map(async (subreddit) => {
        const data = await this.getSubredditStockData(subreddit);
        if (data) {
          results.set(subreddit, data);
        }
        return data ? subreddit : null;
      });

      const completed = await Promise.all(promises);
      const successCount = completed.filter(Boolean).length;
      console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}: ${successCount}/${batch.length} successful`);
      
      // Small delay between batches
      if (i + batchSize < subredditNames.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Successfully fetched ${results.size}/${subredditNames.length} subreddit stock data`);
    return results;
  }
}

export const redditMarketDataService = new RedditMarketDataService();