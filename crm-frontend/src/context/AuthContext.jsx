import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStore } from "../lib/apiClient";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function init() {
      if (!tokenStore.getAccess()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        if (active) {
          const cached = localStorage.getItem("crm_current_user");
          const extra = cached ? JSON.parse(cached) : {};
          setUser({ ...me, ...extra });
        }
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    tokenStore.set(data.accessToken, data.refreshToken);
    setUser(data.user);
    localStorage.setItem("crm_current_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {}
    tokenStore.clear();
    localStorage.removeItem("crm_current_user");
    localStorage.removeItem("user");
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Real-time local & global user updater
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem("crm_current_user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}