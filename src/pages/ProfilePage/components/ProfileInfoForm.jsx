import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function ProfileInfoForm({ user, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div className="pf-row">
        <div className="pf-group">
          <label>Prénom</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Votre prénom"
          />
        </div>
        <div className="pf-group">
          <label>Nom</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Votre nom"
          />
        </div>
      </div>
      <div className="pf-group">
        <label>Adresse email</label>
        <input type="email" value={user?.email || ''} disabled className="pf-disabled" />
        <span className="pf-hint">L'email ne peut pas être modifié</span>
      </div>
      <div className="pf-group">
        <label>Téléphone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+221 77 000 00 00"
        />
      </div>
      <button type="submit" className="pf-btn-save" disabled={saving}>
        <Save size={15} />
        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>
    </form>
  );
}
