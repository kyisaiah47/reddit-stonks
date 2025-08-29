import { io, Socket } from 'socket.io-client';
import { SubredditStock, Portfolio, MarketDataResponse } from '../../shared/types/api';

export interface MarketEvent {
  type: 'drama' | 'ama' | 'admin-action' | 'viral' | 'news';
  subredditId: string;
  title: string;
  impact: number;
  timestamp: string;
}

export interface PriceUpdate {
  stockId: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

export interface TradeExecuted {
  stockId: string;
  symbol: string;
  price: number;
  shares: number;
  type: 'buy' | 'sell';
  timestamp: string;
}

export interface SystemAlert {
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private subscriptions: Set<string> = new Set();

  constructor(private userId: string) {
    this.connect();
    this.setupHeartbeat();
  }

  private connect(): void {
    try {
      const serverUrl = process.env.NODE_ENV === 'development' ? 
        'http://localhost:3000' : 
        window.location.origin;

      this.socket = io(serverUrl, {
        query: { userId: this.userId },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupEventHandlers();
      console.log('📡 WebSocket client connecting...');

    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Re-subscribe to any previous subscriptions
      if (this.subscriptions.size > 0) {
        this.socket?.emit('subscribe', { 
          stockIds: Array.from(this.subscriptions),
          channels: ['all_trades', 'market_events']
        });
      }

      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
      
      if (reason === 'io server disconnect') {
        // Server-side disconnect, try to reconnect
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
      this.scheduleReconnect();
    });

    // Market data updates
    this.socket.on('market_data', (data: MarketDataResponse) => {
      this.emit('marketData', data);
    });

    // Individual price updates
    this.socket.on('price_update', (data: PriceUpdate) => {
      this.emit('priceUpdate', data);
    });

    // Trade executions
    this.socket.on('trade_executed', (data: TradeExecuted) => {
      this.emit('tradeExecuted', data);
    });

    // Portfolio updates
    this.socket.on('portfolio_update', (data: Portfolio) => {
      this.emit('portfolioUpdate', data);
    });

    // Market events
    this.socket.on('market_event', (data: MarketEvent) => {
      this.emit('marketEvent', data);
    });

    // Order book updates
    this.socket.on('order_book_update', (data: any) => {
      this.emit('orderBookUpdate', data);
    });

    // Recent trades
    this.socket.on('recent_trades', (data: any) => {
      this.emit('recentTrades', data);
    });

    // System alerts
    this.socket.on('system_alert', (data: SystemAlert) => {
      this.emit('systemAlert', data);
    });
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect();
      }
    }, delay);
  }

  // Subscription management
  public subscribeToStock(stockId: string): void {
    this.subscriptions.add(stockId);
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { stockIds: [stockId] });
    }
  }

  public unsubscribeFromStock(stockId: string): void {
    this.subscriptions.delete(stockId);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { stockIds: [stockId] });
    }
  }

  public subscribeToChannel(channel: string): void {
    this.subscriptions.add(channel);
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channels: [channel] });
    }
  }

  public unsubscribeFromChannel(channel: string): void {
    this.subscriptions.delete(channel);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { channels: [channel] });
    }
  }

  // Data requests
  public requestPortfolio(): void {
    if (this.socket?.connected) {
      this.socket.emit('get_portfolio');
    }
  }

  public requestOrderBook(stockId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('get_order_book', stockId);
    }
  }

  public requestRecentTrades(stockId?: string, limit?: number): void {
    if (this.socket?.connected) {
      this.socket.emit('get_recent_trades', { stockId, limit });
    }
  }

  // Event listener management
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) return;
    
    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.subscriptions.clear();
  }

  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Singleton pattern for WebSocket client
let webSocketClient: WebSocketClient | null = null;

export function initializeWebSocketClient(userId: string): WebSocketClient {
  if (webSocketClient) {
    webSocketClient.disconnect();
  }
  
  webSocketClient = new WebSocketClient(userId);
  return webSocketClient;
}

export function getWebSocketClient(): WebSocketClient | null {
  return webSocketClient;
}

export { WebSocketClient };