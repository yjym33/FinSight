import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async findAll(category?: string, limit = 50): Promise<News[]> {
    const query = this.newsRepository.createQueryBuilder('news')
      .where('news.source != :mockSource', { mockSource: 'MockSystem' });

    if (category) {
      query.andWhere('news.category = :category', { category });
    }

    return query
      .orderBy('news.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findByUrl(url: string): Promise<News | null> {
    return this.newsRepository.findOne({ where: { url } });
  }

  async findById(id: string): Promise<News | null> {
    return this.newsRepository.findOne({ where: { id } });
  }

  async findByStockCode(stockCode: string, stockName?: string): Promise<News[]> {
    const query = this.newsRepository.createQueryBuilder('news')
      .where('news.relatedStockCode = :stockCode', { stockCode });

    if (stockName) {
      query.orWhere('news.title LIKE :stockName', { stockName: `%${stockName}%` })
           .orWhere('news.summary LIKE :stockName', { stockName: `%${stockName}%` });
    }

    return query
      .orderBy('news.publishedAt', 'DESC')
      .take(20)
      .getMany();
  }

  async findByKeyword(keyword: string): Promise<News[]> {
    return this.newsRepository.createQueryBuilder('news')
      .where('news.title LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('news.summary LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('news.publishedAt', 'DESC')
      .take(20)
      .getMany();
  }

  async create(newsData: Partial<News>): Promise<News> {
    const news = this.newsRepository.create(newsData);
    return this.newsRepository.save(news);
  }

  async createMany(newsItems: Partial<News>[]): Promise<News[]> {
    const news = this.newsRepository.create(newsItems);
    return this.newsRepository.save(news);
  }

  async getLatestNews(since: Date): Promise<News[]> {
    return this.newsRepository
      .createQueryBuilder('news')
      .where('news.publishedAt > :since', { since })
      .orderBy('news.publishedAt', 'DESC')
      .getMany();
  }
}
