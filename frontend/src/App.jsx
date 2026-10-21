import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import DealsPipeline from './pages/DealsPipeline';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import Settings from './pages/Settings';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  Layers, 
  LogOut, 
  ChevronDown, 
  User,
  Bell,
  CheckCircle2,
  Clock,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import * as apiServices from './services/api';

// Exact Real-time Relative Clock
function timeAgo(dateInput) {
  if (!dateInput) return 'Just now';
  const past = new Date(dateInput);
  if (isNaN(past.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const active = localStorage.getItem('crm_current_user');
      if (active) return JSON.parse(active);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [, setTick] = useState(0);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Storage keys isolated per user ID
  const getSettingsKey = (user) => (user?.id ? `crm_notifications_settings_uid_${user.id}` : 'crm_notifications_settings_guest');
  const getAlertsKey = (user) => (user?.id ? `crm_live_alerts_uid_${user.id}` : 'crm_live_alerts_guest');

  // Read saved settings
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const active = localStorage.getItem('crm_current_user');
      const u = active ? JSON.parse(active) : null;
      const key = getSettingsKey(u);
      const saved = localStorage.getItem(key) || localStorage.getItem('crm_notifications_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { newDeal: true, taskDue: true, whatsapp: true };
  });

  // User-isolated alerts list (New user starts with 0 alerts)
  const [notificationsList, setNotificationsList] = useState(() => {
    try {
      const active = localStorage.getItem('crm_current_user');
      const u = active ? JSON.parse(active) : null;
      if (!u) return [];

      const key = getAlertsKey(u);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }

      // Default seed sirf user 1 (Admin/CFO) ke pass
      if (u.id === 1) {
        const now = Date.now();
        const seed = [
          {
            id: 1,
            channel: 'deal',
            title: 'New Deal Assigned',
            desc: 'Enterprise License deal assigned to your pipeline.',
            createdAt: now,
            read: false,
            link: '/deals'
          },
          {
            id: 2,
            channel: 'task',
            title: 'Task Due Reminder',
            desc: 'Follow up with Al-Shifa Healthcare is due today.',
            createdAt: now,
            read: false,
            link: '/tasks'
          },
          {
            id: 3,
            channel: 'whatsapp',
            title: 'WhatsApp Alert Active',
            desc: 'Instant WhatsApp mobile dispatch enabled for deals.',
            createdAt: now,
            read: false,
            link: '/deals'
          }
        ];
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
    } catch (e) {}
    return [];
  });

  // Safe fetch from DB with fallback (No white screen)
  const syncWithDatabase = async () => {
    if (!currentUser?.id || typeof apiServices.fetchNotifications !== 'function') return;
    try {
      const res = await apiServices.fetchNotifications();
      if (res?.data?.success && Array.isArray(res.data.notifications)) {
        if (res.data.notifications.length > 0) {
          const formatted = res.data.notifications.map((n) => ({
            id: n.id,
            channel: n.channel || 'deal',
            title: n.title,
            desc: n.description,
            createdAt: n.created_at,
            read: n.is_read,
            link: n.link || '/deals'
          }));
          setNotificationsList(formatted);
          localStorage.setItem(getAlertsKey(currentUser), JSON.stringify(formatted));
        }
      }
    } catch (e) {
      // Background catch: UI chalte rahegi bina ruke
    }
  };

  useEffect(() => {
    syncWithDatabase();
    const interval = setInterval(syncWithDatabase, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Re-calculate real relative time every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Sync settings when switching user or page
  useEffect(() => {
    try {
      const active = localStorage.getItem('crm_current_user');
      const u = active ? JSON.parse(active) : null;
      setCurrentUser(u);

      if (u) {
        const sKey = getSettingsKey(u);
        const savedSettings = localStorage.getItem(sKey) || localStorage.getItem('crm_notifications_settings');
        if (savedSettings) {
          const newSets = JSON.parse(savedSettings);

          setNotificationsList((prevList) => {
            let hasChanges = false;
            const updated = prevList.map((item) => {
              const wasDisabled = 
                (item.channel === 'deal' && !notifSettings.newDeal && newSets.newDeal) ||
                (item.channel === 'task' && !notifSettings.taskDue && newSets.taskDue) ||
                (item.channel === 'whatsapp' && !notifSettings.whatsapp && newSets.whatsapp);

              if (wasDisabled) {
                hasChanges = true;
                return { ...item, createdAt: Date.now(), read: false };
              }
              return item;
            });

            if (hasChanges) {
              localStorage.setItem(getAlertsKey(u), JSON.stringify(updated));
              return updated;
            }
            return prevList;
          });

          setNotifSettings(newSets);
        }

        const aKey = getAlertsKey(u);
        const savedAlerts = localStorage.getItem(aKey);
        if (savedAlerts) {
          setNotificationsList(JSON.parse(savedAlerts));
        } else if (u.id !== 1) {
          setNotificationsList([]);
        }
      }
    } catch (e) {}
  }, [location.pathname]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('crm_current_user', JSON.stringify(userData));
    localStorage.setItem('crm_profile_data', JSON.stringify(userData));

    const aKey = getAlertsKey(userData);
    const savedAlerts = localStorage.getItem(aKey);
    if (savedAlerts) {
      setNotificationsList(JSON.parse(savedAlerts));
    } else {
      setNotificationsList(userData.id === 1 ? notificationsList : []);
    }

    navigate('/deals');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_current_user');
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return 'AR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filter alerts according to active Settings checkboxes
  const activeAlerts = notificationsList.filter((notif) => {
    if (notif.channel === 'deal' && !notifSettings.newDeal) return false;
    if (notif.channel === 'task' && !notifSettings.taskDue) return false;
    if (notif.channel === 'whatsapp' && !notifSettings.whatsapp) return false;
    return true;
  });

  const unreadCount = activeAlerts.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const updated = notificationsList.map((n) => ({ ...n, read: true }));
    setNotificationsList(updated);
    if (currentUser) {
      localStorage.setItem(getAlertsKey(currentUser), JSON.stringify(updated));
    }
    if (typeof apiServices.markNotificationsAsRead === 'function') {
      try { await apiServices.markNotificationsAsRead(); } catch (e) {}
    }
  };

  const markSingleRead = async (id, targetLink) => {
    const updated = notificationsList.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotificationsList(updated);
    if (currentUser) {
      localStorage.setItem(getAlertsKey(currentUser), JSON.stringify(updated));
    }
    if (typeof apiServices.markNotificationsAsRead === 'function') {
      try { await apiServices.markNotificationsAsRead(id); } catch (e) {}
    }
    setIsNotifOpen(false);
    navigate(targetLink);
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex flex-col font-sans">
      
      {currentUser && !isAuthPage && (
        <header className="sticky top-0 z-20 bg-[#0d131f] border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Logo & Branding */}
            <div 
              onClick={() => navigate('/deals')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Layers className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                  CRM Pro <span className="text-emerald-400">Enterprise</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  Business Management & Sales System
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
              <NavLink
                to="/deals"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Layers className="w-4 h-4" />
                <span>Deals Pipeline</span>
              </NavLink>

              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
              </NavLink>

              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>
            </nav>

            {/* Right Action Icons & Profile */}
            <div className="flex items-center gap-2.5">
              
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsDropdownOpen(false);
                  }}
                  className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Notifications & Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#0d131f] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">System Alerts</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {activeAlerts.length} Active
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {activeAlerts.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          No notifications for {currentUser?.name || 'this agent'} yet.
                        </div>
                      ) : (
                        activeAlerts.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => markSingleRead(item.id, item.link)}
                            className={`p-3.5 hover:bg-slate-800/60 transition-colors cursor-pointer flex gap-3 ${
                              !item.read ? 'bg-slate-800/25' : ''
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 h-fit mt-0.5 ${
                              item.channel === 'whatsapp' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : item.channel === 'deal' 
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.channel === 'deal' && <Briefcase className="w-4 h-4" />}
                              {item.channel === 'task' && <Clock className="w-4 h-4" />}
                              {item.channel === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h4 className={`text-xs font-bold truncate ${!item.read ? 'text-white' : 'text-slate-400'}`}>
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                                  {timeAgo(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                                {item.desc}
                              </p>
                            </div>

                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 self-center animate-pulse" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/settings?tab=notifications');
                        }}
                        className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
                      >
                        Configure Alert Preferences →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Badge & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {getInitials(currentUser.name)}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-none font-medium capitalize">
                      {currentUser.role === 'user' || !currentUser.role ? 'Sales Agent' : currentUser.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/settings?tab=profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/settings?tab=security');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Settings</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </header>
      )}

      {/* Protected Routes Handling */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <Routes>
          <Route path="/" element={<Navigate to={currentUser ? "/deals" : "/login"} replace />} />
          <Route path="/deals" element={currentUser ? <DealsPipeline /> : <Navigate to="/login" replace />} />
          <Route path="/tasks" element={currentUser ? <Tasks /> : <Navigate to="/login" replace />} />
          <Route path="/calendar" element={currentUser ? <CalendarView /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={currentUser ? <Settings /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={currentUser ? <Navigate to="/deals" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={currentUser ? <Navigate to="/deals" replace /> : <Register />} />
          <Route path="*" element={<Navigate to={currentUser ? "/deals" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}