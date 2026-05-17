import axios from 'axios';

// In dev, Vite proxies /api → http://localhost:3001 (vite.config.ts)
// In production (Vercel), set VITE_API_URL to the backend URL
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

export function getStaticUrl(filePath: string): string {
  if (filePath.startsWith('https://')) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${apiBase}/${normalized}`;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  activate: (data: { token: string; name: string; password: string; organizationName?: string }) =>
    api.post('/auth/activate', data),
  validateToken: (token: string) =>
    api.get(`/auth/validate-token?token=${token}`),
};

export const invitationsApi = {
  inviteOwner: (email: string) =>
    api.post('/invitations/owner', { email }),
  inviteUser: (email: string) =>
    api.post('/invitations/user', { email }),
  list: () => api.get('/invitations'),
  stats: () => api.get('/invitations/stats'),
};

export const usersApi = {
  getOrgMembers: () => api.get('/users/org-members'),
  getOrgStats: () => api.get('/users/org-stats'),
};

export const filesApi = {
  uploadText: (formData: FormData) =>
    api.post('/files/upload/text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadImage: (formData: FormData) =>
    api.post('/files/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    uploadedById?: string;
  }) => api.get('/files', { params }),
  search: (q: string, type?: string) =>
    api.get('/files/search', { params: { q, type } }),
  update: (id: string, originalName: string) =>
    api.patch(`/files/${id}`, { originalName }),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const fileSharesApi = {
  share: (fileId: string, userIds: string[]) =>
    api.post(`/file-shares/${fileId}`, { userIds }),
  getShares: (fileId: string) => api.get(`/file-shares/${fileId}`),
  revoke: (shareId: string) => api.delete(`/file-shares/revoke/${shareId}`),
};
