import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Bell, 
  Sliders, 
  Save, 
  Key, 
  Check, 
  Camera,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { updateProfile } from '../services/api';

export default function Settings() {
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'security', 'notifications', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Load current active logged-in user from storage (UNTOUCHED)
  const [profileData, setProfileData] = useState(() => {
    const active = localStorage.getItem('crm_current_user');
    if (active) {
      try { 
        return JSON.parse(active); 
      } catch (e) {}
    }
    return {
      name: '',
      email: '',
      role: '',
      company: '',
      avatar: ''
    };
  });

  // Security / Password State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Notifications State with auto-persistence
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('crm_notifications_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { newDeal: true, taskDue: true, whatsapp: true };
  });
  const [notifSavedToast, setNotifSavedToast] = useState(false);

  // CRM Preferences State with auto-persistence
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('crm_preferences_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { currency: 'PKR (Rs)', layout: 'Kanban Board (Default)' };
  });
  const [prefSavedToast, setPrefSavedToast] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Profile Photo Upload with auto-compression (UNTOUCHED)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 180;
        const MAX_HEIGHT = 180;
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

  // Save changes permanently in PostgreSQL Database (UNTOUCHED)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);

      const response = await updateProfile({
        name: profileData.name,
        role: profileData.role,
        company: profileData.company,
        avatar: profileData.avatar
      });

      if (response.data.success) {
        const updatedUser = response.data.user;

        localStorage.setItem('crm_current_user', JSON.stringify(updatedUser));
        setProfileData(updatedUser);

        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Database update failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Real Database Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (newPassInput.length < 8) {
      setPassErrorMsg("New password kam az kam 8 characters ka hona chahiye.");
      return;
    }

    try {
      setPassLoading(true);
      let token = localStorage.getItem('token') || localStorage.getItem('crm_token');
      if (!token) {
        const storedUser = JSON.parse(localStorage.getItem('crm_current_user') || '{}');
        token = storedUser.token;
      }

      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentPassInput,
          newPassword: newPassInput
        })
      });

      const data = await res.json();

      if (data.success) {
        setPassSuccessMsg("Password successfully updated in database!");
        setCurrentPassInput('');
        setNewPassInput('');
        setTimeout(() => setPassSuccessMsg(''), 4000);
      } else {
        setPassErrorMsg(data.message || "Failed to update password");
      }
    } catch (err) {
      setPassErrorMsg("Server connection error while updating password.");
    } finally {
      setPassLoading(false);
    }
  };

  // Toggle notification alerts & save
  const handleNotificationToggle = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('crm_notifications_settings', JSON.stringify(updated));
    setNotifSavedToast(true);
    setTimeout(() => setNotifSavedToast(false), 2000);
  };

  // Save CRM preferences
  const handlePreferenceChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('crm_preferences_settings', JSON.stringify(updated));
    setPrefSavedToast(true);
    setTimeout(() => setPrefSavedToast(false), 2000);
  };

  const tabs = [
    { id: 'profile', name: 'Profile & Account', icon: User },
    { id: 'security', name: 'Security & Access', icon: Shield },
    { id: 'notifications', name: 'Notifications & Alerts', icon: Bell },
    { id: 'preferences', name: 'CRM Preferences', icon: Sliders }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account credentials, notifications, and application settings.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        
        {/* TAB 1: Profile & Account (100% UNTOUCHED) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-800 flex items-center justify-center shadow-lg">
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                  title="Upload New Photo"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold mt-1">Change</span>
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
                  <h3 className="text-base font-bold text-white">{profileData.name || 'User'}</h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                  >
                    Upload Picture
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{profileData.role || 'Sales Executive'}</p>
                <span className="inline-block mt-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {profileData.company || 'Enterprise'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profileData.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Title / Role
                </label>
                <input
                  type="text"
                  required
                  value={profileData.role || ''}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  placeholder="e.g. Sales Executive, Manager, CEO"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company || ''}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  placeholder="e.g. Aura Fragrance"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {savedSuccess ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" /> Profile permanently saved in database!
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer ${
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

        {/* TAB 2: Security & Access (Database Synced) */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Password & Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your login password to secure your CRM account.
              </p>
            </div>

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                <Check className="w-4 h-4" />
                {passSuccessMsg}
              </div>
            )}

            {passErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400 font-semibold">
                <AlertCircle className="w-4 h-4" />
                {passErrorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                {passLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Notifications (Live State & Toast) */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Email & Messaging Alerts</h3>
                <p className="text-xs text-slate-400">Manage real-time alerts dispatched to your mobile and inbox.</p>
              </div>
              {notifSavedToast && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">New Deal Assigned</h4>
                  <p className="text-[11px] text-slate-400">Notify when a lead is converted into a deal</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.newDeal} 
                  onChange={() => handleNotificationToggle('newDeal')}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Task Due Reminder</h4>
                  <p className="text-[11px] text-slate-400">Send daily morning agenda notification</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.taskDue} 
                  onChange={() => handleNotificationToggle('taskDue')}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">WhatsApp Updates</h4>
                  <p className="text-[11px] text-slate-400">Receive instant lead status alerts on mobile</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.whatsapp} 
                  onChange={() => handleNotificationToggle('whatsapp')}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer" 
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CRM Preferences (Live Currency & Layout) */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">UI & Regional Preferences</h3>
                <p className="text-xs text-slate-400">Customize global display currency and pipeline presentation.</p>
              </div>
              {prefSavedToast && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Preferences Applied
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Default Currency
                </label>
                <select 
                  value={preferences.currency} 
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="PKR (Rs)">PKR (Rs)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pipeline Layout Mode
                </label>
                <select 
                  value={preferences.layout} 
                  onChange={(e) => handlePreferenceChange('layout', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="Kanban Board (Default)">Kanban Board (Default)</option>
                  <option value="List / Spreadsheet View">List / Spreadsheet View</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}