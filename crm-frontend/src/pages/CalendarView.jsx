import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { tokenStore } from '../lib/apiClient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  X,
  Trash2,
  CalendarCheck,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const getCleanLocalDate = (dateObj = new Date()) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    time: '11:00 AM - 12:00 PM',
    type: 'Client Call',
    date: getCleanLocalDate()
  });

  // Centralized robust token getter
  const getAuthHeaders = () => {
    let token = '';
    try {
      if (tokenStore && typeof tokenStore.getAccess === 'function') {
        token = tokenStore.getAccess();
      }
    } catch (e) {}

    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    }

    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('crm_current_user') || localStorage.getItem('user') || '{}');
        token = storedUser.token || storedUser.accessToken;
      } catch (e) {}
    }

    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Filter helper: Won / Closed deals ke events ko hatayega + Sales isolation enforce karega
  const filterActiveEvents = (rawEvents = []) => {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('crm_current_user') || localStorage.getItem('user') || '{}');
    } catch (e) {}

    const userRole = (currentUser?.role || '').toLowerCase();
    const userId = Number(currentUser?.id || currentUser?.userId || 0);
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    return rawEvents.filter((ev) => {
      // 1. Agar user Sales hai, toh doosre users (jaise Admin User) ke events filter honge
      if (!isExecutive && userId > 0) {
        const evUserId = Number(ev.userId || ev.user_id || ev.createdById || 0);
        const evCreatorName = String(ev.createdByName || '').toLowerCase();
        const currentName = String(currentUser?.name || '').toLowerCase();

        if (evUserId > 0 && evUserId !== userId) {
          return false;
        }
        if (evUserId === 0 && evCreatorName && currentName && !evCreatorName.includes(currentName)) {
          return false;
        }
      }

      const stageStr = String(ev.stage || ev.status || '').toLowerCase();
      const typeStr = String(ev.type || '').toLowerCase();
      const titleStr = String(ev.title || '').toLowerCase();

      // 2. Won ya Closed deals ke events hide honge
      if (stageStr.includes('won') || stageStr.includes('closed')) {
        return false;
      }

      if (typeStr === 'closing' && (titleStr.includes('won') || titleStr.includes('closed'))) {
        return false;
      }

      return true;
    });
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Primary: Direct authenticated fetch with token
      const res = await fetch('http://localhost:5000/api/calendar', {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          setEvents(filterActiveEvents(data.events));
          setLoading(false);
          return;
        }
      }

      // Secondary: Axios instance
      try {
        const axiosRes = await api.get('/calendar');
        if (axiosRes?.data?.success && Array.isArray(axiosRes.data.events)) {
          setEvents(filterActiveEvents(axiosRes.data.events));
          setLoading(false);
          return;
        }
      } catch (axiosErr) {}

      setEvents([]);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthHeaderLabel = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthPaddedDays = Array.from(
    { length: startingDayIndex },
    (_, i) => prevMonthTotalDays - startingDayIndex + i + 1
  );
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getTypeBadge = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'task':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'presentation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'closing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'internal meeting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Create Meeting
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.title.trim()) return;

    try {
      const payload = {
        ...newMeeting,
        date: newMeeting.date.split('T')[0]
      };

      let created = false;
      try {
        const res = await api.post('/calendar', payload);
        if (res?.data?.success) created = true;
      } catch (e) {}

      if (!created) {
        await fetch('http://localhost:5000/api/calendar', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      await fetchEvents();
    } catch (err) {
      console.error('Failed to book meeting:', err);
    }

    setIsMeetingModalOpen(false);
    setNewMeeting({
      title: '',
      time: '11:00 AM - 12:00 PM',
      type: 'Client Call',
      date: getCleanLocalDate()
    });
  };

  // Save Rescheduled / Moved Meeting or Task
  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    const cleanDate = selectedMeeting.date.split('T')[0];
    const updatedPayload = { ...selectedMeeting, date: cleanDate };

    setEvents(prev => prev.map(ev => ev.id === selectedMeeting.id ? updatedPayload : ev));
    setIsEditModalOpen(false);

    try {
      let updated = false;
      try {
        const res = await api.put(`/calendar/${selectedMeeting.id}`, updatedPayload);
        if (res?.data?.success) updated = true;
      } catch (e) {}

      if (!updated) {
        await fetch(`http://localhost:5000/api/calendar/${selectedMeeting.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedPayload)
        });
      }
      await fetchEvents();
    } catch (err) {
      console.error('Failed to update event date:', err);
      fetchEvents();
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      try {
        await api.delete(`/calendar/${eventToDelete.id}`);
      } catch (e) {
        await fetch(`http://localhost:5000/api/calendar/${eventToDelete.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      }
      setEvents(prev => prev.filter(ev => ev.id !== eventToDelete.id));
      setEventToDelete(null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to delete event:', err);
      fetchEvents();
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = getCleanLocalDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & Activity Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Click any scheduled meeting or linked task to move, reschedule, or cancel it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 w-36 text-center select-none">
              {monthHeaderLabel}
            </span>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            type="button" 
            onClick={() => setIsMeetingModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Meeting</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-xs font-bold uppercase tracking-wider text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {prevMonthPaddedDays.map((padDay) => (
              <div key={`pad-${padDay}`} className="h-24 p-2 bg-slate-50/50 rounded-xl border border-slate-100 opacity-40 text-xs text-slate-400 select-none">
                {padDay}
              </div>
            ))}

            {currentMonthDays.map((day) => {
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const cellDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const dayEvents = events.filter(e => {
                const eventCleanDate = (e.date || '').split('T')[0];
                return eventCleanDate === cellDateStr;
              });

              const isToday = todayStr === cellDateStr;

              return (
                <div
                  key={day}
                  className={`h-24 p-2 rounded-xl border transition-all flex flex-col justify-between ${
                    isToday 
                      ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 font-extrabold' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        onClick={() => {
                          setSelectedMeeting({ ...ev, date: (ev.date || '').split('T')[0] });
                          setIsEditModalOpen(true);
                        }}
                        className={`text-[10px] p-1 rounded font-medium truncate border cursor-pointer hover:shadow-sm transition-all ${getTypeBadge(ev.type)}`}
                        title={ev.source === 'task' ? "Linked Task (Click to reschedule)" : "Meeting (Click to reschedule or delete)"}
                      >
                        {ev.source === 'task' ? `Task: ${ev.title}` : ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Agenda Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Upcoming Agenda
            </h3>

            <div className="space-y-3">
              {loading && events.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading agenda...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-xl">
                  No upcoming meetings or tasks scheduled.
                </div>
              ) : (
                events.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={() => {
                      setSelectedMeeting({ ...ev, date: (ev.date || '').split('T')[0] });
                      setIsEditModalOpen(true);
                    }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    title="Click to reschedule"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeBadge(ev.type)}`}>
                        {ev.source === 'task' ? 'Task Due' : ev.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{ev.createdByName || 'Admin User'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {ev.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Date: {(ev.date || '').split('T')[0]}</span>
                      <span className="text-indigo-600 text-[10px] font-semibold underline">Reschedule</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Meeting Modal */}
      {isMeetingModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Book New Client Meeting</h3>
              <button 
                type="button" 
                onClick={() => setIsMeetingModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery Call with Aura Fragrance"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Type</label>
                  <select
                    value={newMeeting.type}
                    onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
                  >
                    <option value="Client Call">Client Call</option>
                    <option value="Internal Meeting">Internal Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Time Slot</label>
                <input
                  type="text"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  placeholder="11:00 AM - 12:00 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Meeting
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reschedule / Move Modal */}
      {isEditModalOpen && selectedMeeting && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                {selectedMeeting.source === 'task' ? 'Reschedule Linked Task' : 'Reschedule / Move Meeting'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  disabled={selectedMeeting.source === 'task'}
                  value={selectedMeeting.title}
                  onChange={(e) => setSelectedMeeting({ ...selectedMeeting, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-slate-800 text-sm ${
                    selectedMeeting.source === 'task'
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500'
                      : 'bg-slate-50 border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">New Date</label>
                  <input
                    type="date"
                    required
                    value={selectedMeeting.date}
                    onChange={(e) => setSelectedMeeting({ ...selectedMeeting, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-indigo-300 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Type / Source</label>
                  {selectedMeeting.source === 'task' ? (
                    <div className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center h-[42px]">
                      Linked Task Due Date
                    </div>
                  ) : (
                    <select
                      value={selectedMeeting.type}
                      onChange={(e) => setSelectedMeeting({ ...selectedMeeting, type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 text-sm cursor-pointer"
                    >
                      <option value="Client Call">Client Call</option>
                      <option value="Internal Meeting">Internal Meeting</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Closing">Closing</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Time Slot</label>
                <input
                  type="text"
                  disabled={selectedMeeting.source === 'task'}
                  value={selectedMeeting.time}
                  onChange={(e) => setSelectedMeeting({ ...selectedMeeting, time: e.target.value })}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-slate-800 text-sm ${
                    selectedMeeting.source === 'task'
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500'
                      : 'bg-slate-50 border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEventToDelete(selectedMeeting)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {eventToDelete.source === 'task' ? 'Delete Linked Task' : 'Cancel Meeting'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to delete <span className="text-slate-800 font-semibold">"{eventToDelete.title}"</span>? This will permanently remove it from the system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}