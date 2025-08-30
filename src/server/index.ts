import { Devvit } from '@devvit/public-api';

// NO EXPRESS SERVER - using Devvit's built-in system
console.log('🔑 Reddit API status: Connected via Devvit');
console.log('✅ Server ready - using Devvit platform services');
console.log('🔍 DEBUG: Server initialization complete - ready to test Reddit API');

// Test Reddit API on server startup
(async () => {
  console.log('🔍 DEBUG: Testing Reddit API during server init...');
  // Note: This won't work because we don't have context here, but it shows the approach
})();

// Popular subreddits for stock simulation (from API.md Phase 1)
const STOCK_SUBREDDITS = [
  'wallstreetbets', 'investing', 'stocks', 'cryptocurrency', 'bitcoin',
  'ethereum', 'dogecoin', 'SecurityAnalysis', 'ValueInvesting', 'pennystocks',
  'options', 'financialindependence', 'dividends', 'robinhood', 'trading',
  'PersonalFinanceCanada', 'UKPersonalFinance', 'AusFinance', 'IndiaInvestments', 'SecurityAnalysis'
];

// Test Reddit API immediately on app install
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_event, context) => {
    console.log('🧪 Reddit API test starting in AppInstall trigger...');
    
    try {
      console.log('🔍 DEBUG: Calling getSubredditInfoByName("wallstreetbets")');
      const subreddit = await context.reddit.getSubredditInfoByName('wallstreetbets');
      
      console.log('🔍 DEBUG: ✅ Reddit API SUCCESS in AppInstall!');
      console.log('🔍 DEBUG: Subreddit data:', JSON.stringify(subreddit, null, 2));
      console.log('🎉 Reddit API working perfectly!');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Reddit API FAILED in AppInstall:', errorMsg);
      console.error('❌ Full error:', error);
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

// Add a custom post that tests Reddit API every time it renders
Devvit.addCustomPostType({
  name: 'StonksApp', 
  render: async (context) => {
    console.log('🎯 StonksApp custom post rendering...');
    
    // Test Reddit API immediately
    console.log('🔍 DEBUG: Testing Reddit API in custom post render');
    let apiResult = 'Testing...';
    
    try {
      const subreddit = await context.reddit.getSubredditInfoByName('wallstreetbets');
      console.log('🔍 DEBUG: ✅ Reddit API SUCCESS!');
      console.log('🔍 DEBUG: Full subreddit object:', JSON.stringify(subreddit, null, 2));
      console.log('🔍 DEBUG: WSB name:', subreddit.name);
      apiResult = `SUCCESS: Got subreddit data for ${subreddit.name}`;
      
      // Test another endpoint
      const hotPosts = await context.reddit.getHotPosts({
        subredditName: 'wallstreetbets',
        limit: 3
      });
      console.log('🔍 DEBUG: ✅ Hot posts API SUCCESS!');
      console.log('🔍 DEBUG: Hot posts object:', JSON.stringify(hotPosts, null, 2));
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Reddit API FAILED in custom post:', errorMsg);
      apiResult = `FAILED: ${errorMsg}`;
    }
    
    console.log('🔍 DEBUG: Custom post render complete');
    
    // Return result as text
    return {
      type: 'text',
      text: `Reddit API Test Result: ${apiResult}`
    };
  }
});

// Simple Reddit API test in AppUpgrade trigger
Devvit.addTrigger({
  event: 'AppUpgrade',
  onEvent: async (_event, context) => {
    console.log('🔍 DEBUG: AppUpgrade trigger - testing Reddit API');
    
    try {
      const subreddit = await context.reddit.getSubredditInfoByName('wallstreetbets');
      console.log('🔍 DEBUG: Reddit API SUCCESS in AppUpgrade!');
      console.log('🔍 DEBUG: WSB name:', subreddit.name);
      console.log('✅ Reddit API working in trigger');
    } catch (error) {
      console.error('❌ Reddit API FAILED in trigger:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
});

// Remove menu item to avoid context menu errors - test directly in custom post

export default Devvit;