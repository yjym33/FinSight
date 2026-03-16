import { useQuery } from '@tanstack/react-query';
import api from '@/shared/api/api';

export function SearchResultList({ query, onSelect }: { query: string, onSelect: (stock: any) => void }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ['stocks', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/stocks/search?q=${query}`);
      return response.data;
    },
    enabled: query.length > 0,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900">
        <div className="animate-spin h-6 w-6 border-2 border-toss-blue border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900">
        <p className="text-toss-text-secondary text-[14px]">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 py-2">
      {results.map((stock: any) => (
        <button
          key={stock.code}
          onClick={() => onSelect(stock)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-toss-bg transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-toss-bg flex items-center justify-center font-bold text-toss-text-secondary">
              {stock.name[0]}
            </div>
            <div>
              <p className="text-[15px] font-bold text-toss-text-primary">{stock.name}</p>
              <p className="text-[12px] text-toss-text-placeholder">{stock.code} · {stock.market}</p>
            </div>
          </div>
          <span className="text-[12px] text-toss-text-placeholder font-medium">{stock.sector}</span>
        </button>
      ))}
    </div>
  );
}
