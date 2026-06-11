import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function ChartComponent({ 
  title, 
  type = 'line', 
  data,
  height = 300,
  theme = 'light'
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = theme === 'dark';
    const colors = isDark 
      ? { text: '#fff', grid: '#374151', border: '#22c55e', bg: 'rgba(0, 0, 0, 0.7)' }
      : { text: '#1a1a1a', grid: '#e5e7eb', border: '#22c55e', bg: 'rgba(255, 255, 255, 0.9)' };

    chartInstance.current = echarts.init(chartRef.current);

    const baseOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textStyle: { color: colors.text },
        axisPointer: { lineStyle: { color: colors.border } },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      textStyle: { color: colors.text },
    };

    let option = baseOption;

    if (type === 'line') {
      option = {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.labels,
          boundaryGap: false,
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { color: colors.text },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { color: colors.text },
          splitLine: { lineStyle: { color: colors.grid } },
        },
        series: [
          {
            data: data.values,
            type: 'line',
            smooth: 0.3,
            itemStyle: { color: '#22c55e' },
            lineStyle: { color: '#22c55e', width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0.05)' },
              ]),
            },
            symbolSize: 6,
          },
        ],
      };
    } else if (type === 'bar') {
      option = {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.labels,
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { color: colors.text },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { color: colors.text },
          splitLine: { lineStyle: { color: colors.grid } },
        },
        series: [
          {
            data: data.values,
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' },
              ]),
              borderRadius: [8, 8, 0, 0],
            },
          },
        ],
      };
    } else if (type === 'pie') {
      option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textStyle: { color: colors.text },
        },
        series: [
          {
            name: title,
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: data.items || [],
            itemStyle: {
              borderColor: isDark ? '#1d2434' : '#fff',
              borderWidth: 2,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            label: {
              color: colors.text,
              fontSize: 12,
            },
          },
        ],
      };
    }

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data, type, title, theme]);

  return (
    <div
      ref={chartRef}
      className="chart-container"
      style={{ 
        height: `${height}px`,
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.5))'
          : '#fff',
        borderRadius: '12px',
        border: theme === 'dark' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid #e5e7eb',
        backdropFilter: theme === 'dark' ? 'blur(4px)' : 'none',
      }}
    />
  );
}
