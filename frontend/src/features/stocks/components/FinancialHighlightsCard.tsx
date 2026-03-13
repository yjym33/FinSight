import { Card } from '@/shared/components/ui/Card';
import { motion } from 'framer-motion';

interface FinancialHighlightsProps {
  per?: number;
  pbr?: number;
  eps?: number;
  marketCap?: number;
}

export function FinancialHighlightsCard({ per, pbr, eps, marketCap }: FinancialHighlightsProps) {
  // If no data is available, don't render the card
  if (!per && !pbr && !eps && !marketCap) {
    return null;
  }

  const formatMarketCap = (value?: number) => {
    if (!value) return '-';
    // KIS API returns market cap in 100M KRW (억 원). We converted to full KRW in backend.
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}조 원`;
    }
    return `${(value / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}억 원`;
  };

  const formatNumber = (value?: number, suffix = '') => {
    if (value === undefined || value === null) return '-';
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
  };

  const HighlightItem = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-toss-bg/50 hover:bg-toss-bg transition-colors group relative cursor-help">
      <span className="text-[13px] font-medium text-toss-text-secondary">{label}</span>
      <span className="text-[16px] font-bold text-toss-text-primary">{value}</span>
      
      {/* Simple Custom Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[12px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <h3 className="text-[20px] font-bold text-toss-text-primary mb-6">투자기본정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HighlightItem 
            label="시가총액" 
            value={formatMarketCap(marketCap)} 
            tooltip="기업의 가치를 주식 시장 가격으로 평가한 금액입니다."
          />
          <HighlightItem 
            label="PER" 
            value={formatNumber(per, '배')} 
            tooltip="주가수익비율. 현재 주가가 1주당 수익의 몇 배인지 나타냅니다. 낮을수록 저평가되어 있을 가능성이 높습니다."
          />
          <HighlightItem 
            label="PBR" 
            value={formatNumber(pbr, '배')} 
            tooltip="주가순자산비율. 현재 주가가 1주당 순자산의 몇 배인지 나타냅니다. 1 미만이면 장부상 가치보다 주가가 낮다는 뜻입니다."
          />
          <HighlightItem 
            label="EPS" 
            value={formatNumber(eps, '원')} 
            tooltip="주당순이익. 기업이 1주당 얼마의 순이익을 냈는지 나타냅니다. 높을수록 수익성이 좋습니다."
          />
        </div>
      </Card>
    </motion.div>
  );
}
