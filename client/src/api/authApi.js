import axios from "axios";

// 💡 Dùng đường dẫn tương đối để điện thoại gọi về chính domain Vercel
const API = axios.create({
  baseURL: "/api/",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Export các hàm API
export const loginApi = (formData) => API.post("/login", formData);
export const registerApi = (formData) => API.post("/register", formData);
export const getMeApi = () => API.get("/me");