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
  User 
} from 'lucide-react';

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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Sync active user state across navigation
  useEffect(() => {
    try {
      const active = localStorage.getItem('crm_current_user');
      if (active) {
        setCurrentUser(JSON.parse(active));
      } else {
        setCurrentUser(null);
      }
    } catch (e) {}
  }, [location.pathname]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('crm_current_user', JSON.stringify(userData));
    localStorage.setItem('crm_profile_data', JSON.stringify(userData));
    navigate('/deals');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_current_user'); // Session clear
    setIsDropdownOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return 'AR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
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

            {/* User Profile Badge & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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