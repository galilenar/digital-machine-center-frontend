import axios from 'axios';
import type {
  Product,
  AuthUser,
  LoginRequest,
  SearchRequest,
  SearchResponse,
  FilterOptions,
  License,
  PublicationStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const auth: AuthUser = JSON.parse(stored);
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthUser>('/auth/login', data).then((r) => r.data),
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productsApi = {
  getAll: () => api.get<Product[]>('/products').then((r) => r.data),

  getMyProducts: () => api.get<Product[]>('/products/my').then((r) => r.data),

  getById: (id: number) =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),

  search: (params: SearchRequest) =>
    api.post<SearchResponse>('/products/search', params).then((r) => r.data),

  create: (product: Partial<Product>) =>
    api.post<Product>('/products', product).then((r) => r.data),

  update: (id: number, product: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, product).then((r) => r.data),

  updateStatus: (id: number, status: PublicationStatus) =>
    api
      .patch<Product>(`/products/${id}/status?status=${status}`)
      .then((r) => r.data),

  recordDownload: (id: number) =>
    api.post(`/products/${id}/download`).then((r) => r.data),

  delete: (id: number) => api.delete(`/products/${id}`).then((r) => r.data),

  getFilters: () =>
    api.get<FilterOptions>('/products/filters').then((r) => r.data),
};

// ─── Licenses ────────────────────────────────────────────────────────────────

export const licensesApi = {
  issueTrial: (userId: number, productId: number) =>
    api
      .post<License>(`/licenses/trial?userId=${userId}&productId=${productId}`)
      .then((r) => r.data),

  getUserLicenses: (userId: number) =>
    api.get<License[]>(`/licenses/user/${userId}`).then((r) => r.data),
};

export default api;
