'use client';

import { NewsCard } from './NewsCard';

interface News {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedStockCode?: string;
  category: string;
}

interface NewsListProps {
  news: News[];
}

export function NewsList({ news }: NewsListProps) {
  if (!news || news.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        뉴스가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {news.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </div>
  );
}
