import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MarketDataResponse, Portfolio } from '../../shared/types/api';

interface RedditNewsPost {
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

interface NewsResponse {
  posts: RedditNewsPost[];
  lastUpdated: string;
  sources: string[];
}

interface SimpleDashboardProps {
  portfolio: Portfolio | null;
  marketData: MarketDataResponse | null;
  onStockClick: (stockId: string) => void;
}

export const SimpleDashboard = ({ portfolio, marketData, onStockClick }: SimpleDashboardProps) => {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setError(null);
        const response = await fetch('/api/news?limit=15');
        if (response.ok) {
          const newsData = await response.json();
          setNews(newsData);
        } else {
          setError('Failed to fetch Reddit news');
        }
      } catch (err) {
        setError('Network error fetching news');
        console.error('News fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 10 * 60 * 1000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now.getTime() - posted.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours < 1) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getSubredditColor = (subreddit: string) => {
    switch (subreddit.toLowerCase()) {
      case 'wallstreetbets': return 'text-red-400 bg-red-400/10';
      case 'stocks': return 'text-blue-400 bg-blue-400/10';
      case 'investing': return 'text-green-400 bg-green-400/10';
      case 'cryptocurrency': return 'text-yellow-400 bg-yellow-400/10';
      case 'securityanalysis': return 'text-purple-400 bg-purple-400/10';
      case 'valueinvesting': return 'text-emerald-400 bg-emerald-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (!marketData) return null;

  if (loading) {
    return (
      <div className="w-full bg-gray-900 text-white">
        {/* Market Status Bar */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 flex-shrink-0">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-bold">REDDIT STONKS</span>
              </div>
              <span className="font-medium text-orange-200">Loading News...</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 text-white">
      {/* Market Status Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 flex-shrink-0">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-bold">REDDIT STONKS NEWS</span>
            </div>
            <span className="font-medium text-orange-200">
              📰 {news?.posts.length || 0} Posts
            </span>
          </div>
          <span className="text-xs opacity-75">
            {news?.lastUpdated ? new Date(news.lastUpdated).toLocaleTimeString() : ''}
          </span>
        </div>
      </div>

      {/* News Feed */}
      <div className="p-4 space-y-4">
        {error ? (
          <motion.div 
            className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        ) : (
          <>

            {/* News Posts */}
            <div className="space-y-3">
              {news?.posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500/30 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => window.open(post.url, '_blank')}
                >
                  <div className="space-y-3">
                    {/* Subreddit and Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${getSubredditColor(post.subreddit)}`}>
                          r/{post.subreddit}
                        </span>
                        {post.flair && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                            {post.flair}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatTimeAgo(post.created)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white leading-tight line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Preview Text */}
                    {post.selftext && (
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {post.selftext.substring(0, 150)}...
                      </p>
                    )}

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span>{post.upvotes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                          </svg>
                          <span>{post.comments}</span>
                        </div>
                        <span className="text-gray-500">by u/{post.author}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {(!news?.posts || news.posts.length === 0) && (
              <motion.div 
                className="text-center py-12 text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>No financial news found from Reddit</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};