import { SubredditStock, StockCategory } from '../../shared/types/api';
import { STOCK_UNIVERSE, StockDefinition } from '../data/stockUniverse';
import { marketDataService } from './marketDataService';

export interface SearchFilters {
  query?: string;
  category?: StockCategory;
  priceMin?: number;
  priceMax?: number;
  changeMin?: number;
  changeMax?: number;
  volumeMin?: number;
  isDividendStock?: boolean;
  sortBy?: 'symbol' | 'name' | 'price' | 'change' | 'volume' | 'marketCap';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface SearchResult {
  stocks: SubredditStock[];
  totalCount: number;
  filters: SearchFilters;
  suggestions?: string[];
}

export class StockSearchService {
  private stockDefinitions: Map<string, StockDefinition> = new Map();

  constructor() {
    // Index all stock definitions for fast lookup
    STOCK_UNIVERSE.forEach(stock => {
      this.stockDefinitions.set(stock.id, stock);
    });
  }

  public searchStocks(filters: SearchFilters = {}): SearchResult {
    let stocks = marketDataService.getAllStocks();
    let suggestions: string[] = [];

    // Apply query filter (search by symbol, name, or subreddit)
    if (filters.query) {
      const query = filters.query.toLowerCase().trim();
      const filtered = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query) ||
        stock.id.toLowerCase().includes(query)
      );

      // If no exact matches, provide suggestions
      if (filtered.length === 0) {
        suggestions = this.getSuggestions(query, stocks);
      }

      stocks = filtered;
    }

    // Apply category filter
    if (filters.category) {
      stocks = stocks.filter(stock => stock.category === filters.category);
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      stocks = stocks.filter(stock => stock.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      stocks = stocks.filter(stock => stock.price <= filters.priceMax!);
    }

    // Apply change filters
    if (filters.changeMin !== undefined) {
      stocks = stocks.filter(stock => stock.change >= filters.changeMin!);
    }
    if (filters.changeMax !== undefined) {
      stocks = stocks.filter(stock => stock.change <= filters.changeMax!);
    }

    // Apply volume filter
    if (filters.volumeMin !== undefined) {
      stocks = stocks.filter(stock => stock.volume >= filters.volumeMin!);
    }

    // Apply dividend stock filter
    if (filters.isDividendStock !== undefined) {
      stocks = stocks.filter(stock => stock.isDividendStock === filters.isDividendStock);
    }

    // Apply sorting
    if (filters.sortBy) {
      stocks.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (filters.sortBy) {
          case 'symbol':
            aVal = a.symbol;
            bVal = b.symbol;
            break;
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'price':
            aVal = a.price;
            bVal = b.price;
            break;
          case 'change':
            aVal = a.change;
            bVal = b.change;
            break;
          case 'volume':
            aVal = a.volume;
            bVal = b.volume;
            break;
          case 'marketCap':
            aVal = a.marketCap;
            bVal = b.marketCap;
            break;
          default:
            aVal = a.symbol;
            bVal = b.symbol;
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (filters.sortOrder === 'desc') {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Apply limit
    const totalCount = stocks.length;
    if (filters.limit && filters.limit > 0) {
      stocks = stocks.slice(0, filters.limit);
    }

    return {
      stocks,
      totalCount,
      filters,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  private getSuggestions(query: string, allStocks: SubredditStock[]): string[] {
    const suggestions: Array<{text: string, score: number}> = [];

    allStocks.forEach(stock => {
      // Check symbol similarity
      if (this.getLevenshteinDistance(query, stock.symbol.toLowerCase()) <= 2) {
        suggestions.push({ text: stock.symbol, score: 1 });
      }

      // Check name similarity
      const nameWords = stock.name.toLowerCase().split(' ');
      nameWords.forEach(word => {
        if (word.includes(query) || this.getLevenshteinDistance(query, word) <= 1) {
          suggestions.push({ text: stock.symbol + ' (' + stock.name + ')', score: 0.8 });
        }
      });

      // Check subreddit name similarity
      const subredditName = stock.name.replace('r/', '').toLowerCase();
      if (subredditName.includes(query) || this.getLevenshteinDistance(query, subredditName) <= 2) {
        suggestions.push({ text: stock.symbol, score: 0.9 });
      }
    });

    // Sort by score and remove duplicates
    return [...new Set(suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.text)
    )];
  }

  private getLevenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  public getTopGainers(limit: number = 10): SubredditStock[] {
    return marketDataService.getAllStocks()
      .sort((a, b) => b.change - a.change)
      .slice(0, limit);
  }

  public getTopLosers(limit: number = 10): SubredditStock[] {
    return marketDataService.getAllStocks()
      .sort((a, b) => a.change - b.change)
      .slice(0, limit);
  }

  public getMostActive(limit: number = 10): SubredditStock[] {
    return marketDataService.getAllStocks()
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  public getMostVolatile(limit: number = 10): SubredditStock[] {
    return marketDataService.getAllStocks()
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);
  }

  public getStocksByCategory(category: StockCategory): SubredditStock[] {
    return marketDataService.getAllStocks()
      .filter(stock => stock.category === category)
      .sort((a, b) => b.marketCap - a.marketCap);
  }

  public getDividendStocks(): SubredditStock[] {
    return marketDataService.getAllStocks()
      .filter(stock => stock.isDividendStock)
      .sort((a, b) => b.price - a.price);
  }

  public searchSuggestions(query: string, limit: number = 10): string[] {
    if (!query || query.length < 1) return [];
    
    const allStocks = marketDataService.getAllStocks();
    const suggestions: Set<string> = new Set();

    const queryLower = query.toLowerCase();

    allStocks.forEach(stock => {
      // Exact symbol matches first
      if (stock.symbol.toLowerCase().startsWith(queryLower)) {
        suggestions.add(stock.symbol);
      }
      
      // Subreddit name matches
      const subredditName = stock.name.replace('r/', '').toLowerCase();
      if (subredditName.startsWith(queryLower)) {
        suggestions.add(stock.symbol);
      }

      // Partial matches in name
      if (stock.name.toLowerCase().includes(queryLower)) {
        suggestions.add(stock.symbol);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  public getMarketOverview(): {
    totalStocks: number;
    categories: Array<{
      category: StockCategory;
      count: number;
      avgChange: number;
      topStock: string;
    }>;
    marketCap: number;
    totalVolume: number;
  } {
    const allStocks = marketDataService.getAllStocks();
    const categoryStats = new Map<StockCategory, {
      count: number;
      totalChange: number;
      topStock: SubredditStock;
    }>();

    let totalMarketCap = 0;
    let totalVolume = 0;

    allStocks.forEach(stock => {
      totalMarketCap += stock.marketCap;
      totalVolume += stock.volume;

      if (!categoryStats.has(stock.category)) {
        categoryStats.set(stock.category, {
          count: 0,
          totalChange: 0,
          topStock: stock
        });
      }

      const stats = categoryStats.get(stock.category)!;
      stats.count++;
      stats.totalChange += stock.change;
      
      if (stock.marketCap > stats.topStock.marketCap) {
        stats.topStock = stock;
      }
    });

    const categories = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      avgChange: stats.totalChange / stats.count,
      topStock: stats.topStock.symbol
    }));

    return {
      totalStocks: allStocks.length,
      categories,
      marketCap: totalMarketCap,
      totalVolume
    };
  }
}

export const stockSearchService = new StockSearchService();