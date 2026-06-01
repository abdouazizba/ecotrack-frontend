import React, { useMemo } from 'react';
import * as echarts from 'echarts';

export default function EchartsStatCard({ 
  title, 
  value, 
  subtitle, 
  trend,
  type = 'gauge', // gauge, line, bar, pie
  color = '#16a34a'
}) {
  const chartId = useMemo(() => `chart-${Math.random()}`, []);

  React.useEffect(() => {
    const container = document.getElementById(chartId);
    if (!container) return;

    const chart = echarts.init(container, null, { renderer: 'canvas' });

    let option = {};

    if (type === 'gauge') {
      // Gauge chart pour les pourcentages
      option = {
        series: [
          {
            type: 'gauge',
            startAngle: 225,
            endAngle: -45,
            radius: '90%',
            center: ['50%', '50%'],
            min: 0,
            max: 100,
            splitNumber: 0,
            axisLine: {
              lineStyle: {
                width: 12,
                color: [
                  [0.3, '#ef4444'],
                  [0.7, '#f59e0b'],
                  [1, color],
                ],
              },
            },
            pointer: {
              itemStyle: {
                color: color,
              },
            },
            axisTick: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: color,
              fontSize: 20,
              fontWeight: 'bold',
              offsetCenter: [0, '30%'],
            },
            data: [{ value: Math.min(parseInt(value) || 0, 100) }],
          },
        ],
      };
    } else if (type === 'line') {
      // Mini line chart
      const mockData = [20, 35, 40, 55, 65, 75, 85, parseInt(value) || 0];
      option = {
        grid: { top: 10, right: 10, bottom: 10, left: 10 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            data: mockData,
            type: 'line',
            smooth: true,
            itemStyle: { color: color },
            lineStyle: { color: color, width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color + '40' },
                { offset: 1, color: color + '05' },
              ]),
            },
            symbol: 'none',
          },
        ],
      };
    } else if (type === 'bar') {
      // Mini bar chart
      const mockData = [30, 40, 25, 50, 45];
      option = {
        grid: { top: 10, right: 10, bottom: 10, left: 10 },
        xAxis: {
          type: 'category',
          data: ['L', 'M', 'M', 'J', 'V'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            data: mockData,
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color },
                { offset: 1, color: color + '80' },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };
    } else if (type === 'pie') {
      // Mini pie chart
      const total = parseInt(value) || 100;
      option = {
        series: [
          {
            type: 'pie',
            radius: ['65%', '90%'],
            center: ['50%', '50%'],
            itemStyle: {
              borderRadius: 4,
              borderColor: '#fff',
              borderWidth: 2,
            },
            data: [
              {
                value: total,
                name: 'Actif',
                itemStyle: { color: color },
              },
              {
                value: 100 - total,
                name: 'Inactif',
                itemStyle: { color: color + '20' },
              },
            ],
            label: { show: false },
          },
        ],
      };
    }

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [chartId, value, type, color]);

  return (
    <div className="echarts-stat-card">
      <div className="stat-card-header">
        <h3 className="stat-card-title">{title}</h3>
        {trend && (
          <span className={`stat-card-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div id={chartId} className="stat-chart"></div>
      <div className="stat-card-footer">
        <span className="stat-card-value">{value}</span>
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
