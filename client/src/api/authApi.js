import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Export theo tên (named export)
export const loginApi = (formData) => API.post("/login", formData);
export const registerApi = (formData) => API.post("/register", formData);
export const getMeApi = () => API.get("/me");
