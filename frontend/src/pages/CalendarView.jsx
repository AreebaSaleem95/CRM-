import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { initialCalendarEvents } from '../data/mockData';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  X,
  Check
} from 'lucide-react';

export default function CalendarView() {
  const monthsList = [
    "September 2026", "October 2026", "November 2026", "December 2026"
  ];
  const [monthIndex, setMonthIndex] = useState(1); // 1 = October 2026

  // Events from LocalStorage
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('crm_calendar_events');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return initialCalendarEvents;
  });

  // Real Book Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    time: '11:00 AM - 12:00 PM',
    type: 'Client Call',
    date: '2026-10-15'
  });

  const saveEvents = (updated) => {
    setEvents(updated);
    localStorage.setItem('crm_calendar_events', JSON.stringify(updated));
  };

  const handlePrevMonth = () => {
    if (monthIndex > 0) setMonthIndex(monthIndex - 1);
  };

  const handleNextMonth = () => {
    if (monthIndex < monthsList.length - 1) setMonthIndex(monthIndex + 1);
  };

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeeting.title) return;

    const created = {
      id: `ev-${Date.now()}`,
      title: newMeeting.title,
      time: newMeeting.time,
      date: newMeeting.date,
      type: newMeeting.type,
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    };

    saveEvents([created, ...events]);
    setIsMeetingModalOpen(false);
    setNewMeeting({ title: '', time: '11:00 AM - 12:00 PM', type: 'Client Call', date: '2026-10-15' });
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Schedule & Activity Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sales presentations, discovery calls, and contract reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Working Month Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
            <button 
              onClick={handlePrevMonth}
              disabled={monthIndex === 0}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-200 px-3 w-32 text-center">
              {monthsList[monthIndex]}
            </span>
            <button 
              onClick={handleNextMonth}
              disabled={monthIndex === monthsList.length - 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Functional Meeting Modal Button */}
          <button 
            onClick={() => setIsMeetingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
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
            <div className="h-24 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 opacity-40 text-xs text-slate-600">28</div>
            <div className="h-24 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 opacity-40 text-xs text-slate-600">29</div>
            <div className="h-24 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40 opacity-40 text-xs text-slate-600">30</div>

            {calendarDays.map((day) => {
              const dateStr = `2026-10-${day < 10 ? '0' + day : day}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = day === 14;

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
                      <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        className={`text-[10px] p-1 rounded font-medium truncate border ${ev.color}`}
                        title={ev.title}
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
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.color}`}>
                    {ev.type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100">{ev.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{ev.time}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Date: {ev.date}
                  </div>
                </div>
              ))}
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
                className="text-slate-400 hover:text-white"
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
                  placeholder="10:30 AM - 11:30 AM"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md"
                >
                  Confirm Meeting
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}