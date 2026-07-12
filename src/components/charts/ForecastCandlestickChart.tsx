import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { HistoricalData } from '@/types/stock.types';

interface ForecastCandlestickChartProps {
  historicalData: HistoricalData[];
  predictionData: { time: number; prediction: number }[];
  height?: number;
}

export const ForecastCandlestickChart = ({ historicalData, predictionData, height = 400 }: ForecastCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !historicalData || historicalData.length === 0) return;

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
        vertLines: { color: 'rgba(42, 46, 57, 0.1)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(197, 203, 206, 0.4)' },
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

    const seenTimes = new Set();
    const candleData = [];

    for (const item of historicalData) {
      // lightweight-charts requires numbers, skip if data is missing or null (e.g. market holidays)
      if (item.open == null || item.high == null || item.low == null || item.close == null) {
        continue;
      }
      
      const time = Math.floor(new Date(item.date).getTime() / 1000);
      if (!seenTimes.has(time)) {
        seenTimes.add(time);
        candleData.push({
          time,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        });
      }
    }

    // Sort ascending by time
    candleData.sort((a, b) => a.time - b.time);
    candlestickSeries.setData(candleData);

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });

    const volumeData = [];
    const seenVolumeTimes = new Set();

    for (const item of historicalData) {
      if (item.open == null || item.close == null || item.volume == null) {
        continue;
      }

      const time = Math.floor(new Date(item.date).getTime() / 1000);
      if (!seenVolumeTimes.has(time)) {
        seenVolumeTimes.add(time);
        volumeData.push({
          time: time as any,
          value: Number(item.volume),
          color: item.close >= item.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
        });
      }
    }

    volumeData.sort((a, b) => a.time - b.time);
    volumeSeries.setData(volumeData);

    // Add prediction line series
    if (predictionData && predictionData.length > 0) {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 2, // Dashed line
        crosshairMarkerVisible: true,
      });

      const lineData = [];
      const seenLineTimes = new Set();
      
      // Connect to the last historical candle
      const lastHistorical = candleData[candleData.length - 1];
      if (lastHistorical) {
        lineData.push({
          time: lastHistorical.time as any,
          value: lastHistorical.close,
        });
        seenLineTimes.add(lastHistorical.time);
      }

      for (const item of predictionData) {
        const time = Math.floor(item.time / 1000);
        if (!seenLineTimes.has(time)) {
          seenLineTimes.add(time);
          lineData.push({
            time: time as any,
            value: item.prediction,
          });
        }
      }

      lineData.sort((a, b) => a.time - b.time);
      lineSeries.setData(lineData);
    }

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chart.timeScale().fitContent();

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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [historicalData, predictionData, height]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
      style={{ height }}
    />
  );
};
