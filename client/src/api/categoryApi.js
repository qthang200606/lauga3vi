import axios from 'axios';

const API = axios.create({
  baseURL: 'https://lauga3vi-server.onrender.com/api/categories'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getCategoriesApi = () => API.get('/');
export const createCategoryApi = (data) => API.post('/', data);
export const updateCategoryApi = (id, data) => API.put(`/${id}`, data);
export const deleteCategoryApi = (id) => API.delete(`/${id}`);