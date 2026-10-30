import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Sliders, 
  Save, 
  Key, 
  Check, 
  Camera,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
  Users,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tokenStore } from '../lib/apiClient';

export default function Settings() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { user: authUser, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'security', 'preferences', 'team'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Load active logged-in user dynamically
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_current_user') || localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: authUser?.name || '',
      email: authUser?.email || '',
      role: authUser?.role || 'sales',
      company: authUser?.company || 'Tech Fusion',
      avatar: authUser?.avatarUrl || authUser?.avatar || authUser?.picture || ''
    };
  });

  useEffect(() => {
    if (authUser) {
      setProfileData((prev) => ({
        ...prev,
        name: authUser.name || prev.name || '',
        email: authUser.email || prev.email || '',
        role: authUser.role || prev.role || 'sales',
        company: authUser.company || prev.company || 'Tech Fusion',
        avatar: authUser.avatarUrl || authUser.avatar || authUser.picture || prev.avatar || ''
      }));
    }
  }, [authUser]);

  // Check if current user is an Admin
  const currentRole = (authUser?.role || profileData.role || '').toLowerCase();
  const isAdmin = currentRole === 'admin';

  // Safe API caller using native fetch
  const getAuthToken = () => {
    let token = '';
    try {
      if (tokenStore && typeof tokenStore.getAccess === 'function') {
        token = tokenStore.getAccess();
      }
    } catch (e) {}
    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('crm_token') || '';
    }
    return token;
  };

  const callAuthApi = async (path, bodyData) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const endpoints = [
      `/api${path}`,
      path,
      `http://localhost:5000/api${path}`,
      `http://localhost:5000${path}`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(bodyData)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }
    throw new Error('API connection failed');
  };

  // Password State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // CRM Preferences State (100% UNTOUCHED)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('crm_preferences_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { currency: 'EUR (€)', layout: 'List / Spreadsheet View' };
  });
  const [prefSavedToast, setPrefSavedToast] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- TEAM MANAGEMENT STATE (FOR ADMIN ONLY) ---
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSuccessMsg, setTeamSuccessMsg] = useState('');
  const [teamErrorMsg, setTeamErrorMsg] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchTeamUsers = async () => {
    if (!isAdmin) return;
    try {
      setTeamLoading(true);
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch('http://localhost:5000/api/auth/users', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setTeamUsers(data.users);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load team users:', e);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team' && isAdmin) {
      fetchTeamUsers();
    }
  }, [activeTab, isAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      setTeamSuccessMsg('');
      setTeamErrorMsg('');
      const token = getAuthToken();

      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTeamSuccessMsg(`User role successfully changed to ${newRole.toUpperCase()}!`);
        setTeamUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setTimeout(() => setTeamSuccessMsg(''), 3000);
      } else {
        setTeamErrorMsg(data.message || 'Failed to update role.');
      }
    } catch (err) {
      setTeamErrorMsg('Network error while updating role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle Photo Compression & Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 220;
        const MAX_HEIGHT = 220;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        setProfileData((prev) => ({
          ...prev,
          avatar: compressedBase64
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Permanent Database Save & Live Navbar Sync
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);

      const payload = {
        name: profileData.name,
        role: isAdmin ? profileData.role : (authUser?.role || 'sales'),
        company: profileData.company,
        avatar: profileData.avatar,
        avatarUrl: profileData.avatar
      };

      const result = await callAuthApi('/auth/profile', payload);

      const updatedUser = {
        ...(authUser || {}),
        ...(result?.user || {}),
        ...payload,
        avatar: profileData.avatar,
        avatarUrl: profileData.avatar
      };

      localStorage.setItem("crm_current_user", JSON.stringify(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (typeof updateUser === 'function') {
        updateUser(updatedUser);
      }

      window.dispatchEvent(new Event('crm_user_updated'));

      setProfileData(updatedUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Database update failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Change Password in DB (8 Min Characters)
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (newPassInput.length < 8) {
      setPassErrorMsg("New password kam az kam 8 characters ka hona zaroori hai.");
      return;
    }

    try {
      setPassLoading(true);

      const result = await callAuthApi('/auth/change-password', {
        currentPassword: currentPassInput,
        newPassword: newPassInput
      });

      if (result && (result.success || result.message)) {
        setPassSuccessMsg("Password has been successfully updated in database!!");
        setCurrentPassInput('');
        setNewPassInput('');
        setTimeout(() => setPassSuccessMsg(''), 4000);
      } else {
        setPassErrorMsg(result?.message || "Password update fail ho gaya.");
      }
    } catch (err) {
      setPassErrorMsg("Incorrect current password or server error.");
    } finally {
      setPassLoading(false);
    }
  };

  // Preferences Change (100% UNTOUCHED)
  const handlePreferenceChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('crm_preferences_settings', JSON.stringify(updated));
    setPrefSavedToast(true);
    setTimeout(() => setPrefSavedToast(false), 2000);
  };

  // Dynamic Tabs (Team Tab only appears if user is Admin)
  const tabs = [
    { id: 'profile', name: 'Profile & Account', icon: User },
    { id: 'security', name: 'Security & Access', icon: Shield },
    { id: 'preferences', name: 'CRM Preferences', icon: Sliders },
    ...(isAdmin ? [{ id: 'team', name: 'Team Management', icon: Users }] : [])
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account credentials, notifications, and application settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {/* TAB 1: Profile & Account */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                  title="Upload New Photo"
                >
                  <Camera className="w-5 h-5 text-indigo-300" />
                  <span className="text-[10px] font-semibold mt-1">Change</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900">{profileData.name || 'User'}</h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold underline cursor-pointer"
                  >
                    Upload Picture
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{profileData.role || 'Sales'}</p>
                <span className="inline-block mt-1.5 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {profileData.company || 'Tech Fusion'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email Address
                  </label>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Role
                  </label>
                  {!isAdmin && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                      <Lock className="w-3 h-3" /> Managed by Admin
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  placeholder="e.g. Admin, Manager, Sales"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-all capitalize ${
                    isAdmin 
                      ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white' 
                      : 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed select-none'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  placeholder="e.g. Tech Fusion"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {savedSuccess ? (
                <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  <Check className="w-4 h-4" /> Profile permanently saved in database!
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to DB...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Access */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Password & Authentication
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your login password to secure your CRM account.
              </p>
            </div>

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <Check className="w-4 h-4" />
                {passSuccessMsg}
              </div>
            )}

            {passErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600 font-semibold">
                <AlertCircle className="w-4 h-4" />
                {passErrorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  New Password (Min 8 Characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                {passLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Preferences (100% UNTOUCHED) */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">UI & Regional Preferences</h3>
                <p className="text-xs text-slate-500">Customize global display currency and pipeline presentation.</p>
              </div>
              {prefSavedToast && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Preferences Applied
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Default Currency
                </label>
                <select 
                  value={preferences.currency} 
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="PKR (Rs)">PKR (Rs)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pipeline Layout Mode
                </label>
                <select 
                  value={preferences.layout} 
                  onChange={(e) => handlePreferenceChange('layout', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  <option value="Kanban Board (Default)">Kanban Board (Default)</option>
                  <option value="List / Spreadsheet View">List / Spreadsheet View</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Team Management (ADMIN ONLY - DYNAMIC ROLE MANAGEMENT) */}
        {activeTab === 'team' && isAdmin && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Team Role Management
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Promote sales agents to Manager or assign administrator privileges.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchTeamUsers}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                Refresh Team List
              </button>
            </div>

            {teamSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <Check className="w-4 h-4" />
                {teamSuccessMsg}
              </div>
            )}

            {teamErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600 font-semibold">
                <AlertCircle className="w-4 h-4" />
                {teamErrorMsg}
              </div>
            )}

            {teamLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading registered team members...</span>
              </div>
            ) : teamUsers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No team users found in database.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Member Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Current Role</th>
                        <th className="px-4 py-3 text-right">Assign Authority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamUsers.map((member) => {
                        const isSelf = member.id === authUser?.id || member.email === authUser?.email;
                        const roleLower = String(member.role || 'sales').toLowerCase();

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-slate-400" />
                                <span>{member.name || 'Unnamed User'}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">{member.email}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${
                                roleLower === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : roleLower === 'manager'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {roleLower}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-slate-400 italic">Master Admin</span>
                              ) : (
                                <select
                                  disabled={updatingUserId === member.id}
                                  value={roleLower}
                                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                                >
                                  <option value="sales">Sales Representative</option>
                                  <option value="manager">Sales Manager</option>
                                  <option value="admin">System Admin</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}