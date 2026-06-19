import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, KeyRound } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';

const EMPTY = { email: '', firstName: '', lastName: '', phone: '', role: '', status: '', password: '' };

const canManage = (actorRole, targetRole) => {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') return targetRole === 'agent' || targetRole === 'citoyen';
  return false;
};

const ROLE_OPTIONS = {
  super_admin: [
    { value: 'citoyen',     label: 'Citoyen' },
    { value: 'agent',       label: 'Agent' },
    { value: 'admin',       label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ],
  admin: [
    { value: 'citoyen', label: 'Citoyen' },
    { value: 'agent',   label: 'Agent' },
  ],
};

export default function UserForm({ show, editingUser, onClose, onSubmit, currentUserRole }) {
  const [form, setForm]             = useState(EMPTY);
  const [showPwd, setShowPwd]       = useState(false);
  const [showPwdChange, setShowPwdChange] = useState(false);
  const [pwdError, setPwdError]     = useState('');

  useEffect(() => {
    setShowPwd(false);
    setShowPwdChange(false);
    setPwdError('');
    setForm(
      editingUser
        ? {
            email:     editingUser.email     || '',
            firstName: editingUser.firstName || '',
            lastName:  editingUser.lastName  || '',
            phone:     editingUser.phone     || '',
            role:      editingUser.role      || '',
            status:    editingUser.status    || '',
            password:  '',
          }
        : EMPTY
    );
  }, [editingUser, show]);

  if (!show) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validatePassword = (pwd) => {
    if (!pwd)                       return 'Le mot de passe est requis';
    if (pwd.length < 8)             return 'Au moins 8 caractères';
    if (!/[A-Z]/.test(pwd))        return 'Au moins une majuscule';
    if (!/[a-z]/.test(pwd))        return 'Au moins une minuscule';
    if (!/[0-9]/.test(pwd))        return 'Au moins un chiffre';
    if (!/[!@#$%^&*]/.test(pwd))   return 'Au moins un caractère spécial (!@#$%^&*)';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) {
      const err = validatePassword(form.password);
      if (err) { setPwdError(err); return; }
    } else if (showPwdChange && form.password) {
      const err = validatePassword(form.password);
      if (err) { setPwdError(err); return; }
    }
    setPwdError('');
    // Don't send password on edit unless explicitly set
    const submitData = (editingUser && !showPwdChange)
      ? { ...form, password: '' }
      : form;
    onSubmit(submitData);
  };

  const roleOptions = ROLE_OPTIONS[currentUserRole] || ROLE_OPTIONS.admin;

  const showPwdSection = !editingUser || (
    editingUser && canManage(currentUserRole, editingUser.role)
  );

  return (
    <div className="usr-overlay" onClick={onClose}>
      <div className="usr-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
          <div className="usr-modal-header">
            <h3>{editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h3>
            <button className="usr-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="usr-modal-form">

            <div className="usr-form-row">
              <div className="usr-field">
                <label>Prénom *</label>
                <input type="text" value={form.firstName} onChange={set('firstName')}
                  placeholder="Jean" required />
              </div>
              <div className="usr-field">
                <label>Nom *</label>
                <input type="text" value={form.lastName} onChange={set('lastName')}
                  placeholder="Dupont" required />
              </div>
            </div>

            <div className="usr-field">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jean@ecotrack.com"
                required
                disabled={!!editingUser}
                style={editingUser ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>

            <div className="usr-field">
              <label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+33 6 00 00 00 00" />
            </div>

            <div className="usr-form-row">
              <div className="usr-field">
                <label>Rôle *</label>
                <select value={form.role} onChange={set('role')} required>
                  <option value="" disabled>— Choisir un rôle —</option>
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="usr-field">
                <label>Statut *</label>
                <select value={form.status} onChange={set('status')} required>
                  <option value="" disabled>— Choisir —</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            {/* Creating: always show password */}
            {!editingUser && (
              <div className="usr-field">
                <label>Mot de passe *</label>
                <div className="usr-pwd-wrap">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { set('password')(e); setPwdError(''); }}
                    placeholder="Ex : MonMot2Passe!"
                    required
                  />
                  <button type="button" className="usr-pwd-toggle"
                    onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="usr-pwd-hint">
                  8 car. min · une majuscule · une minuscule · un chiffre · un spécial (!@#$%^&*)
                </p>
                {pwdError && <p className="usr-pwd-error">{pwdError}</p>}
              </div>
            )}

            {/* Editing: optional password change if role allows it */}
            {editingUser && showPwdSection && (
              <div className="usr-field">
                {!showPwdChange ? (
                  <button
                    type="button"
                    className="usr-pwd-change-btn"
                    onClick={() => setShowPwdChange(true)}
                  >
                    <KeyRound size={14} /> Changer le mot de passe
                  </button>
                ) : (
                  <>
                    <label>Nouveau mot de passe</label>
                    <div className="usr-pwd-wrap">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => { set('password')(e); setPwdError(''); }}
                        placeholder="Nouveau mot de passe"
                        autoFocus
                      />
                      <button type="button" className="usr-pwd-toggle"
                        onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <p className="usr-pwd-hint">
                      8 car. min · majuscule · minuscule · chiffre · spécial (!@#$%^&*)
                    </p>
                    {pwdError && <p className="usr-pwd-error">{pwdError}</p>}
                    <button
                      type="button"
                      className="usr-pwd-cancel-btn"
                      onClick={() => { setShowPwdChange(false); setForm((f) => ({ ...f, password: '' })); setPwdError(''); }}
                    >
                      Annuler le changement
                    </button>
                  </>
                )}
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
