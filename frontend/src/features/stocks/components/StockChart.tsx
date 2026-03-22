'use client';

import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface StockChartProps {
  data: { time: string; value: number }[];
  color?: string;
  isUp?: boolean;
}

export const StockChart = memo(function StockChart({ data, color, isUp = true }: StockChartProps) {
  const { settings } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  // Helper for colors based on style
  const getThemeColor = (up: boolean) => {
    const style = settings?.chartColorStyle || 'kr';
    if (style === 'kr') {
      return up ? '#F04452' : '#3182F6'; // KR: Red Up, Blue Down
    } else {
      return up ? '#00D084' : '#F04452'; // US: Green Up, Red Down
    }
  };

  const mainColor = color || getThemeColor(isUp);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = settings?.theme === 'dark';
    const textColor = isDark ? '#9CA3AF' : '#8B95A1';
    const gridColor = isDark ? '#374151' : '#F2F4F6';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: textColor,
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: textColor,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: mainColor,
      topColor: `${mainColor}40`,
      bottomColor: `${mainColor}00`,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
    });

    series.setData(data);
    
    chartRef.current = chart;
    lineSeriesRef.current = series as any;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, mainColor, settings?.theme]);

  // Use a unique display name for debugging
  return <div ref={chartContainerRef} className="w-full" />;
});

// Use a unique display name for debugging
StockChart.displayName = 'StockChart';
