import axios from "axios";

const API = axios.create({
  baseURL: '/api/',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getProductsApi = (categoryId = "") =>
  API.get(categoryId ? `/?categoryId=${categoryId}` : "/");
export const createProductApi = (data) => API.post("/", data);
export const updateProductApi = (id, data) => API.put(`/${id}`, data);
export const deleteProductApi = (id) => API.delete(`/${id}`);