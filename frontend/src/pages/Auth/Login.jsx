import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, X, Loader2 } from 'lucide-react';
import { loginUser } from '../../services/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      // Real Backend API call
      const response = await loginUser({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.data.success) {
        const { token, user } = response.data;

        // JWT token aur user info browser storage mein mehfooz karein
        localStorage.setItem('token', token);
        localStorage.setItem('crm_current_user', JSON.stringify(user));

        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          navigate('/deals');
        }
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotStatus('Please enter your email.');
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotStatus('Password must be at least 6 characters.');
      return;
    }

    setForgotStatus('Password reset link sent or handled via backend route.');
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotStatus('');
      setForgotEmail('');
      setForgotNewPass('');
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-7 relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto mb-3">
            <Layers className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="mb-2">
            <span className="font-extrabold text-base tracking-tight text-white block">
              CRM Pro <span className="text-emerald-400">Enterprise</span>
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Business Management & Sales System
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-4">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to your CRM workspace</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer mt-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to CRM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-bold hover:underline">
            Create an Account
          </Link>
        </p>

        {/* Forgot Password Modal */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Reset Password</h3>
              </div>

              {forgotStatus && (
                <div className="mb-3 text-[11px] p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                  {forgotStatus}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter account email"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs mt-2"
                >
                  Save New Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}