import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import './Calendar.css';

export default function Calendar({ 
  events = [],
  onDateSelect = () => {},
  onEventAdd = () => {},
  loading = false
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect(newDate);
  };

  const getEventsForDate = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => 
      new Date(event.date).toDateString() === date.toDateString()
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3 className="calendar-title">📅 Calendrier Tournées</h3>
        <button 
          className="btn btn-sm btn-primary"
          onClick={onEventAdd}
        >
          <Plus size={16} />
          Événement
        </button>
      </div>

      <div className="calendar">
        <div className="calendar-nav">
          <button 
            className="calendar-nav-btn"
            onClick={previousMonth}
            aria-label="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <h4 className="calendar-month">{monthName}</h4>
          <button 
            className="calendar-nav-btn"
            onClick={nextMonth}
            aria-label="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-weekdays">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const isCurrentDay = day && isToday(day);
            const isSelectedDay = day && isSelected(day);

            return (
              <div
                key={index}
                className={`calendar-day ${day ? 'active' : 'empty'} ${isCurrentDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}`}
                onClick={() => day && handleDateClick(day)}
              >
                <div className="day-number">{day}</div>
                <div className="day-events">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <div 
                      key={i} 
                      className={`event-dot event-${event.type || 'default'}`}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="event-more">+{dayEvents.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-details">
          <h4 className="details-title">
            {selectedDate.toLocaleString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          <div className="details-events">
            {getEventsForDate(selectedDate.getDate()).length > 0 ? (
              getEventsForDate(selectedDate.getDate()).map((event, i) => (
                <div key={i} className={`event-item event-${event.type}`}>
                  <div className="event-item-title">{event.title}</div>
                  <div className="event-item-time">{event.time}</div>
                  {event.description && (
                    <div className="event-item-desc">{event.description}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-events">Aucun événement</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EventForm({ onSubmit = () => {}, onClose = () => {} }) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'tournee',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: 'tournee',
      description: '',
    });
  };

  return (
    <div className="event-form-modal">
      <div className="event-form">
        <h3 className="form-title">Ajouter un événement</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Titre</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="Titre de l'événement"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Heure</label>
              <input
                type="time"
                name="time"
                className="form-input"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              name="type"
              className="form-input"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="tournee">Tournée</option>
              <option value="maintenance">Maintenance</option>
              <option value="inspection">Inspection</option>
              <option value="meeting">Réunion</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optionnel)</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Détails de l'événement"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
