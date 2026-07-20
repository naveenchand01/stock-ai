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
  const tooltipRef = useRef<HTMLDivElement>(null);
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
      crosshair: { mode: CrosshairMode.Magnet },
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
    const tzOffset = new Date().getTimezoneOffset() * 60; // Offset in seconds

    for (const item of historicalData) {
      // lightweight-charts requires numbers, skip if data is missing or null (e.g. market holidays)
      if (item.open == null || item.high == null || item.low == null || item.close == null) {
        continue;
      }
      
      const time = Math.floor(new Date(item.date).getTime() / 1000) - tzOffset;
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

      const time = Math.floor(new Date(item.date).getTime() / 1000) - tzOffset;
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
      
      // Determine a step size for interpolation: 1 day (86400s) for daily+ intervals, 1 min (60s) for intraday
      const lastTimeDiff = candleData.length > 1 ? candleData[candleData.length - 1].time - candleData[candleData.length - 2].time : 60;
      const stepSize = lastTimeDiff > 0 ? lastTimeDiff : 60;

      const lastHistorical = candleData[candleData.length - 1];
      let prevPoint = lastHistorical ? { time: lastHistorical.time, value: lastHistorical.close } : null;

      if (prevPoint) {
        lineData.push({ time: prevPoint.time as any, value: prevPoint.value });
        seenLineTimes.add(prevPoint.time);
      }

      for (const item of predictionData) {
        const time = Math.floor(item.time / 1000) - tzOffset;
        
        // Interpolate points between prevPoint and current time to make the crosshair glide smoothly
        if (prevPoint && time > prevPoint.time + stepSize) {
          const timeGap = time - prevPoint.time;
          const valueGap = item.prediction - prevPoint.value;
          
          for (let t = prevPoint.time + stepSize; t < time; t += stepSize) {
            if (!seenLineTimes.has(t)) {
              seenLineTimes.add(t);
              const progress = (t - prevPoint.time) / timeGap;
              const interpolatedValue = prevPoint.value + (valueGap * progress);
              lineData.push({
                time: t as any,
                value: interpolatedValue
              });
            }
          }
        }

        if (!seenLineTimes.has(time)) {
          seenLineTimes.add(time);
          lineData.push({
            time: time as any,
            value: item.prediction,
          });
        }
        
        prevPoint = { time, value: item.prediction };
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

    // Setup Crosshair Tooltip
    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current;
      if (!tooltip || !chartContainerRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        tooltip.style.display = 'none';
        return;
      }

      const dateStr = new Date((Number(param.time) + tzOffset) * 1000).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      let html = `<div style="font-weight:bold; margin-bottom:4px; color:#E5E7EB;">${dateStr}</div>`;

      const candleInfo: any = param.seriesData.get(candlestickSeries);
      if (candleInfo && candleInfo.close !== undefined) {
        const color = candleInfo.close >= candleInfo.open ? '#10B981' : '#EF4444';
        html += `<div style="color:${color}; font-size:13px;">
          O: ${candleInfo.open.toFixed(2)} &nbsp;
          H: ${candleInfo.high.toFixed(2)} <br/>
          L: ${candleInfo.low.toFixed(2)} &nbsp;
          C: ${candleInfo.close.toFixed(2)}
        </div>`;
      }

      // Check if prediction line exists here
      if (predictionData && predictionData.length > 0) {
        const predInfo: any = param.seriesData.get(lineSeries);
        if (predInfo && predInfo.value !== undefined) {
          html += `<div style="color:#3b82f6; font-size:13px; font-weight:bold; margin-top:4px;">
            ML Prediction: ₹${predInfo.value.toFixed(2)}
          </div>`;
        }
      }

      tooltip.innerHTML = html;
      tooltip.style.display = 'block';

      // Position tooltip avoiding edges
      const tooltipWidth = 180;
      const tooltipHeight = 90;
      const yOffset = param.point.y - tooltipHeight - 10 > 0 ? param.point.y - tooltipHeight - 10 : param.point.y + 10;
      let xOffset = param.point.x + 15;
      if (xOffset + tooltipWidth > chartContainerRef.current.clientWidth) {
        xOffset = param.point.x - tooltipWidth - 15;
      }
      
      tooltip.style.left = `${xOffset}px`;
      tooltip.style.top = `${yOffset}px`;
    });

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
    <div className="relative w-full h-full">
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4"
        style={{ height }}
      />
      {/* Tooltip Overlay */}
      <div
        ref={tooltipRef}
        className="absolute z-50 pointer-events-none rounded bg-[#1a1f2e]/90 border border-border shadow-xl backdrop-blur-md p-2 text-sm"
        style={{ display: 'none', transition: 'none' }}
      />
    </div>
  );
};
