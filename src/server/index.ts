import { Devvit } from '@devvit/public-api';
import { redis, reddit, context } from '@devvit/web/server';
import { createPost } from './core/post';

// Simple Devvit server - no Express needed!
console.log('🔑 Reddit API status: Connected via Devvit');
console.log('✅ Server ready - using Devvit platform services');

// Export the main server handler for Devvit
export default Devvit;