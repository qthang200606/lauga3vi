import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Phone,
  MapPin,
  X,
  Volume2,
  VolumeX,
  Utensils,
  QrCode, // Thêm Icon QR/Bàn
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import { getOrdersApi, updateOrderStatusApi } from "../api/orderApi";
import "../css/AdminOrders.css";

const STATUS_MAP = {
  pending: { label: "Đơn mới", color: "#ed6c02", bg: "#fff7ed" },
  Pending: { label: "Đơn mới", color: "#ed6c02", bg: "#fff7ed" },

  preparing: { label: "Đang làm bếp", color: "#d97706", bg: "#fef3c7" },
  Preparing: { label: "Đang làm bếp", color: "#d97706", bg: "#fef3c7" },

  confirmed: { label: "Sẵn sàng giao", color: "#0288d1", bg: "#e0f2fe" },
  Confirmed: { label: "Sẵn sàng giao", color: "#0288d1", bg: "#e0f2fe" },

  delivering: { label: "Đang giao", color: "#9c27b0", bg: "#f3e8ff" },
  Delivering: { label: "Đang giao", color: "#9c27b0", bg: "#f3e8ff" },

  completed: { label: "Hoàn thành", color: "#2e7d32", bg: "#edf7ed" },
  Completed: { label: "Hoàn thành", color: "#2e7d32", bg: "#edf7ed" },

  cancelled: { label: "Đã hủy", color: "#d32f2f", bg: "#fdeded" },
  Cancelled: { label: "Đã hủy", color: "#d32f2f", bg: "#fdeded" },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrdersApi();
      const data = res.data?.data || res.data || [];
      setOrders(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đổi trạng thái đơn hàng
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!orderId) {
        alert("Lỗi: Mã đơn hàng (orderId) không tồn tại!");
        return;
      }
      await updateOrderStatusApi(orderId, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("🔥 LỖI CẬP NHẬT TRẠNG THÁI:", err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message;
      alert(`Không thể cập nhật trạng thái đơn! Chi tiết lỗi: ${serverMsg}`);
    }
  };

  // Đổi trạng thái thanh toán
  const handleTogglePayment = async (orderId, currentPaidStatus) => {
    try {
      if (!orderId) {
        alert("Lỗi: Mã đơn hàng (orderId) không tồn tại!");
        return;
      }
      await updateOrderStatusApi(orderId, { isPaid: !currentPaidStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, isPaid: !currentPaidStatus }));
      }
    } catch (err) {
      console.error("🔥 LỖI CẬP NHẬT THANH TOÁN:", err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message;
      alert(`Không thể cập nhật trạng thái thanh toán! Chi tiết lỗi: ${serverMsg}`);
    }
  };

  // Lọc danh sách (Bổ sung tìm kiếm theo mã bàn)
  const filteredOrders = orders.filter((ord) => {
    const ordStatus = (ord.status || "").toLowerCase();
    const currentFilter = filterStatus.toLowerCase();

    const matchesStatus =
      filterStatus === "ALL" || ordStatus === currentFilter;

    const phone = ord.shippingInfo?.phone || "";
    const name = ord.shippingInfo?.fullName || "";
    const table = ord.tableCode || ord.tableName || ord.shippingInfo?.tableCode || "";
    
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord._id && ord._id.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingOrdersCount = orders.filter(
    (o) => (o.status || "").toLowerCase() === "pending"
  ).length;

  const todayRevenue = orders
    .filter((o) => (o.status || "").toLowerCase() === "completed")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="admin-page">
      <AdminSidebar pendingCount={pendingOrdersCount} />

      <main className="admin-main">
        <div className="admin-top">
          <h1>Quản Lý Đơn Hàng & Bếp</h1>

          <div className="admin-top-actions">
            <button
              className={`btn-sound ${soundEnabled ? "active" : ""}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>{soundEnabled ? "Bật chuông" : "Tắt chuông"}</span>
            </button>

            <Link to="/" className="admin-home-link">
              Xem trang chủ
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon yellow">
              <ShoppingBag />
            </div>
            <div>
              <p>Đơn mới (Bếp cần làm)</p>
              <h2 className="highlight-pending">{pendingOrdersCount} đơn</h2>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon green">
              <span>₫</span>
            </div>
            <div>
              <p>Doanh Thu Thực Nhận</p>
              <h2>{todayRevenue.toLocaleString("vi-VN")}đ</h2>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon blue">
              <Clock />
            </div>
            <div>
              <p>Tổng Số Đơn Hàng</p>
              <h2>{orders.length} đơn</h2>
            </div>
          </div>
        </div>

        {/* Main Orders Table */}
        <div className="admin-order-container">
          <div className="order-filter-bar">
            <div className="filter-tabs">
              <button
                className={filterStatus === "ALL" ? "active" : ""}
                onClick={() => setFilterStatus("ALL")}
              >
                Tất cả ({orders.length})
              </button>

              <button
                className={filterStatus === "pending" ? "active" : ""}
                onClick={() => setFilterStatus("pending")}
              >
                Đơn mới ({orders.filter((o) => (o.status || "").toLowerCase() === "pending").length})
              </button>

              <button
                className={filterStatus === "preparing" ? "active" : ""}
                onClick={() => setFilterStatus("preparing")}
              >
                Đang làm bếp ({orders.filter((o) => (o.status || "").toLowerCase() === "preparing").length})
              </button>

              <button
                className={filterStatus === "confirmed" ? "active" : ""}
                onClick={() => setFilterStatus("confirmed")}
              >
                Sẵn sàng giao ({orders.filter((o) => (o.status || "").toLowerCase() === "confirmed").length})
              </button>

              <button
                className={filterStatus === "delivering" ? "active" : ""}
                onClick={() => setFilterStatus("delivering")}
              >
                Đang giao ({orders.filter((o) => (o.status || "").toLowerCase() === "delivering").length})
              </button>

              <button
                className={filterStatus === "completed" ? "active" : ""}
                onClick={() => setFilterStatus("completed")}
              >
                Hoàn thành ({orders.filter((o) => (o.status || "").toLowerCase() === "completed").length})
              </button>

              <button
                className={filterStatus === "cancelled" ? "active" : ""}
                onClick={() => setFilterStatus("cancelled")}
              >
                Đã hủy ({orders.filter((o) => (o.status || "").toLowerCase() === "cancelled").length})
              </button>
            </div>

            <div className="order-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm SĐT, tên, bàn, mã đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn-refresh" onClick={fetchOrders}>
                <RefreshCw size={16} className={loading ? "spin" : ""} />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Vị trí / Mã Bàn</th>
                  <th>Khách hàng</th>
                  <th>Món đặt & Ghi chú</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      Đang tải đơn hàng...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      Không tìm thấy đơn hàng nào.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const statusInfo = STATUS_MAP[ord.status] || STATUS_MAP.pending;
                    const statusLower = (ord.status || "").toLowerCase();
                    
                    // Lấy mã bàn từ các nguồn dữ liệu có thể có
                    const tableCode = ord.tableCode || ord.tableName || ord.shippingInfo?.tableCode;

                    return (
                      <tr key={ord._id}>
                        <td>
                          <span className="order-code">
                            #{ord._id ? ord._id.slice(-6).toUpperCase() : "N/A"}
                          </span>
                          <div className="order-time">
                            {ord.createdAt
                              ? new Date(ord.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </td>

                        {/* HIỂN THỊ MÃ BÀN Ở CỘT RIÊNG NỔI BẬT */}
                        <td>
                          {tableCode ? (
                            <span 
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                backgroundColor: "#dc2626",
                                color: "#ffffff",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontWeight: "bold",
                                fontSize: "14px"
                              }}
                            >
                              <QrCode size={16} /> Bàn: {tableCode}
                            </span>
                          ) : (
                            <span 
                              style={{
                                display: "inline-block",
                                backgroundColor: "#f3f4f6",
                                color: "#4b5563",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "500"
                              }}
                            >
                              Giao hàng / Mang về
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="customer-info">
                            <strong>{ord.shippingInfo?.fullName || "Khách tại bàn"}</strong>
                            {ord.shippingInfo?.phone && (
                              <div className="phone">
                                <Phone size={12} /> {ord.shippingInfo?.phone}
                              </div>
                            )}
                            {ord.shippingInfo?.address && (
                              <div className="address" title={ord.shippingInfo?.address}>
                                <MapPin size={12} /> {ord.shippingInfo?.address}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="order-items-summary">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="item-line">
                                <span className="qty">{it.quantity}x</span>{" "}
                                <span className="name">{it.name}</span>
                                {it.note && <span className="item-note"> ({it.note})</span>}
                              </div>
                            ))}
                            {ord.shippingInfo?.note && (
                              <div className="order-global-note">💬 {ord.shippingInfo.note}</div>
                            )}
                          </div>
                        </td>

                        <td>
                          <strong className="order-price">
                            {ord.totalPrice
                              ? `${ord.totalPrice.toLocaleString("vi-VN")}đ`
                              : "0đ"}
                          </strong>
                          <div className="pay-method">
                            {ord.paymentMethod === "BANK_TRANSFER" ? "VietQR" : "Tiền mặt / COD"}
                          </div>
                        </td>

                        <td>
                          <button
                            className={`badge-payment ${ord.isPaid ? "paid" : "unpaid"}`}
                            onClick={() => handleTogglePayment(ord._id, ord.isPaid)}
                          >
                            {ord.isPaid ? "Đã trả" : "Chưa trả"}
                          </button>
                        </td>

                        <td>
                          <span
                            className="badge-status"
                            style={{
                              color: statusInfo.color,
                              backgroundColor: statusInfo.bg,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action view"
                              onClick={() => setSelectedOrder(ord)}
                            >
                              <Eye size={16} />
                            </button>

                            {/* Đơn mới -> Nhận làm bếp */}
                            {statusLower === "pending" && (
                              <button
                                className="btn-action confirm"
                                onClick={() => handleUpdateStatus(ord._id, "preparing")}
                              >
                                <CheckCircle size={16} /> Nhận đơn
                              </button>
                            )}

                            {/* Đang làm bếp -> Bếp xong */}
                            {statusLower === "preparing" && (
                              <button
                                className="btn-action complete"
                                style={{ backgroundColor: "#d97706", color: "#fff" }}
                                onClick={() => handleUpdateStatus(ord._id, "confirmed")}
                              >
                                <Utensils size={16} /> Bếp xong
                              </button>
                            )}

                            {/* Sẵn sàng giao -> Đang giao */}
                            {statusLower === "confirmed" && (
                              <button
                                className="btn-action deliver"
                                onClick={() => handleUpdateStatus(ord._id, "delivering")}
                              >
                                <Truck size={16} /> Giao hàng
                              </button>
                            )}

                            {/* Đang giao -> Hoàn thành */}
                            {statusLower === "delivering" && (
                              <button
                                className="btn-action complete"
                                onClick={() => handleUpdateStatus(ord._id, "completed")}
                              >
                                <CheckCircle size={16} /> Hoàn thành
                              </button>
                            )}

                            {/* Hủy đơn */}
                            {statusLower !== "completed" && statusLower !== "cancelled" && (
                              <button
                                className="btn-action cancel"
                                onClick={() => {
                                  if (window.confirm("Hủy đơn hàng này?")) {
                                    handleUpdateStatus(ord._id, "cancelled");
                                  }
                                }}
                              >
                                <XCircle size={16} />
                              </button>
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

      {/* Modal Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-area">
                <span className="modal-title-label">CHI TIẾT ĐƠN HÀNG</span>
                <h3>#{selectedOrder._id?.slice(-6).toUpperCase()}</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section-grid">
                <div>
                  <h4>Thông tin vị trí & Khách hàng</h4>
                  {(selectedOrder.tableCode || selectedOrder.tableName || selectedOrder.shippingInfo?.tableCode) && (
                    <p style={{ color: "#dc2626", fontWeight: "bold", fontSize: "16px" }}>
                      📍 BÀN PHỤC VỤ: {selectedOrder.tableCode || selectedOrder.tableName || selectedOrder.shippingInfo?.tableCode}
                    </p>
                  )}
                  <p><strong>Tên khách:</strong> {selectedOrder.shippingInfo?.fullName || "Khách tại bàn"}</p>
                  {selectedOrder.shippingInfo?.phone && <p><strong>SĐT:</strong> {selectedOrder.shippingInfo?.phone}</p>}
                  {selectedOrder.shippingInfo?.address && <p><strong>Địa chỉ:</strong> {selectedOrder.shippingInfo?.address}</p>}
                </div>
                <div>
                  <h4>Thanh toán</h4>
                  <p><strong>Hình thức:</strong> {selectedOrder.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản (VietQR)" : "Tiền mặt / COD"}</p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    <span style={{ fontWeight: "bold", color: selectedOrder.isPaid ? "#2e7d32" : "#d32f2f" }}>
                      {selectedOrder.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </p>
                </div>
              </div>

              <h4>Danh sách món ăn</h4>
              <div className="modal-items-list">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="modal-item-row">
                    <div>
                      <strong>{item.quantity}x {item.name}</strong>
                      {item.note && <div className="item-spec-note">📝 {item.note}</div>}
                    </div>
                    <div>{((item.price || 0) * item.quantity).toLocaleString("vi-VN")}đ</div>
                  </div>
                ))}
              </div>

              <div className="modal-total-summary">
                <span>TỔNG TIỀN:</span>
                <span className="total-amount">
                  {selectedOrder.totalPrice?.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;