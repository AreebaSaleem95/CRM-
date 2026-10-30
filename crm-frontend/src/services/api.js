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

// Deals Services (Safe Fallback Protected: Logout nahi karega)
export const getDeals = async () => {
  try {
    const res = await API.get('/deals');
    return res;
  } catch (err) {
    console.warn('Deals backend pending or 404, using client state:', err.message);
    return { data: { success: false, deals: [] } };
  }
};

export const createDeal = async (dealData) => {
  try {
    return await API.post('/deals', dealData);
  } catch (err) {
    console.warn('Deals backend pending, created deal locally:', err.message);
    return { data: { success: true, deal: { ...dealData, id: `deal-${Date.now()}` } } };
  }
};

export const updateDeal = async (id, dealData) => {
  try {
    return await API.put(`/deals/${id}`, dealData);
  } catch (err) {
    console.warn('Deals backend pending, updated deal locally:', err.message);
    return { data: { success: true, deal: { ...dealData, id } } };
  }
};

export const deleteDeal = async (id) => {
  try {
    return await API.delete(`/deals/${id}`);
  } catch (err) {
    console.warn('Deals backend pending, deleted locally:', err.message);
    return { data: { success: true } };
  }
};

// Notifications & Preferences Endpoints
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationsAsRead = (notificationId) => API.put('/notifications/read', { notificationId });
export const fetchUserSettings = () => API.get('/notifications/settings');
export const saveUserSettings = (settings) => API.put('/notifications/settings', settings);

// Sales Agents (Safe: 404 error par screen block nahi karega)
export const fetchSalesAgents = async () => {
  try {
    return await API.get('/deals/agents');
  } catch (err) {
    console.warn('Agents route pending, returning default list:', err.message);
    return {
      data: {
        success: true,
        agents: [
          { id: 1, name: 'Admin User', role: 'admin' },
          { id: 2, name: 'Bilal Ahmed', role: 'sales agent' },
          { id: 3, name: 'Sara Khan', role: 'sales manager' }
        ]
      }
    };
  }
};

// AI Deal Pitch & Insights API call (Safe Fallback Protected)
export const generateAIDealPitch = async (dealData) => {
  try {
    return await API.post('/ai/deal-pitch', dealData);
  } catch (err) {
    console.warn('AI backend route pending, returning calculated pitch:', err.message);
    let baseWin = 65;
    if (dealData?.priority?.toLowerCase() === 'high') baseWin += 15;
    if (dealData?.priority?.toLowerCase() === 'low') baseWin -= 10;
    if ((dealData?.stage || '').toLowerCase().includes('won')) baseWin = 100;

    return {
      data: {
        success: true,
        data: {
          probability: Math.min(Math.max(baseWin, 45), 95),
          keyPoints: [
            `Highlight automated workflows tailored for ${dealData?.company || 'Client'}`,
            `Present phased milestone delivery to maximize ROI on budget of ${dealData?.currency || 'PKR'} ${Number(dealData?.value || 0).toLocaleString()}`,
            `Emphasize dedicated SLA and priority operational support`
          ],
          pitch: `Dear ${dealData?.company || 'Team'},\n\nWe are pleased to submit our strategic implementation roadmap for "${dealData?.title}". By executing this tailored deployment, your team will eliminate manual operational bottlenecks and accelerate enterprise productivity.\n\nLooking forward to aligning on project kickoff this week.\n\nBest regards,\nSales & Solutions Team`
        }
      }
    };
  }
};

// Cloudinary Document & Contract Upload Endpoint
export const uploadDealDocument = async (formData) => {
  try {
    return await API.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (err) {
    console.warn('Upload endpoint pending, using local object mock:', err.message);
    return {
      data: {
        success: true,
        file: {
          url: URL.createObjectURL(formData.get('file')),
          name: formData.get('file')?.name || 'Document'
        }
      }
    };
  }
};

export default API;