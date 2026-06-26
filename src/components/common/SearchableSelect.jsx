import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const overlay = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
  background: '#1e2433', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

const searchInput = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px 8px 32px',
  color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
};

const optionStyle = (active) => ({
  padding: '8px 12px', cursor: 'pointer', fontSize: '0.84rem',
  color: active ? '#10b981' : '#cbd5e1', fontWeight: active ? 600 : 400,
  background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
  transition: 'background 0.1s',
});

const triggerStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.88rem',
  cursor: 'pointer', boxSizing: 'border-box', textAlign: 'left', fontFamily: 'inherit',
};

export default function SearchableSelect({ value, options, onChange, placeholder, labelKey = 'label', valueKey = 'value' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const selected = options.find((o) => String(o[valueKey]) === String(value));
  const filtered = query.trim()
    ? options.filter((o) => (o[labelKey] || '').toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" style={triggerStyle} onClick={() => { setOpen(!open); setQuery(''); }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? '#e2e8f0' : '#64748b' }}>
          {selected ? selected[labelKey] : (placeholder || '— Choisir —')}
        </span>
        {value ? (
          <X size={14} color="#64748b" onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }} style={{ cursor: 'pointer', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
        )}
      </button>

      {open && (
        <div style={overlay}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#64748b', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              style={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', color: '#475569', fontSize: '0.82rem', textAlign: 'center' }}>Aucun résultat</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o[valueKey]}
                style={optionStyle(String(o[valueKey]) === String(value))}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = String(o[valueKey]) === String(value) ? 'rgba(16,185,129,0.08)' : 'transparent'; }}
                onClick={() => { onChange(o[valueKey]); setOpen(false); setQuery(''); }}
              >
                {o[labelKey]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
