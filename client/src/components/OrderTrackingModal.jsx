import React from "react";
import { PackageCheck, X } from "lucide-react";

const OrderTrackingModal = ({ isOpen, onClose, orders, formatPrice }) => {
  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <div className="modal-title">
            <PackageCheck size={22} />
            <h3>Theo Dõi Đơn Đặt Món</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="history-modal-body">
          {orders.length === 0 ? (
            <div className="history-empty">
              <PackageCheck size={48} />
              <p>Bạn chưa có đơn đặt món nào!</p>
            </div>
          ) : (
            <div className="history-list">
              {orders.map((order) => (
                <div key={order._id} className="history-card" style={{ marginBottom: "15px" }}>
                  <div className="history-card-header">
                    <span className="res-code">Mã đơn: #{order._id}</span>
                    <span className="res-status-badge" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                      Đang chuẩn bị
                    </span>
                  </div>

                  <div className="history-card-body" style={{ padding: "12px" }}>
                    <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
                      Ngày đặt: {order.createdAt}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {order.items.map((item) => (
                        <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                          <span>{item.name} x <strong>{item.quantity}</strong></span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                      <span>Tổng tiền:</span>
                      <span style={{ color: "#dc2626" }}>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;