import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const tokenStore = {
  getAccess: () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  set: (access, refresh) => {
    if (access) localStorage.setItem("accessToken", access);
    if (refresh) localStorage.setItem("refreshToken", refresh);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("mockUser");
  },
};

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = tokenStore.getRefresh();
    const isAuthCall = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && !original._retry && refreshToken && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios
            .post(`${API_URL}/auth/refresh`, { refreshToken })
            .finally(() => {
              refreshPromise = null;
            });
        const { data } = await refreshPromise;
        tokenStore.set(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;