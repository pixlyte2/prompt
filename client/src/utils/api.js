import axios from "axios";

/**
 * Axios instance
 */
// const api = axios.create({
//   baseURL: "http://localhost:5000/api" // ✅ FIXED
// });


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL   // ✅ from .env
});

/**
 * Automatically attach token to every request
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Auth helpers
 */
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

export default api;
