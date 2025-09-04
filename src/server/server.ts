import express from 'express';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// CORS for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

const router = express.Router();

// Helper function for enhanced volatility calculation
const calculateEnhancedVolatility = (
  totalScore: number,
  totalComments: number,
  subreddit: string
): number => {
  const activitySeed = (totalScore + totalComments) % 1000;
  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 15)) % 100; // Changes every 15 minutes
  const subredditSeed =
    subreddit.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

  const combinedSeed = (activitySeed + timeSeed + subredditSeed) % 1000;

  // Enhanced volatility: -8% to +8% with weighted distribution
  if (combinedSeed < 150) {
    // 15% chance for big drop
    return -8 + (combinedSeed / 150) * 3; // -8% to -5%
  } else if (combinedSeed < 300) {
    // 15% chance for moderate drop
    return -5 + ((combinedSeed - 150) / 150) * 3; // -5% to -2%
  } else if (combinedSeed < 700) {
    // 40% chance for small movements
    return -2 + ((combinedSeed - 300) / 400) * 4; // -2% to +2%
  } else if (combinedSeed < 850) {
    // 15% chance for moderate gain
    return 2 + ((combinedSeed - 700) / 150) * 3; // +2% to +5%
  } else {
    // 15% chance for big gain
    return 5 + ((combinedSeed - 850) / 150) * 3; // +5% to +8%
  }
};

// Basic Devvit routes
router.get('/api/init', async (_req, res) => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId required' });
    return;
  }

  try {
    const [count, username] = await Promise.all([redis.get('count'), reddit.getCurrentUsername()]);

    res.json({
      type: 'init',
      postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error('API Init Error:', error);
    res.status(400).json({ status: 'error', message: 'Init failed' });
  }
});

router.post('/api/increment', async (_req, res) => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId required' });
    return;
  }

  res.json({
    count: await redis.incrBy('count', 1),
    postId,
    type: 'increment',
  });
});

router.post('/api/decrement', async (_req, res) => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId required' });
    return;
  }

  res.json({
    count: await redis.incrBy('count', -1),
    postId,
    type: 'decrement',
  });
});

// Post creation routes
router.post('/internal/on-app-install', async (_req, res) => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const post = await reddit.submitCustomPost({
      subredditName,
      title: '🚀 Reddit Stonks - Trade Subreddits Like Stocks! 💎🙌',
      splash: {
        appDisplayName: 'Reddit Stonks',
        backgroundUri: 'https://raw.githubusercontent.com/kyisaiah47/reddit-stonks/main/assets/splash-screen-bg.png',
        buttonLabel: '💎 Start Trading',
        description:
          '🚀 Trade subreddits like stocks with real Reddit data! Dynamic prices, live updates, and $10,000 starting portfolio. Diamond hands ready? 💎🙌',
        heading: '📈 Reddit Stonks - Subreddit Stock Exchange',
        appIconUri: 'https://raw.githubusercontent.com/kyisaiah47/reddit-stonks/main/assets/splash-screen-icon.png',
      },
    });

    res.json({
      status: 'success',
      message: `Post created in ${subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

router.post('/internal/menu/post-create', async (_req, res) => {
  try {
    const { subredditName } = context;
    if (!subredditName) {
      throw new Error('subredditName is required');
    }

    const post = await reddit.submitCustomPost({
      subredditName,
      title: '🚀 Reddit Stonks - Trade Subreddits Like Stocks! 💎🙌',
      splash: {
        appDisplayName: 'Reddit Stonks',
        backgroundUri: 'https://raw.githubusercontent.com/kyisaiah47/reddit-stonks/main/assets/splash-screen-bg.png',
        buttonLabel: '💎 Start Trading',
        description:
          '🚀 Trade subreddits like stocks with real Reddit data! Dynamic prices, live updates, and $10,000 starting portfolio. Diamond hands ready? 💎🙌',
        heading: '📈 Reddit Stonks - Subreddit Stock Exchange',
        appIconUri: 'https://raw.githubusercontent.com/kyisaiah47/reddit-stonks/main/assets/splash-screen-icon.png',
      },
    });

    res.json({
      navigateTo: `https://reddit.com/r/${subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

// Simple test endpoint
router.get('/api/test', async (_req, res) => {
  const username = await reddit.getCurrentUsername().catch(() => 'anonymous');
  res.json({
    message: 'Clean server running!',
    timestamp: new Date().toISOString(),
    username,
    version: '0.0.35',
  });
});

// Reddit news endpoint - real trending posts from popular subreddits
router.get('/api/news', async (_req, res) => {
  try {
    console.log('📰 Fetching top trending Reddit posts...');

    const newsSubreddits = [
      'funny',
      'AskReddit',
      'todayilearned',
      'pics',
      'gaming',
      'aww',
      'mildlyinteresting',
    ];
    const allNews = [];

    for (const subreddit of newsSubreddits) {
      try {
        const hotPosts = await reddit
          .getHotPosts({
            subredditName: subreddit,
            limit: 5,
            pageSize: 5,
          })
          .all();

        const subredditNews = hotPosts
          .map((post) => {
            try {
              return {
                id: post.id || `${subreddit}_${Date.now()}`,
                title: post.title || 'Untitled',
                subreddit: subreddit,
                author: post.authorName || 'Unknown',
                upvotes: post.score || 0,
                comments: post.comments || 0,
                created: post.createdAt
                  ? new Date(post.createdAt).toISOString()
                  : new Date().toISOString(),
                url: post.permalink || '#',
                selftext: post.body || '',
              };
            } catch (mapError) {
              console.error(`❌ Error processing post from r/${subreddit}:`, mapError);
              return null;
            }
          })
          .filter(Boolean);

        allNews.push(...subredditNews);
        console.log(`📄 Got ${subredditNews.length} trending posts from r/${subreddit}`);
      } catch (error) {
        console.error(`❌ Error fetching news from r/${subreddit}:`, error);
      }
    }

    // Sort by upvotes and take top 15
    const topNews = allNews.sort((a, b) => b.upvotes - a.upvotes).slice(0, 15);

    console.log(`✅ Serving ${topNews.length} top trending Reddit posts`);

    res.json({
      posts: topNews,
      lastUpdated: new Date().toISOString(),
      sources: newsSubreddits,
    });
  } catch (error) {
    console.error('❌ News API error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Debug endpoint to see what's working
router.get('/api/debug', async (_req, res) => {
  const username = await reddit.getCurrentUsername().catch(() => 'anonymous');
  res.json({
    server: 'running',
    version: '0.0.35',
    username,
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/test',
      '/api/market-data',
      '/api/portfolio',
      '/api/trade',
      '/api/trades',
      '/api/leaderboard',
      '/api/news',
      '/api/debug',
    ],
  });
});

// Test endpoint that calls all our real Reddit APIs and returns results
router.get('/api/test-all-data', async (_req, res) => {
  console.log('🧪 Running comprehensive API test...');

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      username: await reddit.getCurrentUsername().catch(() => 'anonymous'),
      tests: [],
    };

    // Test 1: Market Data
    console.log('🔍 Testing market data...');
    try {
      const marketTestSubreddits = ['funny', 'AskReddit'];
      const marketTestResults = [];

      for (const subreddit of marketTestSubreddits) {
        const subredditInfo = await reddit.getSubredditInfoByName(subreddit);
        const hotPosts = await reddit
          .getHotPosts({
            subredditName: subreddit,
            limit: 5,
            pageSize: 5,
          })
          .all();

        marketTestResults.push({
          subreddit,
          members: subredditInfo.members || 0,
          posts_found: hotPosts.length,
          sample_post_titles: hotPosts.slice(0, 2).map((p) => p.title),
          sample_scores: hotPosts.slice(0, 2).map((p) => p.score || 0),
        });
      }

      testResults.tests.push({
        test: 'market_data',
        status: 'SUCCESS',
        results: marketTestResults,
      });
      console.log('✅ Market data test passed');
    } catch (error) {
      testResults.tests.push({
        test: 'market_data',
        status: 'FAILED',
        error: error.message,
      });
      console.log('❌ Market data test failed:', error.message);
    }

    // Test 2: News Data
    console.log('🔍 Testing news data...');
    try {
      const newsSubreddits = ['worldnews', 'technology'];
      const newsTestResults = [];

      for (const subreddit of newsSubreddits) {
        const hotPosts = await reddit
          .getHotPosts({
            subredditName: subreddit,
            limit: 3,
            pageSize: 3,
          })
          .all();

        newsTestResults.push({
          subreddit,
          posts_found: hotPosts.length,
          sample_headlines: hotPosts.slice(0, 2).map((p) => p.title),
          sample_scores: hotPosts.slice(0, 2).map((p) => p.score || 0),
        });
      }

      testResults.tests.push({
        test: 'news_data',
        status: 'SUCCESS',
        results: newsTestResults,
      });
      console.log('✅ News data test passed');
    } catch (error) {
      testResults.tests.push({
        test: 'news_data',
        status: 'FAILED',
        error: error.message,
      });
      console.log('❌ News data test failed:', error.message);
    }

    console.log('🎯 All API tests completed');
    res.json(testResults);
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// REDDIT STOCK EXCHANGE ENDPOINTS

// Get market data - popular subreddits as stocks (with pagination)
router.get('/api/market-data', async (req, res) => {
  try {
    // Start with reliable core subreddits to prevent connection issues
    const allSubreddits = [
      // Top entertainment & general
      'funny',
      'AskReddit',
      'todayilearned',
      'worldnews',
      'pics',
      'gaming',
      'aww',
      'mildlyinteresting',
      'movies',
      'science',
      'IAmA',
      'food',
      'GetMotivated',
      'LifeProTips',
      'technology',
      'art',
      'space',
      'sports',
      'memes',
      'books',

      // Finance & trading
      'investing',
      'wallstreetbets',
      'cryptocurrency',
      'stocks',
      'Bitcoin',
      'personalfinance',
      'SecurityAnalysis',
      'ValueInvesting',
      'Bogleheads',
      'financialindependence',
      'Forex',
      'ethtrader',
      'CryptoCurrency',
      'StockMarket',
      'options',

      // Technology & programming
      'programming',
      'Python',
      'javascript',
      'webdev',
      'startups',
      'datascience',
      'MachineLearning',
      'artificial',
      'coding',
      'computerscience',
      'reactjs',
      'node',
      'learnpython',
      'webdesign',
      'entrepreneur',

      // Popular communities
      'cats',
      'dogs',
      'Fitness',
      'DIY',
      'music',
      'videos',
      'news',
      'Showerthoughts',
      'explainlikeimfive',
      'EarthPorn',
      'NatureIsFuckingLit',
      'photography',
      'travel',
      'fashion',
      'history',
      'philosophy',
      'psychology',

      // Lifestyle & hobbies
      'coolguides',
      'NoStupidQuestions',
      'YouShouldKnow',
      'Futurology',
      'gadgets',
      'interestingasfuck',
      'nextfuckinglevel',
      'oddlysatisfying',
      'BeAmazed',
      'Damnthatsinteresting',
      'YoutubeHaiku',
      'PublicFreakout',
      'facepalm',
      'therewasanattempt',
      'instant_regret',

      // Niche but popular
      'buildapc',
      'pcmasterrace',
      'MechanicalKeyboards',
      'battlestations',
      'homelab',
      'cars',
      'motorcycles',
      'woodworking',
      'gardening',
      'houseplants',
      'cooking',
      'baking',
      'Coffee',
      'tea',
      'wine',

      // Entertainment & media
      'television',
      'netflix',
      'Marvel',
      'StarWars',
      'anime',
      'tipofmytongue',
      'OutOfTheLoop',
      'bestof',
      'DepthHub',
      'AskHistorians',
      'AskScience',
      'UpliftingNews',
      'nottheonion',
      'mildlyinfuriating',

      // Creative & artistic
      'Design',
      'graphic_design',
      'Adobe',
      'architecture',
      'RoomPorn',
      'streetphotography',
      'itookapicture',
      'carporn',
      'MacroPorn',
      'VillagePorn',

      // Health & wellness
      'loseit',
      'decidingtobebetter',
      'meditation',
      'yoga',
      'running',
      'bodyweightfitness',
      'xxfitness',
      'nutrition',
      'MealPrepSunday',
    ];

    // Implement pagination for faster loading
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5; // Load 5 at a time
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const subredditBatch = allSubreddits.slice(startIndex, endIndex);
    const stocks = [];

    console.log(
      `📊 Loading stocks page ${page}, subreddits ${startIndex + 1}-${Math.min(endIndex, allSubreddits.length)} of ${allSubreddits.length}`
    );

    for (const subreddit of subredditBatch) {
      try {
        console.log(`🔍 Fetching real data for r/${subreddit}`);

        // Get subreddit info using Devvit Reddit API
        const subredditInfo = await reddit.getSubredditInfoByName(subreddit);

        // Get hot posts from the subreddit
        const hotPosts = await reddit
          .getHotPosts({
            subredditName: subreddit,
            limit: 25,
            pageSize: 25,
          })
          .all();

        console.log(`📊 Found ${hotPosts.length} posts for r/${subreddit}`);

        // Calculate metrics from real data
        const totalScore = hotPosts.reduce((sum, post) => sum + (post.score || 0), 0);
        const totalComments = hotPosts.reduce((sum, post) => sum + (post.numComments || 0), 0);
        const avgScore = hotPosts.length > 0 ? totalScore / hotPosts.length : 0;

        // Get subscriber count (try multiple properties for compatibility)
        const subscribers =
          subredditInfo.subscribersCount || subredditInfo.members || subredditInfo.subscribers || 0;
        console.log(`📈 r/${subreddit}: ${subscribers.toLocaleString()} subscribers`);

        // Calculate stock price based on real engagement metrics
        // Base price on subscriber count (scaled down) + recent activity
        const subscriberWeight = Math.log10(subscribers + 1) * 5; // Logarithmic scaling
        const activityWeight = avgScore * 0.01 + totalComments * 0.02;
        const basePrice = Math.max(1, subscriberWeight + activityWeight);

        // Get cached price or calculate new one
        let currentPrice;
        let dailyChange = 0;
        const priceKey = `price:${subreddit}`;
        const cachedPriceData = await redis.get(priceKey);

        // Get today's opening price (or set it if it doesn't exist)
        const today = new Date().toDateString(); // "Mon Oct 30 2023" format
        const openingPriceKey = `opening:${subreddit}:${today}`;
        let openingPriceData = await redis.get(openingPriceKey);

        if (cachedPriceData) {
          const { price, timestamp } = JSON.parse(cachedPriceData);
          const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

          // Use cached price if less than 5 minutes old
          if (ageMinutes < 5) {
            currentPrice = price;
          } else {
            // Calculate new price with enhanced volatility system
            const volatility = calculateEnhancedVolatility(totalScore, totalComments, subreddit);
            currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));

            // Cache the new price
            await redis.set(
              priceKey,
              JSON.stringify({
                price: currentPrice,
                timestamp: Date.now(),
              })
            );
          }
        } else {
          // No cached price, calculate initial price with enhanced volatility
          const volatility = calculateEnhancedVolatility(totalScore, totalComments, subreddit);
          currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));

          // Cache the price
          await redis.set(
            priceKey,
            JSON.stringify({
              price: currentPrice,
              timestamp: Date.now(),
            })
          );
        }

        // Set or get opening price for today
        if (!openingPriceData) {
          // First time seeing this stock today - set current price as opening price
          await redis.set(
            openingPriceKey,
            JSON.stringify({
              openingPrice: currentPrice,
              date: today,
            })
          );
          dailyChange = 0;
        } else {
          // Calculate daily change from opening price
          const { openingPrice } = JSON.parse(openingPriceData);
          dailyChange = ((currentPrice - openingPrice) / openingPrice) * 100;
        }

        stocks.push({
          id: subreddit,
          symbol: subreddit.toUpperCase().substring(0, 5),
          name: `r/${subreddit}`,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(dailyChange * 100) / 100,
          changePercent: Math.round(dailyChange * 100) / 100,
          volume: totalComments,
          marketCap: Math.round((currentPrice * subscribers) / 1000), // Market cap based on subscribers
          posts: hotPosts.length,
          avgScore: Math.round(avgScore),
          subscribers: subscribers,
          isLive: true,
        });

        console.log(
          `✅ Processed r/${subreddit}: ${subscribers.toLocaleString()} members, $${currentPrice.toFixed(2)}`
        );
      } catch (error) {
        console.error(`❌ Error fetching real data for r/${subreddit}:`, error);

        // Use cached price if available, otherwise skip this subreddit
        const priceKey = `price:${subreddit}`;
        try {
          const cachedPriceData = await redis.get(priceKey);
          if (cachedPriceData) {
            const { price } = JSON.parse(cachedPriceData);
            stocks.push({
              id: subreddit,
              symbol: subreddit.toUpperCase().substring(0, 5),
              name: `r/${subreddit}`,
              price: Math.round(price * 100) / 100,
              change: 0,
              changePercent: 0,
              volume: 1000,
              marketCap: Math.round(price * 1000000),
              posts: 25,
              avgScore: 100,
              subscribers: 1000000,
              isLive: false,
            });
            console.log(`⚠️ Using cached price for r/${subreddit}: $${price.toFixed(2)}`);
          } else {
            console.log(`⚠️ Skipping r/${subreddit} - no cached data available`);
          }
        } catch (cacheError) {
          console.log(`⚠️ Skipping r/${subreddit} - cache error:`, cacheError);
        }
      }
    }

    // Ensure we always return at least some stocks
    if (stocks.length === 0) {
      console.log('⚠️ No stocks loaded, creating basic fallback stock');
      stocks.push({
        id: 'reddit',
        symbol: 'REDD',
        name: 'r/reddit',
        price: 50.0,
        change: 0,
        changePercent: 0,
        volume: 1000,
        marketCap: 50000000,
        posts: 100,
        avgScore: 100,
        subscribers: 1000000,
        isLive: false,
      });
    }

    console.log(`✅ Market data API returning ${stocks.length} stocks for page ${page}`);
    res.json({
      stocks,
      lastUpdated: new Date().toISOString(),
      marketStatus: 'open',
      pagination: {
        page,
        limit,
        total: allSubreddits.length,
        hasMore: endIndex < allSubreddits.length,
      },
    });
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Search stocks endpoint
router.get('/api/market-data/search', async (req, res) => {
  try {
    const query = (req.query.q as string)?.toLowerCase() || '';
    if (!query) {
      return res.json({ stocks: [], query: '' });
    }

    const allSubreddits = [
      // Top entertainment & general
      'funny',
      'AskReddit',
      'todayilearned',
      'worldnews',
      'pics',
      'gaming',
      'aww',
      'mildlyinteresting',
      'movies',
      'science',
      'IAmA',
      'food',
      'GetMotivated',
      'LifeProTips',
      'technology',
      'art',
      'space',
      'sports',
      'memes',
      'books',

      // Finance & trading
      'investing',
      'wallstreetbets',
      'cryptocurrency',
      'stocks',
      'Bitcoin',
      'personalfinance',
      'SecurityAnalysis',
      'ValueInvesting',
      'Bogleheads',
      'financialindependence',
      'Forex',
      'ethtrader',
      'CryptoCurrency',
      'StockMarket',
      'options',

      // Technology & programming
      'programming',
      'Python',
      'javascript',
      'webdev',
      'startups',
      'datascience',
      'MachineLearning',
      'artificial',
      'coding',
      'computerscience',
      'reactjs',
      'node',
      'learnpython',
      'webdesign',
      'entrepreneur',

      // Popular communities
      'cats',
      'dogs',
      'Fitness',
      'DIY',
      'music',
      'videos',
      'news',
      'Showerthoughts',
      'explainlikeimfive',
      'EarthPorn',
      'NatureIsFuckingLit',
      'photography',
      'travel',
      'fashion',
      'history',
      'philosophy',
      'psychology',

      // Lifestyle & hobbies
      'coolguides',
      'NoStupidQuestions',
      'YouShouldKnow',
      'Futurology',
      'gadgets',
      'interestingasfuck',
      'nextfuckinglevel',
      'oddlysatisfying',
      'BeAmazed',
      'Damnthatsinteresting',
      'YoutubeHaiku',
      'PublicFreakout',
      'facepalm',
      'therewasanattempt',
      'instant_regret',

      // Niche but popular
      'buildapc',
      'pcmasterrace',
      'MechanicalKeyboards',
      'battlestations',
      'homelab',
      'cars',
      'motorcycles',
      'woodworking',
      'gardening',
      'houseplants',
      'cooking',
      'baking',
      'Coffee',
      'tea',
      'wine',

      // Entertainment & media
      'television',
      'netflix',
      'Marvel',
      'StarWars',
      'anime',
      'tipofmytongue',
      'OutOfTheLoop',
      'bestof',
      'DepthHub',
      'AskHistorians',
      'AskScience',
      'UpliftingNews',
      'nottheonion',
      'mildlyinfuriating',

      // Creative & artistic
      'Design',
      'graphic_design',
      'Adobe',
      'architecture',
      'RoomPorn',
      'streetphotography',
      'itookapicture',
      'carporn',
      'MacroPorn',
      'VillagePorn',

      // Health & wellness
      'loseit',
      'decidingtobebetter',
      'meditation',
      'yoga',
      'running',
      'bodyweightfitness',
      'xxfitness',
      'nutrition',
      'MealPrepSunday',
    ];

    // Filter subreddits that match the search query
    const matchingSubreddits = allSubreddits.filter(
      (subreddit) =>
        subreddit.toLowerCase().includes(query) || `r/${subreddit}`.toLowerCase().includes(query)
    );

    console.log(`🔍 Searching for "${query}", found ${matchingSubreddits.length} matches`);

    const stocks = [];
    // Load data for matching subreddits
    for (const subreddit of matchingSubreddits) {
      try {
        // Use cached price if available for faster search
        const priceKey = `price:${subreddit}`;
        const cachedPriceData = await redis.get(priceKey);

        if (cachedPriceData) {
          const { price } = JSON.parse(cachedPriceData);
          stocks.push({
            id: subreddit,
            symbol: subreddit.toUpperCase().substring(0, 5),
            name: `r/${subreddit}`,
            price: Math.round(price * 100) / 100,
            change: 0,
            changePercent: 0,
            volume: 1000,
            marketCap: Math.round(price * 1000000),
            posts: 25,
            avgScore: 100,
            subscribers: 1000000,
            isLive: false,
          });
        }
      } catch (error) {
        console.error(`❌ Error loading search result for r/${subreddit}:`, error);
      }
    }

    console.log(`✅ Search API returning ${stocks.length} results for "${query}"`);
    res.json({
      stocks,
      query,
      total: matchingSubreddits.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get specific subreddit data
router.get('/api/subreddit/:name/data', async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🔍 Fetching detailed data for r/${name}`);

    // Get real subreddit data using Reddit API
    const subredditInfo = await reddit.getSubredditInfoByName(name);
    const hotPosts = await reddit
      .getHotPosts({
        subredditName: name,
        limit: 10,
        pageSize: 10,
      })
      .all();

    console.log(`📊 Retrieved ${hotPosts.length} posts for r/${name}`);

    const totalScore = hotPosts.reduce((sum, post) => sum + (post.score || 0), 0);
    const totalComments = hotPosts.reduce((sum, post) => sum + (post.numComments || 0), 0);
    const avgScore = hotPosts.length > 0 ? totalScore / hotPosts.length : 0;
    const subscribers = subredditInfo.members || 0;

    // Calculate price using same algorithm as market data
    const subscriberWeight = Math.log10(subscribers + 1) * 5;
    const activityWeight = avgScore * 0.01 + totalComments * 0.02;
    const basePrice = Math.max(1, subscriberWeight + activityWeight);

    // Use cached price system for consistency
    let currentPrice;
    let dailyChange = 0;
    const priceKey = `price:${name}`;
    const cachedPriceData = await redis.get(priceKey);

    // Get today's opening price (or set it if it doesn't exist)
    const today = new Date().toDateString();
    const openingPriceKey = `opening:${name}:${today}`;
    let openingPriceData = await redis.get(openingPriceKey);

    if (cachedPriceData) {
      const { price, timestamp } = JSON.parse(cachedPriceData);
      const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

      if (ageMinutes < 5) {
        currentPrice = price;
      } else {
        const volatility = calculateEnhancedVolatility(totalScore, totalComments, name);
        currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
        await redis.set(
          priceKey,
          JSON.stringify({
            price: currentPrice,
            timestamp: Date.now(),
          })
        );
      }
    } else {
      const volatility = calculateEnhancedVolatility(totalScore, totalComments, name);
      currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
      await redis.set(
        priceKey,
        JSON.stringify({
          price: currentPrice,
          timestamp: Date.now(),
        })
      );
    }

    // Set or get opening price for today
    if (!openingPriceData) {
      // First time seeing this stock today - set current price as opening price
      await redis.set(
        openingPriceKey,
        JSON.stringify({
          openingPrice: currentPrice,
          date: today,
        })
      );
      dailyChange = 0;
    } else {
      // Calculate daily change from opening price
      const { openingPrice } = JSON.parse(openingPriceData);
      dailyChange = ((currentPrice - openingPrice) / openingPrice) * 100;
    }

    res.json({
      subreddit: name,
      symbol: name.toUpperCase().substring(0, 5),
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(dailyChange * 100) / 100,
      changePercent: Math.round(dailyChange * 100) / 100,
      volume: totalComments,
      marketCap: Math.round((currentPrice * subscribers) / 1000),
      metrics: {
        totalPosts: hotPosts.length,
        totalScore,
        totalComments,
        avgScore: Math.round(avgScore),
        subscribers: subscribers,
      },
      recentPosts: hotPosts.slice(0, 5).map((post) => ({
        id: post.id,
        title: post.title,
        score: post.score,
        numComments: post.numComments,
        author: post.authorName,
        url: post.permalink,
      })),
      lastUpdated: new Date().toISOString(),
      isLive: true,
    });

    console.log(`✅ Served real data for r/${name}: ${subscribers.toLocaleString()} members`);
  } catch (error) {
    console.error(`❌ Failed to fetch real data for r/${name}:`, error);
    res.status(500).json({ error: 'Failed to fetch subreddit data' });
  }
});

// Portfolio Management
router.get('/api/portfolio', async (req, res) => {
  try {
    const username = await reddit.getCurrentUsername().catch(() => 'anonymous');
    const portfolioKey = `portfolio:${username}`;

    // Get portfolio from Redis or create default
    const portfolioData = await redis.get(portfolioKey);
    const portfolio = portfolioData
      ? JSON.parse(portfolioData)
      : {
          userId: username,
          cash: 10000, // Starting cash
          totalValue: 10000,
          totalReturn: 0,
          totalReturnPercent: 0,
          holdings: [],
          createdAt: new Date().toISOString(),
        };

    // Update current prices for holdings using real Reddit data
    for (const holding of portfolio.holdings) {
      try {
        console.log(`📈 Updating price for ${holding.subreddit} holding`);

        // Get real subreddit data
        const subredditInfo = await reddit.getSubredditInfoByName(holding.subreddit);
        const hotPosts = await reddit
          .getHotPosts({
            subredditName: holding.subreddit,
            limit: 25,
            pageSize: 25,
          })
          .all();

        const totalScore = hotPosts.reduce((sum, post) => sum + (post.score || 0), 0);
        const totalComments = hotPosts.reduce((sum, post) => sum + (post.numComments || 0), 0);
        const avgScore = hotPosts.length > 0 ? totalScore / hotPosts.length : 0;
        const subscribers = subredditInfo.members || 0;

        // Use same pricing algorithm as market data with caching
        const subscriberWeight = Math.log10(subscribers + 1) * 5;
        const activityWeight = avgScore * 0.01 + totalComments * 0.02;
        const basePrice = Math.max(1, subscriberWeight + activityWeight);

        // Use cached price system for consistency
        let currentPrice;
        const priceKey = `price:${holding.subreddit}`;
        const cachedPriceData = await redis.get(priceKey);

        if (cachedPriceData) {
          const { price, timestamp } = JSON.parse(cachedPriceData);
          const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

          if (ageMinutes < 5) {
            currentPrice = price;
          } else {
            const volatility = calculateEnhancedVolatility(
              totalScore,
              totalComments,
              holding.subreddit
            );
            currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
            await redis.set(
              priceKey,
              JSON.stringify({
                price: currentPrice,
                timestamp: Date.now(),
              })
            );
          }
        } else {
          const volatility = calculateEnhancedVolatility(
            totalScore,
            totalComments,
            holding.subreddit
          );
          currentPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
          await redis.set(
            priceKey,
            JSON.stringify({
              price: currentPrice,
              timestamp: Date.now(),
            })
          );
        }

        holding.currentPrice = Math.round(currentPrice * 100) / 100;
        holding.currentValue = holding.shares * holding.currentPrice;
        holding.totalReturn = holding.currentValue - holding.shares * holding.avgPrice;
        holding.totalReturnPercent =
          ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

        console.log(`✅ Updated ${holding.subreddit}: $${holding.currentPrice.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Error updating ${holding.subreddit} price:`, error);
        // Keep existing price if API fails
      }
    }

    // Recalculate portfolio totals
    const holdingsValue = portfolio.holdings.reduce(
      (sum: number, h: any) => sum + h.currentValue,
      0
    );
    portfolio.totalValue = portfolio.cash + holdingsValue;
    portfolio.totalReturn = portfolio.totalValue - 10000;
    portfolio.totalReturnPercent = ((portfolio.totalValue - 10000) / 10000) * 100;

    // Save updated portfolio
    await redis.set(portfolioKey, JSON.stringify(portfolio));

    res.json({ portfolio });
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Execute Trade
router.post('/api/trade', async (req, res) => {
  try {
    const { subreddit, action, shares } = req.body;
    const username = await reddit.getCurrentUsername().catch(() => 'anonymous');

    if (!subreddit || !action || !shares || shares <= 0) {
      res
        .status(400)
        .json({ error: 'Invalid trade parameters. Need: subreddit, action (buy/sell), shares' });
      return;
    }

    // Get current stock price using real Reddit data
    console.log(`💰 Getting real-time price for r/${subreddit}`);
    const subredditInfo = await reddit.getSubredditInfoByName(subreddit);
    const hotPosts = await reddit
      .getHotPosts({
        subredditName: subreddit,
        limit: 25,
        pageSize: 25,
      })
      .all();

    const totalScore = hotPosts.reduce((sum, post) => sum + (post.score || 0), 0);
    const totalComments = hotPosts.reduce((sum, post) => sum + (post.numComments || 0), 0);
    const avgScore = hotPosts.length > 0 ? totalScore / hotPosts.length : 0;
    const subscribers = subredditInfo.members || 0;

    // Use same pricing algorithm with caching
    const subscriberWeight = Math.log10(subscribers + 1) * 5;
    const activityWeight = avgScore * 0.01 + totalComments * 0.02;
    const basePrice = Math.max(1, subscriberWeight + activityWeight);

    // Use cached price system for consistent trading prices
    let stockPrice;
    const priceKey = `price:${subreddit}`;
    const cachedPriceData = await redis.get(priceKey);

    if (cachedPriceData) {
      const { price, timestamp } = JSON.parse(cachedPriceData);
      const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

      if (ageMinutes < 5) {
        stockPrice = price;
      } else {
        const volatility = calculateEnhancedVolatility(totalScore, totalComments, subreddit);
        stockPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
        await redis.set(
          priceKey,
          JSON.stringify({
            price: stockPrice,
            timestamp: Date.now(),
          })
        );
      }
    } else {
      const volatility = calculateEnhancedVolatility(totalScore, totalComments, subreddit);
      stockPrice = Math.max(0.01, basePrice * (1 + volatility / 100));
      await redis.set(
        priceKey,
        JSON.stringify({
          price: stockPrice,
          timestamp: Date.now(),
        })
      );
    }

    console.log(
      `📊 r/${subreddit} current price: $${stockPrice.toFixed(2)} (${subscribers.toLocaleString()} members)`
    );

    // Get current portfolio
    const portfolioKey = `portfolio:${username}`;
    const portfolioData = await redis.get(portfolioKey);
    const portfolio = portfolioData
      ? JSON.parse(portfolioData)
      : {
          userId: username,
          cash: 10000,
          totalValue: 10000,
          totalReturn: 0,
          totalReturnPercent: 0,
          holdings: [],
        };

    const totalCost = shares * stockPrice;

    if (action === 'buy') {
      if (portfolio.cash < totalCost) {
        res.status(400).json({ error: 'Insufficient funds' });
        return;
      }

      portfolio.cash -= totalCost;

      // Find existing holding or create new one
      const existingHolding = portfolio.holdings.find((h: any) => h.subreddit === subreddit);
      if (existingHolding) {
        const totalShares = existingHolding.shares + shares;
        const totalCostBasis = existingHolding.shares * existingHolding.avgPrice + totalCost;
        existingHolding.avgPrice = totalCostBasis / totalShares;
        existingHolding.shares = totalShares;
      } else {
        portfolio.holdings.push({
          subreddit,
          symbol: subreddit.toUpperCase().substring(0, 5),
          shares,
          avgPrice: stockPrice,
          currentPrice: stockPrice,
          currentValue: totalCost,
          totalReturn: 0,
          totalReturnPercent: 0,
        });
      }
    } else if (action === 'sell') {
      const holding = portfolio.holdings.find((h: any) => h.subreddit === subreddit);
      if (!holding || holding.shares < shares) {
        res.status(400).json({ error: 'Insufficient shares to sell' });
        return;
      }

      portfolio.cash += totalCost;
      holding.shares -= shares;

      // Remove holding if all shares sold
      if (holding.shares === 0) {
        portfolio.holdings = portfolio.holdings.filter((h: any) => h.subreddit !== subreddit);
      }
    } else {
      res.status(400).json({ error: 'Invalid action. Use "buy" or "sell"' });
      return;
    }

    // Save updated portfolio
    await redis.set(portfolioKey, JSON.stringify(portfolio));

    // Save trade history
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: username,
      subreddit,
      action,
      shares,
      price: stockPrice,
      total: totalCost,
      timestamp: new Date().toISOString(),
    };

    const tradesKey = `trades:${username}`;
    const existingTrades = await redis.get(tradesKey);
    const trades = existingTrades ? JSON.parse(existingTrades) : [];
    trades.unshift(trade);
    trades.splice(50); // Keep only last 50 trades
    await redis.set(tradesKey, JSON.stringify(trades));

    res.json({
      success: true,
      trade,
      message: `Successfully ${action === 'buy' ? 'bought' : 'sold'} ${shares} shares of r/${subreddit}`,
    });
  } catch (error) {
    console.error('Trade error:', error);
    res.status(500).json({ error: 'Trade execution failed' });
  }
});

// Get Trade History
router.get('/api/trades', async (req, res) => {
  try {
    const username = await reddit.getCurrentUsername().catch(() => 'anonymous');
    const tradesKey = `trades:${username}`;

    const tradesData = await redis.get(tradesKey);
    const trades = tradesData ? JSON.parse(tradesData) : [];

    res.json({
      trades,
      userId: username,
      count: trades.length,
    });
  } catch (error) {
    console.error('Trade history error:', error);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

// Simple Leaderboard
router.get('/api/leaderboard', async (req, res) => {
  try {
    const username = await reddit.getCurrentUsername().catch(() => 'anonymous');

    // For now, just return current user's performance
    // In a real app, you'd maintain a sorted leaderboard in Redis
    const portfolioKey = `portfolio:${username}`;
    const portfolioData = await redis.get(portfolioKey);

    const leaderboard = portfolioData
      ? [
          {
            userId: username,
            totalValue: JSON.parse(portfolioData).totalValue || 10000,
            totalReturn: JSON.parse(portfolioData).totalReturn || 0,
            totalReturnPercent: JSON.parse(portfolioData).totalReturnPercent || 0,
            rank: 1,
          },
        ]
      : [];

    res.json({
      leaderboard,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.use(router);

// Error handling
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

const port = getServerPort();
const server = createServer ? createServer(app) : app;

server.listen(port, () => {
  console.log(`🔥 CLEAN SERVER v0.0.36 - ${new Date().toISOString()}`);
  console.log('🚀 Reddit Stonks server running on port', port);
  console.log('🎯 All API endpoints available - USING REAL REDDIT DATA');
  console.log('🗑️  All old services completely removed');

  reddit
    .getCurrentUsername()
    .then((username) => console.log(`🔑 Connected as: ${username}`))
    .catch(() => console.log('⚠️ Running in anonymous mode'));
});

export default app;
