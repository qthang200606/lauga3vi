import React, { useState } from "react";
import { X, Calendar, Clock, Users, User, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";
import { createReservationApi } from "../api/reservationApi";
import "../css/BookingModal.css";

const BookingModal = ({ isOpen, onClose, defaultUser }) => {
  const [formData, setFormData] = useState({
    customerName: defaultUser?.name || "",
    phone: defaultUser?.phone || "",
    email: defaultUser?.email || "",
    guests: 2,
    bookingDate: new Date().toISOString().split("T")[0],
    bookingTime: "18:00",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await createReservationApi(formData);
      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Đặt bàn thất bại, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-card">
        <button className="booking-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        {successData ? (
          <div className="booking-success-view">
            <CheckCircle2 size={64} className="success-icon" />
            <h2>Đặt Bàn Thành Công!</h2>
            <p>
              Mã đặt bàn của bạn là: <strong>{successData.reservationCode}</strong>
            </p>
            <div className="booking-summary-box">
              <div><span>Khách hàng:</span> <strong>{successData.customerName}</strong></div>
              <div><span>Thời gian:</span> <strong>{successData.bookingTime} - {successData.bookingDate}</strong></div>
              <div><span>Số khách:</span> <strong>{successData.guests} người</strong></div>
              <div><span>Trạng thái:</span> <span className="badge-pending-res">Chờ nhà hàng xác nhận</span></div>
            </div>
            <p className="note-text">Nhà hàng sẽ liên hệ sớm nhất để xác nhận vị trí bàn ăn cho bạn.</p>
            <button className="btn-done" onClick={handleClose}>Đã hiểu</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-header">
              <h3>Đặt Bàn Giữ Chỗ</h3>
              <p>Thưởng thức Lẩu Gà 3 Vị cùng người thân & bạn bè</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label><User size={16} /> Họ và tên *</label>
                <input
                  type="text"
                  name="customerName"
                  required
                  placeholder="Nhập họ tên"
                  value={formData.customerName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label><Phone size={16} /> Số điện thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label><Calendar size={16} /> Ngày dùng bữa *</label>
                <input
                  type="date"
                  name="bookingDate"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.bookingDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label><Clock size={16} /> Giờ đến *</label>
                <select name="bookingTime" value={formData.bookingTime} onChange={handleChange}>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="17:30">05:30 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="20:00">08:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label><Users size={16} /> Số lượng khách *</label>
                <input
                  type="number"
                  name="guests"
                  min="1"
                  max="30"
                  required
                  value={formData.guests}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label><Mail size={16} /> Email (Tùy chọn)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Để nhận xác nhận"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label><FileText size={16} /> Ghi chú đặc biệt</label>
              <textarea
                name="note"
                rows="2"
                placeholder="Ví dụ: Cần ghế trẻ em, tiệc sinh nhật..."
                value={formData.note}
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" className="booking-submit-btn" disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác Nhận Đặt Bàn"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;