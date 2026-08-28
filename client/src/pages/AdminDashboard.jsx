import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, FolderKanban, Utensils } from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import "../css/AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="admin-page">
      {/* Sidebar dùng chung */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-top">
          <h1>Tổng Quan Quản Trị</h1>

          <Link to="/" className="admin-home-link">
            Xem trang chủ
          </Link>
        </div>

        {/* Thống kê chung */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon yellow">
              <ShoppingBag />
            </div>
            <div>
              <p>Tổng Đơn Hàng</p>
              <h2>128</h2>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon green">
              <span>₫</span>
            </div>
            <div>
              <p>Doanh Thu Ngày</p>
              <h2>18.500.000đ</h2>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon blue">
              <Users />
            </div>
            <div>
              <p>Thành Viên</p>
              <h2>450</h2>
            </div>
          </div>
        </div>

        {/* Chào mừng & Shortcut */}
        <div className="admin-welcome">
          <div>
            <h2>
              Chào mừng trở lại, <span>{user?.name || "Admin"}</span>! 👋
            </h2>
            <p>Đây là hệ thống quản trị cửa hàng Lẩu Gà 3 Vị.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;