import React from 'react';
import { Activity, Settings, Plus, Search, RefreshCw } from 'lucide-react';

const toggle = {
  wrap: {
    display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 3,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  btn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10,
    border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#64748b',
    transition: 'all 0.15s', fontFamily: 'inherit',
  }),
};

const statBox = ({ label, value, color }) => (
  <div key={label} style={{
    background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 110,
  }}>
    <span style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</span>
    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
  </div>
);

export default function PageShell({
  icon: Icon,
  title,
  count,
  stats = [],
  hasTabs = false,
  activeTab = 'monitoring',
  onTabChange,
  onCreateClick,
  createLabel = 'Nouveau',
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filters,
  refreshCountdown,
  onRefresh,
  children,
}) {
  const isGestion = !hasTabs || activeTab === 'gestion';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 14 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {Icon && <Icon size={22} color="#3b82f6" />}
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', margin: 0, letterSpacing: '-0.3px' }}>
          {title}{' '}
          {count != null && (
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({count})</span>
          )}
        </h1>

        {hasTabs && (
          <div style={toggle.wrap} role="tablist" aria-label="Mode d'affichage">
            <button
              onClick={() => onTabChange?.('monitoring')}
              style={toggle.btn(activeTab === 'monitoring')}
              role="tab"
              aria-selected={activeTab === 'monitoring'}
            >
              <Activity size={14} /> Monitoring
            </button>
            <button
              onClick={() => onTabChange?.('gestion')}
              style={toggle.btn(activeTab === 'gestion')}
              role="tab"
              aria-selected={activeTab === 'gestion'}
            >
              <Settings size={14} /> Gestion
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {hasTabs && activeTab === 'monitoring' && refreshCountdown != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span>Refresh {refreshCountdown}s</span>
            {onRefresh && (
              <button onClick={onRefresh} aria-label="Rafraîchir les données" style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
              }}>
                <RefreshCw size={12} /> Rafraîchir
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {stats.map(statBox)}
        </div>
      )}

      {/* ── Filters + Search + Create ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {onSearchChange && (
          <div style={{ position: 'relative', flex: '1 1 180px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 8, color: '#f1f5f9', fontSize: '0.85rem', padding: '9px 12px 9px 34px',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {filters}

        {isGestion && onCreateClick && (
          <button onClick={onCreateClick} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            background: '#10b981', color: '#fff', fontFamily: 'inherit', transition: 'background 0.15s',
            marginLeft: 'auto',
          }}>
            <Plus size={16} /> {createLabel}
          </button>
        )}
      </div>

      {/* ── Body (children) ── */}
      {children}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
