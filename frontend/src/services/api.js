import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatic token attachment interceptor
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token') || localStorage.getItem('crm_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth & User Services
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);
export const changeUserPassword = (passwords) => API.put('/auth/change-password', passwords);

// Deals Services
export const getDeals = () => API.get('/deals');
export const createDeal = (dealData) => API.post('/deals', dealData);
export const updateDeal = (id, dealData) => API.put(`/deals/${id}`, dealData);
export const deleteDeal = (id) => API.delete(`/deals/${id}`);
// Notifications & Preferences Endpoints
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationsAsRead = (notificationId) => API.put('/notifications/read', { notificationId });
export const fetchUserSettings = () => API.get('/notifications/settings');
export const saveUserSettings = (settings) => API.put('/notifications/settings', settings);
export const fetchSalesAgents = () => API.get('/deals/agents');

export default API;