import React, { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';

export default function EchartsStatCard({
  title,
  value,
  subtitle,
  trend,
  type = 'gauge',
  color = '#16a34a',
  inverted = false,  // pour gauge : inverted=true → rouge=haut (ex. taux remplissage)
}) {
  const chartRef = useRef(null);
  const chartId  = useMemo(() => `echarts-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const chart = echarts.init(container, null, { renderer: 'canvas' });
    let option = {};
    const numValue = parseInt(value) || 0;

    if (type === 'gauge') {
      // inverted=true  → haut = mauvais (remplissage): vert→ambre→rouge
      // inverted=false → haut = bon  (résolution):    rouge→ambre→vert
      const axisColors = inverted
        ? [[0.5, '#10b981'], [0.8, '#f59e0b'], [1, '#ef4444']]
        : [[0.3, '#ef4444'], [0.7, '#f59e0b'], [1, '#10b981']];

      option = {
        series: [{
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          radius: '88%',
          center: ['50%', '55%'],
          min: 0, max: 100,
          splitNumber: 0,
          axisLine: { lineStyle: { width: 10, color: axisColors } },
          pointer: { itemStyle: { color }, length: '55%', width: 4 },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color,
            fontSize: 16,
            fontWeight: 'bold',
            offsetCenter: [0, '25%'],
          },
          data: [{ value: Math.min(numValue, 100) }],
        }],
      };
    } else if (type === 'line') {
      const data = [20, 35, 45, 38, 55, 48, numValue];
      option = {
        grid: { top: 8, right: 8, bottom: 8, left: 8 },
        xAxis: { type: 'category', boundaryGap: false, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false } },
        yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
        series: [{
          data,
          type: 'line',
          smooth: true,
          symbol: 'none',
          itemStyle: { color },
          lineStyle: { color, width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '50' },
              { offset: 1, color: color + '05' },
            ]),
          },
        }],
      };
    } else if (type === 'bar') {
      const data = [30, 45, 28, 52, 40, 35, numValue > 0 ? numValue : 30];
      option = {
        grid: { top: 8, right: 8, bottom: 8, left: 8 },
        xAxis: { type: 'category', data: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false } },
        yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
        series: [{
          data,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color },
              { offset: 1, color: color + '80' },
            ]),
            borderRadius: [3, 3, 0, 0],
          },
        }],
      };
    } else if (type === 'pie') {
      const total = Math.max(numValue, 1);
      option = {
        series: [{
          type: 'pie',
          radius: ['60%', '85%'],
          center: ['50%', '50%'],
          data: [
            { value: total, name: 'Actif', itemStyle: { color } },
            { value: Math.max(100 - total, 1), name: '', itemStyle: { color: color + '20' } },
          ],
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
        }],
      };
    }

    chart.setOption(option);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [value, type, color, inverted]);

  const trendUp = trend?.direction === 'up';

  return (
    <div className="echarts-stat-card">
      <div className="stat-card-header">
        <h3 className="stat-card-title">{title}</h3>
        {trend && (
          <span className={`stat-card-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div ref={chartRef} id={chartId} className="stat-chart" />
      <div className="stat-card-footer">
        <span className="stat-card-value" style={{ color }}>{value}</span>
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
