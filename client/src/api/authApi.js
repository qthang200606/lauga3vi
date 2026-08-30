import axios from "axios";

const API = axios.create({
  baseURL: "https://lauga3vi-server.onrender.com/api", // Bỏ chữ /auth ở đây
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Thêm /auth trực tiếp vào từng hàm
export const loginApi = (formData) => API.post("/auth/login", formData);
export const registerApi = (formData) => API.post("/auth/register", formData);
export const getMeApi = () => API.get("/auth/me");