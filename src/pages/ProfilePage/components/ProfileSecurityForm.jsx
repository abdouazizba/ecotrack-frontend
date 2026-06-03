import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function ProfileSecurityForm({ onSave, onError }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) {
      onError('Veuillez saisir votre mot de passe actuel');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      onError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.newPassword.length < 6) {
      onError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (form.newPassword === form.currentPassword) {
      onError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }
    setSaving(true);
    await onSave(form.newPassword, form.currentPassword);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="pf-group">
        <label>Mot de passe actuel</label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          placeholder="Votre mot de passe actuel"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="pf-group">
        <label>Nouveau mot de passe</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={set('newPassword')}
          placeholder="Minimum 6 caractères"
          required
          autoComplete="new-password"
        />
      </div>
      <div className="pf-group">
        <label>Confirmer le nouveau mot de passe</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          placeholder="Répéter le nouveau mot de passe"
          required
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="pf-btn-save" disabled={saving}>
        <Lock size={15} />
        {saving ? 'Modification...' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}
