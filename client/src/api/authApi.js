import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Thêm /auth trước các endpoint để trùng khớp với backend Route
export const loginApi = (formData) => API.post("/auth/login", formData);
export const registerApi = (formData) => API.post("/auth/register", formData);
export const getMeApi = () => API.get("/auth/me");