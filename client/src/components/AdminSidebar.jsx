import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Shield,
  Users,
  ShoppingBag,
  FolderKanban,
  Utensils,
  CalendarDays,
  LogOut,
  LayoutDashboard,
  QrCode,
} from "lucide-react";

const AdminSidebar = ({ pendingCount = 0, pendingReservationsCount = 0 }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <Shield className="admin-brand-icon" />
        <div>
          <h2>Admin Panel</h2>
          <span>Lẩu Gà 3 Vị</span>
        </div>
      </div>

      <nav className="admin-menu">
        <Link
          to="/admin"
          className={`admin-menu-item ${isActive("/admin") ? "active" : ""}`}
        >
          <LayoutDashboard size={20} />
          <span>Tổng Quan</span>
        </Link>

        <Link
          to="/admin/orders"
          className={`admin-menu-item ${isActive("/admin/orders") ? "active" : ""}`}
        >
          <ShoppingBag size={20} />
          <span>Quản lý Đơn Hàng</span>
          {pendingCount > 0 && (
            <span className="badge-pending">{pendingCount}</span>
          )}
        </Link>

        {/* Trỏ đến trang AdminQR.jsx sẵn có của bạn */}
        <Link
          to="/admin/qr"
          className={`admin-menu-item ${isActive("/admin/qr") ? "active" : ""}`}
        >
          <QrCode size={20} />
          <span>Quản lý Mã QR</span>
        </Link>

        <Link
          to="/admin/categories"
          className={`admin-menu-item ${isActive("/admin/categories") ? "active" : ""}`}
        >
          <FolderKanban size={20} />
          <span>Quản lý Danh Mục</span>
        </Link>

        <Link
          to="/admin/products"
          className={`admin-menu-item ${isActive("/admin/products") ? "active" : ""}`}
        >
          <Utensils size={20} />
          <span>Quản lý Sản Phẩm</span>
        </Link>

        <Link
          to="/admin/reservations"
          className={`admin-menu-item ${isActive("/admin/reservations") ? "active" : ""}`}
        >
          <CalendarDays size={20} />
          <span>Quản lý Đặt Bàn</span>
          {pendingReservationsCount > 0 && (
            <span className="badge-pending">{pendingReservationsCount}</span>
          )}
        </Link>

        <Link
          to="/admin/users"
          className={`admin-menu-item ${isActive("/admin/users") ? "active" : ""}`}
        >
          <Users size={20} />
          <span>Quản lý Thành Viên</span>
        </Link>
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-user">
          <p>Đăng nhập với tư cách</p>
          <strong>{user?.name || "Admin"}</strong>
        </div>

        <button onClick={logout} className="admin-logout">
          <LogOut size={17} />
          Đăng Xuất
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;