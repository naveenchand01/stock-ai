import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { HistoricalData } from '@/types/stock.types';

interface CandlestickChartProps {
  data: HistoricalData[];
  height?: number;
}

export const CandlestickChart = ({ data, height = 400 }: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      width: chartContainerRef.current.clientWidth,
      height,
      grid: {
        vertLines: {
          color: 'rgba(42, 46, 57, 0.1)',
        },
        horzLines: {
          color: 'rgba(42, 46, 57, 0.1)',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Transform data for lightweight-charts
    const seenTimes = new Set();
    const chartData = [];

    for (const item of data) {
      const time = Math.floor(new Date(item.date).getTime() / 1000);
      if (!seenTimes.has(time)) {
        seenTimes.add(time);
        chartData.push({
          time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        });
      }
    }

    candlestickSeries.setData(chartData);

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as an overlay by setting a blank priceScaleId
    });

    const volumeData = [];
    const seenVolumeTimes = new Set();

    for (const item of data) {
      const time = Math.floor(new Date(item.date).getTime() / 1000);
      if (!seenVolumeTimes.has(time)) {
        seenVolumeTimes.add(time);
        volumeData.push({
          time: time as any, // type assertion to bypass Time mismatch
          value: item.volume,
          color: item.close >= item.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
        });
      }
    }

    volumeSeries.setData(volumeData);

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
      style={{ height }}
    />
  );
};
