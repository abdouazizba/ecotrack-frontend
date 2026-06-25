import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User,
} from 'lucide-react';
import { getTourneesByAgent } from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';

const STATUS_META = {
  pending:     { label: 'Planifiée', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  in_progress: { label: 'En cours',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  done:        { label: 'Terminée',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelled:   { label: 'Annulée',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6h → 19h

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d, n) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d) => isSameDay(d, new Date());

const parseHour = (str) => {
  if (!str) return null;
  const match = str.match(/^(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
};

const formatAgentName = (agent) => {
  const name = [agent.prenom, agent.nom].filter(Boolean).join(' ');
  return name || `Agent ${String(agent.id).slice(0, 6)}`;
};

const formatWeekRange = (monday) => {
  const sunday = addDays(monday, 6);
  const opts = { day: 'numeric', month: 'short' };
  const from = monday.toLocaleDateString('fr-FR', opts);
  const to = sunday.toLocaleDateString('fr-FR', { ...opts, year: 'numeric' });
  return `${from} — ${to}`;
};

export default function CalendrierAgentPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getTourneesByAgent(user.id);
      setTournees(Array.isArray(data) ? data : []);
    } catch {
      setTournees([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const tourneesByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((day) => {
      const key = day.toISOString().slice(0, 10);
      map[key] = [];
    });
    tournees.forEach((t) => {
      if (!t.date_prevue) return;
      const tDate = new Date(t.date_prevue);
      const key = tDate.toISOString().slice(0, 10);
      if (map[key]) map[key].push(t);
    });
    return map;
  }, [tournees, weekDays]);

  const navBtn = (extra = {}) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 8, border: 'none',
    cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
    transition: 'all 0.15s',
    ...extra,
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Calendar size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Calendrier</h1>
      </div>

      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={prevWeek} style={navBtn()} title="Semaine précédente"><ChevronLeft size={16} /></button>
        <button onClick={goToday} style={{ ...navBtn({ width: 'auto', padding: '0 14px', fontSize: '0.8rem', fontWeight: 500 }) }}>Aujourd'hui</button>
        <button onClick={nextWeek} style={navBtn()} title="Semaine suivante"><ChevronRight size={16} /></button>
        <span style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginLeft: 6 }}>
          {formatWeekRange(weekStart)}
        </span>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      {!loading && (
        <div style={{ background: '#1e2433', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {/* En-tête jours */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ padding: '10px 0' }} />
            {weekDays.map((day, i) => {
              const today = isToday(day);
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 8px', textAlign: 'center',
                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                    background: today ? 'rgba(59,130,246,0.06)' : 'transparent',
                  }}
                >
                  <p style={{ color: today ? '#3b82f6' : '#64748b', fontSize: '0.72rem', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase' }}>
                    {DAYS[i]}
                  </p>
                  <p style={{
                    color: today ? '#fff' : '#e2e8f0',
                    fontSize: '1rem', fontWeight: 700, margin: 0,
                    ...(today ? { background: '#3b82f6', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : {}),
                  }}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grille horaire */}
          <div style={{ position: 'relative' }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: 52, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div style={{ padding: '4px 8px 0 0', textAlign: 'right', color: '#475569', fontSize: '0.7rem', fontWeight: 500 }}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((day, di) => {
                  const key = day.toISOString().slice(0, 10);
                  const dayTournees = tourneesByDay[key] || [];
                  const matching = dayTournees.filter((t) => {
                    const h = parseHour(t.heure_debut);
                    return h === hour;
                  });

                  return (
                    <div
                      key={di}
                      style={{
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        padding: '2px 3px', position: 'relative',
                        background: isToday(day) ? 'rgba(59,130,246,0.02)' : 'transparent',
                      }}
                    >
                      {matching.map((t) => {
                        const meta = STATUS_META[t.status] || STATUS_META.pending;
                        const startH = parseHour(t.heure_debut) || hour;
                        const endH = parseHour(t.heure_fin) || startH + 2;
                        const span = Math.max(endH - startH, 1);
                        const chef = (t.agents || []).find((a) => a.role === 'CONDUCTEUR');

                        return (
                          <div
                            key={t.id}
                            onClick={() => navigate('/agent/tournees')}
                            style={{
                              position: 'absolute', left: 3, right: 3, top: 2,
                              height: `calc(${span * 100}% - 4px)`,
                              background: meta.bg,
                              borderLeft: `3px solid ${meta.color}`,
                              borderRadius: 6,
                              padding: '6px 8px',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              zIndex: 2,
                              transition: 'transform 0.1s',
                            }}
                            title={`${t.titre || t.code || 'Tournée'} — ${meta.label}`}
                          >
                            <p style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.titre || t.code || `Tournée #${t.id?.slice(0, 8)}`}
                            </p>
                            {t.heure_debut && (
                              <span style={{ color: meta.color, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                <Clock size={9} /> {t.heure_debut}{t.heure_fin ? ` - ${t.heure_fin}` : ''}
                              </span>
                            )}
                            {t.zone_nom && span > 1 && (
                              <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                <MapPin size={8} /> {t.zone_nom}
                              </span>
                            )}
                            {chef && span > 1 && (
                              <span style={{ color: '#64748b', fontSize: '0.62rem', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                <User size={8} /> {formatAgentName(chef)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Tournées sans heure — affichées en haut du jour (all-day style) */}
            {weekDays.some((day) => {
              const key = day.toISOString().slice(0, 10);
              return (tourneesByDay[key] || []).some((t) => !parseHour(t.heure_debut));
            }) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: 40 }}>
                  <div style={{ padding: '8px 8px 0 0', textAlign: 'right', color: '#475569', fontSize: '0.68rem' }}>
                    Journée
                  </div>
                  {weekDays.map((day, di) => {
                    const key = day.toISOString().slice(0, 10);
                    const noHour = (tourneesByDay[key] || []).filter((t) => !parseHour(t.heure_debut));

                    return (
                      <div key={di} style={{ borderLeft: '1px solid rgba(255,255,255,0.04)', padding: '4px 3px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {noHour.map((t) => {
                          const meta = STATUS_META[t.status] || STATUS_META.pending;
                          return (
                            <div
                              key={t.id}
                              onClick={() => navigate('/agent/tournees')}
                              style={{
                                background: meta.bg, borderLeft: `3px solid ${meta.color}`,
                                borderRadius: 5, padding: '4px 6px', cursor: 'pointer',
                              }}
                              title={`${t.titre || t.code || 'Tournée'} — ${meta.label}`}
                            >
                              <p style={{ color: '#e2e8f0', fontSize: '0.68rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.titre || t.code || `Tournée #${t.id?.slice(0, 8)}`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: meta.color }} />
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
