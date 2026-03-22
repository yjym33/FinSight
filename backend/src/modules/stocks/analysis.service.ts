import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { LLMService } from '../chat/llm.service';
import { NewsService } from '../news/news.service';
import { KisService } from './kis.service';
import { StocksService } from './stocks.service';
import { UsersSettingsService } from '../users/users-settings.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 mins

  constructor(
    private readonly llmService: LLMService,
    private readonly newsService: NewsService,
    private readonly kisService: KisService,
    @Inject(forwardRef(() => StocksService))
    private readonly stocksService: StocksService,
    private readonly settingsService: UsersSettingsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getStockAnalysis(stockCode: string, userId?: string) {
    // 1. Check Cache
    const cacheKey = userId ? `${stockCode}_${userId}` : stockCode;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // 2. Fetch Data & User Settings
      const [priceData, newsData, dbStock, settings] = await Promise.all([
        this.kisService.getStockPrice(stockCode),
        this.newsService.findByStockCode(stockCode),
        this.stocksService.findOneByCode(stockCode),
        userId ? this.settingsService.findByUserId(userId) : Promise.resolve(null),
      ]);

      if (!priceData) return null;

      // 3. Prepare Prompt based on style
      const style = settings?.aiAnalysisStyle || 'expert';
      let styleInstruction = '';
      
      switch(style) {
        case 'summary':
          styleInstruction = '최대한 핵심만 1문장으로 짧고 명확하게 요약해 주세요.';
          break;
        case 'friendly':
          styleInstruction = '친절한 조언자처럼 비유를 들어 이해하기 쉽게 설명해 주세요.';
          break;
        case 'expert':
        default:
          styleInstruction = '금융 전문가의 관점에서 심도 있고 기술적인 분석을 제공해 주세요.';
          break;
      }

      const newsTitles = newsData.slice(0, 5).map((n: any) => n.title).join('\n');
      const prompt = `당신은 전문적인 AI 투자 분석가입니다. 
다음은 ${priceData.stockName} (${stockCode})의 현재 시장 데이터와 최근 뉴스, 그리고 기업 정보입니다.

[기업 정보]
- 업종(Sector): ${dbStock?.sector || '알 수 없음'}

[현재 시세]
- 현재가: ${priceData.price}원
- 등락: ${priceData.change}원 (${priceData.changePercent}%)

[최근 주요 뉴스]
${newsTitles || '최근 관련 뉴스가 없습니다.'}

이 데이터를 바탕으로 다음 사항들을 분석해 주세요:
1. 이 회사가 어떤 사업을 하는 회사인지 처음 보는 사람도 알기 쉽게 1~2문장으로 설명 (description). 반드시 제공된 '업종' 정보를 참고하여 사실에 기반해 작성해 주세요.
2. 오늘 이 종목이 어떤 이유(뉴스, 수급, 업황 등)로 이런 변동폭을 보이는지 "한 줄 요약" (reason)
3. 향후 투심에 영향을 줄 주요 투자 포인트 3가지 (points)
4. 0~100점 사이의 'AI 투자 매력도 점수' (score)

[스타일 지침]
${styleInstruction}

각 포인트는 1~2문장의 간결하고 전문적인 문체로 작성해 주세요. 

반드시 다음 JSON 형식을 엄격하게 지켜서 응답해 주세요:
{
  "description": "...",
  "reason": "...",
  "points": ["...", "...", "..."],
  "score": 85
}`;

      // 4. Call LLM
      const response = await this.llmService.generateResponse(prompt);
      
      try {
        // AI might return Markdown block sometimes, clean it
        const cleanJson = response.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanJson);
        
        // 5. Cache result
        this.cache.set(stockCode, { data: analysis, timestamp: Date.now() });
        return analysis;
      } catch (e) {
        this.logger.error(`Failed to parse AI response as JSON: ${response}`);
        return null;
      }

    } catch (error) {
      this.logger.error(`Error in stock analysis: ${error.message}`);
      return null;
    }
  }

  async getThemeClustering() {
    // Cache for 30 mins
    const cacheKey = 'market_themes';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const serverUrl = this.configService.get<string>('ANALYSIS_SERVER_URL') || 'http://localhost:8000';
      const response = await firstValueFrom(
        this.httpService.get(`${serverUrl}/analyze/themes`)
      );
      
      const themes = response.data;
      if (themes && Array.isArray(themes)) {
        this.cache.set(cacheKey, { data: themes, timestamp: Date.now() });
        return themes;
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching theme clustering: ${error.message}`);
      return [];
    }
  }
}
