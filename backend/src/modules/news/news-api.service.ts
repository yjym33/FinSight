import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { News } from './entities/news.entity';

@Injectable()
export class NewsApiService {
  private readonly logger = new Logger(NewsApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async fetchDomesticNews(query: string = '주식', display: number = 50): Promise<Partial<News>[]> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');

    if (!clientId || clientId === 'your_naver_client_id') {
      this.logger.warn('Naver API keys not configured. Skipping domestic news fetch.');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://openapi.naver.com/v1/search/news.json', {
          params: { query, display, sort: 'date' }, // Sort by date for real-time
          headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
          },
        }),
      );

      return response.data.items.map((item: any) => ({
        title: item.title.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'"),
        summary: item.description.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'"),
        url: item.link,
        source: 'Naver News',
        publishedAt: new Date(item.pubDate),
        category: query, // Use query as category for filtering
      }));
    } catch (error) {
      this.logger.error(`Error fetching domestic news for ${query}: ${error.message}`);
      return [];
    }
  }

}
