import React, { useEffect, useState } from 'react';
import {
  PlusCircle, Clock, CheckCircle, XCircle, AlertCircle,
  UserCheck, RotateCcw, Loader,
} from 'lucide-react';
import { getSignalementAudit } from '../../../../services/api';

const EVENT_META = {
  creation:      { label: 'Signalement créé',    Icon: PlusCircle,  color: '#6366f1' },
  status_change: { label: 'Statut modifié',       Icon: Clock,       color: '#3b82f6' },
  assignment:    { label: 'Agent assigné',         Icon: UserCheck,   color: '#10b981' },
  rejection:     { label: 'Signalement rejeté',   Icon: XCircle,     color: '#ef4444' },
  reopen:        { label: 'Réouvert',             Icon: RotateCcw,   color: '#f59e0b' },
  close:         { label: 'Clôturé',              Icon: CheckCircle, color: '#10b981' },
};

const STATUS_FR = {
  OUVERT:                  'En attente',
  EN_COURS_DE_TRAITEMENT:  'En cours',
  'FERMÉ':                 'Clôturé',
  'REJETÉ':                'Rejeté',
  pending:                 'En attente',
  in_progress:             'En cours',
  closed:                  'Clôturé',
  rejected:                'Rejeté',
};

function resolveEvent(entry) {
  let meta = EVENT_META[entry.type] || { label: entry.type, Icon: AlertCircle, color: '#94a3b8' };

  if (entry.type === 'status_change' || (!entry.type && entry.nouveau_statut)) {
    const ns = entry.nouveau_statut;
    if (ns === 'FERMÉ' || ns === 'closed')            meta = EVENT_META.close;
    else if (ns === 'REJETÉ' || ns === 'rejected')    meta = EVENT_META.rejection;
    else if (ns === 'OUVERT' || ns === 'pending')     meta = EVENT_META.reopen;
    else                                               meta = EVENT_META.status_change;
  }

  return meta;
}

export default function SignalementAudit({ sigId }) {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sigId) return;
    setLoading(true);
    getSignalementAudit(sigId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [sigId]);

  if (loading) {
    return (
      <div className="sig-audit-loading">
        <Loader size={14} className="sig-audit-spin" />
        <span>Chargement…</span>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="sig-audit-empty">
        {entries === null ? 'Historique non disponible.' : 'Aucun événement enregistré.'}
      </p>
    );
  }

  return (
    <div className="sig-audit-timeline">
      {entries.map((entry, i) => {
        const { label, Icon, color } = resolveEvent(entry);
        const isLast = i === entries.length - 1;
        const ts = entry.created_at
          ? new Date(entry.created_at).toLocaleString('fr-FR', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
          : null;

        return (
          <div key={entry.id ?? i} className="sig-audit-entry">
            <div className="sig-audit-track">
              <span className="sig-audit-dot" style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}>
                <Icon size={11} color="#fff" />
              </span>
              {!isLast && <span className="sig-audit-line" />}
            </div>
            <div className="sig-audit-body">
              <div className="sig-audit-header">
                <span className="sig-audit-label" style={{ color }}>{label}</span>
                {ts && <span className="sig-audit-ts">{ts}</span>}
              </div>
              {(entry.ancien_statut || entry.nouveau_statut) && (
                <span className="sig-audit-transition">
                  {entry.ancien_statut && <>{STATUS_FR[entry.ancien_statut] || entry.ancien_statut} → </>}
                  {entry.nouveau_statut && <strong>{STATUS_FR[entry.nouveau_statut] || entry.nouveau_statut}</strong>}
                </span>
              )}
              {entry.auteur_nom && (
                <span className="sig-audit-author">par {entry.auteur_nom}</span>
              )}
              {entry.commentaire && (
                <p className="sig-audit-comment">{entry.commentaire}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
