'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { SearchResultList } from '@/features/stocks/components/SearchResultList';
import { stocksService } from '@/features/stocks/services/stocksService';
import { Plus, X, BarChart2, TrendingUp, Info } from 'lucide-react';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { cn } from '@/shared/lib/utils';
import {
    createChart,
    IChartApi,
    ISeriesApi,
    ColorType,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';

// --- Sub-components ---

function ComparisonChart({ codes }: { codes: string[] }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

    const { data: stockDetails } = useQuery({
        queryKey: ['stocks', 'compare', 'names', codes],
        queryFn: () => stocksService.compareStocks(codes),
        enabled: codes.length > 0,
    });

    const codeToName = useMemo(() => {
        const map: Record<string, string> = {};
        (stockDetails as any[])?.forEach(s => {
            map[s.stockCode] = s.stockName;
        });
        return map;
    }, [stockDetails]);

    const { data: chartsData, isLoading } = useQuery({
        queryKey: ['stocks', 'compare', 'charts', codes],
        queryFn: async () => {
            const data = await Promise.all(
                codes.map(async (code) => {
                    const history = await stocksService.getChartData(code, '1Y');
                    if (!history || history.length === 0) return { code, data: [] };
                    
                    // Normalize to 0% based on the first price in the period
                    const firstPrice = history[0].value;
                    const normalized = history.map((point: any) => ({
                        time: point.time,
                        value: ((point.value - firstPrice) / firstPrice) * 100,
                    }));
                    return { code, data: normalized };
                })
            );
            return data;
        },
        enabled: codes.length > 0,
    });

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#8B95A1',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: '#F2F4F6' },
            },
            rightPriceScale: {
                borderVisible: false,
                textColor: '#8B95A1',
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
            },
            handleScale: true,
            handleScroll: true,
        });

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current || !chartsData) return;

        // Clear existing series
        seriesRefs.current.forEach((series) => chartRef.current?.removeSeries(series));
        seriesRefs.current.clear();

        const colors = ['#3182F6', '#F04452', '#00D084', '#FF9500', '#9254DE'];
        
        chartsData.forEach((item, index) => {
            if (item.data.length === 0) return;
            
            const color = colors[index % colors.length];
            const lineSeries = chartRef.current!.addLineSeries({
                color: color,
                lineWidth: 2,
                title: codeToName[item.code] || item.code,
                priceFormat: {
                    type: 'custom',
                    formatter: (price: number) => `${price.toFixed(1)}%`,
                },
            });
            
            lineSeries.setData(item.data);
            seriesRefs.current.set(item.code, lineSeries);
        });

        chartRef.current.timeScale().fitContent();
    }, [chartsData]);

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-toss-blue border-t-transparent" />
                </div>
            )}
            <div ref={chartContainerRef} className="rounded-2xl" />
            <div className="mt-4 flex flex-wrap gap-4 px-2">
                {codes.map((code, idx) => {
                    const colors = ['#3182F6', '#F04452', '#00D084', '#FF9500', '#9254DE'];
                    return (
                        <div key={code} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                            <span className="text-[13px] font-medium text-toss-text-secondary">
                                {codeToName[code] || code}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- Main Page ---

export default function ComparePage() {
    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const { data: comparisonData, isLoading: isComparisonLoading } = useQuery({
        queryKey: ['stocks', 'compare', 'details', selectedCodes],
        queryFn: () => stocksService.compareStocks(selectedCodes),
        enabled: selectedCodes.length > 0,
    });

    const addStock = (stock: any) => {
        const code = stock.code;
        if (selectedCodes.includes(code)) return;
        if (selectedCodes.length >= 5) {
            alert('최대 5개 종목까지 비교 가능합니다.');
            return;
        }
        setSelectedCodes([...selectedCodes, code]);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const removeStock = (code: string) => {
        setSelectedCodes(selectedCodes.filter((c) => c !== code));
    };

    interface StockComparison {
        stockCode: string;
        stockName: string;
        price: number;
        change: number;
        changePercent: number;
        per?: number;
        pbr?: number;
        marketCap?: number;
        analysis?: {
            score: number;
            reason: string;
            points: string[];
        };
    }

    const codeToName = useMemo(() => {
        const map: Record<string, string> = {};
        (comparisonData as StockComparison[])?.forEach(s => {
            map[s.stockCode] = s.stockName;
        });
        return map;
    }, [comparisonData]);

    return (
        <div className="flex min-h-screen bg-toss-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mx-auto w-full max-w-[1200px] py-10 px-8">
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <h1 className="text-[32px] font-bold text-toss-text-primary">종목 비교 분석</h1>
                        <p className="mt-2 text-[16px] text-toss-text-secondary">
                            최대 5개 종목의 재무 지표, 수익률, AI 분석 점수를 한눈에 비교해보세요.
                        </p>
                    </div>
                    <div className="relative flex items-center gap-3">
                        <div className="relative w-72">
                            <Input
                                placeholder="비교할 종목 검색"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                                className="h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800"
                            />
                            {isSearchOpen && searchQuery && (
                                <div className="absolute top-14 left-0 right-0 z-50 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800">
                                    <SearchResultList 
                                        query={searchQuery} 
                                        onSelect={addStock} 
                                    />
                                </div>
                            )}
                        </div>
                        {isSearchOpen && searchQuery && (
                            <Button 
                                variant="secondary" 
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                            >
                                닫기
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mb-8 flex flex-wrap gap-3">
                    {selectedCodes.map((code) => (
                        <div 
                            key={code} 
                            className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 px-4 py-2 border border-gray-200 dark:border-slate-700 shadow-sm"
                        >
                            <span className="text-[14px] font-bold text-toss-text-primary">
                                {codeToName[code] || code}
                            </span>
                            <button 
                                onClick={() => removeStock(code)}
                                className="text-toss-text-placeholder hover:text-toss-text-secondary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {selectedCodes.length === 0 && (
                        <div className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 py-12">
                            <div className="text-center">
                                <BarChart2 className="mx-auto h-12 w-12 text-toss-text-placeholder mb-4" />
                                <p className="text-[16px] font-medium text-toss-text-secondary">비교할 종목을 먼저 검색해서 추가해주세요.</p>
                            </div>
                        </div>
                    )}
                </div>

                {selectedCodes.length > 0 && (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Comparison Table */}
                        <Card className="lg:col-span-3 overflow-hidden border-none shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                                <Info className="h-5 w-5 text-toss-blue" />
                                <h3 className="text-[18px] font-bold text-toss-text-primary">재무 및 시세 지표 비교</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[13px] font-bold text-toss-text-secondary uppercase">지표 명칭</th>
                                            {selectedCodes.map(code => (
                                                <th key={code} className="px-8 py-4 text-[14px] font-bold text-toss-text-primary text-center">
                                                    {codeToName[code] || code}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        <tr>
                                            <td className="px-8 py-5 text-[14px] font-medium text-toss-text-secondary">현재가</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                return (
                                                    <td key={code} className="px-8 py-5 text-[15px] font-bold text-toss-text-primary text-center">
                                                        {stock ? `${stock.price.toLocaleString()}원` : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="px-8 py-5 text-[14px] font-medium text-toss-text-secondary">등락률</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                const isUp = (stock?.change || 0) >= 0;
                                                return (
                                                    <td key={code} className={cn(
                                                        "px-8 py-5 text-[15px] font-bold text-center",
                                                        isUp ? "text-[#F04452]" : "text-toss-blue"
                                                    )}>
                                                        {stock ? `${isUp ? '+' : ''}${stock.changePercent}%` : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="px-8 py-5 text-[14px] font-medium text-toss-text-secondary">PER (배)</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                return (
                                                    <td key={code} className="px-8 py-5 text-[15px] font-medium text-toss-text-primary text-center">
                                                        {stock?.per || 'N/A'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="px-8 py-5 text-[14px] font-medium text-toss-text-secondary">PBR (배)</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                return (
                                                    <td key={code} className="px-8 py-5 text-[15px] font-medium text-toss-text-primary text-center">
                                                        {stock?.pbr || 'N/A'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="px-8 py-5 text-[14px] font-medium text-toss-text-secondary">시가총액</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                return (
                                                    <td key={code} className="px-8 py-5 text-[14px] font-medium text-toss-text-primary text-center">
                                                        {stock?.marketCap ? `${(stock.marketCap / 1000000000000).toFixed(1)}조` : 'N/A'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr className="bg-toss-blue/5 dark:bg-toss-blue/10">
                                            <td className="px-8 py-6 text-[14px] font-bold text-toss-blue">AI 분석 점수</td>
                                            {selectedCodes.map(code => {
                                                const stock = (comparisonData as StockComparison[])?.find((s: StockComparison) => s.stockCode === code);
                                                const score = stock?.analysis?.score;
                                                return (
                                                    <td key={code} className="px-8 py-6 text-center">
                                                        {score ? (
                                                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-toss-blue text-white font-bold text-[16px]">
                                                                {score}
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Chart Section */}
                        <Card className="lg:col-span-3 border-none shadow-sm p-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-toss-blue" />
                                    <h3 className="text-[18px] font-bold text-toss-text-primary">최근 1년 수익률 추이 (상대 수익률)</h3>
                                </div>
                                <span className="text-[12px] text-toss-text-placeholder bg-toss-bg px-3 py-1 rounded-full uppercase">Normalized to 0% at start</span>
                            </div>
                            <ComparisonChart codes={selectedCodes} />
                        </Card>
                        
                        {/* AI Insights side-by-side */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {comparisonData?.map((stock: any) => (
                                <Card key={stock.stockCode} className="border-none shadow-sm h-full flex flex-col">
                                    <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                                        <h4 className="text-[16px] font-bold text-toss-text-primary flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-toss-blue" />
                                            {stock.stockName} 요약
                                        </h4>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <p className="text-[14px] text-toss-text-secondary leading-relaxed mb-6">
                                            {stock.analysis?.reason || 'AI 분석 데이터를 가져오는 중입니다...'}
                                        </p>
                                        <ul className="space-y-3">
                                            {stock.analysis?.points?.slice(0, 2).map((point: string, idx: number) => (
                                                <li key={idx} className="bg-toss-bg p-3 rounded-xl text-[13px] text-toss-text-primary font-medium">
                                                    • {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);
}
