import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function ChartCard({ title, option, height = 300 }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [option]);

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div 
        ref={chartRef} 
        className="chart-container"
        style={{ height: `${height}px` }}
      />

      <style>{`
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .chart-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .chart-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #22c55e;
          padding-bottom: 12px;
        }

        .chart-container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
