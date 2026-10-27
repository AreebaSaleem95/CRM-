import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchema";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK, getErrorMessage } from "../lib/apiClient";
import Field, { inputClass } from "../components/ui/Field";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          Nova<span className="text-indigo-600">CRM</span>
        </h1>
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
          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              className={inputClass}
              placeholder="••••••"
              {...register("password")}
            />
          </Field>

          {serverError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

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