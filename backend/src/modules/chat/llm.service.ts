import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      return 'AI 서비스 연결 설정이 되어 있지 않습니다.';
    }

    const systemPrompt = `당신은 전문적인 AI 투자 분석가입니다. 
제공된 투자 소식과 시장 데이터를 바탕으로 사용자의 질문에 친절하고 전문적으로 답변해 주세요.
한국어로 답변해 주세요.
${context ? `\n참고할 현재 시장 뉴스:\n${context}` : ''}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        ),
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Error calling OpenAI API: ${error.message}`);
      if (error.response) {
        this.logger.error(`API response error: ${JSON.stringify(error.response.data)}`);
      }
      return '죄송합니다. AI 응답을 생성하는 중에 오류가 발생했습니다.';
    }
  }
}
