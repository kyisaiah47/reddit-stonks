import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { MarketDataResponse, SubredditStock, Portfolio } from '../../shared/types/api';
import { marketDataService } from './marketDataService';
import { tradingEngine } from './tradingEngine';

export interface ClientData {
  userId: string;
  subscriptions: Set<string>; // Stock IDs or channels they're subscribed to
  lastHeartbeat: number;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'heartbeat' | 'market_data' | 'portfolio_update' | 'trade_executed' | 'price_update';
  payload?: any;
  timestamp: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private clients: Map<string, ClientData> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Configure this based on your needs
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
    this.startPriceUpdates();
    this.startHeartbeatCheck();

    console.log('📡 WebSocket service initialized');
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Initialize client data
      this.clients.set(socket.id, {
        userId: socket.handshake.query.userId as string || `user-${socket.id}`,
        subscriptions: new Set(),
        lastHeartbeat: Date.now()
      });

      // Send initial market data
      this.sendMarketData(socket.id);

      // Handle subscription to specific stocks or channels
      socket.on('subscribe', (data: { stockIds?: string[]; channels?: string[] }) => {
        const client = this.clients.get(socket.id);
        if (client) {
          if (data.stockIds) {
            data.stockIds.forEach(stockId => client.subscriptions.add(stockId));
          }
          if (data.channels) {
            data.channels.forEach(channel => client.subscriptions.add(channel));
          }
          console.log(`📊 Client ${socket.id} subscribed to:`, Array.from(client.subscriptions));
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe', (data: { stockIds?: string[]; channels?: string[] }) => {
        const client = this.clients.get(socket.id);
        if (client) {
          if (data.stockIds) {
            data.stockIds.forEach(stockId => client.subscriptions.delete(stockId));
          }
          if (data.channels) {
            data.channels.forEach(channel => client.subscriptions.delete(channel));
          }
        }
      });

      // Handle heartbeat
      socket.on('heartbeat', () => {
        const client = this.clients.get(socket.id);
        if (client) {
          client.lastHeartbeat = Date.now();
        }
      });

      // Handle portfolio requests
      socket.on('get_portfolio', () => {
        const client = this.clients.get(socket.id);
        if (client) {
          const portfolio = tradingEngine.getPortfolio(client.userId);
          if (portfolio) {
            socket.emit('portfolio_update', portfolio);
          }
        }
      });

      // Handle order book requests
      socket.on('get_order_book', (stockId: string) => {
        const orderBook = tradingEngine.getOrderBook(stockId);
        if (orderBook) {
          socket.emit('order_book_update', orderBook);
        }
      });

      // Handle recent trades requests
      socket.on('get_recent_trades', (data: { stockId?: string; limit?: number }) => {
        const trades = tradingEngine.getRecentTrades(data.stockId, data.limit || 50);
        socket.emit('recent_trades', trades);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        this.clients.delete(socket.id);
      });
    });
  }

  private async sendMarketData(socketId?: string): Promise<void> {
    try {
      const marketData = await marketDataService.getMarketData();
      
      if (socketId) {
        // Send to specific client
        this.io.to(socketId).emit('market_data', marketData);
      } else {
        // Broadcast to all clients
        this.io.emit('market_data', marketData);
      }
    } catch (error) {
      console.error('Error sending market data:', error);
    }
  }

  private startPriceUpdates(): void {
    // Send price updates every 10 seconds (more frequent than the backend updates)
    this.priceUpdateInterval = setInterval(async () => {
      await this.sendMarketData();
      
      // Send targeted updates to subscribed clients
      this.sendTargetedUpdates();
    }, 10000);

    console.log('📈 Started real-time price updates');
  }

  private sendTargetedUpdates(): void {
    // Group clients by their subscriptions and send relevant updates
    const stockSubscriptions = new Map<string, string[]>(); // stockId -> socketIds[]
    
    this.clients.forEach((client, socketId) => {
      client.subscriptions.forEach(subscription => {
        if (!stockSubscriptions.has(subscription)) {
          stockSubscriptions.set(subscription, []);
        }
        stockSubscriptions.get(subscription)!.push(socketId);
      });
    });

    // Send stock-specific updates
    stockSubscriptions.forEach((socketIds, stockId) => {
      const stock = marketDataService.getStock(stockId);
      if (stock) {
        socketIds.forEach(socketId => {
          this.io.to(socketId).emit('price_update', {
            stockId,
            price: stock.price,
            change: stock.change,
            volume: stock.volume,
            timestamp: new Date().toISOString()
          });
        });
      }
    });
  }

  private startHeartbeatCheck(): void {
    // Check for inactive clients every minute
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeoutMs = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach((client, socketId) => {
        if (now - client.lastHeartbeat > timeoutMs) {
          console.log(`💔 Client ${socketId} timed out, disconnecting`);
          this.io.to(socketId).disconnect(true);
          this.clients.delete(socketId);
        }
      });
    }, 60000);
  }

  public broadcastTradeExecution(trade: {
    stockId: string;
    symbol: string;
    price: number;
    shares: number;
    type: 'buy' | 'sell';
    timestamp: string;
  }): void {
    // Broadcast to all clients interested in this stock
    this.clients.forEach((client, socketId) => {
      if (client.subscriptions.has(trade.stockId) || client.subscriptions.has('all_trades')) {
        this.io.to(socketId).emit('trade_executed', trade);
      }
    });
  }

  public broadcastMarketEvent(event: {
    type: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news';
    subredditId: string;
    title: string;
    impact: number;
    timestamp: string;
  }): void {
    // Broadcast significant market events to all clients
    this.io.emit('market_event', event);
  }

  public sendPortfolioUpdate(userId: string, portfolio: Portfolio): void {
    // Find all sockets for this user and send portfolio update
    this.clients.forEach((client, socketId) => {
      if (client.userId === userId) {
        this.io.to(socketId).emit('portfolio_update', portfolio);
      }
    });
  }

  public broadcastSystemAlert(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('system_alert', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectionStats(): {
    totalConnections: number;
    clientsByUserId: { [userId: string]: number };
    subscriptions: { [subscription: string]: number };
  } {
    const clientsByUserId: { [userId: string]: number } = {};
    const subscriptions: { [subscription: string]: number } = {};

    this.clients.forEach(client => {
      // Count clients by user
      clientsByUserId[client.userId] = (clientsByUserId[client.userId] || 0) + 1;

      // Count subscriptions
      client.subscriptions.forEach(subscription => {
        subscriptions[subscription] = (subscriptions[subscription] || 0) + 1;
      });
    });

    return {
      totalConnections: this.clients.size,
      clientsByUserId,
      subscriptions
    };
  }

  public sendCustomMessage(socketId: string, event: string, data: any): boolean {
    const client = this.clients.get(socketId);
    if (client) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public broadcastToSubscribers(stockId: string, event: string, data: any): void {
    this.clients.forEach((client, socketId) => {
      if (client.subscriptions.has(stockId)) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }

  public stop(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.io.close();
    console.log('📡 WebSocket service stopped');
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function initializeWebSocketService(server: HttpServer): WebSocketService {
  if (webSocketService) {
    console.warn('WebSocket service already initialized');
    return webSocketService;
  }
  
  webSocketService = new WebSocketService(server);
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}

export { webSocketService };