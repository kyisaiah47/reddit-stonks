import { reddit } from '@devvit/web/server';

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
    'all',
    'popular', 
    'news',
    'worldnews',
    'technology',
    'gaming',
    'movies',
    'AskReddit',
    'todayilearned',
    'funny'
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

        console.log(`📰 Successfully fetched ${sortedPosts.length} Reddit news posts`);
        return newsResponse;
      } else {
        console.error('❌ No posts fetched from any subreddit - Reddit API required');
        throw new Error('No Reddit posts available - API authentication required');
      }

    } catch (error) {
      console.error('❌ Error fetching Reddit news:', error);
      
      // Return cached data if available, even if stale
      if (this.newsCache) {
        console.log('📰 Returning stale cached data due to error');
        return this.newsCache;
      }

      // No fallback data - throw error
      throw new Error('Failed to fetch Reddit news - API authentication required');
    }
  }


  private async fetchSubredditPosts(subreddit: string, limit: number): Promise<RedditNewsPost[]> {
    try {
      const posts = await reddit.getHotPosts({ 
        subredditName: subreddit, 
        limit: limit 
      }).all();
      
      if (!posts || posts.length === 0) {
        return [];
      }

      return posts
        .map((post: any) => {
          return {
            id: post.id || '',
            title: post.title || '',
            author: post.authorName || 'unknown',
            subreddit: post.subredditName || subreddit,
            upvotes: post.score || 0,
            comments: post.numberOfComments || 0,
            created: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
            url: post.url || `https://reddit.com/r/${subreddit}/comments/${post.id}`,
            selftext: post.body || '',
            flair: post.flair?.text || undefined,
            thumbnail: post.thumbnail || undefined,
            domain: post.domain || 'reddit.com'
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
    } catch (error) {
      console.error(`Error fetching posts from r/${subreddit} via Devvit:`, error);
      return [];
    }
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