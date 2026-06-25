import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowRight, Check, Sparkles } from 'lucide-react';
import { getZones, updateUser } from '../../services/api';
import useAuthStore from '../../store/authStore';
import './ProfileSetupWizard.css';

const NOTIF_DEFAULTS = [
  { key: 'critical_fill', name: 'Alertes conteneurs', desc: 'Quand un conteneur est plein ou critique', on: true },
  { key: 'new_signal', name: 'Nouveaux signalements', desc: 'Mises à jour sur vos signalements', on: true },
  { key: 'tournee_update', name: 'Collectes programmées', desc: 'Horaires de passage dans votre zone', on: false },
];

export default function ProfileSetupWizard({ isOpen, onComplete, onSkip }) {
  const { user, updateUserProfile, setProfileCompleted } = useAuthStore();
  const fileRef = useRef(null);

  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [notifs, setNotifs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setStep(0);

    const saved = localStorage.getItem('ecotrack-avatar');
    if (saved) setPhoto(saved);

    const notifInit = {};
    NOTIF_DEFAULTS.forEach((n) => { notifInit[n.key] = n.on; });
    try {
      const stored = JSON.parse(localStorage.getItem('ecotrack-notif-prefs'));
      if (stored) Object.assign(notifInit, stored);
    } catch {}
    setNotifs(notifInit);

    getZones().then((z) => setZones(Array.isArray(z) ? z : [])).catch(() => {});
  }, [isOpen, user]);

  if (!isOpen) return null;

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleNotif = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSkip = () => {
    setProfileCompleted(true);
    onSkip();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (firstName !== user?.firstName || lastName !== user?.lastName) {
        await updateUser(user.id, {
          firstName, lastName,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
        });
        updateUserProfile({ firstName, lastName });
      }

      if (photo) localStorage.setItem('ecotrack-avatar', photo);
      if (selectedZone) localStorage.setItem('ecotrack-preferred-zone', selectedZone);
      localStorage.setItem('ecotrack-notif-prefs', JSON.stringify(notifs));

      setProfileCompleted(true);
      onComplete();
    } catch {
      setProfileCompleted(true);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="psw-overlay" onClick={handleSkip}>
      <div className="psw-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="psw-header">
          <div className="psw-badge"><Sparkles size={14} /> Bienvenue !</div>
          <h2 className="psw-title">Configurez votre profil</h2>
          <p className="psw-subtitle">
            {step === 0 ? 'Ajoutez une photo et vérifiez vos informations' : 'Choisissez vos préférences'}
          </p>
        </div>

        {/* Step dots */}
        <div className="psw-dots">
          <div className={`psw-dot${step === 0 ? ' active' : ''}`} />
          <div className={`psw-dot${step === 1 ? ' active' : ''}`} />
        </div>

        {/* Step 1: Profile */}
        {step === 0 && (
          <>
            <div className="psw-photo-section">
              <div className="psw-photo-circle" onClick={() => fileRef.current?.click()}>
                {photo ? (
                  <img src={photo} alt="Avatar" />
                ) : (
                  <span className="psw-photo-initials">{initials}</span>
                )}
                <div className="psw-photo-overlay"><Camera size={12} /> Photo</div>
              </div>
              <span className="psw-photo-label">Cliquez pour ajouter une photo</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhoto}
              />
            </div>

            <div className="psw-row">
              <div className="psw-field">
                <label>Prénom</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="psw-field">
                <label>Nom</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Step 2: Preferences */}
        {step === 1 && (
          <>
            <div className="psw-field">
              <label>Votre zone / quartier</label>
              <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                <option value="">— Choisir votre zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.nom || z.name || z.code_zone}</option>
                ))}
              </select>
            </div>

            <div className="psw-field">
              <label>Notifications</label>
              <div className="psw-toggles">
                {NOTIF_DEFAULTS.map((n) => (
                  <div key={n.key} className="psw-toggle-row">
                    <div className="psw-toggle-info">
                      <span className="psw-toggle-name">{n.name}</span>
                      <span className="psw-toggle-desc">{n.desc}</span>
                    </div>
                    <label className="psw-toggle">
                      <input
                        type="checkbox"
                        checked={!!notifs[n.key]}
                        onChange={() => toggleNotif(n.key)}
                      />
                      <span className="psw-toggle-track" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="psw-footer">
          <button type="button" className="psw-btn-skip" onClick={handleSkip}>
            Passer
          </button>
          {step === 0 ? (
            <button type="button" className="psw-btn-next" onClick={() => setStep(1)}>
              Suivant <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="psw-btn-next"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : <><Check size={16} /> Terminer</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
