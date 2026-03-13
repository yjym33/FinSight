import { useQuery } from '@tanstack/react-query';
import api from '@/shared/api/api';

export function SidebarSearchResultList({ query, onSelect }: { query: string, onSelect: (code: string) => void }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ['stocks', 'search', 'sidebar', query],
    queryFn: async () => {
      const response = await api.get(`/stocks/search?q=${query}`);
      return response.data;
    },
    enabled: query.length > 0,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center bg-white">
        <div className="animate-spin h-5 w-5 border-2 border-toss-blue border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-6 text-center bg-white">
        <p className="text-toss-text-secondary text-[13px]">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white py-1">
      {results.map((stock: any) => (
        <button
          key={stock.code}
          onClick={() => onSelect(stock.code)}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-toss-bg transition-colors text-left"
        >
          <div className="h-8 w-8 rounded-full bg-toss-bg flex items-center justify-center font-bold text-toss-text-secondary text-[12px]">
            {stock.name[0]}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-toss-text-primary leading-tight">{stock.name}</p>
            <p className="text-[11px] text-toss-text-placeholder">{stock.code} · {stock.market}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
