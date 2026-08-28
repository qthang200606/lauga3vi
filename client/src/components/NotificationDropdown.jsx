import React, { useState, useRef, useEffect } from "react";
import { Bell, CalendarCheck } from "lucide-react";
import "../css/NotificationDropdown.css";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "#d97706", bg: "#fff7ed" },
  confirmed: { label: "Đã xác nhận", color: "#0284c7", bg: "#e0f2fe" },
  checked_in: { label: "Khách đã đến", color: "#15803d", bg: "#dcfce7" },
  completed: { label: "Hoàn tất", color: "#4b5563", bg: "#f3f4f6" },
  cancelled: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const NotificationDropdown = ({ reservations = [], onOpenHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Đếm thông báo mới (ví dụ các đơn đã xác nhận)
    const unread = reservations.filter((r) => r.status === "confirmed").length;
    setUnreadCount(unread);
  }, [reservations]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="noti-wrapper" ref={dropdownRef}>
      <button
        className="icon-action-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="noti-dropdown">
          <div className="noti-header">
            <strong>Thông báo đặt bàn</strong>
            <span onClick={() => setUnreadCount(0)}>Đã đọc tất cả</span>
          </div>
          <div className="noti-body">
            {reservations.length === 0 ? (
              <p className="noti-empty">Bạn chưa có thông báo nào</p>
            ) : (
              reservations.slice(0, 5).map((item) => {
                const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
                return (
                  <div
                    key={item._id}
                    className="noti-item"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenHistory();
                    }}
                  >
                    <div
                      className="noti-item-icon"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      <CalendarCheck size={16} />
                    </div>
                    <div className="noti-item-content">
                      <p>
                        Đơn đặt bàn <strong>#{item.reservationCode || item._id.slice(-6)}</strong>
                      </p>
                      <span style={{ color: status.color }}>
                        Trạng thái: {status.label}
                      </span>
                      <small>{item.bookingDate} - {item.bookingTime}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;