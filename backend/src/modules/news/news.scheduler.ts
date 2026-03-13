import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsService } from './news.service';
import { NewsApiService } from './news-api.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { News } from './entities/news.entity';

@Injectable()
export class NewsScheduler {
  private readonly logger = new Logger(NewsScheduler.name);

  constructor(
    private newsService: NewsService,
    private newsApiService: NewsApiService,
    private websocketGateway: WebsocketGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async fetchNews() {
    this.logger.debug('Fetching themed domestic news from Naver API...');
    const themes = ['금융', '증권', '산업', '재계', '경제', '부동산', '주식'];

    try {
      for (const theme of themes) {
        const newsItems = await this.newsApiService.fetchDomesticNews(theme);

        if (newsItems.length === 0) continue;

        const newItems: Partial<News>[] = [];
        for (const item of newsItems) {
          if (item.url) {
            const existing = await this.newsService.findByUrl(item.url);
            if (!existing) {
              newItems.push(item);
            } else if (existing.category === 'domestic') {
              // Update existing 'domestic' items to the specific theme
              existing.category = theme;
              await this.newsService.create(existing);
              this.logger.debug(`Updated category for existing news: ${existing.title} -> ${theme}`);
            }
          }
        }

        if (newItems.length > 0) {
          const savedNews = await this.newsService.createMany(newItems);
          this.logger.log(`Added ${savedNews.length} new news items for ${theme}`);
          savedNews.forEach((news) => this.websocketGateway.broadcastNews(news));
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle news fetch: ${error.message}`);
    }
  }
}
