import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle,
  UserCheck,
  RotateCcw,
  XCircle,
  CalendarDays,
  Users,
  Armchair,
} from "lucide-react";

import "../css/AdminReservations.css";
import AdminSidebar from "../components/AdminSidebar";
import {
  getReservationsApi,
  updateReservationStatusApi,
} from "../api/reservationApi";

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  confirmed: { label: "Đã xác nhận", bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  checked_in: { label: "Khách đã đến", bg: "rgba(16, 185, 129, 0.15)", text: "#34d399" },
  completed: { label: "Hoàn tất", bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af" },
  cancelled: { label: "Đã hủy", bg: "rgba(239, 68, 68, 0.15)", text: "#f87171" },
};

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [tableInput, setTableInput] = useState("");

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getReservationsApi({
        date: dateFilter,
        status: statusFilter,
      });

      if (res.data?.success) {
        setReservations(res.data.data || []);
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu đặt bàn:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleUpdateStatus = async (id, status, tableNumber = null) => {
    try {
      if (!id) {
        alert("Không tìm thấy mã đặt bàn!");
        return;
      }

      const payload = { status };
      if (tableNumber !== null) {
        payload.tableNumber = tableNumber;
      }

      const res = await updateReservationStatusApi(id, payload);

      if (res.data?.success) {
        setReservations((prev) =>
          prev.map((item) => (item._id === id ? res.data.data : item))
        );
        setAssignModal(null);
        setTableInput("");
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err.response?.data || err);
      alert(err.response?.data?.message || "Cập nhật trạng thái thất bại!");
    }
  };

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return reservations;

    return reservations.filter((item) => {
      const customerName = (item.customerName || "").toLowerCase();
      const phone = item.phone || "";
      const reservationCode = (item.reservationCode || "").toLowerCase();

      return (
        customerName.includes(keyword) ||
        phone.includes(keyword) ||
        reservationCode.includes(keyword)
      );
    });
  }, [reservations, searchTerm]);

  const pendingCount = reservations.filter((i) => i.status === "pending").length;
  const confirmedCount = reservations.filter((i) => i.status === "confirmed").length;
  const checkedInCount = reservations.filter((i) => i.status === "checked_in").length;

  return (
    <div className="admin-page">
      <AdminSidebar />

      <main className="admin-main reservation-page">
        {/* HEADER */}
        <div className="reservation-header">
          <div>
            <h1>Quản Lý Đặt Bàn</h1>
            <p>Quản lý lịch đặt bàn và tiếp nhận khách hàng</p>
          </div>

          <button
            className="reservation-refresh-btn"
            onClick={fetchReservations}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>{loading ? "Đang tải..." : "Tải lại dữ liệu"}</span>
          </button>
        </div>

        {/* THỐNG KÊ */}
        <div className="reservation-stats">
          <div className="reservation-stat-card">
            <div className="reservation-stat-icon orange">
              <CalendarDays size={22} />
            </div>
            <div>
              <p>Chờ xác nhận</p>
              <h2>{pendingCount}</h2>
            </div>
          </div>

          <div className="reservation-stat-card">
            <div className="reservation-stat-icon blue">
              <CheckCircle size={22} />
            </div>
            <div>
              <p>Đã xác nhận</p>
              <h2>{confirmedCount}</h2>
            </div>
          </div>

          <div className="reservation-stat-card">
            <div className="reservation-stat-icon green">
              <UserCheck size={22} />
            </div>
            <div>
              <p>Khách đã đến</p>
              <h2>{checkedInCount}</h2>
            </div>
          </div>

          <div className="reservation-stat-card">
            <div className="reservation-stat-icon red">
              <Users size={22} />
            </div>
            <div>
              <p>Tổng đặt bàn</p>
              <h2>{reservations.length}</h2>
            </div>
          </div>
        </div>

        {/* KHU VỰC BẢNG & BỘ LỌC */}
        <div className="reservation-container">
          <div className="reservation-filter-bar">
            <div className="reservation-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, mã đặt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="reservation-date">
              <CalendarDays size={16} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <select
              className="reservation-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="checked_in">Khách đã đến</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="reservation-table-wrapper">
            <table className="reservation-table">
              <thead>
                <tr>
                  <th>MÃ ĐẶT</th>
                  <th>KHÁCH HÀNG</th>
                  <th>LỊCH ĐẾN</th>
                  <th>SỐ KHÁCH</th>
                  <th>SỐ BÀN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="reservation-empty">
                      <RefreshCw size={20} className="spin" />
                      <span>Đang tải dữ liệu...</span>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="reservation-empty">
                      Không có dữ liệu đặt bàn
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const status =
                      STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

                    return (
                      <tr key={item._id}>
                        <td>
                          <span className="reservation-code">
                            #{item.reservationCode || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="reservation-customer">
                            <strong>{item.customerName || "Khách hàng"}</strong>
                            <span>📞 {item.phone || "Chưa có SĐT"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="booking-time">
                            <strong>{item.bookingTime || "--:--"}</strong>
                            <span>{item.bookingDate || "--/--/----"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="guest-count">
                            <Users size={14} />
                            <span>{item.guests || 0} người</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-number">
                            <Armchair size={14} />
                            <span>{item.tableNumber || "Chưa chọn"}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="reservation-status"
                            style={{
                              backgroundColor: status.bg,
                              color: status.text,
                            }}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="reservation-actions">
                            {item.status === "pending" && (
                              <button
                                className="res-btn confirm"
                                onClick={() => {
                                  setAssignModal(item);
                                  setTableInput(item.tableNumber || "");
                                }}
                              >
                                <CheckCircle size={14} /> Duyệt
                              </button>
                            )}

                            {item.status === "confirmed" && (
                              <button
                                className="res-btn checkin"
                                onClick={() =>
                                  handleUpdateStatus(item._id, "checked_in")
                                }
                              >
                                <UserCheck size={14} /> Đón khách
                              </button>
                            )}

                            {item.status === "checked_in" && (
                              <button
                                className="res-btn complete"
                                onClick={() =>
                                  handleUpdateStatus(item._id, "completed")
                                }
                              >
                                <RotateCcw size={14} /> Trả bàn
                              </button>
                            )}

                            {(item.status === "cancelled" ||
                              item.status === "completed") && (
                              <span className="no-action">--</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL GÁN BÀN */}
      {assignModal && (
        <div
          className="reservation-modal-overlay"
          onClick={() => {
            setAssignModal(null);
            setTableInput("");
          }}
        >
          <div
            className="reservation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reservation-modal-header">
              <div>
                <h3>Xác Nhận Đặt Bàn</h3>
                <p>Gán bàn cho khách hàng</p>
              </div>
              <button
                className="reservation-modal-close"
                onClick={() => {
                  setAssignModal(null);
                  setTableInput("");
                }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="reservation-modal-body">
              <div className="reservation-customer-box">
                <div>
                  <span>Khách hàng</span>
                  <strong>{assignModal.customerName}</strong>
                </div>
                <div>
                  <span>Số điện thoại</span>
                  <strong>{assignModal.phone}</strong>
                </div>
                <div>
                  <span>Thời gian</span>
                  <strong>
                    {assignModal.bookingTime} - {assignModal.bookingDate}
                  </strong>
                </div>
                <div>
                  <span>Số khách</span>
                  <strong>{assignModal.guests} người</strong>
                </div>
              </div>

              <label className="table-input-label">Số bàn</label>
              <div className="table-input-wrapper">
                <Armchair size={18} />
                <input
                  type="text"
                  placeholder="Ví dụ: Bàn 04"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="reservation-modal-footer">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setAssignModal(null);
                  setTableInput("");
                }}
              >
                Hủy
              </button>
              <button
                className="modal-btn confirm"
                onClick={() => {
                  if (!tableInput.trim()) {
                    alert("Vui lòng nhập số bàn!");
                    return;
                  }
                  handleUpdateStatus(
                    assignModal._id,
                    "confirmed",
                    tableInput.trim()
                  );
                }}
              >
                <CheckCircle size={16} /> Xác nhận & Gán bàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;