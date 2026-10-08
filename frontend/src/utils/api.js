import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://swippo4.onrender.com/api"),
});
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("sw_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sw_token");
      localStorage.removeItem("sw_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  },
);
export default api;
