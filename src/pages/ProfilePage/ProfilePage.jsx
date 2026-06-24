import React, { useState, useRef } from 'react';
import { User, Lock, Bell, Camera } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { updateUser } from '../../services/api';
import { ProfileInfoForm, ProfileSecurityForm } from './components';
import './ProfilePage.css';

const ROLE_LABELS = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  agent: 'Agent de collecte',
  citoyen: 'Citoyen',
};

const NOTIF_PREFS_KEY = 'ecotrack-notif-prefs';

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY)) || {}; }
  catch { return {}; }
}

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuthStore();
  const [message, setMessage] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('ecotrack-avatar') || null);
  const [notifPrefs, setNotifPrefs] = useState(getNotifPrefs);
  const fileRef = useRef(null);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleProfileSave = async (formData) => {
    try {
      await updateUser(user.id, {
        ...formData,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
      });
      updateUserProfile(formData);
      flash('success', 'Profil mis à jour avec succès');
    } catch {
      flash('error', 'Erreur lors de la mise à jour du profil');
    }
  };

  const handlePasswordSave = async (newPassword, currentPassword) => {
    try {
      await updateUser(user.id, { password: newPassword, currentPassword });
      flash('success', 'Mot de passe modifié avec succès');
    } catch {
      flash('error', 'Mot de passe actuel incorrect ou erreur serveur');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      localStorage.setItem('ecotrack-avatar', dataUrl);
      flash('success', 'Photo de profil mise à jour');
    };
    reader.readAsDataURL(file);
  };

  const toggleNotifPref = (key) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() ||
      user.email?.[0]?.toUpperCase() || 'U'
    : 'U';

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981' }} />
          ) : (
            <div className="profile-avatar-hero">{initials}</div>
          )}
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1e293b' }}>
            <Camera size={13} color="#fff" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div className="profile-hero-info">
          <h1>
            {user?.firstName || user?.email?.split('@')[0]} {user?.lastName}
          </h1>
          <span className="profile-role-badge">
            {ROLE_LABELS[user?.role] || user?.role || '—'}
          </span>
          <p className="profile-hero-email">{user?.email}</p>
        </div>
      </div>

      {message && (
        <div className={`profile-flash profile-flash--${message.type}`}>{message.text}</div>
      )}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-title">
            <User size={18} />
            <h2>Informations personnelles</h2>
          </div>
          <ProfileInfoForm user={user} onSave={handleProfileSave} />
        </div>

        <div className="profile-card">
          <div className="profile-card-title">
            <Lock size={18} />
            <h2>Sécurité</h2>
          </div>
          <ProfileSecurityForm
            onSave={handlePasswordSave}
            onError={(msg) => flash('error', msg)}
          />
        </div>

        <div className="profile-card" style={{ gridColumn: '1 / -1' }}>
          <div className="profile-card-title">
            <Bell size={18} />
            <h2>Préférences de notifications</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'critical_fill', label: 'Conteneurs critiques', desc: 'Remplissage > 80%', default: true },
              { key: 'battery', label: 'Batterie capteur faible', desc: 'Batterie < 20%', default: true },
              { key: 'new_signal', label: 'Nouveaux signalements', desc: 'Signalements en attente', default: true },
              { key: 'tournee_update', label: 'Mises à jour tournées', desc: 'Démarrage et fin de tournée', default: false },
            ].map(pref => (
              <label key={pref.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                <input
                  type="checkbox"
                  checked={notifPrefs[pref.key] !== undefined ? notifPrefs[pref.key] : pref.default}
                  onChange={() => toggleNotifPref(pref.key)}
                  style={{ width: 18, height: 18, accentColor: '#10b981' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{pref.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{pref.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
