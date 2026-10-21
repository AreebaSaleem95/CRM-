import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});


API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);
export const getDeals = () => API.get('/deals');
export const createDeal = (dealData) => API.post('/deals', dealData);
export const updateDeal = (id, dealData) => API.put(`/deals/${id}`, dealData);
export const deleteDeal = (id) => API.delete(`/deals/${id}`);

export default API;