import React, { useState, useEffect, useCallback } from 'react';
import { getSignalementsCitoyen, getUsers } from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Points system ─────────────────────────────────────────────
const calcPoints = (sigs) => {
  let pts = 0;
  sigs.forEach((s) => {
    if (s.status === 'pending')     pts += 10;
    if (s.status === 'in_progress') pts += 15;
    if (s.status === 'closed')      pts += 30;
    // urgent bonus
    if (s.priority === 'critical')  pts += 10;
    if (s.priority === 'high')      pts +=  5;
  });
  return pts;
};

const LEVELS = [
  { name: 'Débutant',      min: 0,    color: '#6b7280', emoji: '🌱' },
  { name: 'Éco-Actif',     min: 50,   color: '#34d399', emoji: '🌿' },
  { name: 'Éco-Engagé',    min: 150,  color: '#0891b2', emoji: '💧' },
  { name: 'Éco-Champion',  min: 350,  color: '#fbbf24', emoji: '⭐' },
  { name: 'Éco-Héros',     min: 700,  color: '#f59e0b', emoji: '🏆' },
];

const getLevel = (pts) => {
  let lvl = LEVELS[0];
  LEVELS.forEach((l) => { if (pts >= l.min) lvl = l; });
  return lvl;
};

const getNextLevel = (pts) => {
  for (let i = 0; i < LEVELS.length; i++) {
    if (pts < LEVELS[i].min) return LEVELS[i];
  }
  return null;
};

const BADGES = [
  { id: 'first',    emoji: '🌱', label: 'Premier pas',      desc: '1er signalement',       cond: (sigs) => sigs.length >= 1 },
  { id: 'five',     emoji: '🌿', label: '5 signalements',   desc: 'Très actif',            cond: (sigs) => sigs.length >= 5 },
  { id: 'resolved', emoji: '✅', label: 'Résolu !',         desc: '1 signalement résolu',  cond: (sigs) => sigs.some((s) => s.status === 'closed') },
  { id: 'five_res', emoji: '⭐', label: '5 résolus',        desc: '5 signalements résolus', cond: (sigs) => sigs.filter((s) => s.status === 'closed').length >= 5 },
  { id: 'urgent',   emoji: '⚡', label: 'Urgence signalée', desc: 'Signalement critique',  cond: (sigs) => sigs.some((s) => s.priority === 'critical') },
  { id: 'photo',    emoji: '📸', label: 'Preuve photo',     desc: 'Photo jointe',          cond: (sigs) => sigs.some((s) => s.photo_url) },
];

function Avatar({ initials, level }) {
  return (
    <div className="pp-avatar" style={{ '--level-color': level.color }}>
      <span className="pp-avatar-initials">{initials}</span>
      <span className="pp-avatar-badge">{level.emoji}</span>
    </div>
  );
}

function ProgressBar({ current, next, pts }) {
  const from = current.min;
  const to   = next ? next.min : pts + 1;
  const pct  = next ? Math.min(100, Math.round(((pts - from) / (to - from)) * 100)) : 100;
  return (
    <div className="pp-progress-wrap">
      <div className="pp-progress-bar">
        <div className="pp-progress-fill" style={{ width: `${pct}%`, background: current.color }} />
      </div>
      <div className="pp-progress-labels">
        <span>{current.name}</span>
        {next ? <span>{pts}/{next.min} pts → {next.name}</span> : <span>Niveau max !</span>}
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const { user, logout, updateUserProfile } = useAuthStore();
  const navigate = useNavigate();

  const [sigs, setSigs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [sigsResult, usersResult] = await Promise.allSettled([
        getSignalementsCitoyen(user.id),
        getUsers({ role: 'citoyen', limit: 50 }),
      ]);
      const mySigs = sigsResult.status === 'fulfilled' ? sigsResult.value : [];
      setSigs(mySigs);

      if (usersResult.status === 'fulfilled') {
        const citizens = usersResult.value;
        const board = citizens
          .map((c) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email, pts: 0 }))
          .sort((a, b) => b.pts - a.pts)
          .slice(0, 10);
        // Place current user with real points
        const myPts = calcPoints(mySigs);
        const meIdx = board.findIndex((b) => b.id === user.id);
        if (meIdx >= 0) board[meIdx].pts = myPts;
        else board.push({ id: user.id, name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), pts: myPts });
        board.sort((a, b) => b.pts - a.pts);
        setLeaderboard(board.slice(0, 10));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const pts    = calcPoints(sigs);
  const level  = getLevel(pts);
  const next   = getNextLevel(pts);
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const myRank = leaderboard.findIndex((b) => b.id === user?.id) + 1;

  const handleSaveProfile = () => {
    updateUserProfile({ firstName, lastName });
    setEditing(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="pp-page">
      {/* Profile card */}
      <div className="pp-profile-card cp-card">
        <Avatar initials={initials} level={level} />
        {!editing ? (
          <div className="pp-name-block">
            <h2 className="pp-name">{user?.firstName || ''} {user?.lastName || ''}</h2>
            <span className="pp-email">{user?.email}</span>
            <button className="pp-edit-btn" onClick={() => setEditing(true)}>Modifier le profil</button>
          </div>
        ) : (
          <div className="pp-edit-block">
            <input className="pp-edit-input" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="pp-edit-input" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <div className="pp-edit-actions">
              <button className="cp-btn-accent pp-save" onClick={handleSaveProfile}>Enregistrer</button>
              <button className="cp-btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* Points & level */}
      <div className="pp-points-card cp-card">
        <div className="pp-points-row">
          <div className="pp-points-big">
            <span className="pp-pts-num" style={{ color: level.color }}>{pts}</span>
            <span className="pp-pts-label">points</span>
          </div>
          <div className="pp-level-info">
            <span className="pp-level-name" style={{ color: level.color }}>{level.emoji} {level.name}</span>
            {myRank > 0 && <span className="pp-rank">#{myRank} dans votre zone</span>}
          </div>
        </div>
        <ProgressBar current={level} next={next} pts={pts} />
        <div className="pp-sigs-row">
          <div className="pp-sig-stat"><span style={{ color: '#34d399', fontWeight: 700 }}>{sigs.length}</span><span>Total</span></div>
          <div className="pp-sig-stat"><span style={{ color: '#fb923c', fontWeight: 700 }}>{sigs.filter((s) => s.status === 'pending').length}</span><span>Ouverts</span></div>
          <div className="pp-sig-stat"><span style={{ color: '#6ee7b7', fontWeight: 700 }}>{sigs.filter((s) => s.status === 'closed').length}</span><span>Résolus</span></div>
        </div>
      </div>

      {/* Badges */}
      <p className="cp-section-title">Mes badges</p>
      <div className="pp-badges-grid">
        {BADGES.map((b) => {
          const earned = b.cond(sigs);
          return (
            <div key={b.id} className={`pp-badge-chip ${earned ? 'earned' : 'locked'}`}>
              <span className="pp-badge-emoji">{earned ? b.emoji : '🔒'}</span>
              <div className="pp-badge-info">
                <span className="pp-badge-label">{b.label}</span>
                <span className="pp-badge-desc">{b.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <p className="cp-section-title">Classement — Citoyens actifs</p>
      <div className="pp-leaderboard cp-card">
        {loading ? (
          <div className="cp-loading"><span className="cp-spin" /></div>
        ) : leaderboard.length === 0 ? (
          <div className="cp-empty"><span>Aucune donnée disponible</span></div>
        ) : (
          leaderboard.map((entry, idx) => {
            const isMe = entry.id === user?.id;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div key={entry.id} className={`pp-lb-row ${isMe ? 'mine' : ''}`}>
                <span className="pp-lb-medal">{medal}</span>
                <span className="pp-lb-name">{isMe ? `${entry.name} (vous)` : entry.name}</span>
                <span className="pp-lb-pts">{entry.pts} pts</span>
              </div>
            );
          })
        )}
      </div>

      {/* Logout */}
      <button className="pp-logout cp-btn-ghost" onClick={handleLogout}>
        <LogOut size={16} />
        Se déconnecter
      </button>

      <style>{`
        .pp-page { padding: 1.5rem 1.5rem 2rem; max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }

        .pp-profile-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
        .pp-avatar { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
        .pp-avatar-initials { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 2.5px solid var(--level-color, #34d399); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; color: white; }
        .pp-avatar-badge { position: absolute; bottom: 0; right: 0; font-size: 1.1rem; background: rgba(2,44,34,0.9); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1.5px solid rgba(255,255,255,0.2); }
        .pp-name-block { display: flex; flex-direction: column; gap: 0.2rem; }
        .pp-name  { margin: 0; font-size: 1.15rem; font-weight: 700; color: white; }
        .pp-email { font-size: 0.78rem; color: rgba(255,255,255,0.45); }
        .pp-edit-btn { margin-top: 0.4rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 0.78rem; padding: 0.3rem 0.75rem; cursor: pointer; transition: all 0.15s; align-self: flex-start; }
        .pp-edit-btn:hover { background: rgba(255,255,255,0.14); color: white; }
        .pp-edit-block { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .pp-edit-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; padding: 0.5rem 0.75rem; font-size: 0.88rem; outline: none; }
        .pp-edit-input::placeholder { color: rgba(255,255,255,0.3); }
        .pp-edit-input:focus { border-color: rgba(52,211,153,0.5); }
        .pp-edit-actions { display: flex; gap: 0.5rem; }
        .pp-save { padding: 0.45rem 1rem; font-size: 0.82rem; }

        .pp-points-card { padding: 1.25rem 1.4rem; display: flex; flex-direction: column; gap: 1rem; }
        .pp-points-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .pp-points-big { display: flex; align-items: baseline; gap: 0.35rem; }
        .pp-pts-num { font-size: 2.5rem; font-weight: 900; line-height: 1; }
        .pp-pts-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .pp-level-info { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
        .pp-level-name { font-size: 0.9rem; font-weight: 700; }
        .pp-rank { font-size: 0.75rem; color: rgba(255,255,255,0.45); }
        .pp-progress-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
        .pp-progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
        .pp-progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .pp-progress-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: rgba(255,255,255,0.4); }
        .pp-sigs-row { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem; }
        .pp-sig-stat { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
        .pp-sig-stat span:first-child { font-size: 1.2rem; }
        .pp-sig-stat span:last-child  { font-size: 0.7rem; color: rgba(255,255,255,0.4); }

        .pp-badges-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .pp-badge-chip { display: flex; align-items: center; gap: 0.65rem; padding: 0.8rem 0.9rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; backdrop-filter: blur(12px); transition: all 0.2s; }
        .pp-badge-chip.earned { border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.08); }
        .pp-badge-chip.locked { opacity: 0.45; filter: grayscale(1); }
        .pp-badge-emoji { font-size: 1.6rem; flex-shrink: 0; }
        .pp-badge-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .pp-badge-label { font-size: 0.82rem; font-weight: 700; color: white; }
        .pp-badge-desc  { font-size: 0.7rem; color: rgba(255,255,255,0.4); }

        .pp-leaderboard { overflow: hidden; }
        .pp-lb-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.88rem; color: rgba(255,255,255,0.65); transition: background 0.15s; }
        .pp-lb-row:last-child { border-bottom: none; }
        .pp-lb-row.mine { background: rgba(52,211,153,0.08); color: #6ee7b7; }
        .pp-lb-medal { font-size: 1rem; width: 26px; text-align: center; flex-shrink: 0; }
        .pp-lb-name  { flex: 1; font-weight: 500; }
        .pp-lb-pts   { font-weight: 700; color: #34d399; font-size: 0.82rem; }
        .pp-lb-row.mine .pp-lb-name { font-weight: 700; }

        .pp-logout { width: 100%; justify-content: center; padding: 0.75rem; }
      `}</style>
    </div>
  );
}
