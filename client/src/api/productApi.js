import axios from "axios";

const API = axios.create({
  baseURL: "https://lauga3vi-server.onrender.com/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// Lấy danh sách sản phẩm
export const getProductsApi = (categoryId = "") =>
  API.get(
    categoryId
      ? `/products?categoryId=${categoryId}`
      : "/products"
  );

// Thêm sản phẩm
export const createProductApi = (formData) =>
  API.post("/products", formData);

// Sửa sản phẩm
export const updateProductApi = (id, formData) =>
  API.put(`/products/${id}`, formData);

// Xóa sản phẩm
export const deleteProductApi = (id) =>
  API.delete(`/products/${id}`);