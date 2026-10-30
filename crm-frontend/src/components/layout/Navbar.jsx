import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Settings as SettingsIcon,
  CheckSquare,
  Briefcase,
  Users,
  X,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { tokenStore } from "../../lib/apiClient";

export default function Navbar({ onMenuClick }) {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Fully Dynamic User State synced with DB & localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_current_user") || localStorage.getItem("user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return authUser || null;
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const saved = localStorage.getItem("crm_current_user") || localStorage.getItem("user");
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        } else if (authUser) {
          setCurrentUser(authUser);
        }
      } catch (e) {}
    };

    syncUser();
    window.addEventListener("crm_user_updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("crm_user_updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [authUser]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(true);

  // Profile menu dropdown state
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Centralized robust token getter
  const getAuthToken = () => {
    let token = "";
    try {
      if (tokenStore && typeof tokenStore.getAccess === "function") {
        token = tokenStore.getAccess();
      }
    } catch (e) {}

    if (!token) {
      token = localStorage.getItem("token") || localStorage.getItem("crm_token");
    }

    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("crm_current_user") || localStorage.getItem("user") || "{}");
        token = storedUser.token || storedUser.accessToken;
      } catch (e) {}
    }

    return token || "";
  };

  // Auto-detecting fetch handler with strictly injected token
  const safeApiGet = async (path) => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const endpoints = [
      `/api${path}`,
      path,
      `http://localhost:5000/api${path}`,
      `http://localhost:5000${path}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }
    return null;
  };

  // Live Spotlight Search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await safeApiGet(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
      
      // Support both { success: true, data: { ... } } and direct object
      const resultData = res?.data || res;
      if (resultData && typeof resultData === "object") {
        setSearchResults(resultData);
        setSearchOpen(true);
      }
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Notifications loader (Role Isolated)
  const loadNotifications = async () => {
    const res = await safeApiGet("/dashboard/notifications");
    const notifArray = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    setNotifications(notifArray);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleToggleNotifications = () => {
    if (!notifOpen) {
      loadNotifications();
      setHasUnread(false);
    }
    setNotifOpen(!notifOpen);
    setSearchOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (path) => {
    navigate(path);
    setSearchOpen(false);
    setQuery("");
  };

  const hasAnyResults =
    searchResults &&
    ((searchResults.deals && searchResults.deals.length > 0) ||
      (searchResults.tasks && searchResults.tasks.length > 0) ||
      (searchResults.leads && searchResults.leads.length > 0) ||
      (searchResults.contacts && searchResults.contacts.length > 0));

  // Always prefer the freshest updated state
  const activeUser = currentUser || authUser;
  const userName = activeUser?.name || "Admin User";
  const userEmail = activeUser?.email || "admin@crm.com";
  const userRole = activeUser?.role || "Admin";
  const userAvatar = activeUser?.avatar || activeUser?.avatarUrl || activeUser?.picture || activeUser?.image;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Global Search */}
      <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (searchResults) setSearchOpen(true); }}
          placeholder="Search anything"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setSearchResults(null); setSearchOpen(false); }} 
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}

        {/* Dropdown Results */}
        {searchOpen && (
          <div className="absolute left-0 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-2xl max-h-96 overflow-y-auto p-2 z-50">
            {isSearching && (
              <div className="p-3 text-center text-xs text-slate-400">Searching CRM records...</div>
            )}

            {!isSearching && !hasAnyResults && (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching results found for "{query}"
              </div>
            )}

            {!isSearching && hasAnyResults && (
              <div className="space-y-3">
                {searchResults.deals && searchResults.deals.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={12} /> Deals Pipeline
                    </div>
                    {searchResults.deals.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelectResult("/deals")}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{d.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{d.stage}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.tasks && searchResults.tasks.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={12} /> Tasks & Agendas
                    </div>
                    {searchResults.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectResult("/tasks")}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{t.title}</span>
                        <span className="text-[11px] text-slate-500">{t.priority} Priority</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.leads && searchResults.leads.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} /> Leads
                    </div>
                    {searchResults.leads.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => handleSelectResult("/leads")}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{l.name}</span>
                        <span className="text-[11px] text-slate-400">{l.company}</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.contacts && searchResults.contacts.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} /> Contacts
                    </div>
                    {searchResults.contacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectResult("/contacts")}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{c.name}</span>
                        <span className="text-[11px] text-slate-400">{c.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Icons */}
      <div className="ml-auto flex items-center gap-3">
        {/* Bell Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {hasUnread && notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                <span className="text-[11px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                  {notifications.length} alerts
                </span>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        navigate(n.link);
                        setNotifOpen(false);
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.subtitle}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No pending alerts right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu (Live Picture + Name + Dropdown) */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
              setSearchOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="User profile menu"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover border border-slate-300 shadow-sm"
              />
            ) : (
              <Avatar name={userName} size="sm" />
            )}
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-semibold text-slate-800">{userName}</p>
              <p className="text-[11px] capitalize text-slate-500">{userRole}</p>
            </div>
            <ChevronDown size={14} className="hidden text-slate-400 md:block ml-0.5" />
          </button>

          {/* Profile Floating Menu (Settings & Logout) */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white py-2 shadow-2xl z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <Avatar name={userName} size="sm" />
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/settings");
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <SettingsIcon size={16} />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}