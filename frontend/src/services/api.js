import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  config.headers.username = localStorage.getItem("admin_user");
  config.headers.password = localStorage.getItem("admin_pass");
  return config;
});

export default api;
