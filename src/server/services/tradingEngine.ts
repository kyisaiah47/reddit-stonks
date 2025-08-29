import { TradeRequest, TradeResponse, Portfolio, Holding, SubredditStock } from '../../shared/types/api';
import { STOCK_UNIVERSE, getStockBySubreddit } from '../data/stockUniverse';
import { marketDataService } from './marketDataService';

export interface Order {
  id: string;
  userId: string;
  stockId: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  shares: number;
  price?: number; // For limit orders
  status: 'pending' | 'filled' | 'cancelled' | 'partial';
  filledShares: number;
  avgFillPrice: number;
  timestamp: Date;
  expiresAt?: Date;
}

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  stockId: string;
  shares: number;
  price: number;
  timestamp: Date;
  buyUserId: string;
  sellUserId: string;
}

export interface OrderBookEntry {
  orderId: string;
  userId: string;
  shares: number;
  price: number;
  timestamp: Date;
}

export interface OrderBook {
  stockId: string;
  bids: OrderBookEntry[]; // Buy orders, sorted by price desc
  asks: OrderBookEntry[]; // Sell orders, sorted by price asc
  lastTrade?: { price: number; shares: number; timestamp: Date };
}

export class TradingEngine {
  private orders: Map<string, Order> = new Map();
  private orderBooks: Map<string, OrderBook> = new Map();
  private trades: Trade[] = [];
  private portfolios: Map<string, Portfolio> = new Map();
  private lastOrderId = 0;
  private lastTradeId = 0;

  constructor() {
    this.initializeOrderBooks();
  }

  private initializeOrderBooks(): void {
    // Initialize order books for all stocks
    STOCK_UNIVERSE.forEach(stock => {
      this.orderBooks.set(stock.id, {
        stockId: stock.id,
        bids: [],
        asks: []
      });
    });
  }

  private generateOrderId(): string {
    return `order-${++this.lastOrderId}-${Date.now()}`;
  }

  private generateTradeId(): string {
    return `trade-${++this.lastTradeId}-${Date.now()}`;
  }

  public async submitOrder(userId: string, request: TradeRequest): Promise<TradeResponse> {
    try {
      // Validate the request
      const stock = marketDataService.getStock(request.stockId);
      if (!stock) {
        return {
          success: false,
          message: `Stock ${request.stockId} not found`
        };
      }

      if (request.shares <= 0) {
        return {
          success: false,
          message: 'Shares must be positive'
        };
      }

      // Get or create user portfolio
      let portfolio = this.portfolios.get(userId);
      if (!portfolio) {
        portfolio = this.createEmptyPortfolio(userId);
        this.portfolios.set(userId, portfolio);
      }

      // Validate the trade
      const validation = this.validateTrade(portfolio, stock, request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message!
        };
      }

      // Create the order
      const order: Order = {
        id: this.generateOrderId(),
        userId,
        stockId: request.stockId,
        type: request.type,
        orderType: request.orderType,
        shares: request.shares,
        price: request.limitPrice,
        status: 'pending',
        filledShares: 0,
        avgFillPrice: 0,
        timestamp: new Date(),
        expiresAt: request.orderType === 'limit' ? 
          new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined // Limit orders expire in 24 hours
      };

      this.orders.set(order.id, order);

      // Process the order
      const execution = await this.processOrder(order, stock);

      // Update portfolio
      const updatedPortfolio = this.updatePortfolioFromExecution(portfolio, execution, stock);
      this.portfolios.set(userId, updatedPortfolio);

      return {
        success: true,
        message: execution.status === 'filled' ? 
          `Order filled: ${execution.filledShares} shares at $${execution.avgFillPrice.toFixed(2)}` :
          execution.status === 'partial' ?
            `Partially filled: ${execution.filledShares}/${order.shares} shares at $${execution.avgFillPrice.toFixed(2)}` :
            'Order placed successfully',
        trade: execution.status === 'filled' || execution.status === 'partial' ? {
          id: execution.trades[0]?.id || order.id,
          stockId: request.stockId,
          symbol: stock.symbol,
          type: request.type,
          shares: execution.filledShares,
          price: execution.avgFillPrice,
          total: execution.filledShares * execution.avgFillPrice,
          timestamp: new Date().toISOString()
        } : undefined,
        updatedPortfolio
      };

    } catch (error) {
      console.error('Error processing trade:', error);
      return {
        success: false,
        message: 'Internal server error processing trade'
      };
    }
  }

  private validateTrade(portfolio: Portfolio, stock: SubredditStock, request: TradeRequest): { valid: boolean; message?: string } {
    if (request.type === 'buy') {
      const cost = request.orderType === 'market' ? 
        stock.price * request.shares :
        (request.limitPrice || stock.price) * request.shares;
        
      if (portfolio.cash < cost) {
        return {
          valid: false,
          message: `Insufficient funds. Need $${cost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`
        };
      }
    } else { // sell
      const holding = portfolio.holdings.find(h => h.stockId === request.stockId);
      if (!holding || holding.shares < request.shares) {
        return {
          valid: false,
          message: `Insufficient shares. Need ${request.shares}, have ${holding?.shares || 0}`
        };
      }
    }

    if (request.orderType === 'limit' && !request.limitPrice) {
      return {
        valid: false,
        message: 'Limit price required for limit orders'
      };
    }

    return { valid: true };
  }

  private async processOrder(order: Order, stock: SubredditStock): Promise<{
    status: 'filled' | 'partial' | 'pending';
    filledShares: number;
    avgFillPrice: number;
    trades: Trade[];
  }> {
    const orderBook = this.orderBooks.get(order.stockId)!;
    const trades: Trade[] = [];
    let filledShares = 0;
    let totalCost = 0;

    if (order.orderType === 'market') {
      // Market orders execute immediately at current market price
      const executionPrice = this.calculateMarketPrice(order, stock, orderBook);
      const trade = this.createTrade(order, order.shares, executionPrice);
      trades.push(trade);
      this.trades.push(trade);
      
      filledShares = order.shares;
      totalCost = order.shares * executionPrice;
      
      // Update order
      order.status = 'filled';
      order.filledShares = filledShares;
      order.avgFillPrice = executionPrice;

      // Add market impact to pricing
      marketDataService.addTradingImpact(
        order.stockId, 
        order.shares, 
        order.type
      );

    } else {
      // Limit orders go into the order book and may execute against existing orders
      const execution = this.matchLimitOrder(order, orderBook);
      
      filledShares = execution.filledShares;
      totalCost = execution.totalCost;
      trades.push(...execution.trades);
      
      if (filledShares === order.shares) {
        order.status = 'filled';
      } else if (filledShares > 0) {
        order.status = 'partial';
      } else {
        order.status = 'pending';
        this.addToOrderBook(order, orderBook);
      }
      
      order.filledShares = filledShares;
      order.avgFillPrice = filledShares > 0 ? totalCost / filledShares : 0;
    }

    return {
      status: order.status,
      filledShares,
      avgFillPrice: filledShares > 0 ? totalCost / filledShares : 0,
      trades
    };
  }

  private calculateMarketPrice(order: Order, stock: SubredditStock, orderBook: OrderBook): number {
    // For market orders, use current stock price with slight slippage based on order size
    let basePrice = stock.price;
    
    // Add slippage based on order size relative to daily volume
    const slippageRate = Math.min(0.02, order.shares / Math.max(stock.volume, 1000));
    const slippage = basePrice * slippageRate;
    
    // Buyers pay slightly more, sellers get slightly less
    return order.type === 'buy' ? 
      basePrice + slippage : 
      basePrice - slippage;
  }

  private matchLimitOrder(order: Order, orderBook: OrderBook): {
    filledShares: number;
    totalCost: number;
    trades: Trade[];
  } {
    const trades: Trade[] = [];
    let remainingShares = order.shares;
    let totalCost = 0;

    // Get opposing side of the order book
    const opposingOrders = order.type === 'buy' ? 
      [...orderBook.asks].sort((a, b) => a.price - b.price) : // Best asks first (lowest price)
      [...orderBook.bids].sort((a, b) => b.price - a.price);  // Best bids first (highest price)

    for (const bookEntry of opposingOrders) {
      if (remainingShares === 0) break;

      // Check if prices cross
      const canExecute = order.type === 'buy' ? 
        (order.price || 0) >= bookEntry.price :
        (order.price || Infinity) <= bookEntry.price;

      if (!canExecute) break;

      // Calculate execution
      const executionShares = Math.min(remainingShares, bookEntry.shares);
      const executionPrice = bookEntry.price; // Use the book price
      
      // Create trade
      const trade = this.createTradeFromBookEntry(order, bookEntry, executionShares, executionPrice);
      trades.push(trade);
      this.trades.push(trade);

      // Update tracking
      remainingShares -= executionShares;
      totalCost += executionShares * executionPrice;

      // Update or remove the book entry
      bookEntry.shares -= executionShares;
      if (bookEntry.shares === 0) {
        this.removeFromOrderBook(bookEntry.orderId, orderBook);
        // Update the original order
        const originalOrder = this.orders.get(bookEntry.orderId);
        if (originalOrder) {
          originalOrder.status = 'filled';
          originalOrder.filledShares += executionShares;
        }
      }

      // Add trading impact
      marketDataService.addTradingImpact(order.stockId, executionShares, order.type);
    }

    return {
      filledShares: order.shares - remainingShares,
      totalCost,
      trades
    };
  }

  private addToOrderBook(order: Order, orderBook: OrderBook): void {
    const bookEntry: OrderBookEntry = {
      orderId: order.id,
      userId: order.userId,
      shares: order.shares - order.filledShares,
      price: order.price!,
      timestamp: order.timestamp
    };

    if (order.type === 'buy') {
      orderBook.bids.push(bookEntry);
      orderBook.bids.sort((a, b) => b.price - a.price); // Highest first
    } else {
      orderBook.asks.push(bookEntry);
      orderBook.asks.sort((a, b) => a.price - b.price); // Lowest first
    }
  }

  private removeFromOrderBook(orderId: string, orderBook: OrderBook): void {
    orderBook.bids = orderBook.bids.filter(entry => entry.orderId !== orderId);
    orderBook.asks = orderBook.asks.filter(entry => entry.orderId !== orderId);
  }

  private createTrade(order: Order, shares: number, price: number): Trade {
    return {
      id: this.generateTradeId(),
      buyOrderId: order.type === 'buy' ? order.id : 'market',
      sellOrderId: order.type === 'sell' ? order.id : 'market',
      stockId: order.stockId,
      shares,
      price,
      timestamp: new Date(),
      buyUserId: order.type === 'buy' ? order.userId : 'market',
      sellUserId: order.type === 'sell' ? order.userId : 'market'
    };
  }

  private createTradeFromBookEntry(order: Order, bookEntry: OrderBookEntry, shares: number, price: number): Trade {
    return {
      id: this.generateTradeId(),
      buyOrderId: order.type === 'buy' ? order.id : bookEntry.orderId,
      sellOrderId: order.type === 'sell' ? order.id : bookEntry.orderId,
      stockId: order.stockId,
      shares,
      price,
      timestamp: new Date(),
      buyUserId: order.type === 'buy' ? order.userId : bookEntry.userId,
      sellUserId: order.type === 'sell' ? order.userId : bookEntry.userId
    };
  }

  private updatePortfolioFromExecution(
    portfolio: Portfolio, 
    execution: any, 
    stock: SubredditStock
  ): Portfolio {
    const updatedPortfolio = { ...portfolio };
    
    if (execution.filledShares > 0) {
      const totalCost = execution.filledShares * execution.avgFillPrice;
      
      if (execution.trades[0]?.buyUserId === portfolio.userId) {
        // Buy transaction
        updatedPortfolio.cash -= totalCost;
        
        const existingHolding = updatedPortfolio.holdings.find(h => h.stockId === stock.id);
        if (existingHolding) {
          // Update existing holding
          const totalShares = existingHolding.shares + execution.filledShares;
          const totalValue = (existingHolding.shares * existingHolding.avgPrice) + totalCost;
          existingHolding.avgPrice = totalValue / totalShares;
          existingHolding.shares = totalShares;
          existingHolding.currentPrice = stock.price;
          existingHolding.value = totalShares * stock.price;
          existingHolding.unrealizedPnL = existingHolding.value - (totalShares * existingHolding.avgPrice);
          existingHolding.unrealizedPnLPercent = (existingHolding.unrealizedPnL / (totalShares * existingHolding.avgPrice)) * 100;
        } else {
          // Create new holding
          const holding: Holding = {
            stockId: stock.id,
            symbol: stock.symbol,
            shares: execution.filledShares,
            avgPrice: execution.avgFillPrice,
            currentPrice: stock.price,
            value: execution.filledShares * stock.price,
            unrealizedPnL: execution.filledShares * (stock.price - execution.avgFillPrice),
            unrealizedPnLPercent: ((stock.price - execution.avgFillPrice) / execution.avgFillPrice) * 100
          };
          updatedPortfolio.holdings.push(holding);
        }
      } else {
        // Sell transaction
        updatedPortfolio.cash += totalCost;
        
        const holding = updatedPortfolio.holdings.find(h => h.stockId === stock.id);
        if (holding) {
          holding.shares -= execution.filledShares;
          if (holding.shares === 0) {
            updatedPortfolio.holdings = updatedPortfolio.holdings.filter(h => h.stockId !== stock.id);
          } else {
            holding.value = holding.shares * stock.price;
            holding.unrealizedPnL = holding.value - (holding.shares * holding.avgPrice);
            holding.unrealizedPnLPercent = (holding.unrealizedPnL / (holding.shares * holding.avgPrice)) * 100;
          }
        }
      }
    }

    // Recalculate portfolio totals
    updatedPortfolio.totalValue = updatedPortfolio.cash + 
      updatedPortfolio.holdings.reduce((sum, holding) => sum + holding.value, 0);
    
    const initialValue = 100000; // Starting cash
    updatedPortfolio.totalReturn = updatedPortfolio.totalValue - initialValue;
    updatedPortfolio.totalReturnPercent = (updatedPortfolio.totalReturn / initialValue) * 100;

    return updatedPortfolio;
  }

  private createEmptyPortfolio(userId: string): Portfolio {
    return {
      userId,
      totalValue: 100000, // Start with $100k
      cash: 100000,
      holdings: [],
      totalReturn: 0,
      totalReturnPercent: 0,
      dividendIncome: 0,
      riskScore: 0,
      diversificationScore: 0,
      sectorAllocations: {
        'meme': 0,
        'blue-chip': 0,
        'tech-growth': 0,
        'entertainment': 0,
        'lifestyle': 0,
        'sports': 0,
        'creative': 0,
        'science': 0,
        'niche': 0
      }
    };
  }

  public getPortfolio(userId: string): Portfolio | undefined {
    const portfolio = this.portfolios.get(userId);
    if (portfolio) {
      // Update current prices and recalculate
      return this.updatePortfolioValues(portfolio);
    }
    return undefined;
  }

  private updatePortfolioValues(portfolio: Portfolio): Portfolio {
    const updated = { ...portfolio };
    
    // Update holding values with current prices
    updated.holdings = updated.holdings.map(holding => {
      const stock = marketDataService.getStock(holding.stockId);
      if (stock) {
        const updatedHolding = { ...holding };
        updatedHolding.currentPrice = stock.price;
        updatedHolding.value = holding.shares * stock.price;
        updatedHolding.unrealizedPnL = updatedHolding.value - (holding.shares * holding.avgPrice);
        updatedHolding.unrealizedPnLPercent = (updatedHolding.unrealizedPnL / (holding.shares * holding.avgPrice)) * 100;
        return updatedHolding;
      }
      return holding;
    });

    // Recalculate totals
    updated.totalValue = updated.cash + updated.holdings.reduce((sum, holding) => sum + holding.value, 0);
    
    const initialValue = 100000;
    updated.totalReturn = updated.totalValue - initialValue;
    updated.totalReturnPercent = (updated.totalReturn / initialValue) * 100;

    // Calculate sector allocations
    const totalHoldingValue = updated.holdings.reduce((sum, holding) => sum + holding.value, 0);
    Object.keys(updated.sectorAllocations).forEach(sector => {
      updated.sectorAllocations[sector as keyof typeof updated.sectorAllocations] = 0;
    });

    updated.holdings.forEach(holding => {
      const stock = marketDataService.getStock(holding.stockId);
      if (stock && totalHoldingValue > 0) {
        const allocation = (holding.value / totalHoldingValue) * 100;
        updated.sectorAllocations[stock.category] += allocation;
      }
    });

    return updated;
  }

  public getOrderBook(stockId: string): OrderBook | undefined {
    return this.orderBooks.get(stockId);
  }

  public getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getRecentTrades(stockId?: string, limit: number = 50): Trade[] {
    let trades = [...this.trades];
    if (stockId) {
      trades = trades.filter(trade => trade.stockId === stockId);
    }
    return trades
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public cancelOrder(userId: string, orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order || order.userId !== userId || order.status !== 'pending') {
      return false;
    }

    order.status = 'cancelled';
    
    // Remove from order book
    const orderBook = this.orderBooks.get(order.stockId);
    if (orderBook) {
      this.removeFromOrderBook(orderId, orderBook);
    }

    return true;
  }

  public getSystemStatus() {
    return {
      totalOrders: this.orders.size,
      totalTrades: this.trades.length,
      activePortfolios: this.portfolios.size,
      orderBooks: Array.from(this.orderBooks.entries()).map(([stockId, book]) => ({
        stockId,
        bidCount: book.bids.length,
        askCount: book.asks.length,
        spread: book.asks.length > 0 && book.bids.length > 0 ? 
          book.asks[0].price - book.bids[0].price : null
      }))
    };
  }
}

export const tradingEngine = new TradingEngine();