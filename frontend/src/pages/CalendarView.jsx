import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  X,
  Trash2,
  CalendarCheck
} from 'lucide-react';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    time: '11:00 AM - 12:00 PM',
    type: 'Client Call',
    date: '2026-10-21'
  });

  const getAuthHeaders = () => {
    let token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('crm_current_user') || '{}');
        token = storedUser.token;
      } catch (e) {}
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/calendar', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
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

  // Create Meeting
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.title) return;

    try {
      const res = await fetch('http://localhost:5000/api/calendar', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMeeting)
      });
      const data = await res.json();
      if (data.success) {
        await fetchEvents();
      }
    } catch (err) {
      console.error('Failed to book meeting:', err);
    }

    setIsMeetingModalOpen(false);
    setNewMeeting({
      title: '',
      time: '11:00 AM - 12:00 PM',
      type: 'Client Call',
      date: '2026-10-21'
    });
  };

  // Open Edit/Move Modal
  const handleOpenEdit = (eventItem) => {
    setSelectedMeeting({ ...eventItem });
    setIsEditModalOpen(true);
  };

  // Save Rescheduled / Moved Meeting
  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    // Optimistic UI update
    setEvents(prev => prev.map(ev => ev.id === selectedMeeting.id ? selectedMeeting : ev));
    setIsEditModalOpen(false);

    try {
      await fetch(`http://localhost:5000/api/calendar/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: selectedMeeting.title,
          date: selectedMeeting.date,
          time: selectedMeeting.time,
          type: selectedMeeting.type
        })
      });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to update event date:', err);
      fetchEvents();
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    setIsEditModalOpen(false);

    try {
      await fetch(`http://localhost:5000/api/calendar/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      fetchEvents();
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Schedule & Activity Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Click any scheduled meeting to move, reschedule, or cancel it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
            <button 
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-200 px-3 w-36 text-center select-none">
              {monthHeaderLabel}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setIsMeetingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Meeting</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-xs font-bold uppercase tracking-wider text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {prevMonthPaddedDays.map((padDay) => (
              <div key={`pad-${padDay}`} className="h-24 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 opacity-30 text-xs text-slate-600">
                {padDay}
              </div>
            ))}

            {currentMonthDays.map((day) => {
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = currentYear === 2026 && currentMonth === 9 && day === 21;

              return (
                <div
                  key={day}
                  className={`h-24 p-2 rounded-xl border transition-all flex flex-col justify-between ${
                    isToday 
                      ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        onClick={() => handleOpenEdit(ev)}
                        className={`text-[10px] p-1 rounded font-medium truncate border cursor-pointer hover:scale-[1.02] transition-transform ${ev.color || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}
                        title="Click to reschedule or delete"
                      >
                        {ev.title}
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
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              Upcoming Agenda
            </h3>

            <div className="space-y-3">
              {loading && events.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">Loading agenda...</div>
              ) : events.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                  No upcoming meetings scheduled.
                </div>
              ) : (
                events.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={() => handleOpenEdit(ev)}
                    className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                    title="Click to move/reschedule"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.color || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                        {ev.type}
                      </span>
                      {ev.createdByName && (
                        <span className="text-[10px] text-slate-400">{ev.createdByName}</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {ev.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{ev.time}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span>Date: {ev.date}</span>
                      <span className="text-emerald-400 text-[10px] underline">Reschedule</span>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Book New Client Meeting</h3>
              <button 
                type="button" 
                onClick={() => setIsMeetingModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery Call with IT Tech Fusion"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Type</label>
                  <select
                    value={newMeeting.type}
                    onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Client Call">Client Call</option>
                    <option value="Internal Meeting">Internal Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Time Slot</label>
                <input
                  type="text"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  placeholder="11:00 AM - 12:00 PM"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Meeting
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reschedule / Move / Cancel Meeting Modal */}
      {isEditModalOpen && selectedMeeting && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
                Reschedule / Move Meeting
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={selectedMeeting.title}
                  onChange={(e) => setSelectedMeeting({ ...selectedMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">New Date (Move)</label>
                  <input
                    type="date"
                    required
                    value={selectedMeeting.date}
                    onChange={(e) => setSelectedMeeting({ ...selectedMeeting, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Type</label>
                  <select
                    value={selectedMeeting.type}
                    onChange={(e) => setSelectedMeeting({ ...selectedMeeting, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Client Call">Client Call</option>
                    <option value="Internal Meeting">Internal Meeting</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Time Slot</label>
                <input
                  type="text"
                  value={selectedMeeting.time}
                  onChange={(e) => setSelectedMeeting({ ...selectedMeeting, time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel / Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer"
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
    </div>
  );
}