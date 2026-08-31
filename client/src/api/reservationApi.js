import axios from "axios";

// 1. Khởi tạo instance API dùng chung đường dẫn tương đối Proxy
const API = axios.create({
  baseURL: "/api/reservations",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Tự động đính kèm Token vào Header cho mọi request gửi đi
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Tạo đơn đặt bàn mới
export const createReservationApi = (bookingData) => API.post("/", bookingData);

// 4. Lấy danh sách lịch sử đặt bàn của User đang đăng nhập (Sửa lỗi crash ở HeaderContext)
export const getMyReservationsApi = () => API.get("/my-reservations");

// 5. Admin: Lấy tất cả danh sách đặt bàn
export const getReservationsApi = (params) => API.get("/", { params });

// 6. Admin: Cập nhật trạng thái đặt bàn
export const updateReservationStatusApi = (id, payload) => API.patch(`/${id}/status`, payload);