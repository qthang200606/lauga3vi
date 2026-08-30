import axios from "axios";

const BASE_URL = "https://lauga3vi-server.onrender.com/api/reservations";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. Tạo đơn đặt bàn mới (GỬI KÈM TOKEN ĐỂ BACKEND BIẾT AI ĐANG ĐẶT)
export const createReservationApi = async (bookingData) => {
  return await axios.post(BASE_URL, bookingData, {
    headers: getAuthHeaders(),
  });
};

// 2. Lấy danh sách lịch sử của User đang đăng nhập
export const getMyReservationsApi = async () => {
  return await axios.get(`${BASE_URL}/my-reservations`, {
    headers: getAuthHeaders(),
  });
};

// 3. Admin lấy tất cả
export const getReservationsApi = async (params) => {
  return await axios.get(BASE_URL, {
    params,
    headers: getAuthHeaders(),
  });
};

// 4. Admin cập nhật trạng thái
export const updateReservationStatusApi = async (id, payload) => {
  return await axios.patch(`${BASE_URL}/${id}/status`, payload, {
    headers: getAuthHeaders(),
  });
};