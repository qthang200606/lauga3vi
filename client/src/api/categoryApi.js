import axios from 'axios';

const API = axios.create({
  baseURL: '/api/',
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