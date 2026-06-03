import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';

const EMPTY = { email: '', firstName: '', lastName: '', phone: '', role: 'agent', status: 'active', password: '' };

export default function UserForm({ show, editingUser, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(editingUser
      ? { email: editingUser.email || '', firstName: editingUser.firstName || '', lastName: editingUser.lastName || '', phone: editingUser.phone || '', role: editingUser.role || 'agent', status: editingUser.status || 'active', password: '' }
      : EMPTY
    );
  }, [editingUser, show]);

  if (!show) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="usr-overlay" onClick={onClose}>
      <div className="usr-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
        <div className="usr-modal-header">
          <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
          <button className="usr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="usr-modal-form">
          <div className="usr-form-row">
            <div className="usr-field">
              <label>Prénom *</label>
              <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jean" required />
            </div>
            <div className="usr-field">
              <label>Nom *</label>
              <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Dupont" required />
            </div>
          </div>
          <div className="usr-field">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="jean@ecotrack.com" required disabled={!!editingUser} style={editingUser ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
          </div>
          <div className="usr-field">
            <label>Téléphone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+221 77 000 00 00" />
          </div>
          <div className="usr-form-row">
            <div className="usr-field">
              <label>Rôle *</label>
              <select value={form.role} onChange={set('role')}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="usr-field">
              <label>Statut *</label>
              <select value={form.status} onChange={set('status')}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
          {!editingUser && (
            <div className="usr-field">
              <label>Mot de passe *</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 car. avec majuscule et chiffre"
                required
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                title="Au moins 8 caractères, une majuscule, une minuscule et un chiffre"
              />
            </div>
          )}
          <div className="usr-modal-footer">
            <button type="button" className="usr-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="usr-btn-confirm">
              {editingUser ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
