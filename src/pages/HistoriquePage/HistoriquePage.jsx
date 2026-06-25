import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History, Search, ChevronLeft, ChevronRight, X,
  AlertTriangle, Truck, Users, Package, Calendar,
  Clock, MapPin, FileText, CheckCircle, XCircle,
  Loader, Filter,
} from 'lucide-react';
import {
  getSignalements, getTournees, getContainers, getCapteurs, getUsers,
} from '../../services/api';

const PAGE_SIZE = 20;

const TYPE_COLORS = {
  signalement: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  tournee:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  conteneur:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  utilisateur: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
};

const TYPE_ICONS = {
  signalement: AlertTriangle,
  tournee:     Truck,
  conteneur:   Package,
  utilisateur: Users,
};

const TYPE_LABELS = {
  signalement: 'Signalement',
  tournee:     'Tournée',
  conteneur:   'Conteneur',
  utilisateur: 'Utilisateur',
};

const SIG_TYPE_LABELS = {
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  overflowing: 'Débordement',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const STATUS_COLORS = {
  pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  in_progress: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  closed:      { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  done:        { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  rejected:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  cancelled:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const STATUS_LABELS = {
  pending:     'En attente',
  in_progress: 'En cours',
  closed:      'Fermé',
  rejected:    'Rejeté',
  done:        'Terminée',
  cancelled:   'Annulée',
};

const PRIORITY_LABELS = {
  low:      'Basse',
  medium:   'Normale',
  high:     'Haute',
  critical: 'Critique',
};

const FILTER_TYPES = [
  { value: 'all',         label: 'Tous' },
  { value: 'signalement', label: 'Signalements' },
  { value: 'tournee',     label: 'Tournées' },
];

const DATE_RANGES = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d',    label: '7 jours' },
  { value: '30d',   label: '30 jours' },
  { value: '90d',   label: '3 mois' },
  { value: 'all',   label: 'Tout' },
];

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHour < 24) return `Il y a ${diffHour}h`;
  if (diffDay === 1) return 'Hier';
  if (diffDay < 7) return `Il y a ${diffDay} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getDateGroup = (dateStr) => {
  if (!dateStr) return 'Date inconnue';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateOnly.getTime() === today.getTime()) return "Aujourd'hui";
  if (dateOnly.getTime() === yesterday.getTime()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const isInDateRange = (dateStr, range) => {
  if (range === 'all' || !dateStr) return true;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') return date >= today;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 0;
  if (days) {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days);
    return date >= cutoff;
  }
  return true;
};

// ============================================
// BUILD EVENTS — chronological action timeline
// ============================================

const buildEvents = (signalements, tournees, _containers, _capteurs, users) => {
  const events = [];

  // Map user IDs → names for agent resolution
  const userMap = {};
  (Array.isArray(users) ? users : []).forEach((u) => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    userMap[u.id] = name || u.email || u.id?.slice(0, 8);
  });

  const resolveAgent = (id) => (id ? userMap[id] || null : null);

  const resolveTeam = (agents) => {
    if (!Array.isArray(agents) || agents.length === 0) return null;
    return agents
      .map((a) => {
        const name = resolveAgent(a.id);
        const role = a.role === 'CONDUCTEUR' ? 'Conducteur' : 'Collecteur';
        return name ? `${name} (${role})` : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  // ── SIGNALEMENTS ──────────────────────────────────────────────────
  (Array.isArray(signalements) ? signalements : []).forEach((sig) => {
    const typeLabel = SIG_TYPE_LABELS[sig.type] || sig.type || 'Signalement';
    const agentName = resolveAgent(sig.agent_id);

    if (sig.status === 'pending') {
      events.push({
        id: `sig-${sig.id}`,
        type: 'signalement',
        subtype: 'create',
        title: `Nouveau signalement : ${typeLabel}`,
        description: sig.description || 'Aucune description',
        date: sig.created_at,
        status: 'pending',
        priority: sig.priority,
        agent: null,
        rawData: sig,
      });
    }

    if (sig.status === 'in_progress') {
      events.push({
        id: `sig-${sig.id}`,
        type: 'signalement',
        subtype: 'in_progress',
        title: `Signalement pris en charge : ${typeLabel}`,
        description: agentName
          ? `Pris en charge par ${agentName} — ${sig.description || ''}`
          : sig.description || 'En cours de traitement',
        date: sig.updated_at || sig.created_at,
        status: 'in_progress',
        priority: sig.priority,
        agent: agentName,
        rawData: sig,
      });
    }

    if (sig.status === 'closed') {
      events.push({
        id: `sig-${sig.id}`,
        type: 'signalement',
        subtype: 'close',
        title: `Signalement résolu : ${typeLabel}`,
        description: [
          agentName ? `Résolu par ${agentName}` : null,
          sig.notes_resolution,
          sig.description,
        ].filter(Boolean).join(' — '),
        date: sig.date_resolution || sig.updated_at || sig.created_at,
        status: 'closed',
        priority: sig.priority,
        agent: agentName,
        rawData: sig,
      });
    }

    if (sig.status === 'rejected') {
      events.push({
        id: `sig-${sig.id}`,
        type: 'signalement',
        subtype: 'reject',
        title: `Signalement rejeté : ${typeLabel}`,
        description: sig.motif_rejet || sig.notes_resolution || 'Signalement rejeté',
        date: sig.date_resolution || sig.updated_at || sig.created_at,
        status: 'rejected',
        priority: sig.priority,
        agent: agentName,
        rawData: sig,
      });
    }
  });

  // ── TOURNÉES ──────────────────────────────────────────────────────
  (Array.isArray(tournees) ? tournees : []).forEach((t) => {
    const team = resolveTeam(t.agents);

    if (t.status === 'pending') {
      events.push({
        id: `tour-${t.id}`,
        type: 'tournee',
        subtype: 'pending',
        title: `Tournée planifiée ${t.code || ''}`,
        description: [t.zone_nom, team].filter(Boolean).join(' — ') || 'Tournée planifiée',
        date: t.date_prevue || t.created_at,
        status: 'pending',
        agent: team,
        rawData: t,
      });
    }

    if (t.status === 'in_progress') {
      events.push({
        id: `tour-${t.id}`,
        type: 'tournee',
        subtype: 'in_progress',
        title: `Tournée en cours ${t.code || ''}`,
        description: [
          t.zone_nom,
          t.heure_debut ? `Début : ${t.heure_debut}` : null,
          t.conteneurs_collectes ? `${t.conteneurs_collectes} conteneurs collectés` : null,
          team,
        ].filter(Boolean).join(' — '),
        date: t.date_prevue || t.updated_at || t.created_at,
        status: 'in_progress',
        agent: team,
        rawData: t,
      });
    }

    if (t.status === 'done') {
      events.push({
        id: `tour-${t.id}`,
        type: 'tournee',
        subtype: 'done',
        title: `Tournée terminée ${t.code || ''}`,
        description: [
          t.zone_nom,
          t.heure_debut && t.heure_fin ? `${t.heure_debut} → ${t.heure_fin}` : null,
          t.distance_km != null ? `${t.distance_km} km` : null,
          t.conteneurs_collectes ? `${t.conteneurs_collectes} conteneurs` : null,
          team,
          t.notes,
        ].filter(Boolean).join(' — '),
        date: t.date_prevue || t.updated_at || t.created_at,
        status: 'done',
        agent: team,
        rawData: t,
      });
    }

    if (t.status === 'cancelled') {
      events.push({
        id: `tour-${t.id}`,
        type: 'tournee',
        subtype: 'cancelled',
        title: `Tournée annulée ${t.code || ''}`,
        description: [t.zone_nom, t.notes, team].filter(Boolean).join(' — '),
        date: t.date_prevue || t.updated_at || t.created_at,
        status: 'cancelled',
        agent: team,
        rawData: t,
      });
    }
  });

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
};

// ============================================
// COMPONENT
// ============================================

export default function HistoriquePage() {
  const [signalements, setSignalements] = useState([]);
  const [tournees, setTournees]         = useState([]);
  const [containers, setContainers]     = useState([]);
  const [capteurs, setCapteurs]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange]   = useState('30d');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sigData, tourData, contData, capData, userData] = await Promise.all([
        getSignalements().catch(() => []),
        getTournees().catch(() => []),
        getContainers().catch(() => []),
        getCapteurs().catch(() => []),
        getUsers().catch(() => []),
      ]);
      setSignalements(Array.isArray(sigData) ? sigData : []);
      setTournees(Array.isArray(tourData) ? tourData : []);
      setContainers(Array.isArray(contData) ? contData : []);
      setCapteurs(Array.isArray(capData) ? capData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allEvents = useMemo(
    () => buildEvents(signalements, tournees, containers, capteurs, users),
    [signalements, tournees, containers, capteurs, users]
  );

  const filteredEvents = useMemo(() => {
    let list = allEvents;
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter);
    list = list.filter((e) => isInDateRange(e.date, dateRange));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q) ||
          (e.agent || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEvents, typeFilter, dateRange, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: allEvents.length,
      today: allEvents.filter((e) => new Date(e.date) >= today).length,
      signalements: allEvents.filter((e) => e.type === 'signalement').length,
      tournees: allEvents.filter((e) => e.type === 'tournee').length,
    };
  }, [allEvents]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginated = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [typeFilter, dateRange, search]);
  useEffect(() => {
    if (selected && !filteredEvents.find((e) => e.id === selected.id)) setSelected(null);
  }, [filteredEvents, selected]);

  const groupedEvents = useMemo(() => {
    const groups = [];
    let currentGroup = null;
    paginated.forEach((event) => {
      const group = getDateGroup(event.date);
      if (!currentGroup || currentGroup.label !== group) {
        currentGroup = { label: group, events: [] };
        groups.push(currentGroup);
      }
      currentGroup.events.push(event);
    });
    return groups;
  }, [paginated]);

  // ── RENDER DETAIL PANEL ───────────────────────────────────────────

  const renderDetail = () => {
    if (!selected) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#475569' }}>
          <History size={48} strokeWidth={1} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Sélectionnez un événement</p>
        </div>
      );
    }

    const tc = TYPE_COLORS[selected.type] || TYPE_COLORS.signalement;
    const sc = STATUS_COLORS[selected.status] || STATUS_COLORS.pending;
    const Icon = TYPE_ICONS[selected.type] || FileText;
    const raw = selected.rawData || {};

    return (
      <div style={{ flex: 1, background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} />
            </div>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{selected.title}</p>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0' }}>{TYPE_LABELS[selected.type]}</p>
            </div>
          </div>
          <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={16} />
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
            {STATUS_LABELS[selected.status] || selected.status}
          </span>
          {selected.priority && (
            <span style={{
              padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
              background: selected.priority === 'critical' ? 'rgba(239,68,68,0.15)' : selected.priority === 'high' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
              color: selected.priority === 'critical' ? '#ef4444' : selected.priority === 'high' ? '#f59e0b' : '#94a3b8',
            }}>
              {PRIORITY_LABELS[selected.priority] || selected.priority}
            </span>
          )}
        </div>

        {/* Agent / Équipe */}
        {selected.agent && (
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={16} color="#3b82f6" />
            <div>
              <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                {selected.type === 'tournee' ? 'Équipe' : 'Agent'}
              </p>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, margin: '2px 0 0' }}>{selected.agent}</p>
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 8px', fontWeight: 700, textTransform: 'uppercase' }}>Description</p>
          <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
        </div>

        {/* Date & heure */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
              <Calendar size={13} color={tc.color} /> Date
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>
              {selected.date ? new Date(selected.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
              <Clock size={13} color={tc.color} /> Heure
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>
              {selected.date ? new Date(selected.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>

        {/* Tournée details */}
        {selected.type === 'tournee' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {raw.zone_nom && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <MapPin size={13} color="#3b82f6" /> Zone
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{raw.zone_nom}</p>
              </div>
            )}
            {raw.distance_km != null && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <Truck size={13} color="#3b82f6" /> Distance
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{raw.distance_km} km</p>
              </div>
            )}
            {raw.conteneurs_collectes != null && raw.conteneurs_collectes > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <Package size={13} color="#3b82f6" /> Conteneurs
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{raw.conteneurs_collectes} collectés</p>
              </div>
            )}
            {raw.heure_debut && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <Clock size={13} color="#3b82f6" /> Horaires
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                  {raw.heure_debut}{raw.heure_fin ? ` → ${raw.heure_fin}` : ' (en cours)'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Signalement details */}
        {selected.type === 'signalement' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {raw.type && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <FileText size={13} color="#f59e0b" /> Type
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{SIG_TYPE_LABELS[raw.type] || raw.type}</p>
              </div>
            )}
            {raw.notes_resolution && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <CheckCircle size={13} color="#10b981" /> Notes de résolution
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{raw.notes_resolution}</p>
              </div>
            )}
            {raw.motif_rejet && (
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '12px 14px', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                  <XCircle size={13} color="#ef4444" /> Motif de rejet
                </div>
                <p style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{raw.motif_rejet}</p>
              </div>
            )}
            {raw.photo_url && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', gridColumn: '1 / -1' }}>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 8px' }}>Photo</p>
                <img src={raw.photo_url} alt="Signalement" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── RENDER TIMELINE ITEM ──────────────────────────────────────────

  const renderTimelineItem = (event) => {
    const tc = TYPE_COLORS[event.type] || TYPE_COLORS.signalement;
    const sc = STATUS_COLORS[event.status] || STATUS_COLORS.pending;
    const Icon = TYPE_ICONS[event.type] || FileText;
    const isSelected = selected?.id === event.id;

    return (
      <div
        key={event.id}
        onClick={() => setSelected(event)}
        style={{
          display: 'flex', gap: 12, cursor: 'pointer', transition: 'all 0.15s',
          background: isSelected ? 'rgba(59,130,246,0.08)' : '#1e2433',
          border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: '12px 14px',
          borderLeft: `3px solid ${tc.color}`,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: tc.bg, color: tc.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </span>
          </div>
          {event.agent && (
            <p style={{ color: '#7dd3fc', fontSize: '0.72rem', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={10} /> {event.agent}
            </p>
          )}
          <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.description}
          </p>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: '0.7rem', color: '#475569' }}>
            {formatRelativeTime(event.date)}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            background: sc.bg, color: sc.color,
          }}>
            {STATUS_LABELS[event.status] || event.status}
          </span>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ───────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <History size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Historique{' '}
          <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({filteredEvents.length})</span>
        </h1>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setLoading(true); load(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem',
          }}
        >
          <Filter size={12} /> Rafraîchir
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 14px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6' },
          { label: "Aujourd'hui", value: stats.today, color: '#10b981' },
          { label: 'Signalements', value: stats.signalements, color: '#f59e0b' },
          { label: 'Tournées', value: stats.tournees, color: '#3b82f6' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 110 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            placeholder="Rechercher par titre, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.82rem', padding: '7px 12px 7px 32px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {FILTER_TYPES.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600,
              background: typeFilter === f.value ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: typeFilter === f.value ? '#fff' : '#94a3b8',
            }}
          >
            {f.label}
          </button>
        ))}

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' }}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Dual panel */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left - Timeline */}
        <div style={{ flex: selected ? '0 0 420px' : 1, display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'flex 0.2s' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#64748b', gap: 8 }}>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Chargement...</span>
              </div>
            )}
            {!loading && paginated.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                <History size={40} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Aucun événement trouvé</p>
              </div>
            )}
            {!loading && groupedEvents.map((group) => (
              <React.Fragment key={group.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 4px', marginTop: 4 }}>
                  <Calendar size={12} color="#475569" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {group.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: '0.7rem', color: '#334155' }}>{group.events.length}</span>
                </div>
                {group.events.map(renderTimelineItem)}
              </React.Fragment>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === 1 ? '#334155' : '#94a3b8', opacity: page === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#475569' }}>...</span>}
                    <button
                      onClick={() => setPage(p)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: page === p ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: page === p ? '#fff' : '#94a3b8' }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === totalPages ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#334155' : '#94a3b8', opacity: page === totalPages ? 0.5 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right - Detail */}
        {renderDetail()}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
