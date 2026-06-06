import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Bare client for refresh — avoids interceptor loops
const refreshClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const setTokens = (token, refreshToken) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// On 401, try refresh once then retry; otherwise redirect to login
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const isAuthRefresh = originalRequest?.url?.includes('/auth/refresh');
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (err.response?.status === 429) {
      return Promise.reject(err);
    }

    if (err.response?.status !== 401 || originalRequest?._retry || isAuthRefresh || isAuthRoute) {
      return Promise.reject(err);
    }

    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) {
      clearAuthStorage();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await refreshClient.post('/auth/refresh', { refreshToken: storedRefresh });
      const { token, refreshToken } = res.data;
      setTokens(token, refreshToken);
      processQueue(null, token);
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearAuthStorage();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => refreshClient.post('/auth/login', data),
  register: (data) => refreshClient.post('/auth/register', data),
  refresh:  (data) => refreshClient.post('/auth/refresh', data),
  logout:   (data) => refreshClient.post('/auth/logout', data),
  me:       ()     => api.get('/auth/me'),
  verifyEmail: (data) => refreshClient.post('/auth/verify-email', data),
  resendVerification: (data) => refreshClient.post('/auth/resend-verification', data),
  forgotPassword: (data) => refreshClient.post('/auth/forgot-password', data),
  resetPassword: (data) => refreshClient.post('/auth/reset-password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/me/avatar', formData);
  },
  getAvatarBlob: () =>
    api.get('/auth/me/avatar', { responseType: 'blob' }).then((res) => res.data),
};

const downloadBlobExport = async (url, params) => {
  const res = await api.get(url, { params, responseType: 'blob' });
  if (res.data?.type?.includes('application/json')) {
    const text = await res.data.text();
    const json = JSON.parse(text);
    throw { response: { data: json } };
  }
  const match = res.headers['content-disposition']?.match(/filename="([^"]+)"/);
  const filename = match?.[1] || 'export';
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsAPI = {
  list:   (params) => api.get('/transactions', { params }),
  get:    (id)     => api.get(`/transactions/${id}`),
  create: (data)   => api.post('/transactions', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  delete: (id)     => api.delete(`/transactions/${id}`),
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/transactions/${id}/files`, formData);
  },
  downloadFile: (transactionId, fileId) =>
    api.get(`/transactions/${transactionId}/files/${fileId}`, { responseType: 'blob' }),
  deleteFile: (transactionId, fileId) =>
    api.delete(`/transactions/${transactionId}/files/${fileId}`),
  fileUrl: (transactionId, fileId) =>
    `${baseURL}/transactions/${transactionId}/files/${fileId}`,
  exportCsv: (params) => downloadBlobExport('/transactions/export/csv', params),
  exportExcel: (params) => downloadBlobExport('/transactions/export/excel', params),
  exportPdf: (params) => downloadBlobExport('/transactions/export/pdf', params),
  downloadImportTemplate: () => downloadBlobExport('/transactions/import/template'),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/transactions/import/excel', formData);
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary:   (params) => api.get('/dashboard/summary', { params }),
  insights:  ()       => api.get('/dashboard/insights'),
  categories:(params) => api.get('/dashboard/categories', { params }),
  monthly:   (params) => api.get('/dashboard/trends/monthly', { params }),
  weekly:    ()       => api.get('/dashboard/trends/weekly'),
  categoryStack: (params) => api.get('/dashboard/trends/category-stack', { params }),
  recent:    (params) => api.get('/dashboard/recent', { params }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:      (params)    => api.get('/users', { params }),
  get:       (id)        => api.get(`/users/${id}`),
  update:    (id, data)  => api.patch(`/users/${id}`, data),
  setStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  delete:    (id)        => api.delete(`/users/${id}`),
};

export default api;
