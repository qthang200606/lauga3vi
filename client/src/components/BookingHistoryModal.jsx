import React from "react";
import {
  History,
  X,
  CalendarCheck,
  Clock,
  Users,
  Armchair,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import "../css/BookingHistoryModal.css";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "#d97706", bg: "#fff7ed", icon: Clock3 },
  confirmed: { label: "Đã xác nhận", color: "#0284c7", bg: "#e0f2fe", icon: CheckCircle2 },
  checked_in: { label: "Khách đã đến", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  completed: { label: "Hoàn tất", color: "#4b5563", bg: "#f3f4f6", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2", icon: XCircle },
};

const BookingHistoryModal = ({
  isOpen,
  onClose,
  reservations = [],
  onOpenBooking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <div className="modal-title">
            <History size={22} />
            <h3>Theo Dõi Lịch Sử Đặt Bàn</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="history-modal-body">
          {reservations.length === 0 ? (
            <div className="history-empty">
              <CalendarCheck size={48} />
              <p>Bạn chưa có lịch đặt bàn nào!</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
              >
                Đặt bàn ngay
              </button>
            </div>
          ) : (
            <div className="history-list">
              {reservations.map((item) => {
                const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
                const StatusIcon = status.icon;

                return (
                  <div key={item._id} className="history-card">
                    <div className="history-card-header">
                      <span className="res-code">
                        Mã: #{item.reservationCode || item._id.slice(-6)}
                      </span>
                      <span
                        className="res-status-badge"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>

                    <div className="history-card-body">
                      <div className="info-row">
                        <span><Clock size={15} /> Thời gian:</span>
                        <strong>{item.bookingTime} - {item.bookingDate}</strong>
                      </div>
                      <div className="info-row">
                        <span><Users size={15} /> Số lượng:</span>
                        <strong>{item.guests} người</strong>
                      </div>
                      <div className="info-row">
                        <span><Armchair size={15} /> Vị trí bàn:</span>
                        <strong className={item.tableNumber ? "table-assigned" : "table-pending"}>
                          {item.tableNumber || "Chưa xếp bàn"}
                        </strong>
                      </div>
                      {item.note && (
                        <div className="info-row note-row">
                          <span>Ghi chú:</span>
                          <p>{item.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingHistoryModal;