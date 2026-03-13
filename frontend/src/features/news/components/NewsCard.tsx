import { motion } from 'framer-motion';
import { ExternalLink, Clock, Tag } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';

interface NewsCardProps {
  news: {
    id: string;
    title: string;
    summary: string;
    url: string;
    source: string;
    publishedAt: string;
    relatedStockCode?: string;
    category: string;
  };
}

export function NewsCard({ news }: NewsCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedAt = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    return publishedAt.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group h-full p-0 overflow-hidden border-none bg-white hover:shadow-2xl">
        <a 
          href={news.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex h-full flex-col p-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-toss-bg text-[10px] font-bold text-toss-blue">
                {news.source[0]}
              </div>
              <span className="text-[14px] font-bold text-toss-text-primary">{news.source}</span>
            </div>
            {news.relatedStockCode && (
              <div className="flex items-center gap-1 rounded-full bg-toss-bg px-3 py-1 text-[12px] font-bold text-toss-blue">
                <Tag className="h-3 w-3" />
                {news.relatedStockCode}
              </div>
            )}
          </div>

          <h3 className="mb-3 line-clamp-2 text-[20px] font-bold leading-snug text-toss-text-primary group-hover:text-toss-blue transition-colors">
            {news.title}
          </h3>

          <p className="mb-6 line-clamp-3 text-[15px] leading-relaxed text-toss-text-secondary">
            {news.summary}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-6">
            <div className="flex items-center gap-1.5 text-[13px] text-toss-text-placeholder">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeAgo(news.publishedAt)}
            </div>
            <ExternalLink className="h-4 w-4 text-toss-text-placeholder opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>
      </Card>
    </motion.div>
  );
}
