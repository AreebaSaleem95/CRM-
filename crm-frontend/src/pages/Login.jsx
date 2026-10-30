import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchema";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK, getErrorMessage, tokenStore } from "../lib/apiClient";
import Field, { inputClass } from "../components/ui/Field";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  // Safe fetch helper for password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Please enter a valid email address.");
      return;
    }

    if (resetNewPassword.length < 8) {
      setResetError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setResetLoading(true);

      const endpoints = [
        "/api/auth/reset-password",
        "/auth/reset-password",
        "http://localhost:5000/api/auth/reset-password",
        "http://localhost:5000/auth/reset-password",
      ];

      let resData = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: resetEmail.trim(),
              newPassword: resetNewPassword,
            }),
          });
          if (res.ok) {
            resData = await res.json();
            break;
          } else {
            const errJson = await res.json().catch(() => null);
            if (errJson?.message) {
              setResetError(errJson.message);
              setResetLoading(false);
              return;
            }
          }
        } catch (err) {}
      }

      if (resData && (resData.success || resData.message)) {
        setResetSuccess("Password reset successfully! You can now sign in.");
        setValue("email", resetEmail);
        setValue("password", resetNewPassword);

        setTimeout(() => {
          setIsForgotPassword(false);
          setResetSuccess("");
          setResetNewPassword("");
        }, 1500);
      } else if (!resetError) {
        setResetError("Failed to reset password. Please verify your email.");
      }
    } catch (err) {
      setResetError("Server error. Please check backend connection.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          Nova<span className="text-indigo-600">CRM</span>
        </h1>

        {!isForgotPassword ? (
          <>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <Field label="Email" error={errors.email?.message}>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@company.com"
                  {...register("email")}
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setServerError("");
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password?.message && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetError("");
                  setResetSuccess("");
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Back to login"
              >
                <ArrowLeft size={16} />
              </button>
              <p className="text-sm font-semibold text-slate-700">Reset your password</p>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Enter your registered email and your new password to restore account access.
            </p>

            {resetSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@crm.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  New Password (Min 8 Characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <span>Reset & Sign In</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetError("");
                  setResetSuccess("");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1 cursor-pointer"
              >
                Cancel and return to login
              </button>
            </form>
          </>
        )}

        {USE_MOCK && (
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium">Mock accounts (password: 123456)</p>
            <p>admin@crm.com · manager@crm.com · sales@crm.com</p>
          </div>
        )}
      </div>
    </div>
  );
}