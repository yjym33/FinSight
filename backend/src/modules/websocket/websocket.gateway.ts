import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { News } from '../news/entities/news.entity';
import { KisService } from '../stocks/kis.service';
import { StocksService } from '../stocks/stocks.service';
import { AlertService } from '../notifications/alert.service';
import { Inject, forwardRef } from '@nestjs/common';

interface StockPrice {
  stockCode: string;
  stockName?: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  market?: string;
  timestamp: Date;
}

/**
 * 웹소켓 통신 게이트웨이 (WebsocketGateway)
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private stockSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private readonly kisService: KisService,
    private readonly stocksService: StocksService,
    @Inject(forwardRef(() => AlertService))
    private readonly alertService: AlertService,
  ) {}

  onModuleInit() {
    // Poll for prices every 5 seconds for active subscriptions
    setInterval(() => this.pollStockPrices(), 5000);
  }

  private isPolling = false;

  private async pollStockPrices() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const subscribedStocks = Array.from(this.stockSubscriptions.keys());
      if (subscribedStocks.length === 0) return;

      for (const stockCode of subscribedStocks) {
        // Use StocksService to get name-enriched price
        const priceData = await this.stocksService.getStockPriceWithDetail(stockCode);
        if (priceData) {
          this.broadcastStockPrice(priceData);
          // Check for alerts
          this.alertService.checkPriceAlerts(priceData).catch(err => 
            this.logger.error(`Alert check failed for ${stockCode}: ${err.message}`)
          );
        }
        // Wait 500ms between requests to avoid rate limits (KIS limit is usually 2 req/sec)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.isPolling = false;
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('user:subscribe')
  handleUserSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    this.logger.log(`Client ${client.id} joined user room: ${userId}`);
    client.join(`user:${userId}`);
    return { event: 'user:subscribed', data: userId };
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.stockSubscriptions.forEach((clients, stockCode) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.stockSubscriptions.delete(stockCode);
      }
    });
  }

  @SubscribeMessage('stock:subscribe')
  async handleStockSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() stockCode: string,
  ) {
    this.logger.log(`Client ${client.id} subscribed to ${stockCode}`);

    if (!this.stockSubscriptions.has(stockCode)) {
      this.stockSubscriptions.set(stockCode, new Set());
    }
    this.stockSubscriptions.get(stockCode)!.add(client.id);

    client.join(`stock:${stockCode}`);

    // Immediately fetch and send the current price with a small random delay to avoid rate limit spikes
    const delay = Math.floor(Math.random() * 1000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Use name-enriched price for initial subscription
    const initialPrice = await this.stocksService.getStockPriceWithDetail(stockCode);
    if (initialPrice) {
      client.emit('stock:price', initialPrice);
    }

    return { event: 'stock:subscribed', data: stockCode };
  }

  @SubscribeMessage('stock:unsubscribe')
  handleStockUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() stockCode: string,
  ) {
    this.logger.log(`Client ${client.id} unsubscribed from ${stockCode}`);

    this.stockSubscriptions.get(stockCode)?.delete(client.id);
    client.leave(`stock:${stockCode}`);

    return { event: 'stock:unsubscribed', data: stockCode };
  }

  broadcastStockPrice(stockPrice: StockPrice) {
    if (!this.server) return;
    this.server.to(`stock:${stockPrice.stockCode}`).emit('stock:price', stockPrice);
  }

  broadcastNews(news: News) {
    if (!this.server) return;
    this.server.emit('news:new', news);
  }
  
  broadcastComment(stockCode: string, comment: any) {
    if (!this.server) return;
    this.server.to(`stock:${stockCode}`).emit('stock:comment:new', comment);
  }

  sendToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot send to user ${userId}: server is not initialized`);
      return;
    }
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
