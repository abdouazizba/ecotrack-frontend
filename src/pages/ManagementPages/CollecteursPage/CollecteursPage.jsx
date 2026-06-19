import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Plus, Edit2, Trash2, Battery, Wrench, Search, AlertTriangle } from 'lucide-react';
import { getCollecteurs, createCollecteur, updateCollecteur, deleteCollecteur, getAgents } from '../../../services/api';

const STATUS_META = {
  ACTIF:          { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  INACTIF:        { label: 'Inactif',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const genTag = () => {
  const d = new Date();
  return `COL-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
};

export default function CollecteursPage() {
  const [collecteurs, setCollecteurs] = useState([]);
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);

  const [form, setForm] = useState({ code_collecteur: '', id_agent: '', statut: 'ACTIF', model: '', batterie_actuelle: 100 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, agentsData] = await Promise.all([getCollecteurs(), getAgents()]);
      setCollecteurs(Array.isArray(data) ? data : data?.data || []);
      setAgents(agentsData || []);
    } catch { setError('Erreur chargement collecteurs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = collecteurs;
    if (filter !== 'all') list = list.filter(c => c.statut === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.code_collecteur || '').toLowerCase().includes(q) || (c.model || '').toLowerCase().includes(q));
    }
    return list;
  }, [collecteurs, filter, search]);

  const agentName = (id) => {
    const a = agents.find(ag => ag.id === id);
    return a ? `${a.firstName} ${a.lastName}` : '—';
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code_collecteur: genTag(), id_agent: '', statut: 'ACTIF', model: '', batterie_actuelle: 100 });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ code_collecteur: c.code_collecteur, id_agent: c.id_agent || '', statut: c.statut, model: c.model || '', batterie_actuelle: c.batterie_actuelle ?? 100 });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateCollecteur(editing.id, form);
      else await createCollecteur(form);
      setShowForm(false);
      await load();
    } catch { setError('Erreur sauvegarde'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce collecteur ?')) return;
    try { await deleteCollecteur(id); await load(); }
    catch { setError('Erreur suppression'); }
  };

  const S = {
    page: { padding: 24, maxWidth: 1100, margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
    title: { fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
    controls: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
    searchInput: { flex: '1 1 200px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.85rem', padding: '7px 12px', outline: 'none' },
    filterBtn: (a) => ({ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: a ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: a ? '#fff' : '#94a3b8' }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 },
    card: { background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
    badge: (s) => ({ display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }),
    btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: '#3b82f6', color: '#fff' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
    modal: { background: '#1e2433', borderRadius: 14, padding: 24, width: 380, maxWidth: '92vw', border: '1px solid rgba(255,255,255,0.08)' },
    field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
    label: { fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 },
    input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}><Truck size={22} color="#3b82f6" /> Collecteurs (Véhicules)</h1>
        <button style={S.btn} onClick={openCreate}><Plus size={16} /> Nouveau</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 14px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: 12 }}>{error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>x</button></div>}

      <div style={S.controls}>
        <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
        {['all', 'ACTIF', 'INACTIF', 'EN_MAINTENANCE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
            {f === 'all' ? 'Tous' : (STATUS_META[f]?.label || f)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      <div style={S.grid}>
        {filtered.map(c => {
          const sm = STATUS_META[c.statut] || STATUS_META.ACTIF;
          const battColor = (c.batterie_actuelle ?? 100) > 50 ? '#10b981' : (c.batterie_actuelle ?? 100) > 20 ? '#f59e0b' : '#ef4444';
          return (
            <div key={c.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{c.code_collecteur}</span>
                <span style={S.badge(sm)}>{sm.label}</span>
              </div>
              {c.model && <p style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>{c.model}</p>}
              <div style={{ display: 'flex', gap: 12, color: '#94a3b8', fontSize: '0.78rem' }}>
                <span>Agent : {agentName(c.id_agent)}</span>
                <span style={{ color: battColor, display: 'flex', alignItems: 'center', gap: 3 }}><Battery size={12} /> {c.batterie_actuelle ?? '—'}%</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'rgba(59,130,246,0.12)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#3b82f6', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><Edit2 size={12} /> Modifier</button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && <p style={{ textAlign: 'center', color: '#475569', marginTop: 48 }}>Aucun collecteur trouvé</p>}

      {showForm && (
        <div style={S.overlay} onClick={() => setShowForm(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 16px', fontWeight: 700 }}>{editing ? 'Modifier' : 'Nouveau collecteur'}</h3>
            <form onSubmit={handleSubmit}>
              {!editing && (
                <div style={S.field}>
                  <label style={S.label}>Modèle / Description</label>
                  <input style={S.input} placeholder="Ex: Renault Access 7.5t" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                </div>
              )}
              <div style={S.field}>
                <label style={S.label}>Agent assigné</label>
                <select style={S.input} value={form.id_agent} onChange={e => setForm({...form, id_agent: e.target.value})}>
                  <option value="">— Non assigné —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{...S.field, flex: 1}}>
                  <label style={S.label}>Statut</label>
                  <select style={S.input} value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="EN_MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div style={{...S.field, flex: 1}}>
                  <label style={S.label}>Batterie %</label>
                  <input type="number" min="0" max="100" style={S.input} value={form.batterie_actuelle} onChange={e => setForm({...form, batterie_actuelle: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>{editing ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
