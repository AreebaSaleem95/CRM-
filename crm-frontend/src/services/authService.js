import api, { USE_MOCK, tokenStore } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";

const mockAccounts = [
  { id: 1, name: "Admin User", email: "admin@crm.com", password: "123456", role: "admin" },
  { id: 2, name: "Manager User", email: "manager@crm.com", password: "123456", role: "manager" },
  { id: 3, name: "Bint e Zahra", email: "sales@crm.com", password: "123456", role: "sales" },
];

export async function login({ email, password }) {
  if (USE_MOCK) {
    await delay();
    const account = mockAccounts.find(
      (a) => a.email === email.toLowerCase() && a.password === password
    );
    if (!account) {
      const err = new Error("Invalid email or password");
      err.response = { data: { message: "Invalid email or password" } };
      throw err;
    }
    const { password: _pw, ...user } = account;
    localStorage.setItem("mockUser", JSON.stringify(user));
    return {
      user,
      accessToken: `mock-access-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
    };
  }
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getMe() {
  if (USE_MOCK) {
    await delay(200);
    const raw = localStorage.getItem("mockUser");
    if (!raw) throw new Error("Not logged in");
    return JSON.parse(raw);
  }
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logout() {
  if (USE_MOCK) return;
  try {
    await api.post("/auth/logout", { refreshToken: tokenStore.getRefresh() });
  } catch {
    // logout par error ignore karte hain, local tokens phir bhi clear honge
  }
}