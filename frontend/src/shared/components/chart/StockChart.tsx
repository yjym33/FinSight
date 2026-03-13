'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useTheme } from '@/shared/providers/ThemeProvider';
import api from '@/shared/api/api';

interface StockChartProps {
  stockCode: string;
  period: '1D' | '1W' | '1M' | '1Y';
}

export function StockChart({ stockCode, period }: StockChartProps) {
  const { settings } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const { stockPrices, subscribeStock, unsubscribeStock } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);

  // Helper for colors
  const getColors = (isUp: boolean) => {
    const style = settings?.chartColorStyle || 'kr';
    if (style === 'kr') {
      return isUp ? '#F04452' : '#3182F6'; // Red Up, Blue Down
    } else {
      return isUp ? '#00D084' : '#F04452'; // Green Up, Red Down
    }
  };

  // Initial Chart Setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = settings?.theme === 'dark';
    const textColor = isDark ? '#9CA3AF' : '#8B95A1';
    const gridColor = isDark ? '#374151' : '#F2F4F6';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: textColor,
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: textColor,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      handleScale: true,
      handleScroll: true,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#3182F6',
      topColor: '#3182F633',
      bottomColor: '#3182F600',
      lineWidth: 3,
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

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
  }, [settings?.theme]);

  // Fetch History and Subscribe
  useEffect(() => {
    const fetchHistory = async () => {
      if (!seriesRef.current) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/api/stocks/${stockCode}/chart`, {
          params: { period },
        });
        const history = response.data;
        if (history && history.length > 0) {
          seriesRef.current.setData(history);
          chartRef.current?.timeScale().fitContent();
          
          // Set initial color based on last two points if available
          if (history.length >= 2) {
            const last = history[history.length - 1].value;
            const prev = history[history.length - 2].value;
            const mainColor = getColors(last >= prev);
            seriesRef.current.applyOptions({
              lineColor: mainColor,
              topColor: `${mainColor}33`,
              bottomColor: `${mainColor}00`,
            });
          }
        } else {
          seriesRef.current.setData([]);
        }
      } catch (error) {
        console.error('Failed to fetch chart history:', error);
        seriesRef.current?.setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
    subscribeStock(stockCode);

    return () => {
      unsubscribeStock(stockCode);
    };
  }, [stockCode, period, subscribeStock, unsubscribeStock, settings?.chartColorStyle]);

  // Real-time Update
  useEffect(() => {
    const price = stockPrices[stockCode];
    if (price && seriesRef.current && period === '1D') {
      const time = Math.floor(new Date(price.timestamp).getTime() / 1000);
      seriesRef.current.update({
        time: time as any,
        value: price.price,
      });

      const isUp = price.change >= 0;
      const mainColor = getColors(isUp);
      seriesRef.current.applyOptions({
        lineColor: mainColor,
        topColor: `${mainColor}33`,
        bottomColor: `${mainColor}00`,
      });
    }
  }, [stockCode, stockPrices, period, settings?.chartColorStyle]);

  const currentPrice = stockPrices[stockCode];
  const isUp = currentPrice ? currentPrice.change >= 0 : false;
  const statusColorClass = isUp 
    ? (settings?.chartColorStyle === 'kr' ? 'text-[#F04452]' : 'text-[#00D084]')
    : (settings?.chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-[#F04452]');

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-toss-blue border-t-transparent" />
        </div>
      )}
      <div className="mb-6 flex items-end gap-3">
        {currentPrice && (
          <>
            <span className="text-[32px] font-bold text-toss-text-primary">
              {currentPrice.price.toLocaleString()}원
            </span>
            <span className={`mb-1.5 text-[16px] font-bold ${statusColorClass}`}>
              {isUp ? '▲' : '▼'}
              {Math.abs(currentPrice.change).toLocaleString()}원 ({currentPrice.changePercent}%)
            </span>
          </>
        )}
      </div>
      <div ref={chartContainerRef} className="rounded-2xl" />
    </div>
  );
}
