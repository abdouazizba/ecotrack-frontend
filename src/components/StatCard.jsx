import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'green',
  trend = null,
  subtitle = null 
}) {
  const colorMap = {
    green: { bg: '#d1fae5', text: '#059669', border: '#10b981', gradient: '#ecfdf5' },
    blue: { bg: '#dbeafe', text: '#0284c7', border: '#0ea5e9', gradient: '#f0f9ff' },
    orange: { bg: '#fed7aa', text: '#d97706', border: '#f59e0b', gradient: '#fffbeb' },
    red: { bg: '#fecaca', text: '#dc2626', border: '#ef4444', gradient: '#fef2f2' },
  };

  const style = colorMap[color] || colorMap.green;

  return (
    <div className="stat-card" style={{ borderTopColor: style.border, borderLeftColor: style.border }}>
      <div className="stat-header">
        <div className="stat-title">{title}</div>
        <div 
          className="stat-icon" 
          style={{ background: style.gradient, color: style.text }}
        >
          <Icon size={24} />
        </div>
      </div>

      <div className="stat-value" style={{ color: style.text }}>
        {value}
      </div>

      {subtitle && (
        <div className="stat-subtitle">{subtitle}</div>
      )}

      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
          <span>{trend.value}%</span>
        </div>
      )}

      <style>{`
        .stat-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.08);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .stat-title {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.08);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }

        .stat-value {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -1px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          z-index: 1;
          line-height: 1;
        }

        .stat-subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 1;
          padding: 6px 10px;
          border-radius: 8px;
          width: fit-content;
        }

        .stat-trend.up {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }

        .stat-trend.down {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
      `}</style>
    </div>
  );
}
