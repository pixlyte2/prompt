import axios from "axios";
import { getCache, setCache, clearCacheByPrefix } from "../utils/cache";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const cachedGet = async (url) => {
  const cached = getCache(url);
  if (cached) return { data: cached };
  
  const response = await api.get(url);
  setCache(url, response.data);
  return response;
};

const cachedApi = {
  get: cachedGet,
  post: async (url, data) => {
    const response = await api.post(url, data);
    clearCacheByPrefix(url.split('/')[1]);
    return response;
  },
  put: async (url, data) => {
    const response = await api.put(url, data);
    clearCacheByPrefix(url.split('/')[1]);
    return response;
  },
  delete: async (url) => {
    const response = await api.delete(url);
    clearCacheByPrefix(url.split('/')[1]);
    return response;
  }
};

export const saveAuth = (token, role) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

export default cachedApi;
