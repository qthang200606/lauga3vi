// src/api/orderApi.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

// Hàm phụ trợ lấy token từ localStorage
const getToken = () => {
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
  return token;
};

// 1. Tạo đơn hàng mới (Khách hàng)
export const createOrderApi = async (orderData) => {
  const token = getToken();
  if (!token) {
    throw new Error("XAC_THUC_THAT_BAI: Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
  }

  return await axios.post(API_URL, orderData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 2. Lấy danh sách đơn hàng (Admin)
export const getOrdersApi = async () => {
  const token = getToken();
  if (!token) {
    throw new Error("XAC_THUC_THAT_BAI: Bạn chưa đăng nhập.");
  }

  return await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 3. Cập nhật trạng thái đơn hàng (Admin) -> ĐÃ SỬA LỖI 404 TẠI ĐÂY
export const updateOrderStatusApi = async (orderId, updateData) => {
  const token = getToken();
  if (!token) {
    throw new Error("XAC_THUC_THAT_BAI: Bạn chưa đăng nhập.");
  }

  // ✅ ĐÃ THÊM "/status" VÀO CUỐI URL
  return await axios.put(`${API_URL}/${orderId}/status`, updateData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// 4. Lấy danh sách đơn hàng của người dùng đang đăng nhập (Khách hàng)
export const getMyOrdersApi = async () => {
  const token = getToken();
  if (!token) {
    throw new Error("XAC_THUC_THAT_BAI: Bạn chưa đăng nhập.");
  }

  // Router Backend thường quy định đường dẫn là /my-orders hoặc /user
  return await axios.get(`${API_URL}/my-orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};