import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Search, Trophy, Star, Award,
  ChevronLeft, ChevronRight, Filter, AlertCircle,
} from 'lucide-react';
import { getCitoyens } from '../../../services/api';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

// ── Styles ──────────────────────────────────────────────────────
const colors = {
  bg: '#0f1724',
  card: '#1e2433',
  cardHover: '#252d3f',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#10b981',
  accentBg: 'rgba(16,185,129,0.12)',
  border: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.05)',
  gold: '#fbbf24',
  silver: '#9ca3af',
  bronze: '#d97706',
  danger: '#ef4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  blue: '#3b82f6',
  blueBg: 'rgba(59,130,246,0.12)',
  purple: '#a855f7',
  purpleBg: 'rgba(168,85,247,0.12)',
};

const s = {
  page: {
    padding: '24px 32px',
    minHeight: '100vh',
    color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 16,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 10,
    background: colors.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  badge: {
    fontSize: 13, fontWeight: 600, padding: '2px 10px', borderRadius: 12,
    background: colors.accentBg, color: colors.accent, marginLeft: 8,
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: colors.inputBg, borderRadius: 8, padding: '8px 14px',
    border: `1px solid ${colors.border}`, minWidth: 260,
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: colors.text, fontSize: 14, flex: 1,
  },

  // Stats row
  statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  statBox: {
    flex: '1 1 180px', background: colors.card, borderRadius: 12, padding: '18px 20px',
    border: `1px solid ${colors.border}`,
  },
  statLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: 26, fontWeight: 700 },

  // Main layout
  mainLayout: { display: 'flex', gap: 24 },
  leftPanel: { flex: 1, minWidth: 0 },
  rightPanel: {
    width: 280, flexShrink: 0,
  },

  // Toolbar
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap',
  },
  filterBtn: (active) => ({
    padding: '6px 16px', borderRadius: 8, border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? colors.accentBg : 'transparent',
    color: active ? colors.accent : colors.textMuted,
    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  }),
  sortSelect: {
    padding: '6px 12px', borderRadius: 8, background: colors.inputBg,
    border: `1px solid ${colors.border}`, color: colors.text, fontSize: 13,
    outline: 'none', cursor: 'pointer', marginLeft: 'auto',
  },

  // Cards grid
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  card: {
    background: colors.card, borderRadius: 12, padding: 20,
    border: `1px solid ${colors.border}`, transition: 'border-color 0.2s, transform 0.15s',
    cursor: 'default',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardName: { fontSize: 16, fontWeight: 600, margin: 0 },
  cardEmail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  activeBadge: (active) => ({
    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10,
    background: active ? colors.accentBg : colors.dangerBg,
    color: active ? colors.accent : colors.danger,
  }),
  cardStats: { display: 'flex', gap: 16, marginTop: 12 },
  cardStat: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textMuted,
  },
  scoreBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 8,
    background: colors.accentBg, color: colors.accent,
    fontSize: 13, fontWeight: 600,
  },
  cardDate: { fontSize: 12, color: colors.textMuted, marginTop: 10 },

  // Pagination
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  pageBtn: (active, disabled) => ({
    width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${active ? colors.accent : colors.border}`,
    background: active ? colors.accentBg : 'transparent',
    color: active ? colors.accent : disabled ? 'rgba(255,255,255,0.2)' : colors.textMuted,
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
    transition: 'all 0.2s',
  }),

  // Sidebar
  sidebar: {
    background: colors.card, borderRadius: 12, padding: 20,
    border: `1px solid ${colors.border}`, position: 'sticky', top: 24,
  },
  sidebarTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 16, fontWeight: 600, marginBottom: 16,
  },
  rankItem: (index) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0',
    borderBottom: `1px solid ${colors.border}`,
  }),
  rankNumber: (index) => ({
    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    background: index === 0 ? 'rgba(251,191,36,0.15)' : index === 1 ? 'rgba(156,163,175,0.15)' : index === 2 ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.05)',
    color: index === 0 ? colors.gold : index === 1 ? colors.silver : index === 2 ? colors.bronze : colors.textMuted,
  }),
  rankInfo: { flex: 1, minWidth: 0 },
  rankName: { fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rankScore: { fontSize: 12, color: colors.accent },
  rankSignalements: { fontSize: 11, color: colors.textMuted, marginLeft: 'auto', whiteSpace: 'nowrap' },

  // Loading / error / empty
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 60, color: colors.textMuted,
  },

  // Responsive sidebar hidden on narrow
  '@media(max-width:900px)': { rightPanel: { display: 'none' } },
};

const MEDAL = ['gold', 'silver', 'bronze'];
const medalEmoji = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CitoyensPage() {
  const [citoyens, setCitoyens] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('score');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Fetch citoyens for current page
  const fetchPage = useCallback(async (p, s, srch) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCitoyens(p, PAGE_SIZE, s, srch);
      setCitoyens(result.citoyens);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err) {
      setError('Erreur lors du chargement des citoyens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch leaderboard (top 10 by score)
  const fetchLeaderboard = useCallback(async () => {
    try {
      const result = await getCitoyens(1, 10, 'score', '');
      setLeaderboard(result.citoyens);
    } catch {
      // silently fail for leaderboard
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPage(1, sort, search);
    fetchLeaderboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearch = (value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, sort, value);
    }, DEBOUNCE_MS);
  };

  const handleSort = (newSort) => {
    setSort(newSort);
    setPage(1);
    fetchPage(1, newSort, search);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchPage(newPage, sort, search);
  };

  // Client-side filter for active/inactive
  const filteredCitoyens = citoyens.filter((c) => {
    if (statusFilter === 'active') return c.is_active === true;
    if (statusFilter === 'inactive') return c.is_active === false;
    return true;
  });

  // Compute stats from the currently displayed page (total from server)
  const stats = {
    total,
    actifs: citoyens.filter((c) => c.is_active === true).length,
    scoreMoyen: citoyens.length > 0
      ? Math.round(citoyens.reduce((sum, c) => sum + (c.score_reputation || 0), 0) / citoyens.length)
      : 0,
    totalSignalements: citoyens.reduce((sum, c) => sum + (c.nombre_signalements || 0), 0),
  };

  // Pagination buttons
  const paginationButtons = () => {
    const btns = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      btns.push(1);
      if (start > 2) btns.push('...');
    }
    for (let i = start; i <= end; i++) btns.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) btns.push('...');
      btns.push(totalPages);
    }
    return btns;
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>
            <Users size={22} color={colors.accent} />
          </div>
          <div>
            <h1 style={s.title}>
              Citoyens
              <span style={s.badge}>{total}</span>
            </h1>
          </div>
        </div>
        <div style={s.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <input
            style={s.searchInput}
            placeholder="Rechercher par nom, email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <div style={s.statLabel}>Total citoyens</div>
          <div style={{ ...s.statValue, color: colors.accent }}>{total}</div>
        </div>
        <div style={s.statBox}>
          <div style={s.statLabel}>Actifs (page)</div>
          <div style={{ ...s.statValue, color: colors.blue }}>{stats.actifs}</div>
        </div>
        <div style={s.statBox}>
          <div style={s.statLabel}>Score moyen (page)</div>
          <div style={{ ...s.statValue, color: colors.gold }}>{stats.scoreMoyen}</div>
        </div>
        <div style={s.statBox}>
          <div style={s.statLabel}>Signalements (page)</div>
          <div style={{ ...s.statValue, color: colors.purple }}>{stats.totalSignalements}</div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={s.mainLayout}>
        {/* Left: cards */}
        <div style={s.leftPanel}>
          {/* Toolbar */}
          <div style={s.toolbar}>
            <Filter size={16} color={colors.textMuted} />
            {['all', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                style={s.filterBtn(statusFilter === f)}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Inactifs'}
              </button>
            ))}

            <select
              style={s.sortSelect}
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="score">Trier par Score</option>
              <option value="signalements">Trier par Signalements</option>
              <option value="date">Trier par Date inscription</option>
            </select>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div style={s.center}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: colors.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: 12, fontSize: 14 }}>Chargement des citoyens...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ ...s.center, color: colors.danger }}>
              <AlertCircle size={36} />
              <p style={{ marginTop: 12, fontSize: 14 }}>{error}</p>
              <button
                style={{ ...s.filterBtn(true), marginTop: 12 }}
                onClick={() => fetchPage(page, sort, search)}
              >
                Reessayer
              </button>
            </div>
          )}

          {!loading && !error && filteredCitoyens.length === 0 && (
            <div style={s.center}>
              <Users size={40} color={colors.textMuted} />
              <p style={{ marginTop: 12, fontSize: 14 }}>Aucun citoyen trouv{'é'}</p>
            </div>
          )}

          {/* Cards grid */}
          {!loading && !error && filteredCitoyens.length > 0 && (
            <>
              <div style={s.grid}>
                {filteredCitoyens.map((c) => (
                  <div key={c.id} style={s.card}>
                    <div style={s.cardTop}>
                      <div>
                        <p style={s.cardName}>
                          {c.firstName} {c.lastName}
                        </p>
                        <p style={s.cardEmail}>{c.email}</p>
                      </div>
                      <span style={s.activeBadge(c.is_active)}>
                        {c.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <div style={s.cardStats}>
                      <div style={s.scoreBadge}>
                        <Star size={14} />
                        {c.score_reputation ?? '-'}
                      </div>
                      <div style={s.cardStat}>
                        <AlertCircle size={14} color={colors.purple} />
                        {c.nombre_signalements ?? 0} signalements
                      </div>
                    </div>

                    <div style={s.cardDate}>
                      Inscrit le {formatDate(c.created_at)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button
                    style={s.pageBtn(false, page <= 1)}
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {paginationButtons().map((btn, i) =>
                    btn === '...' ? (
                      <span key={`dots-${i}`} style={{ color: colors.textMuted, fontSize: 13 }}>...</span>
                    ) : (
                      <button
                        key={btn}
                        style={s.pageBtn(btn === page, false)}
                        onClick={() => handlePageChange(btn)}
                      >
                        {btn}
                      </button>
                    )
                  )}

                  <button
                    style={s.pageBtn(false, page >= totalPages)}
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: leaderboard sidebar */}
        <div style={s.rightPanel}>
          <div style={s.sidebar}>
            <div style={s.sidebarTitle}>
              <Trophy size={18} color={colors.gold} />
              Classement
            </div>

            {leaderboard.length === 0 && (
              <p style={{ fontSize: 13, color: colors.textMuted }}>Aucune donnee</p>
            )}

            {leaderboard.map((c, i) => (
              <div key={c.id} style={s.rankItem(i)}>
                <div style={s.rankNumber(i)}>
                  {i < 3 ? medalEmoji(i) : i + 1}
                </div>
                <div style={s.rankInfo}>
                  <div style={s.rankName}>{c.firstName} {c.lastName}</div>
                  <div style={s.rankScore}>
                    <Star size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {c.score_reputation ?? 0}
                  </div>
                </div>
                <div style={s.rankSignalements}>
                  {c.nombre_signalements ?? 0} sig.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
