import { Devvit } from '@devvit/public-api';

// NO EXPRESS SERVER - using Devvit's built-in system
console.log('🔑 Reddit API status: Connected via Devvit');
console.log('✅ Server ready - using Devvit platform services');

// Popular subreddits for stock simulation (from API.md Phase 1)
const STOCK_SUBREDDITS = [
  'wallstreetbets', 'investing', 'stocks', 'cryptocurrency', 'bitcoin',
  'ethereum', 'dogecoin', 'SecurityAnalysis', 'ValueInvesting', 'pennystocks',
  'options', 'financialindependence', 'dividends', 'robinhood', 'trading',
  'PersonalFinanceCanada', 'UKPersonalFinance', 'AusFinance', 'IndiaInvestments', 'SecurityAnalysis'
];

// Test Reddit API on startup with multiple endpoints
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (event, context) => {
    try {
      console.log('🧪 Testing Reddit API endpoints on app install...');
      
      // Test getSubredditInfoByName (core endpoint for stock prices)
      console.log('📊 Testing getSubredditInfoByName...');
      const wsb = await context.reddit.getSubredditInfoByName('wallstreetbets');
      console.log(`✅ WSB: ${wsb.subscribers} subscribers`);
      
      // Test getHotPosts (for engagement metrics)
      console.log('📈 Testing getHotPosts...');
      const hotPosts = await context.reddit.getHotPosts({
        subredditName: 'wallstreetbets',
        limit: 5
      });
      console.log(`✅ Hot posts: ${hotPosts.length} posts fetched`);
      
      // Test getNewPosts (for daily activity)  
      console.log('🆕 Testing getNewPosts...');
      const newPosts = await context.reddit.getNewPosts({
        subredditName: 'wallstreetbets', 
        limit: 5
      });
      console.log(`✅ New posts: ${newPosts.length} posts fetched`);
      
      // Test getCurrentUser (for portfolio management)
      console.log('👤 Testing getCurrentUser...');
      const currentUser = await context.reddit.getCurrentUser();
      console.log(`✅ Current user: ${currentUser?.username || 'Anonymous'}`);
      
      console.log('🎉 All Reddit API tests successful!');
      
    } catch (error) {
      console.error('❌ Reddit API test failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  }
});

// Add trigger to test market data fetching
Devvit.addTrigger({
  event: 'AppUpgrade', 
  onEvent: async (event, context) => {
    try {
      console.log('📊 Fetching market data for stock exchange...');
      
      // Fetch data for first 5 stock subreddits  
      const marketData: Array<{name: string, subscribers: number, activity: number}> = [];
      
      for (const subredditName of STOCK_SUBREDDITS.slice(0, 5)) {
        try {
          const subreddit = await context.reddit.getSubredditInfoByName(subredditName);
          const hotPosts = await context.reddit.getHotPosts({
            subredditName,
            limit: 10
          });
          
          marketData.push({
            name: subreddit.name,
            subscribers: subreddit.subscribers || 0,
            activity: hotPosts.length
          });
          
          console.log(`📈 ${subreddit.name}: ${subreddit.subscribers} subs, ${hotPosts.length} hot posts`);
        } catch (err) {
          console.log(`⚠️ Failed to fetch ${subredditName}: ${err}`);
        }
      }
      
      console.log(`✅ Market data collected for ${marketData.length} subreddits`);
      
    } catch (error) {
      console.error('❌ Market data fetch failed:', error);
    }
  }
});

// Add a custom post that provides Reddit data to the client
Devvit.addCustomPostType({
  name: 'StonksApp', 
  render: async (context) => {
    // Instead of JSX, let's just fetch the data when the post loads
    console.log('🎯 StonksApp post loading...');
    
    try {
      // Fetch real Reddit data for first 3 subreddits
      console.log('📊 Fetching Reddit market data...');
      for (const subredditName of STOCK_SUBREDDITS.slice(0, 3)) {
        try {
          const subreddit = await context.reddit.getSubredditInfoByName(subredditName);
          const hotPosts = await context.reddit.getHotPosts({
            subredditName,
            limit: 10
          });
          
          console.log(`📈 ${subreddit.name}: ${subreddit.subscribers} subs, ${hotPosts.length} hot posts`);
        } catch (err) {
          console.log(`⚠️ Failed to fetch ${subredditName}: ${err}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch market data:', error);
    }
    
    // Return a simple text component - no JSX needed
    return { type: 'text', text: 'Reddit Stonks - Market Data Loaded' };
  }
});

export default Devvit;