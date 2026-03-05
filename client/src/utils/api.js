import axios from "axios";

/**
 * Axios instance
 */
// const api = axios.create({
//   baseURL: "http://localhost:5000/api" // ✅ FIXED
// });


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000
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
export const saveAuth = (token, role, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  if (user) localStorage.setItem("user", JSON.stringify(user));
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};

export default api;
