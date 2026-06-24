import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Truck, Plus, Edit2, Trash2, Gauge, Wrench, Search, Calendar,
  ChevronLeft, ChevronRight, X, MapPin, User, Filter,
} from 'lucide-react';
import { getVehicules, createVehicule, updateVehicule, deleteVehicule, getAgents } from '../../../services/api';

const STATUS_META = {
  ACTIF:          { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  INACTIF:        { label: 'Inactif',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const TYPE_META = {
  BENNE:       { label: 'Benne',       color: '#3b82f6' },
  COMPACTEUR:  { label: 'Compacteur',  color: '#8b5cf6' },
  UTILITAIRE:  { label: 'Utilitaire',  color: '#06b6d4' },
  CAMION_GRUE: { label: 'Camion-grue', color: '#f97316' },
};

const PAGE_SIZE = 12;

export default function VehiculesPage() {
  const [vehicules, setVehicules] = useState([]);
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm] = useState({
    immatriculation: '', marque: '', modele: '', type_vehicule: 'BENNE',
    capacite_tonnes: '', kilometrage: '', id_agent: '', statut: 'ACTIF',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getVehicules(), getAgents()]);
      setVehicules(Array.isArray(data) ? data : data?.data || []);
      setAgents(agentsData || []);
    } catch { setError('Erreur chargement véhicules'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const agentMap = useMemo(() => {
    const m = {};
    agents.forEach(a => { m[a.id] = a; });
    return m;
  }, [agents]);

  const agentName = (id) => {
    const a = agentMap[id];
    return a ? `${a.firstName} ${a.lastName}` : '—';
  };

  const filtered = useMemo(() => {
    let list = vehicules;
    if (filter !== 'all') list = list.filter(v => v.statut === filter);
    if (typeFilter !== 'all') list = list.filter(v => v.type_vehicule === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        (v.immatriculation || '').toLowerCase().includes(q) ||
        (v.marque || '').toLowerCase().includes(q) ||
        (v.modele || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicules, filter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter, typeFilter, search]);
  useEffect(() => {
    if (selected && !filtered.find(v => v.id === selected.id)) setSelected(null);
  }, [filtered, selected]);

  const openCreate = () => {
    setEditing(null);
    setForm({ immatriculation: '', marque: '', modele: '', type_vehicule: 'BENNE', capacite_tonnes: '', kilometrage: '', id_agent: '', statut: 'ACTIF' });
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      immatriculation: v.immatriculation, marque: v.marque || '', modele: v.modele || '',
      type_vehicule: v.type_vehicule || 'BENNE', capacite_tonnes: v.capacite_tonnes || '',
      kilometrage: v.kilometrage || '', id_agent: v.id_agent || '', statut: v.statut,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.capacite_tonnes) payload.capacite_tonnes = parseFloat(payload.capacite_tonnes);
      if (payload.kilometrage) payload.kilometrage = parseInt(payload.kilometrage);
      if (!payload.id_agent) delete payload.id_agent;
      if (editing) await updateVehicule(editing.id, payload);
      else await createVehicule(payload);
      setShowForm(false);
      await load();
    } catch { setError('Erreur sauvegarde'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteVehicule(id);
      if (selected?.id === id) setSelected(null);
      await load();
    } catch { setError('Erreur suppression'); }
  };

  const fmtKm = (km) => km != null ? `${Number(km).toLocaleString('fr-FR')} km` : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const stats = useMemo(() => ({
    total: vehicules.length,
    actif: vehicules.filter(v => v.statut === 'ACTIF').length,
    maintenance: vehicules.filter(v => v.statut === 'EN_MAINTENANCE').length,
    types: Object.entries(TYPE_META).map(([k, v]) => ({ key: k, label: v.label, count: vehicules.filter(vh => vh.type_vehicule === k).length })),
  }), [vehicules]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Truck size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', margin: 0, flex: 1 }}>
          Véhicules <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({filtered.length})</span>
        </h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: '#3b82f6', color: '#fff' }}>
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 14px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6' },
          { label: 'Actifs', value: stats.actif, color: '#10b981' },
          { label: 'Maintenance', value: stats.maintenance, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.82rem', padding: '7px 12px 7px 32px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {['all', 'ACTIF', 'INACTIF', 'EN_MAINTENANCE'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: filter === f ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: filter === f ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
            {f === 'all' ? 'Tous' : (STATUS_META[f]?.label || f)}
          </button>
        ))}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' }}>
          <option value="all">Tous types</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Dual panel */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Left — list */}
        <div style={{ flex: selected ? '0 0 420px' : 1, display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'flex 0.2s' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {loading && <p style={{ color: '#64748b', padding: 20 }}>Chargement…</p>}
            {!loading && paginated.length === 0 && <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>Aucun véhicule trouvé</p>}
            {paginated.map(v => {
              const sm = STATUS_META[v.statut] || STATUS_META.ACTIF;
              const tm = TYPE_META[v.type_vehicule] || TYPE_META.BENNE;
              const isSelected = selected?.id === v.id;
              return (
                <div key={v.id} onClick={() => setSelected(v)}
                  style={{ background: isSelected ? 'rgba(59,130,246,0.08)' : '#1e2433', border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tm.color}15`, color: tm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{v.immatriculation}</span>
                      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: `${tm.color}18`, color: tm.color }}>{tm.label}</span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.marque} {v.modele || ''}
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.72rem', color: '#64748b' }}>
                      <span>{fmtKm(v.kilometrage)}</span>
                      {v.capacite_tonnes && <span>{v.capacite_tonnes}t</span>}
                    </div>
                  </div>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: sm.bg, color: sm.color, flexShrink: 0 }}>{sm.label}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === 1 ? '#334155' : '#94a3b8', opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#475569' }}>…</span>}
                  <button onClick={() => setPage(p)}
                    style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: page === p ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: page === p ? '#fff' : '#94a3b8' }}>
                    {p}
                  </button>
                </React.Fragment>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === totalPages ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#334155' : '#94a3b8', opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right — detail */}
        {selected && (
          <div style={{ flex: 1, background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem' }}>{selected.immatriculation}</span>
                <p style={{ color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 600, margin: '6px 0 0' }}>{selected.marque} {selected.modele || ''}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: (STATUS_META[selected.statut] || STATUS_META.ACTIF).bg, color: (STATUS_META[selected.statut] || STATUS_META.ACTIF).color }}>{(STATUS_META[selected.statut] || STATUS_META.ACTIF).label}</span>
              <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: `${(TYPE_META[selected.type_vehicule] || TYPE_META.BENNE).color}18`, color: (TYPE_META[selected.type_vehicule] || TYPE_META.BENNE).color }}>{(TYPE_META[selected.type_vehicule] || TYPE_META.BENNE).label}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { icon: Gauge, label: 'Kilométrage', value: fmtKm(selected.kilometrage), color: '#3b82f6' },
                { icon: Truck, label: 'Capacité', value: selected.capacite_tonnes ? `${selected.capacite_tonnes} tonnes` : '—', color: '#8b5cf6' },
                { icon: User, label: 'Chauffeur', value: agentName(selected.id_agent), color: '#10b981' },
                { icon: Wrench, label: 'Dernière maintenance', value: fmtDate(selected.date_derniere_maintenance), color: '#f59e0b' },
                { icon: Calendar, label: 'Prochain contrôle', value: fmtDate(selected.date_prochain_controle), color: '#ef4444' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                    <item.icon size={13} color={item.color} /> {item.label}
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 6px' }}>Notes</p>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => openEdit(selected)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>
                <Edit2 size={14} /> Modifier
              </button>
              <button onClick={() => handleDelete(selected.id)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#1e2433', borderRadius: 14, padding: 24, width: 440, maxWidth: '92vw', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 16px', fontWeight: 700 }}>{editing ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Immatriculation" required>
                  <input style={inputStyle} placeholder="AB-123-CD" value={form.immatriculation} onChange={e => setForm({...form, immatriculation: e.target.value})} required />
                </Field>
                <Field label="Type">
                  <select style={inputStyle} value={form.type_vehicule} onChange={e => setForm({...form, type_vehicule: e.target.value})}>
                    <option value="BENNE">Benne</option><option value="COMPACTEUR">Compacteur</option><option value="UTILITAIRE">Utilitaire</option><option value="CAMION_GRUE">Camion-grue</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Marque" required>
                  <input style={inputStyle} placeholder="Renault" value={form.marque} onChange={e => setForm({...form, marque: e.target.value})} required />
                </Field>
                <Field label="Modèle">
                  <input style={inputStyle} placeholder="Midlum 220" value={form.modele} onChange={e => setForm({...form, modele: e.target.value})} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Field label="Capacité (t)">
                  <input type="number" step="0.1" min="0" style={inputStyle} value={form.capacite_tonnes} onChange={e => setForm({...form, capacite_tonnes: e.target.value})} />
                </Field>
                <Field label="Kilométrage">
                  <input type="number" min="0" style={inputStyle} value={form.kilometrage} onChange={e => setForm({...form, kilometrage: e.target.value})} />
                </Field>
              </div>
              <Field label="Chauffeur assigné">
                <select style={inputStyle} value={form.id_agent} onChange={e => setForm({...form, id_agent: e.target.value})}>
                  <option value="">— Non assigné —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select style={inputStyle} value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                  <option value="ACTIF">Actif</option><option value="INACTIF">Inactif</option><option value="EN_MAINTENANCE">En maintenance</option>
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>{editing ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' };

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, flex: 1 }}>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}
