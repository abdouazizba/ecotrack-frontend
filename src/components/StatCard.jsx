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
    green: { bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
    blue: { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
    orange: { bg: '#fed7aa', text: '#ea580c', border: '#fb923c' },
    red: { bg: '#fecaca', text: '#dc2626', border: '#ef4444' },
  };

  const style = colorMap[color] || colorMap.green;

  return (
    <div className="stat-card" style={{ borderLeftColor: style.border }}>
      <div className="stat-header">
        <div className="stat-title">{title}</div>
        <div 
          className="stat-icon" 
          style={{ background: style.bg, color: style.text }}
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
          background: white;
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid #22c55e;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-title {
          font-size: 13px;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1);
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-subtitle {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-trend.up {
          color: #16a34a;
        }

        .stat-trend.down {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
