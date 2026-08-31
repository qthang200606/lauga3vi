import axios from 'axios';

// 1. Khởi tạo instance API dùng đường dẫn tương đối Proxy
const API = axios.create({
  baseURL: '/api/orders',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor tự động lấy Token từ localStorage đính kèm vào Header
API.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (!token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          token = parsedUser.token || parsedUser.accessToken;
        } catch (e) {
          console.error("Lỗi parse thông tin user từ localStorage", e);
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Tạo đơn hàng mới (Khách hàng)
export const createOrderApi = (orderData) => API.post('/', orderData);

// 4. Lấy tất cả danh sách đơn hàng (Admin)
export const getOrdersApi = () => API.get('/');

// 5. Cập nhật trạng thái đơn hàng (Admin)
export const updateOrderStatusApi = (orderId, updateData) => 
  API.put(`/${orderId}/status`, updateData);

// 6. Lấy danh sách đơn hàng của người dùng đang đăng nhập (Sửa triệt để lỗi HeaderContext)
export const getMyOrdersApi = () => API.get('/my-orders');