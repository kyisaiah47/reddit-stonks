import { redditApiService } from './redditApiService';

export interface RedditNewsPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  created: string;
  url: string;
  selftext?: string;
  flair?: string;
  thumbnail?: string;
  domain?: string;
}

export interface NewsResponse {
  posts: RedditNewsPost[];
  lastUpdated: string;
  sources: string[];
}

class RedditNewsService {
  private readonly NEWS_SUBREDDITS = [
    'wallstreetbets',
    'stocks', 
    'investing',
    'SecurityAnalysis',
    'ValueInvesting',
    'financialindependence',
    'StockMarket',
    'pennystocks',
    'options',
    'CryptoCurrency'
  ];

  private newsCache: NewsResponse | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  async getFinancialNews(limit: number = 20): Promise<NewsResponse> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.newsCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log(`📰 Returning cached Reddit news (${this.newsCache.posts.length} posts)`);
      return this.newsCache;
    }

    try {
      const allPosts: RedditNewsPost[] = [];
      let successfulFetches = 0;
      
      // Fetch from multiple subreddits
      for (const subreddit of this.NEWS_SUBREDDITS.slice(0, 4)) { // Reduced to 4 to avoid rate limits
        try {
          console.log(`📡 Fetching from r/${subreddit}...`);
          const posts = await this.fetchSubredditPosts(subreddit, 3); // Reduced limit
          if (posts.length > 0) {
            allPosts.push(...posts);
            successfulFetches++;
            console.log(`✅ Got ${posts.length} posts from r/${subreddit}`);
          } else {
            console.warn(`⚠️  No posts returned from r/${subreddit}`);
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Failed to fetch from r/${subreddit}:`, error);
        }
      }

      console.log(`📊 Total posts fetched: ${allPosts.length} from ${successfulFetches} subreddits`);

      // If we got some posts, use them
      if (allPosts.length > 0) {
        // Sort by engagement score (upvotes + comments) and recency
        const sortedPosts = allPosts
          .filter(post => post.upvotes > 5) // Lower threshold
          .sort((a, b) => {
            const aScore = a.upvotes + (a.comments * 2); // Weight comments higher
            const bScore = b.upvotes + (b.comments * 2);
            return bScore - aScore;
          })
          .slice(0, limit);

        const newsResponse: NewsResponse = {
          posts: sortedPosts,
          lastUpdated: new Date().toISOString(),
          sources: this.NEWS_SUBREDDITS
        };

        // Cache the result
        this.newsCache = newsResponse;
        this.lastFetchTime = now;

        console.log(`📰 Successfully fetched ${sortedPosts.length} financial news posts from Reddit`);
        return newsResponse;
      } else {
        console.warn('⚠️  No posts fetched from any subreddit, using fallback data');
        return this.getFallbackNews(limit);
      }

    } catch (error) {
      console.error('❌ Error fetching Reddit financial news:', error);
      
      // Return cached data if available, even if stale
      if (this.newsCache) {
        console.log('📰 Returning stale cached data due to error');
        return this.newsCache;
      }

      // Return fallback mock data for demo
      console.log('📰 Using fallback mock data');
      return this.getFallbackNews(limit);
    }
  }

  private getFallbackNews(limit: number): NewsResponse {
    const mockPosts: RedditNewsPost[] = [
      {
        id: 'mock1',
        title: '🚀 TSLA hits new all-time high after surprise earnings beat!',
        author: 'ElonFanBoy420',
        subreddit: 'wallstreetbets',
        upvotes: 3420,
        comments: 892,
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        url: 'https://reddit.com/r/wallstreetbets/mock1',
        selftext: 'Tesla just posted incredible Q4 numbers. Revenue up 37% YoY. This is going to moon! 🌙',
        flair: 'DD'
      },
      {
        id: 'mock2', 
        title: 'AMD vs NVDA: Which semiconductor stock to buy in 2024?',
        author: 'TechAnalyst',
        subreddit: 'investing',
        upvotes: 1567,
        comments: 423,
        created: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        url: 'https://reddit.com/r/investing/mock2',
        selftext: 'Deep dive analysis comparing AMD and NVIDIA fundamentals, market position, and growth prospects...',
        flair: 'Analysis'
      },
      {
        id: 'mock3',
        title: 'Market crash incoming? Fed signals more rate hikes',
        author: 'BearMarketGuru',
        subreddit: 'stocks',
        upvotes: 2134,
        comments: 678,
        created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        url: 'https://reddit.com/r/stocks/mock3',
        selftext: 'Jerome Powell hints at continued aggressive monetary policy. What does this mean for equity valuations?',
        flair: 'Discussion'
      },
      {
        id: 'mock4',
        title: 'LOSS: Down $25k on AAPL calls. AMA about poor life choices',
        author: 'DegenGambler',
        subreddit: 'wallstreetbets', 
        upvotes: 5678,
        comments: 1234,
        created: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        url: 'https://reddit.com/r/wallstreetbets/mock4',
        selftext: 'Bought AAPL calls before earnings. Tim Cook has personally destroyed my portfolio. Diamond hands until I die.',
        flair: 'Loss'
      },
      {
        id: 'mock5',
        title: 'Warren Buffett increases Berkshire stake in this undervalued stock',
        author: 'ValueInvestor123',
        subreddit: 'ValueInvesting',
        upvotes: 987,
        comments: 234,
        created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        url: 'https://reddit.com/r/ValueInvesting/mock5',
        selftext: 'Latest 13F filings show Berkshire doubled down on this position. Here\'s why Buffett might be right...',
        flair: 'News'
      }
    ];

    return {
      posts: mockPosts.slice(0, limit),
      lastUpdated: new Date().toISOString(),
      sources: this.NEWS_SUBREDDITS
    };
  }

  private async fetchSubredditPosts(subreddit: string, limit: number): Promise<RedditNewsPost[]> {
    const data = await redditApiService.makeRequest(`/r/${subreddit}/hot.json?limit=${limit}`);
    
    if (!data?.data?.children) {
      return [];
    }

    return data.data.children
      .map((child: any) => {
        const post = child.data;
        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          upvotes: post.ups || 0,
          comments: post.num_comments || 0,
          created: new Date(post.created_utc * 1000).toISOString(),
          url: `https://reddit.com${post.permalink}`,
          selftext: post.selftext,
          flair: post.link_flair_text,
          thumbnail: post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : undefined,
          domain: post.domain
        };
      })
      .filter((post: RedditNewsPost) => 
        // Filter out removed/deleted posts and ensure quality
        post.title && 
        post.title !== '[deleted]' && 
        post.author !== '[deleted]' &&
        !post.title.toLowerCase().includes('daily thread') &&
        !post.title.toLowerCase().includes('weekly thread')
      );
  }

  // Get news related to specific stock symbols
  async getStockNews(symbols: string[], limit: number = 10): Promise<RedditNewsPost[]> {
    const allNews = await this.getFinancialNews(100); // Get more posts to search through
    
    const stockRelatedPosts = allNews.posts.filter(post => {
      const titleLower = post.title.toLowerCase();
      const selftextLower = (post.selftext || '').toLowerCase();
      
      return symbols.some(symbol => {
        const symbolLower = symbol.toLowerCase();
        return titleLower.includes(symbolLower) || 
               titleLower.includes(`$${symbolLower}`) ||
               selftextLower.includes(symbolLower) ||
               selftextLower.includes(`$${symbolLower}`);
      });
    });

    return stockRelatedPosts.slice(0, limit);
  }

  // Get trending topics from financial subreddits
  async getTrendingTopics(): Promise<{ topic: string; mentions: number; sentiment: 'bullish' | 'bearish' | 'neutral' }[]> {
    const news = await this.getFinancialNews(50);
    const topicCounts = new Map<string, number>();
    
    // Extract common financial terms and stock symbols
    const financialTerms = ['bull', 'bear', 'moon', 'crash', 'dip', 'rally', 'squeeze', 'calls', 'puts', 'dd'];
    
    news.posts.forEach(post => {
      const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
      
      financialTerms.forEach(term => {
        if (text.includes(term)) {
          topicCounts.set(term, (topicCounts.get(term) || 0) + 1);
        }
      });
      
      // Extract potential stock symbols ($SYMBOL format)
      const symbolMatches = text.match(/\$[a-z]{1,5}\b/gi);
      if (symbolMatches) {
        symbolMatches.forEach(symbol => {
          topicCounts.set(symbol, (topicCounts.get(symbol) || 0) + 1);
        });
      }
    });

    return Array.from(topicCounts.entries())
      .map(([topic, mentions]) => ({
        topic,
        mentions,
        sentiment: this.getSentimentForTopic(topic) as 'bullish' | 'bearish' | 'neutral'
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);
  }

  private getSentimentForTopic(topic: string): string {
    const bullishTerms = ['moon', 'bull', 'rally', 'squeeze', 'calls'];
    const bearishTerms = ['crash', 'bear', 'dip', 'puts'];
    
    const topicLower = topic.toLowerCase();
    
    if (bullishTerms.some(term => topicLower.includes(term))) {
      return 'bullish';
    }
    if (bearishTerms.some(term => topicLower.includes(term))) {
      return 'bearish';
    }
    return 'neutral';
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.newsCache = null;
    this.lastFetchTime = 0;
  }

  getSystemStatus() {
    return {
      cacheAge: this.lastFetchTime ? Date.now() - this.lastFetchTime : null,
      cachedPosts: this.newsCache?.posts.length || 0,
      sources: this.NEWS_SUBREDDITS.length,
      lastUpdate: this.newsCache?.lastUpdated || null
    };
  }
}

export const redditNewsService = new RedditNewsService();