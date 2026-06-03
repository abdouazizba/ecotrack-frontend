import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { updateUser } from '../../services/api';
import { ProfileInfoForm, ProfileSecurityForm } from './components';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuthStore();
  const [message, setMessage] = useState(null);

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

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      'U'
    : 'U';

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar-hero">{initials}</div>
        <div className="profile-hero-info">
          <h1>
            {user?.firstName || user?.email?.split('@')[0]} {user?.lastName}
          </h1>
          <span className="profile-role-badge">
            {user?.role === 'admin' ? '👑 Administrateur' : '👤 Agent'}
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
      </div>
    </div>
  );
}
