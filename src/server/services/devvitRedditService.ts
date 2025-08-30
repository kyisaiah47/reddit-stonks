import { reddit } from '@devvit/web/server';
import { RedditSubredditData } from './redditApiService';
import { StockDefinition } from '../data/stockUniverse';

export class DevvitRedditService {
  private readonly cache = new Map<string, { data: RedditSubredditData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  async fetchSubredditData(subreddit: string): Promise<RedditSubredditData | null> {
    // Check cache first
    const cached = this.cache.get(subreddit);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`📊 Fetching r/${subreddit} data using Devvit Reddit client...`);
      
      // Fetch subreddit information using Devvit's Reddit client
      const subredditInfo = await reddit.getSubredditInfoByName(subreddit);
      
      if (!subredditInfo) {
        console.warn(`Failed to fetch subreddit info for r/${subreddit}`);
        return null;
      }

      // Fetch hot posts for engagement analysis
      const hotPosts = await reddit.getHotPosts({ 
        subredditName: subreddit, 
        limit: 25 
      }).all();

      // Fetch new posts for activity analysis  
      const newPosts = await reddit.getNewPosts({
        subredditName: subreddit,
        limit: 25
      }).all();

      // Calculate metrics using similar logic to the original service
      const subredditData = this.calculateMetrics(subreddit, subredditInfo, hotPosts, newPosts);
      
      // Cache the result
      this.cache.set(subreddit, { 
        data: subredditData, 
        timestamp: Date.now() 
      });

      console.log(`✅ Successfully fetched data for r/${subreddit} via Devvit`);
      return subredditData;

    } catch (error) {
      console.error(`Error fetching data for r/${subreddit} via Devvit:`, error);
      return null;
    }
  }

  private calculateMetrics(
    subreddit: string,
    subredditInfo: any,
    hotPosts: any[],
    newPosts: any[]
  ): RedditSubredditData {
    
    const subscribers = subredditInfo.numberOfSubscribers || 0;
    const activeUsers = subredditInfo.numberOfActiveUsers || Math.floor(subscribers * 0.01);

    // Analyze hot posts for engagement metrics
    let totalScore = 0;
    let totalComments = 0;
    let totalUpvoteRatio = 0;
    let viralPosts = 0;
    let postsAnalyzed = 0;

    hotPosts.forEach(post => {
      if (post.stickied) return; // Skip stickied posts

      totalScore += post.score || 0;
      totalComments += post.numberOfComments || 0;
      totalUpvoteRatio += post.upvoteRatio || 0.5;
      
      // Check for viral posts (high engagement relative to subreddit size)
      const engagement = ((post.score || 0) + (post.numberOfComments || 0)) / Math.max(subscribers / 1000, 1);
      if (engagement > 10) { // Arbitrary threshold for viral content
        viralPosts++;
      }
      
      postsAnalyzed++;
    });

    // Analyze new posts for activity level
    const recentPostCount = newPosts.length;
    const now = Date.now() / 1000;
    const recentPosts = newPosts.filter(post => 
      (now - (post.createdAt?.getTime() || 0) / 1000) < 3600 // Posts from last hour
    ).length;

    // Calculate derived metrics
    const avgScore = postsAnalyzed > 0 ? totalScore / postsAnalyzed : 0;
    const avgComments = postsAnalyzed > 0 ? totalComments / postsAnalyzed : 0;
    const avgUpvoteRatio = postsAnalyzed > 0 ? totalUpvoteRatio / postsAnalyzed : 0.5;
    
    // Estimate subscriber growth (simplified - would need historical data for accuracy)
    const subscriberGrowth = this.estimateGrowthRate(subscribers, subredditInfo.createdAt);
    
    // Post activity relative to subreddit size and baseline
    const postActivity = this.calculatePostActivity(recentPosts, subscribers);
    
    // Engagement score based on interactions relative to views (estimated)
    const engagementScore = this.calculateEngagementScore(avgScore, avgComments, avgUpvoteRatio);
    
    // Viral boost from high-engagement posts
    const viralBoost = Math.min(viralPosts * 0.15, 1.0);
    
    // Sentiment analysis from post titles and upvote ratios
    const sentiment = this.calculateSentiment(hotPosts, avgUpvoteRatio);

    return {
      subreddit,
      subscribers,
      activeUsers,
      subscriberGrowth,
      postActivity,
      engagementScore: Math.max(0, Math.min(1, engagementScore)),
      viralBoost,
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      lastUpdated: new Date()
    };
  }

  private estimateGrowthRate(subscribers: number, createdAt: Date | null): number {
    if (!createdAt) return 0.001;
    
    const subredditAge = (Date.now() - createdAt.getTime()) / 1000;
    const ageInYears = subredditAge / (365 * 24 * 3600);
    
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
    return baseGrowthRate * (1 + variation);
  }

  private calculatePostActivity(recentPosts: number, subscribers: number): number {
    // Expected posts per hour based on subscriber count
    let expectedPostsPerHour = Math.max(1, subscribers / 10000); // 1 post per 10k subscribers per hour
    expectedPostsPerHour = Math.min(expectedPostsPerHour, 50); // Cap at 50 posts/hour
    
    return Math.max(0.1, recentPosts / expectedPostsPerHour);
  }

  private calculateEngagementScore(avgScore: number, avgComments: number, avgUpvoteRatio: number): number {
    // Normalized engagement based on score, comments, and upvote ratio
    const scoreWeight = Math.min(avgScore / 100, 1); // Normalize to 0-1, 100+ is high
    const commentWeight = Math.min(avgComments / 20, 1); // Normalize to 0-1, 20+ comments is high
    const ratioWeight = Math.max(0, (avgUpvoteRatio - 0.5) * 2); // Convert 0.5-1.0 to 0-1.0
    
    return (scoreWeight * 0.4) + (commentWeight * 0.3) + (ratioWeight * 0.3);
  }

  private calculateSentiment(posts: any[], avgUpvoteRatio: number): number {
    if (!posts || posts.length === 0) {
      // Base sentiment on upvote ratio
      return (avgUpvoteRatio - 0.5) * 2; // Convert 0.5-1.0 to 0-1.0
    }

    let sentimentScore = 0;
    let analyzedPosts = 0;

    // Sentiment keywords
    const positiveWords = [
      'great', 'amazing', 'awesome', 'love', 'best', 'win', 'success', 'good', 'excellent',
      'fantastic', 'wonderful', 'perfect', 'brilliant', 'outstanding', 'beautiful', 'incredible'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'hate', 'worst', 'fail', 'problem', 'issue', 'concern', 'crisis',
      'awful', 'horrible', 'disaster', 'broken', 'disappointing', 'frustrated', 'angry'
    ];

    posts.forEach(post => {
      if (post.stickied) return; // Skip stickied posts
      
      const title = (post.title || '').toLowerCase();
      const selftext = (post.body || '').toLowerCase();
      const text = `${title} ${selftext}`;
      
      let postSentiment = 0;
      
      // Count positive/negative words
      positiveWords.forEach(word => {
        const matches = (text.match(new RegExp(word, 'g')) || []).length;
        postSentiment += matches * 0.1;
      });
      
      negativeWords.forEach(word => {
        const matches = (text.match(new RegExp(word, 'g')) || []).length;
        postSentiment -= matches * 0.1;
      });
      
      // Factor in upvote ratio (strong signal)
      postSentiment += ((post.upvoteRatio || 0.5) - 0.5) * 0.5;
      
      // Factor in score relative to comments (controversy indicator)
      const numComments = post.numberOfComments || 0;
      if (numComments > 0) {
        const scoreToCommentRatio = (post.score || 0) / numComments;
        if (scoreToCommentRatio < 2) { // Controversial post
          postSentiment -= 0.1;
        }
      }
      
      sentimentScore += postSentiment;
      analyzedPosts++;
    });

    return analyzedPosts > 0 ? sentimentScore / analyzedPosts : 0;
  }

  async fetchBatchSubredditData(subreddits: string[]): Promise<Map<string, RedditSubredditData>> {
    const results = new Map<string, RedditSubredditData>();
    const batchSize = 5; // Smaller batches for Devvit to avoid rate limits
    
    console.log(`📊 Fetching Reddit data for ${subreddits.length} subreddits using Devvit...`);
    
    for (let i = 0; i < subreddits.length; i += batchSize) {
      const batch = subreddits.slice(i, i + batchSize);
      const batchPromises = batch.map(async (subreddit) => {
        try {
          const data = await this.fetchSubredditData(subreddit);
          if (data) {
            results.set(subreddit, data);
            return { subreddit, success: true };
          }
          return { subreddit, success: false };
        } catch (error) {
          console.error(`Failed to fetch data for r/${subreddit}:`, error);
          return { subreddit, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const successCount = batchResults.filter(r => r.success).length;
      console.log(`📊 Devvit Batch ${Math.floor(i/batchSize) + 1}: ${successCount}/${batch.length} successful`);
      
      // Add delay between batches
      if (i + batchSize < subreddits.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
      }
    }

    console.log(`✅ Successfully fetched data for ${results.size}/${subreddits.length} subreddits via Devvit`);
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  generateFallbackData(stockDef: StockDefinition): RedditSubredditData {
    // Generate realistic fallback data based on stock category and size
    let baseSubscribers = 50000;
    let activeUsersRatio = 0.01;
    let engagementBase = 0.3;
    
    switch (stockDef.category) {
      case 'meme':
        baseSubscribers = Math.floor(Math.random() * 2000000) + 500000; // 0.5M-2.5M
        activeUsersRatio = 0.03; // Higher engagement
        engagementBase = 0.6;
        break;
      case 'blue-chip':
        baseSubscribers = Math.floor(Math.random() * 1000000) + 200000; // 0.2M-1.2M
        activeUsersRatio = 0.015;
        engagementBase = 0.4;
        break;
      case 'tech-growth':
        baseSubscribers = Math.floor(Math.random() * 800000) + 100000; // 0.1M-0.9M
        activeUsersRatio = 0.02;
        engagementBase = 0.5;
        break;
      default:
        baseSubscribers = Math.floor(Math.random() * 300000) + 50000; // 50K-350K
        activeUsersRatio = 0.01;
        engagementBase = 0.3;
    }
    
    const subscribers = baseSubscribers;
    const activeUsers = Math.floor(subscribers * activeUsersRatio);
    
    return {
      subreddit: stockDef.subreddit,
      subscribers,
      activeUsers,
      subscriberGrowth: (Math.random() - 0.5) * 0.1, // -5% to +5% growth
      postActivity: 0.5 + Math.random() * 0.5, // 0.5-1.0 activity level
      engagementScore: engagementBase + (Math.random() - 0.5) * 0.2,
      viralBoost: Math.random() * 0.3, // 0-0.3 viral boost
      sentiment: (Math.random() - 0.5) * 1.5, // -0.75 to +0.75 sentiment
      lastUpdated: new Date()
    };
  }
}

export const devvitRedditService = new DevvitRedditService();