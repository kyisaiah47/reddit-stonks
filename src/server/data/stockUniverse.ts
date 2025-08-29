import { StockCategory } from '../../shared/types/api';

export interface StockDefinition {
  id: string;
  symbol: string;
  name: string;
  subreddit: string; // The actual subreddit name for API calls
  category: StockCategory;
  volatilityMultiplier: number;
  isDividendStock: boolean;
  categoryMultiplier: number;
}

export const STOCK_UNIVERSE: StockDefinition[] = [
  // Meme Stocks (High Volatility)
  { id: 'wsb', symbol: 'WSB', name: 'r/wallstreetbets', subreddit: 'wallstreetbets', category: 'meme', volatilityMultiplier: 2.5, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'doge', symbol: 'DOGE', name: 'r/dogecoin', subreddit: 'dogecoin', category: 'meme', volatilityMultiplier: 2.0, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'gme', symbol: 'GME', name: 'r/superstonk', subreddit: 'Superstonk', category: 'meme', volatilityMultiplier: 2.5, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'amc', symbol: 'AMC', name: 'r/amcstock', subreddit: 'amcstock', category: 'meme', volatilityMultiplier: 2.0, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'cryp', symbol: 'CRYP', name: 'r/cryptocurrency', subreddit: 'CryptoCurrency', category: 'meme', volatilityMultiplier: 1.8, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'hood', symbol: 'HOOD', name: 'r/robinhoodpennystocks', subreddit: 'RobinhoodPennyStocks', category: 'meme', volatilityMultiplier: 2.2, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'meme', symbol: 'MEME', name: 'r/memeeconomy', subreddit: 'MemeEconomy', category: 'meme', volatilityMultiplier: 1.9, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'stck', symbol: 'STCK', name: 'r/stockmarket', subreddit: 'StockMarket', category: 'meme', volatilityMultiplier: 1.5, isDividendStock: false, categoryMultiplier: 0.5 },

  // Blue Chip Stocks (Stable Growth)
  { id: 'ask', symbol: 'ASK', name: 'r/askreddit', subreddit: 'AskReddit', category: 'blue-chip', volatilityMultiplier: 0.5, isDividendStock: true, categoryMultiplier: 2.0 },
  { id: 'aww', symbol: 'AWW', name: 'r/aww', subreddit: 'aww', category: 'blue-chip', volatilityMultiplier: 0.3, isDividendStock: true, categoryMultiplier: 2.0 },
  { id: 'lol', symbol: 'LOL', name: 'r/funny', subreddit: 'funny', category: 'blue-chip', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'pics', symbol: 'PICS', name: 'r/pics', subreddit: 'pics', category: 'blue-chip', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'news', symbol: 'NEWS', name: 'r/worldnews', subreddit: 'worldnews', category: 'blue-chip', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'til', symbol: 'TIL', name: 'r/todayilearned', subreddit: 'todayilearned', category: 'blue-chip', volatilityMultiplier: 0.4, isDividendStock: true, categoryMultiplier: 2.0 },
  { id: 'eli5', symbol: 'ELI5', name: 'r/explainlikeimfive', subreddit: 'explainlikeimfive', category: 'blue-chip', volatilityMultiplier: 0.5, isDividendStock: true, categoryMultiplier: 2.0 },
  { id: 'lpt', symbol: 'LPT', name: 'r/lifeprotips', subreddit: 'LifeProTips', category: 'blue-chip', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 2.0 },

  // Tech Growth Stocks
  { id: 'tech', symbol: 'TECH', name: 'r/technology', subreddit: 'technology', category: 'tech-growth', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'code', symbol: 'CODE', name: 'r/programming', subreddit: 'programming', category: 'tech-growth', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'pcmr', symbol: 'PCMR', name: 'r/pcmasterrace', subreddit: 'pcmasterrace', category: 'tech-growth', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'linux', symbol: 'LINUX', name: 'r/linux', subreddit: 'linux', category: 'tech-growth', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'ai', symbol: 'AI', name: 'r/artificial', subreddit: 'artificial', category: 'tech-growth', volatilityMultiplier: 1.8, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'gadg', symbol: 'GADG', name: 'r/gadgets', subreddit: 'gadgets', category: 'tech-growth', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'start', symbol: 'START', name: 'r/startups', subreddit: 'startups', category: 'tech-growth', volatilityMultiplier: 1.6, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'web', symbol: 'WEB', name: 'r/webdev', subreddit: 'webdev', category: 'tech-growth', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 3.0 },

  // Entertainment Sector
  { id: 'movs', symbol: 'MOVS', name: 'r/movies', subreddit: 'movies', category: 'entertainment', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'tv', symbol: 'TV', name: 'r/television', subreddit: 'television', category: 'entertainment', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'music', symbol: 'MUSIC', name: 'r/music', subreddit: 'Music', category: 'entertainment', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'game', symbol: 'GAME', name: 'r/gaming', subreddit: 'gaming', category: 'entertainment', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'nflx', symbol: 'NFLX', name: 'r/netflix', subreddit: 'netflix', category: 'entertainment', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'mrvl', symbol: 'MRVL', name: 'r/marvel', subreddit: 'Marvel', category: 'entertainment', volatilityMultiplier: 1.4, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'swrs', symbol: 'SWRS', name: 'r/starwars', subreddit: 'StarWars', category: 'entertainment', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'anime', symbol: 'ANIME', name: 'r/anime', subreddit: 'anime', category: 'entertainment', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.5 },

  // Lifestyle & Health
  { id: 'fit', symbol: 'FIT', name: 'r/fitness', subreddit: 'Fitness', category: 'lifestyle', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.2 },
  { id: 'diet', symbol: 'DIET', name: 'r/loseit', subreddit: 'loseit', category: 'lifestyle', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 1.2 },
  { id: 'zen', symbol: 'ZEN', name: 'r/meditation', subreddit: 'Meditation', category: 'lifestyle', volatilityMultiplier: 0.4, isDividendStock: true, categoryMultiplier: 1.2 },
  { id: 'pf', symbol: 'PF', name: 'r/personalfinance', subreddit: 'personalfinance', category: 'lifestyle', volatilityMultiplier: 0.6, isDividendStock: true, categoryMultiplier: 1.2 },
  { id: 'save', symbol: 'SAVE', name: 'r/frugal', subreddit: 'Frugal', category: 'lifestyle', volatilityMultiplier: 0.5, isDividendStock: true, categoryMultiplier: 1.2 },
  { id: 'invst', symbol: 'INVST', name: 'r/investing', subreddit: 'investing', category: 'lifestyle', volatilityMultiplier: 0.7, isDividendStock: true, categoryMultiplier: 1.2 },
  { id: 'fire', symbol: 'FIRE', name: 'r/fire', subreddit: 'Fire', category: 'lifestyle', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.2 },
  { id: 'biz', symbol: 'BIZ', name: 'r/entrepreneur', subreddit: 'Entrepreneur', category: 'lifestyle', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.2 },

  // Sports Sector  
  { id: 'nfl', symbol: 'NFL', name: 'r/nfl', subreddit: 'nfl', category: 'sports', volatilityMultiplier: 1.4, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'nba', symbol: 'NBA', name: 'r/nba', subreddit: 'nba', category: 'sports', volatilityMultiplier: 1.5, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'socc', symbol: 'SOCC', name: 'r/soccer', subreddit: 'soccer', category: 'sports', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'mlb', symbol: 'MLB', name: 'r/baseball', subreddit: 'baseball', category: 'sports', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'nhl', symbol: 'NHL', name: 'r/hockey', subreddit: 'hockey', category: 'sports', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'mma', symbol: 'MMA', name: 'r/mma', subreddit: 'MMA', category: 'sports', volatilityMultiplier: 1.6, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'f1', symbol: 'F1', name: 'r/formula1', subreddit: 'formula1', category: 'sports', volatilityMultiplier: 1.4, isDividendStock: false, categoryMultiplier: 1.3 },
  { id: 'olym', symbol: 'OLYM', name: 'r/olympics', subreddit: 'olympics', category: 'sports', volatilityMultiplier: 2.0, isDividendStock: false, categoryMultiplier: 1.3 },

  // Creative Communities
  { id: 'art', symbol: 'ART', name: 'r/art', subreddit: 'Art', category: 'creative', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'foto', symbol: 'FOTO', name: 'r/photography', subreddit: 'photography', category: 'creative', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'diy', symbol: 'DIY', name: 'r/diy', subreddit: 'DIY', category: 'creative', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'cook', symbol: 'COOK', name: 'r/cooking', subreddit: 'Cooking', category: 'creative', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'wood', symbol: 'WOOD', name: 'r/woodworking', subreddit: 'woodworking', category: 'creative', volatilityMultiplier: 0.5, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: '3dp', symbol: '3DP', name: 'r/3dprinting', subreddit: '3Dprinting', category: 'creative', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'craft', symbol: 'CRAFT', name: 'r/crafts', subreddit: 'crafts', category: 'creative', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 1.4 },
  { id: 'dsgn', symbol: 'DSGN', name: 'r/design', subreddit: 'Design', category: 'creative', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.4 },

  // Science & Education
  { id: 'sci', symbol: 'SCI', name: 'r/science', subreddit: 'science', category: 'science', volatilityMultiplier: 0.7, isDividendStock: true, categoryMultiplier: 2.5 },
  { id: 'asci', symbol: 'ASCI', name: 'r/askscience', subreddit: 'askscience', category: 'science', volatilityMultiplier: 0.6, isDividendStock: true, categoryMultiplier: 2.5 },
  { id: 'spce', symbol: 'SPCE', name: 'r/space', subreddit: 'space', category: 'science', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 2.5 },
  { id: 'phys', symbol: 'PHYS', name: 'r/physics', subreddit: 'Physics', category: 'science', volatilityMultiplier: 0.5, isDividendStock: true, categoryMultiplier: 2.5 },
  { id: 'chem', symbol: 'CHEM', name: 'r/chemistry', subreddit: 'chemistry', category: 'science', volatilityMultiplier: 0.6, isDividendStock: true, categoryMultiplier: 2.5 },
  { id: 'bio', symbol: 'BIO', name: 'r/biology', subreddit: 'biology', category: 'science', volatilityMultiplier: 0.7, isDividendStock: true, categoryMultiplier: 2.5 },
  { id: 'med', symbol: 'MED', name: 'r/medicine', subreddit: 'medicine', category: 'science', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 2.5 },
  { id: 'eng', symbol: 'ENG', name: 'r/engineering', subreddit: 'engineering', category: 'science', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 2.5 },

  // Niche/Specialty
  { id: 'keys', symbol: 'KEYS', name: 'r/mechanicalkeyboards', subreddit: 'MechanicalKeyboards', category: 'niche', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'plnt', symbol: 'PLNT', name: 'r/houseplants', subreddit: 'houseplants', category: 'niche', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'coff', symbol: 'COFF', name: 'r/coffee', subreddit: 'Coffee', category: 'niche', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'whsk', symbol: 'WHSK', name: 'r/whiskey', subreddit: 'whiskey', category: 'niche', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'wtch', symbol: 'WTCH', name: 'r/watches', subreddit: 'Watches', category: 'niche', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'cars', symbol: 'CARS', name: 'r/cars', subreddit: 'cars', category: 'niche', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'moto', symbol: 'MOTO', name: 'r/motorcycles', subreddit: 'motorcycles', category: 'niche', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'camp', symbol: 'CAMP', name: 'r/camping', subreddit: 'camping', category: 'niche', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 1.5 },

  // Additional Popular Subreddits to reach 100
  { id: 'iama', symbol: 'IAMA', name: 'r/iama', subreddit: 'IAmA', category: 'blue-chip', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'mildly', symbol: 'MILDLY', name: 'r/mildlyinteresting', subreddit: 'mildlyinteresting', category: 'blue-chip', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'shower', symbol: 'SHOWER', name: 'r/showerthoughts', subreddit: 'Showerthoughts', category: 'blue-chip', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'oddly', symbol: 'ODDLY', name: 'r/oddlysatisfying', subreddit: 'oddlysatisfying', category: 'entertainment', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'nextf', symbol: 'NEXTF', name: 'r/nextfuckinglevel', subreddit: 'nextfuckinglevel', category: 'entertainment', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'damnint', symbol: 'DAMNINT', name: 'r/damnthatsinteresting', subreddit: 'Damnthatsinteresting', category: 'entertainment', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'nature', symbol: 'NATURE', name: 'r/natureisfuckinglit', subreddit: 'NatureIsFuckingLit', category: 'creative', volatilityMultiplier: 0.8, isDividendStock: true, categoryMultiplier: 1.4 },
  { id: 'earthp', symbol: 'EARTHP', name: 'r/earthporn', subreddit: 'EarthPorn', category: 'creative', volatilityMultiplier: 0.6, isDividendStock: true, categoryMultiplier: 1.4 },
  { id: 'inter', symbol: 'INTER', name: 'r/interestingasfuck', subreddit: 'interestingasfuck', category: 'entertainment', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'unexp', symbol: 'UNEXP', name: 'r/unexpected', subreddit: 'Unexpected', category: 'entertainment', volatilityMultiplier: 1.2, isDividendStock: false, categoryMultiplier: 1.5 },

  // Crypto & Finance specific
  { id: 'btc', symbol: 'BTC', name: 'r/bitcoin', subreddit: 'Bitcoin', category: 'meme', volatilityMultiplier: 2.2, isDividendStock: false, categoryMultiplier: 0.5 },
  { id: 'eth', symbol: 'ETH', name: 'r/ethereum', subreddit: 'ethereum', category: 'tech-growth', volatilityMultiplier: 2.0, isDividendStock: false, categoryMultiplier: 3.0 },
  { id: 'stocks', symbol: 'STOCKS', name: 'r/stocks', subreddit: 'stocks', category: 'lifestyle', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.2 },

  // More gaming
  { id: 'pcgame', symbol: 'PCGAME', name: 'r/pcgaming', subreddit: 'pcgaming', category: 'entertainment', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'games', symbol: 'GAMES', name: 'r/games', subreddit: 'Games', category: 'entertainment', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.5 },

  // Additional lifestyle
  { id: 'rela', symbol: 'RELA', name: 'r/relationship_advice', subreddit: 'relationship_advice', category: 'lifestyle', volatilityMultiplier: 1.3, isDividendStock: false, categoryMultiplier: 1.2 },
  { id: 'legal', symbol: 'LEGAL', name: 'r/legaladvice', subreddit: 'legaladvice', category: 'lifestyle', volatilityMultiplier: 1.1, isDividendStock: false, categoryMultiplier: 1.2 },

  // Regional/Country subreddits
  { id: 'usa', symbol: 'USA', name: 'r/usa', subreddit: 'usa', category: 'blue-chip', volatilityMultiplier: 0.8, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'canada', symbol: 'CANADA', name: 'r/canada', subreddit: 'canada', category: 'blue-chip', volatilityMultiplier: 0.7, isDividendStock: false, categoryMultiplier: 2.0 },
  { id: 'europe', symbol: 'EUROPE', name: 'r/europe', subreddit: 'europe', category: 'blue-chip', volatilityMultiplier: 0.6, isDividendStock: false, categoryMultiplier: 2.0 },

  // More niche communities
  { id: 'audioph', symbol: 'AUDIOPH', name: 'r/audiophile', subreddit: 'audiophile', category: 'niche', volatilityMultiplier: 1.0, isDividendStock: false, categoryMultiplier: 1.5 },
  { id: 'hifi', symbol: 'HIFI', name: 'r/headphones', subreddit: 'headphones', category: 'niche', volatilityMultiplier: 0.9, isDividendStock: false, categoryMultiplier: 1.5 },
];

export const getStockBySubreddit = (subreddit: string): StockDefinition | undefined => {
  return STOCK_UNIVERSE.find(stock => stock.subreddit.toLowerCase() === subreddit.toLowerCase());
};

export const getStocksByCategory = (category: StockCategory): StockDefinition[] => {
  return STOCK_UNIVERSE.filter(stock => stock.category === category);
};