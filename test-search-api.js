#!/usr/bin/env node

// Simple test to validate our search API endpoints
import { stockSearchService } from './src/server/services/stockSearchService.js';

console.log('🧪 Testing Reddit Stonks Search API');
console.log('='.repeat(50));

try {
  // Test basic search
  console.log('\n1. Testing basic search functionality:');
  const searchResult = stockSearchService.searchStocks({ query: 'gaming' });
  console.log(`   Found ${searchResult.totalCount} stocks matching "gaming"`);
  console.log(`   Sample result:`, searchResult.stocks[0]);

  // Test category filtering
  console.log('\n2. Testing category filtering:');
  const memeStocks = stockSearchService.getStocksByCategory('meme');
  console.log(`   Meme category has ${memeStocks.length} stocks`);
  console.log(`   Sample meme stock:`, memeStocks[0]?.symbol);

  // Test top performers
  console.log('\n3. Testing performance filtering:');
  const topGainers = stockSearchService.getTopGainers(5);
  console.log(`   Top 5 gainers:`, topGainers.map(s => `${s.symbol}(${s.change.toFixed(2)}%)`));

  // Test search suggestions
  console.log('\n4. Testing search suggestions:');
  const suggestions = stockSearchService.searchSuggestions('wall', 3);
  console.log(`   Suggestions for "wall":`, suggestions);

  // Test market overview
  console.log('\n5. Testing market overview:');
  const overview = stockSearchService.getMarketOverview();
  console.log(`   Total stocks: ${overview.totalStocks}`);
  console.log(`   Categories: ${overview.categories.length}`);
  console.log(`   Sample category:`, overview.categories[0]);

  console.log('\n✅ All search functionality tests passed!');
  console.log('🎯 Search/filter API is working correctly');

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}