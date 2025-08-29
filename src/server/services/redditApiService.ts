import axios, { AxiosInstance } from 'axios';
import { StockDefinition } from '../data/stockUniverse';

export interface RedditSubredditData {
  subreddit: string;
  subscribers: number;
  activeUsers: number;
  subscriberGrowth: number;
  postActivity: number;
  engagementScore: number;
  viralBoost: number;
  sentiment: number;
  lastUpdated: Date;
}

interface RedditAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface RedditSubredditAbout {
  data: {
    display_name: string;
    subscribers: number;
    active_user_count: number;
    accounts_active: number;
    created_utc: number;
    public_description: string;
    over18: boolean;
    lang: string;
    subreddit_type: string;
  };
}

interface RedditPost {
  data: {
    id: string;
    title: string;
    score: number;
    num_comments: number;
    upvote_ratio: number;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
    locked: boolean;
    is_video: boolean;
    url: string;
    selftext: string;
    author: string;
  };
}

interface RedditListingResponse {
  data: {
    children: RedditPost[];
    after: string | null;
    before: string | null;
  };
}

export class RedditApiService {
  private readonly REDDIT_OAUTH_URL = 'https://www.reddit.com/api/v1/access_token';
  private readonly REDDIT_API_BASE = 'https://oauth.reddit.com';
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly cache = new Map<string, { data: RedditSubredditData; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds
  private readonly REQUEST_DELAY = 1000; // 1 second between requests for rate limiting
  private lastRequestTime = 0;

  constructor() {
    // Create axios instance for authentication
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'RedditStonks/1.0.0 (Trading Game)'
      }
    });

    // Initialize authentication
    this.authenticate();
  }

  private async authenticate(): Promise<void> {
    try {
      const clientId = process.env.REDDIT_CLIENT_ID;
      const clientSecret = process.env.REDDIT_CLIENT_SECRET;
      const username = process.env.REDDIT_USERNAME;
      const password = process.env.REDDIT_PASSWORD;

      if (!clientId || !clientSecret) {
        console.error('Reddit API credentials not found in environment variables');
        return;
      }

      let authData: any;

      if (username && password) {
        // Script app authentication (username/password)
        authData = new URLSearchParams({
          grant_type: 'password',
          username,
          password
        });
      } else {
        // Client credentials flow (app-only, no user context)
        authData = new URLSearchParams({
          grant_type: 'client_credentials'
        });
      }

      const response = await axios.post<RedditAuthResponse>(
        this.REDDIT_OAUTH_URL,
        authData,
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': process.env.REDDIT_USER_AGENT || 'RedditStonks/1.0.0'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
      
      console.log('✅ Reddit API authentication successful');
      
      // Update axios instance with auth header
      this.client.defaults.headers['Authorization'] = `Bearer ${this.accessToken}`;
      this.client.defaults.baseURL = this.REDDIT_API_BASE;

    } catch (error) {
      console.error('❌ Reddit API authentication failed:', error);
      this.accessToken = null;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
    return this.accessToken !== null;
  }

  private async rateLimitedRequest<T>(url: string): Promise<T | null> {
    // Ensure we don't exceed rate limits
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    if (!(await this.ensureValidToken())) {
      throw new Error('Failed to authenticate with Reddit API');
    }

    try {
      const response = await this.client.get<T>(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited - wait longer
        console.warn('Rate limited by Reddit API, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        throw error;
      } else if (error.response?.status === 403) {
        // Subreddit might be private or banned
        console.warn(`Access denied for ${url}`);
        return null;
      } else if (error.response?.status === 404) {
        // Subreddit doesn't exist
        console.warn(`Subreddit not found: ${url}`);
        return null;
      }
      throw error;
    }
  }

  async fetchSubredditData(subreddit: string): Promise<RedditSubredditData | null> {
    // Check cache first
    const cached = this.cache.get(subreddit);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Fetch subreddit about information
      const aboutData = await this.rateLimitedRequest<RedditSubredditAbout>(`/r/${subreddit}/about`);
      if (!aboutData) {
        console.warn(`Failed to fetch about data for r/${subreddit}`);
        return null;
      }

      // Fetch hot posts for engagement analysis
      const hotPosts = await this.rateLimitedRequest<RedditListingResponse>(`/r/${subreddit}/hot?limit=25`);
      
      // Fetch new posts for activity analysis
      const newPosts = await this.rateLimitedRequest<RedditListingResponse>(`/r/${subreddit}/new?limit=25`);

      // Calculate metrics
      const subredditData = this.calculateMetrics(subreddit, aboutData, hotPosts, newPosts);
      
      // Cache the result
      this.cache.set(subreddit, { 
        data: subredditData, 
        timestamp: Date.now() 
      });

      return subredditData;

    } catch (error) {
      console.error(`Error fetching data for r/${subreddit}:`, error);
      return null;
    }
  }

  private calculateMetrics(
    subreddit: string,
    aboutData: RedditSubredditAbout,
    hotPosts: RedditListingResponse | null,
    newPosts: RedditListingResponse | null
  ): RedditSubredditData {
    
    const subscribers = aboutData.data.subscribers || 0;
    const activeUsers = aboutData.data.active_user_count || aboutData.data.accounts_active || Math.floor(subscribers * 0.01);

    // Analyze hot posts for engagement metrics
    let totalScore = 0;
    let totalComments = 0;
    let totalUpvoteRatio = 0;
    let viralPosts = 0;
    let postsAnalyzed = 0;

    if (hotPosts?.data.children) {
      hotPosts.data.children.forEach(post => {
        if (post.data.stickied) return; // Skip stickied posts

        totalScore += post.data.score;
        totalComments += post.data.num_comments;
        totalUpvoteRatio += post.data.upvote_ratio || 0.5;
        
        // Check for viral posts (high engagement relative to subreddit size)
        const engagement = (post.data.score + post.data.num_comments) / Math.max(subscribers / 1000, 1);
        if (engagement > 10) { // Arbitrary threshold for viral content
          viralPosts++;
        }
        
        postsAnalyzed++;
      });
    }

    // Analyze new posts for activity level
    const recentPostCount = newPosts?.data.children?.length || 0;
    const now = Date.now() / 1000;
    const recentPosts = newPosts?.data.children?.filter(post => 
      (now - post.data.created_utc) < 3600 // Posts from last hour
    ).length || 0;

    // Calculate derived metrics
    const avgScore = postsAnalyzed > 0 ? totalScore / postsAnalyzed : 0;
    const avgComments = postsAnalyzed > 0 ? totalComments / postsAnalyzed : 0;
    const avgUpvoteRatio = postsAnalyzed > 0 ? totalUpvoteRatio / postsAnalyzed : 0.5;
    
    // Estimate subscriber growth (simplified - would need historical data for accuracy)
    const subscriberGrowth = this.estimateGrowthRate(subscribers, aboutData.data.created_utc);
    
    // Post activity relative to subreddit size and baseline
    const postActivity = this.calculatePostActivity(recentPosts, subscribers);
    
    // Engagement score based on interactions relative to views (estimated)
    const engagementScore = this.calculateEngagementScore(avgScore, avgComments, avgUpvoteRatio);
    
    // Viral boost from high-engagement posts
    const viralBoost = Math.min(viralPosts * 0.15, 1.0);
    
    // Sentiment analysis from post titles and upvote ratios
    const sentiment = this.calculateSentiment(hotPosts?.data.children || [], avgUpvoteRatio);

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

  private estimateGrowthRate(subscribers: number, createdUtc: number): number {
    const subredditAge = (Date.now() / 1000) - createdUtc;
    const ageInYears = subredditAge / (365 * 24 * 3600);
    
    // Estimate daily growth rate based on size and age
    // Newer subreddits and smaller ones typically grow faster
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

  private calculateSentiment(posts: RedditPost[], avgUpvoteRatio: number): number {
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
      if (post.data.stickied) return; // Skip stickied posts
      
      const title = post.data.title.toLowerCase();
      const selftext = (post.data.selftext || '').toLowerCase();
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
      postSentiment += (post.data.upvote_ratio - 0.5) * 0.5;
      
      // Factor in score relative to comments (controversy indicator)
      if (post.data.num_comments > 0) {
        const scoreToCommentRatio = post.data.score / post.data.num_comments;
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
    const batchSize = 10; // Process in smaller batches to be respectful of rate limits
    
    console.log(`📊 Fetching Reddit data for ${subreddits.length} subreddits...`);
    
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
      console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}: ${successCount}/${batch.length} successful`);
      
      // Add delay between batches
      if (i + batchSize < subreddits.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }

    console.log(`✅ Successfully fetched data for ${results.size}/${subreddits.length} subreddits`);
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getAuthStatus(): { authenticated: boolean; tokenExpiresAt: number; cacheSize: number } {
    return {
      authenticated: this.accessToken !== null && Date.now() < this.tokenExpiresAt,
      tokenExpiresAt: this.tokenExpiresAt,
      cacheSize: this.cache.size
    };
  }

  async refreshToken(): Promise<void> {
    this.accessToken = null;
    await this.authenticate();
  }
}

export const redditApiService = new RedditApiService();