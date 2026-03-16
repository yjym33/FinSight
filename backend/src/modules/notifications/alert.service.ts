import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';
import { WatchlistService } from '../watchlist/watchlist.service';
import { UsersSettingsService } from '../users/users-settings.service';
import { UsersService } from '../users/users.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AnalysisService } from '../stocks/analysis.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  
  // To avoid spamming alerts, we keep track of when the last alert was sent for a user-stock pair
  // Key: userId:stockCode:type, Value: timestamp
  private lastAlertMap: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN = 1000 * 60 * 60; // 1 hour cooldown per stock

  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => WatchlistService))
    private readonly watchlistService: WatchlistService,
    @Inject(forwardRef(() => UsersSettingsService))
    private readonly userSettingsService: UsersSettingsService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
  ) {}

  async checkPriceAlerts(stockPrice: any) {
    const { stockCode, changePercent, price } = stockPrice;
    const absChange = Math.abs(changePercent);

    // 1. Find all users who have this stock in their watchlist
    const watchlistEntries = await this.watchlistService.findByStockCode(stockCode);
    if (!watchlistEntries || watchlistEntries.length === 0) return;

    for (const entry of watchlistEntries) {
      const userId = entry.userId;
      
      // 2. Check user's alert settings
      const settings = await this.userSettingsService.findByUserId(userId);
      if (!settings) continue;

      // 3. Check if threshold is met
      if (absChange >= settings.alertThreshold) {
        const cooldownKey = `${userId}:${stockCode}:price`;
        const lastAlert = this.lastAlertMap.get(cooldownKey);
        
        if (!lastAlert || Date.now() - lastAlert > this.ALERT_COOLDOWN) {
          const isUp = changePercent >= 0;
          let title = isUp ? '📈 주가 급등 알림' : '📉 주가 급락 알림';
          let message = `${entry.stockName}(${stockCode})이(가) ${changePercent}% ${isUp ? '상승' : '하락'}했습니다! (현재가: ${price.toLocaleString()}원)`;
          let notificationType = NotificationType.PRICE_ALARM;

          // 4. If AI analysis is enabled, get the reason why it's changing
          if (settings.autoReportEnabled || settings.aiAlertEnabled) {
            try {
              const analysis = await this.analysisService.getStockAnalysis(stockCode, userId);
              if (analysis && analysis.reason) {
                title = isUp ? '🤖 AI 변동 분석 리포트' : '🤖 AI 변동 분석 리포트';
                message = `[${entry.stockName}] ${analysis.reason}\n(현재가: ${price.toLocaleString()}원, ${changePercent}%)`;
                notificationType = NotificationType.AI_REPORT;
              }
            } catch (err) {
              this.logger.warn(`AI Analysis failed for alert: ${err.message}`);
            }
          }

          this.logger.log(`Sending ${notificationType} to user ${userId} for ${stockCode}`);

          // A. Save to Database
          const notification = await this.notificationsService.create({
            userId,
            type: notificationType,
            title,
            message,
            stockCode,
            metadata: {
              changePercent,
              price,
              isUp,
            },
          });

          // B. Send via WebSocket
          // Use the helper method for safety
          this.websocketGateway.sendToUser(userId, 'notification:new', notification);
          
          // Update cooldown
          this.lastAlertMap.set(cooldownKey, Date.now());
        }
      }
    }
  }

  async handleNewNews(news: any) {
    this.logger.log(`Checking news alert for: ${news.title}`);
    
    // For now, let's notify all users about "Macro" news if it's significant
    // OR notify users if the news is related to a stock in their watchlist
    if (news.relatedStockCode) {
      const watchlistEntries = await this.watchlistService.findByStockCode(news.relatedStockCode);
      for (const entry of watchlistEntries) {
        const settings = await this.userSettingsService.findByUserId(entry.userId);
        if (settings && settings.aiAlertEnabled) {
          const notification = await this.notificationsService.create({
            userId: entry.userId,
            type: NotificationType.NEWS_KEYWORD,
            title: `📰 관련 뉴스: ${entry.stockName}`,
            message: news.title,
            stockCode: news.relatedStockCode,
            metadata: { newsId: news.id }
          });
          this.websocketGateway.sendToUser(entry.userId, 'notification:new', notification);
        }
      }
    } else {
      // 매크로 뉴스 알림
      // 모든 사용자를 조회하여 AI 알림 설정이 켜져있는 경우 알림 전송
      const users = await this.usersService.findAll();
      for (const user of users) {
        const settings = await this.userSettingsService.findByUserId(user.id);
        if (settings && settings.aiAlertEnabled) {
          const notification = await this.notificationsService.create({
            userId: user.id,
            type: NotificationType.NEWS_KEYWORD,
            title: `🌐 주요 거시경제 뉴스`,
            message: news.title,
            metadata: { newsId: news.id, category: news.category }
          });
          this.websocketGateway.sendToUser(user.id, 'notification:new', notification);
        }
      }
    }
  }
}
