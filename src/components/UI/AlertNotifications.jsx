import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import './AlertNotifications.css';

export default function AlertNotifications({ 
  alerts = [],
  onDismiss = () => {},
  position = 'top-right'
}) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  const dismissAlert = (id) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== id));
    onDismiss(id);
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'error':
        return <AlertCircle size={20} />;
      case 'success':
        return <CheckCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  return (
    <div className={`alert-container alert-${position}`}>
      {visibleAlerts.map((alert) => (
        <div 
          key={alert.id} 
          className={`alert alert-${alert.type || 'info'}`}
        >
          <div className="alert-icon">
            {getAlertIcon(alert.type)}
          </div>
          
          <div className="alert-content">
            <h4 className="alert-title">{alert.title}</h4>
            {alert.message && <p className="alert-message">{alert.message}</p>}
          </div>
          
          <button 
            className="alert-close"
            onClick={() => dismissAlert(alert.id)}
            aria-label="Fermer l'alerte"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook personnalisé pour gérer les alertes
export function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (type = 'info', title = '', message = '') => {
    const id = Date.now();
    const alert = { id, type, title, message };
    setAlerts(prev => [...prev, alert]);
    
    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
    
    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    addSuccess: (title, message) => addAlert('success', title, message),
    addError: (title, message) => addAlert('error', title, message),
    addInfo: (title, message) => addAlert('info', title, message),
    addWarning: (title, message) => addAlert('warning', title, message),
  };
}
