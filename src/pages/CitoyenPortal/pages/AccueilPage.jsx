import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, List, Map, Trophy, ChevronRight, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { getSignalementsCitoyen, getNearbyContainers } from '../../../services/api';

function StatBubble({ value, label, color }) {
  return (
    <div className="acc-stat-bubble" style={{ '--bubble-color': color }}>
      <span className="acc-stat-value">{value}</span>
      <span className="acc-stat-label">{label}</span>
    </div>
  );
}

function QuickCard({ to, icon: Icon, label, desc, accent }) {
  return (
    <Link to={to} className="acc-quick-card" style={{ '--card-accent': accent }}>
      <div className="acc-quick-icon"><Icon size={26} /></div>
      <div className="acc-quick-text">
        <span className="acc-quick-label">{label}</span>
        <span className="acc-quick-desc">{desc}</span>
      </div>
      <ChevronRight size={16} className="acc-quick-arrow" />
    </Link>
  );
}

export default function AccueilPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0 });
  const [nearbyCount, setNearbyCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [sigs] = await Promise.allSettled([
          user?.id ? getSignalementsCitoyen(user.id) : Promise.resolve([]),
        ]);
        const list = sigs.status === 'fulfilled' ? sigs.value : [];
        if (alive) {
          setStats({
            total: list.length,
            open: list.filter((s) => s.status === 'pending').length,
            inProgress: list.filter((s) => s.status === 'in_progress').length,
            closed: list.filter((s) => s.status === 'closed').length,
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    // Try to get nearby count with browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const nearby = await getNearbyContainers({ lat: coords.latitude, lng: coords.longitude, radius: 2 });
            if (alive) setNearbyCount(nearby.length);
          } catch {}
        },
        () => {}
      );
    }

    load();
    return () => { alive = false; };
  }, [user?.id]);

  const firstName = user?.firstName || 'Citoyen';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="acc-page">
      {/* Hero */}
      <div className="acc-hero cp-card">
        <div className="acc-hero-text">
          <p className="acc-hero-time">{greeting} 👋</p>
          <h1 className="acc-hero-name">{firstName}</h1>
          <p className="acc-hero-sub">Ensemble, gardons notre ville propre.</p>
        </div>
        <div className="acc-hero-illustration">🌿</div>
      </div>

      {/* Stats row */}
      <div className="acc-stats-row">
        <StatBubble value={loading ? '…' : stats.total}      label="Signalements"  color="#34d399" />
        <StatBubble value={loading ? '…' : stats.open}       label="Ouverts"       color="#fb923c" />
        <StatBubble value={loading ? '…' : stats.inProgress} label="En cours"      color="#fbbf24" />
        <StatBubble value={loading ? '…' : stats.closed}     label="Résolus"       color="#6ee7b7" />
      </div>

      {/* Quick access cards */}
      <p className="cp-section-title">Actions rapides</p>
      <div className="acc-quick-grid">
        <QuickCard
          to="/citoyen/signaler"
          icon={AlertCircle}
          label="Signaler un problème"
          desc="Conteneur plein, endommagé..."
          accent="#34d399"
        />
        <QuickCard
          to="/citoyen/mes-signalements"
          icon={List}
          label="Mes signalements"
          desc={`${stats.total} au total`}
          accent="#6ee7b7"
        />
        <QuickCard
          to="/citoyen/signaler"
          icon={Map}
          label="Carte des conteneurs"
          desc={nearbyCount != null ? `${nearbyCount} conteneurs à 2 km` : 'Voir les conteneurs proches'}
          accent="#06b6d4"
        />
        <QuickCard
          to="/citoyen/profil"
          icon={Trophy}
          label="Mon classement"
          desc="Points & badges"
          accent="#f59e0b"
        />
      </div>

      {/* Activity summary */}
      {stats.total > 0 && (
        <>
          <p className="cp-section-title">Activité récente</p>
          <div className="acc-activity cp-card">
            <div className="acc-activity-row">
              <TrendingUp size={16} color="#34d399" />
              <span>{stats.total} signalement{stats.total > 1 ? 's' : ''} envoyé{stats.total > 1 ? 's' : ''}</span>
            </div>
            {stats.closed > 0 && (
              <div className="acc-activity-row">
                <CheckCircle size={16} color="#6ee7b7" />
                <span>{stats.closed} problème{stats.closed > 1 ? 's' : ''} résolu{stats.closed > 1 ? 's' : ''} grâce à vous !</span>
              </div>
            )}
            {stats.inProgress > 0 && (
              <div className="acc-activity-row">
                <Clock size={16} color="#fbbf24" />
                <span>{stats.inProgress} en cours de traitement</span>
              </div>
            )}
            <Link to="/citoyen/mes-signalements" className="acc-activity-link">
              Voir tous mes signalements <ChevronRight size={14} />
            </Link>
          </div>
        </>
      )}

      <style>{`
        .acc-page {
          padding: 1.5rem 1.5rem 2rem;
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .acc-hero {
          padding: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(8,145,178,0.18)) !important;
          border-color: rgba(52,211,153,0.3) !important;
        }
        .acc-hero-time { margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.55); }
        .acc-hero-name { margin: 0.15rem 0 0.3rem; font-size: 1.6rem; font-weight: 800; color: white; }
        .acc-hero-sub  { margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .acc-hero-illustration { font-size: 3.5rem; line-height: 1; }

        .acc-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 400px) { .acc-stats-row { grid-template-columns: repeat(2, 1fr); } }

        .acc-stat-bubble {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          padding: 1rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          backdrop-filter: blur(12px);
        }
        .acc-stat-value { font-size: 1.5rem; font-weight: 800; color: var(--bubble-color, #34d399); }
        .acc-stat-label { font-size: 0.68rem; color: rgba(255,255,255,0.5); text-align: center; font-weight: 500; }

        .acc-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 380px) { .acc-quick-grid { grid-template-columns: 1fr; } }

        .acc-quick-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          backdrop-filter: blur(12px);
          text-decoration: none;
          color: white;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .acc-quick-card:hover {
          background: rgba(255,255,255,0.12);
          border-color: var(--card-accent, #34d399);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .acc-quick-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: var(--card-accent, #34d399);
          flex-shrink: 0;
        }
        .acc-quick-text { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .acc-quick-label { font-size: 0.82rem; font-weight: 700; color: white; }
        .acc-quick-desc  { font-size: 0.72rem; color: rgba(255,255,255,0.45); }
        .acc-quick-arrow { color: rgba(255,255,255,0.3); flex-shrink: 0; }

        .acc-activity {
          padding: 1.1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .acc-activity-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.7);
        }
        .acc-activity-link {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #34d399;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
