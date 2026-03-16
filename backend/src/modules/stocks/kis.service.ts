import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class KisService implements OnModuleInit {
  private readonly logger = new Logger(KisService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  
  // Rate limiting & Caching
  private nextRequestTime = 0;
  private readonly minRequestInterval = 510; // Slightly over 500ms (2 req/sec)
  private priceCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTTL = 5000; // Increase to 5 seconds to reduce redundant API calls
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private async executeWithRateLimit<T>(task: () => Promise<T>): Promise<T> {
    const now = Date.now();
    let executeAt = Math.max(now, this.nextRequestTime);
    
    // Assign the next available time to the queue
    this.nextRequestTime = executeAt + this.minRequestInterval;

    const waitTime = executeAt - now;
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    return task();
  }

  private tokenFetchPromise: Promise<void> | null = null;

  async onModuleInit() {
    await this.ensureValidToken();
  }

  private async ensureValidToken() {
    // 1. If we have a valid token, we're good
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return;
    }

    // 2. If a fetch is already in progress, wait for it
    if (this.tokenFetchPromise) {
      return this.tokenFetchPromise;
    }

    // 3. Start a new fetch
    this.tokenFetchPromise = (async () => {
      const appKey = this.configService.get<string>('KIS_APP_KEY');
      const secretKey = this.configService.get<string>('KIS_SECRET');
      const baseUrl = this.configService.get<string>('KIS_URL');

      if (!appKey || !secretKey || !baseUrl) {
        this.logger.error('KIS API keys or URL are not configured.');
        return;
      }

      try {
        this.logger.log('Fetching new KIS access token...');
        const response = await firstValueFrom(
          this.httpService.post(`${baseUrl}/oauth2/tokenP`, {
            grant_type: 'client_credentials',
            appkey: appKey,
            appsecret: secretKey,
          }),
        );

        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
        this.logger.log('Successfully fetched KIS access token.');
        fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Token Success\n`);
      } catch (error) {
        this.logger.error(`Failed to fetch KIS token: ${error.message}`);
        fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Token Error: ${error.message}\n`);
        if (error.response) {
          this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
          
          // If we hit the 1-minute limit, set a temporary expiration so we don't hammer it
          // the error code EGW00133 is for the once-per-minute limit
          if (error.response.data.error_code === 'EGW00133') {
              this.tokenExpiresAt = Date.now() + 60000; // Pretend it's "valid" for 1 min (but it won't be used) to cool down
          }
        }
      } finally {
        this.tokenFetchPromise = null;
      }
    })();

    return this.tokenFetchPromise;
  }

  public isOverseas(stockCode: string): boolean {
    return /[a-zA-Z]/.test(stockCode);
  }

  async getStockPrice(stockCode: string) {
    // 1. Check Cache
    const cached = this.priceCache.get(stockCode);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // 2. Check for pending identical request (deduplication)
    if (this.pendingRequests.has(stockCode)) {
      return this.pendingRequests.get(stockCode);
    }

    const pricePromise = this.isOverseas(stockCode) 
      ? this.getOverseasStockPrice(stockCode)
      : this.getDomesticStockPrice(stockCode);

    this.pendingRequests.set(stockCode, pricePromise);
    try {
      const result = await pricePromise;
      if (result) {
        this.priceCache.set(stockCode, { data: result, timestamp: Date.now() });
      }
      return result;
    } finally {
      this.pendingRequests.delete(stockCode);
    }
  }

  private async getDomesticStockPrice(stockCode: string) {
    try {
      await this.ensureValidToken();
      if (!this.accessToken) return null;

      const baseUrl = this.configService.get<string>('KIS_URL');
      const appKey = this.configService.get<string>('KIS_APP_KEY');
      const secretKey = this.configService.get<string>('KIS_SECRET');

      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`, {
          params: {
            fid_cond_mrkt_div_code: 'J',
            fid_input_iscd: stockCode,
          },
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': 'FHKST01010100',
          },
        }),
      ));

      const data = response.data.output;
      if (!data || !data.stck_prpr) {
        this.logger.warn(`No domestic price data received for ${stockCode}: ${JSON.stringify(response.data)}`);
        return null;
      }

      return {
        stockCode,
        stockName: data.stck_nm || stockCode,
        price: parseInt(data.stck_prpr) || 0,
        change: parseInt(data.prdy_vrss) || 0,
        changePercent: parseFloat(data.prdy_ctrt) || 0,
        high: parseInt(data.stck_hgpr) || 0,
        low: parseInt(data.stck_lwpr) || 0,
        per: parseFloat(data.per) || undefined,
        pbr: parseFloat(data.pbr) || undefined,
        eps: parseFloat(data.eps) || undefined,
        marketCap: data.hts_avls ? parseInt(data.hts_avls) * 100000000 : undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch domestic price for ${stockCode}: ${error.message}`);
      return null;
    }
  }

  private async getOverseasStockPrice(stockCode: string) {
    try {
      await this.ensureValidToken();
      if (!this.accessToken) return null;

      const baseUrl = this.configService.get<string>('KIS_URL');
      const appKey = this.configService.get<string>('KIS_APP_KEY');
      const secretKey = this.configService.get<string>('KIS_SECRET');

      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(`${baseUrl}/uapi/overseas-stock/v1/quotations/price`, {
          params: {
            AUTH: '',
            EXCD: 'NAS', // Default to NASDAQ for now
            SYMB: stockCode,
          },
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': 'HHDFS76410000',
          },
        }),
      ));

      const data = response.data.output;
      if (!data || !data.last) {
        this.logger.warn(`No overseas price data received for ${stockCode}: ${JSON.stringify(response.data)}`);
        return null;
      }

      return {
        stockCode,
        stockName: stockCode, // KIS overseas API response might not have name in output depending on tr_id
        price: parseFloat(data.last) || 0,
        change: parseFloat(data.diff) || 0,
        changePercent: parseFloat(data.rate) || 0,
        high: parseFloat(data.high) || 0,
        low: parseFloat(data.low) || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch overseas price for ${stockCode}: ${error.message}`);
      return null;
    }
  }

  async getChartData(stockCode: string, period: '1D' | '1W' | '1M' | '1Y') {
    await this.ensureValidToken();
    if (!this.accessToken) return [];

    const isOverseas = this.isOverseas(stockCode);
    if (isOverseas) {
      return this.getOverseasChartData(stockCode, period);
    }

    const baseUrl = this.configService.get<string>('KIS_URL');
    const appKey = this.configService.get<string>('KIS_APP_KEY');
    const secretKey = this.configService.get<string>('KIS_SECRET');

    try {
      if (period === '1D') {
        const response = await this.executeWithRateLimit(() => firstValueFrom(
          this.httpService.get(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice`, {
            params: {
              FID_COND_MRKT_DIV_CODE: 'J',
              FID_INPUT_ISCD: stockCode,
              FID_INPUT_HOUR_1: '153000', // Typically 153000 gets the whole day for K-Stocks
              FID_ETC_CLS_CODE: '',
              FID_PW_DATA_INCU_YN: 'N',
            },
            headers: {
              'content-type': 'application/json',
              'authorization': `Bearer ${this.accessToken}`,
              'appkey': appKey,
              'appsecret': secretKey,
              'tr_id': 'FHKST03010200',
            },
          }),
        ));

        if (!response.data.output2 || response.data.output2.length === 0) {
           this.logger.warn(`1D chart empty for ${stockCode}. Response: ${JSON.stringify(response.data)}`);
        }

        return (response.data.output2 || []).map((item: any) => ({
          time: this.parseTimeString(item.stck_bsop_date, item.stck_cntg_hour),
          value: parseInt(item.stck_prpr),
        })).reverse();
      } else {
        // For all periods > 1D (1W, 1M, 1Y), we use Daily stick ('D') 
        // to show daily changes but limit the date range.
        const periodCode = 'D'; 
        const startDate = this.getStartDate(period);
        const endDate = this.getEndDate();

        const response = await this.executeWithRateLimit(() => firstValueFrom(
          this.httpService.get(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`, {
            params: {
              FID_COND_MRKT_DIV_CODE: 'J',
              FID_INPUT_ISCD: stockCode,
              FID_INPUT_DATE_1: startDate,
              FID_INPUT_DATE_2: endDate,
              FID_PERIOD_DIV_CODE: periodCode,
              FID_ORG_ADJ_PRC: 'Y',
            },
            headers: {
              'content-type': 'application/json',
              'authorization': `Bearer ${this.accessToken}`,
              'appkey': appKey,
              'appsecret': secretKey,
              'tr_id': 'FHKST03010100',
            },
          }),
        ));

        return response.data.output2.map((item: any) => ({
          time: this.parseDateString(item.stck_bsop_date),
          value: parseInt(item.stck_clpr),
        })).reverse();
      }
    } catch (error) {
      this.logger.error(`Failed to fetch chart data for ${stockCode}: ${error.message}`);
      return [];
    }
  }

  async getInvestorTrend(stockCode: string) {
    this.logger.warn(`[getInvestorTrend] called with ${stockCode}`);
    if (this.isOverseas(stockCode)) {
      console.log(`[getInvestorTrend] skipping overseas stock`);
      return null;
    }

    try {
      this.logger.warn(`[getInvestorTrend] ensuring valid token`);
      await this.ensureValidToken();
      if (!this.accessToken) {
        this.logger.warn(`[getInvestorTrend] no access token`);
        return null;
      }

      this.logger.warn(`[getInvestorTrend] making request to KIS`);
      const baseUrl = this.configService.get<string>('KIS_URL');
      const appKey = this.configService.get<string>('KIS_APP_KEY');
      const secretKey = this.configService.get<string>('KIS_SECRET');

      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-investor`, {
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: stockCode,
          },
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': 'FHKST01010900',
          },
        }),
      ));

      const output: any[] = response.data.output;
      this.logger.warn(`[getInvestorTrend] response output length: ${output?.length}`);
      
      if (!output || output.length === 0) {
        this.logger.warn(`No investor data for ${stockCode}: ${JSON.stringify(response.data)}`);
        return null;
      }

      // Find the most recent day that actually has investor data (sometimes today is empty)
      const latest = output.find(item => item.prsn_ntby_qty && item.prsn_ntby_qty !== '') || output[0];
      
      this.logger.warn(`[getInvestorTrend] returning data for ${latest.stck_bsop_date}`);
      return {
        retail: parseInt(latest.prsn_ntby_qty) || 0,
        foreigner: parseInt(latest.frgn_ntby_qty) || 0, // It's frgn_ntby_qty not forn_ntby_qty
        institution: parseInt(latest.orgn_ntby_qty) || 0,
        date: latest.stck_bsop_date,
        raw: latest,
      };
    } catch (error) {
      this.logger.warn(`[getInvestorTrend] error caught: ${JSON.stringify(error.response?.data || error.message)}`);
      this.logger.error(`Failed to fetch investor trend for ${stockCode}: ${error.message}`);
      return null;
    }
  }

  private async getOverseasChartData(stockCode: string, period: '1D' | '1W' | '1M' | '1Y') {
    const baseUrl = this.configService.get<string>('KIS_URL');
    const appKey = this.configService.get<string>('KIS_APP_KEY');
    const secretKey = this.configService.get<string>('KIS_SECRET');

    try {
      // Overseas chart uses daily data for simplicity in this mockup implementation
      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(`${baseUrl}/uapi/overseas-price/v1/quotations/dailyprice`, {
          params: {
            AUTH: '',
            EXCD: 'NAS',
            SYMB: stockCode,
            GUBN: '0', // 0: Daily
            BYMD: '',
            MODP: '0', // MODP: '0' for raw, '1' for adjusted in some docs, or 'Y'. Wait, usually it is 0 or 1
          },
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': 'HHDFS76240000',
          },
        }),
      ));

      if (!response.data.output2 || response.data.output2.length === 0) {
        this.logger.warn(`Overseas chart empty for ${stockCode}. Response: ${JSON.stringify(response.data)}`);
      }

      let output = response.data.output2 || [];

      // KIS returns last 100 daily sticks by default. Filter based on period:
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (period === '1W') today.setDate(today.getDate() - 7);
      else if (period === '1M') today.setMonth(today.getMonth() - 1);
      else if (period === '1Y') today.setFullYear(today.getFullYear() - 1);
      const cutoffTime = Math.floor(today.getTime() / 1000);

      return output
        .map((item: any) => ({
          time: this.parseDateString(item.xymd),
          value: parseFloat(item.clos),
        }))
        .filter((item: any) => item.time >= cutoffTime)
        .reverse();
    } catch (error) {
      this.logger.error(`Failed to fetch overseas chart for ${stockCode}: ${error.message}`);
      return [];
    }
  }

  private parseTimeString(date: string, hour: string) {
    // KIS returns yyyymmdd and hhmmss
    const y = parseInt(date.substring(0, 4));
    const m = parseInt(date.substring(4, 6)) - 1;
    const d = parseInt(date.substring(6, 8));
    const hh = parseInt(hour.substring(0, 2));
    const mm = parseInt(hour.substring(2, 4));
    return Math.floor(new Date(y, m, d, hh, mm).getTime() / 1000);
  }

  private parseDateString(date: string) {
    const y = parseInt(date.substring(0, 4));
    const m = parseInt(date.substring(4, 6)) - 1;
    const d = parseInt(date.substring(6, 8));
    return Math.floor(new Date(y, m, d).getTime() / 1000);
  }

  private getStartDate(period: '1W' | '1M' | '1Y') {
    const today = new Date();
    if (period === '1W') today.setDate(today.getDate() - 7);
    else if (period === '1M') today.setMonth(today.getMonth() - 1);
    else if (period === '1Y') today.setFullYear(today.getFullYear() - 1);
    return today.toISOString().split('T')[0].replace(/-/g, '');
  }

  private getEndDate() {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  private rankingCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly rankingCacheTTL = 60000; // 1 minute cache for rankings

  async getRanking(type: 'volume' | 'gainers' | 'losers' = 'volume', market: 'J' | 'K' = 'J') {
    const cacheKey = `ranking_${type}_${market}`;
    // const cached = this.rankingCache.get(cacheKey);
    // if (cached && Date.now() - cached.timestamp < this.rankingCacheTTL) {
    //   return cached.data;
    // }

    await this.ensureValidToken();
    if (!this.accessToken) return [];

    const baseUrl = this.configService.get<string>('KIS_URL');
    const appKey = this.configService.get<string>('KIS_APP_KEY');
    const secretKey = this.configService.get<string>('KIS_SECRET');

    try {
      const isVolume = type === 'volume';
      const trId = isVolume ? 'FHPST01710000' : 'FHPST01700000';
      const url = isVolume 
        ? `${baseUrl}/uapi/domestic-stock/v1/quotations/volume-rank`
        : `${baseUrl}/uapi/domestic-stock/v1/quotations/psearch-result`;

      this.logger.log(`Fetching ${type} ranking for market ${market} using ${trId} at ${url}`);

      const params: any = isVolume 
        ? {
            fid_cond_mrkt_div_code: 'J', 
            fid_cond_scr_div_code: '20171', 
            fid_input_iscd: market === 'J' ? '0001' : '1001', 
            fid_div_cls_code: '0',
            fid_blng_cls_code: '0',
            fid_trgt_cls_code: '0',
            fid_trgt_exls_cls_code: '0',
            fid_input_price_1: '0',
            fid_input_price_2: '0',
            fid_vol_cnt: '0',
            fid_input_date_1: '',
          }
        : {
            fid_cond_mrkt_div_code: 'J',
            fid_cond_scr_div_code: '20170',
            fid_input_iscd: market === 'J' ? '0001' : '1001',
            fid_rank_sort_cls_code: type === 'gainers' ? '0' : '1',
            fid_input_cnt_1: '0',
            fid_prc_cls_code: '0',
            fid_input_price_1: '0',
            fid_input_price_2: '0',
            fid_vol_cnt: '0',
            fid_trgt_cls_code: '0',
            fid_trgt_exls_cls_code: '0',
            fid_div_cls_code: '0',
            fid_rsfl_cls_code: '1',
          };

      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(url, {
          params,
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': trId,
            'custtype': 'P',
          },
        }),
      ));

      if (response.data.rt_cd !== '0') {
        const err = `KIS API Error (${type}): ${response.data.msg1} (rt_cd: ${response.data.rt_cd})`;
        this.logger.error(err);
        fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] ${err}\nFull: ${JSON.stringify(response.data)}\n`);
        return [];
      }

      if (!response.data.output || !Array.isArray(response.data.output) || response.data.output.length === 0) {
        fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Ranking Empty/NoData: ${JSON.stringify(response.data)}\n`);
        return [];
      }
      fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Ranking Success: ${response.data.output.length} items\n`);

      const results = response.data.output.slice(0, 30).map((item: any) => {
        const currentPrice = parseInt(item.stck_prpr);
        const change = parseInt(item.prdy_vrss);
        const prevClose = item.stck_prdy_clpr ? parseInt(item.stck_prdy_clpr) : (currentPrice - change);
        
        return {
          code: item.mksc_shrn_iscd || item.stck_shrn_iscd,
          name: item.hts_kor_isnm,
          price: currentPrice,
          change: change,
          changePercent: parseFloat(item.prdy_ctrt),
          volume: parseInt(item.acml_vol),
          tradingValue: parseInt(item.acml_tr_pbmn || 0),
          prevClose: prevClose,
          market: market === 'J' ? '코스피' : '코스닥',
        };
      });

      this.rankingCache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    } catch (error) {
      const errMsg = `Failed to fetch ${type} ranking: ${error.message}`;
      this.logger.error(errMsg);
      fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Catch Error: ${errMsg}\n`);
      if (error.response) {
        this.logger.error(`Error Response Data: ${JSON.stringify(error.response.data)}`);
        fs.appendFileSync('debug.txt', `[${new Date().toISOString()}] Error Response: ${JSON.stringify(error.response.data)}\n`);
      }
      return [];
    }
  }
  async getMarketIndex(indexCode: '0001' | '1001' = '0001') {
    try {
      await this.ensureValidToken();
      if (!this.accessToken) return null;

      const baseUrl = this.configService.get<string>('KIS_URL');
      const appKey = this.configService.get<string>('KIS_APP_KEY');
      const secretKey = this.configService.get<string>('KIS_SECRET');

      const response = await this.executeWithRateLimit(() => firstValueFrom(
        this.httpService.get(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-index-price`, {
          params: {
            fid_cond_mrkt_div_code: 'U',
            fid_input_iscd: indexCode,
          },
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.accessToken}`,
            'appkey': appKey,
            'appsecret': secretKey,
            'tr_id': 'FHPST01010000',
          },
        }),
      ));

      const data = response.data.output;
      if (!data) return null;

      return {
        indexName: indexCode === '0001' ? 'KOSPI' : 'KOSDAQ',
        price: parseFloat(data.bstp_nmix_prpr),
        change: parseFloat(data.bstp_nmix_prdy_vrss),
        changePercent: parseFloat(data.bstp_nmix_prdy_ctrt),
        high: parseFloat(data.bstp_nmix_hgpr),
        low: parseFloat(data.bstp_nmix_lwpr),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch market index ${indexCode}: ${error.message}`);
      return null;
    }
  }
}
