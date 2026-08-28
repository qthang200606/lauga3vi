import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, PackageCheck, History, LogOut, 
  ShieldCheck, Utensils 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { HeaderContext } from '../context/HeaderContext';
import NotificationDropdown from './NotificationDropdown';
import '../css/Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { totalQuantity } = useContext(CartContext);
  const { 
    setIsCartOpen, setShowOrderModal, setShowHistoryModal, 
    myOrders, myReservations, fetchMyOrders, fetchMyReservations 
  } = useContext(HeaderContext);

  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <header className="main-header">
      <div className="home-container header-inner">
        <Link to="/" className="brand">
          <div className="brand-logo-wrapper">
            <Utensils className="brand-icon" size={20} />
          </div>
          <div className="brand-info">
            <span className="brand-title">LẨU GÀ 3 VỊ</span>
            <span className="brand-subtitle">FINE VIETNAMESE CUISINE</span>
          </div>
        </Link>

        <nav className="main-nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>TRANG CHỦ</Link>
          <Link to="/ve-chung-toi" className={`nav-link ${isActive('/ve-chung-toi')}`}>GIỚI THIỆU</Link>
          <Link to="/xem-thuc-don" className={`nav-link ${isActive('/xem-thuc-don')}`}>THỰC ĐƠN</Link>
          <Link to="/menu" className={`nav-link ${isActive('/menu')}`}>ĐẶT MÓN</Link>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <button
                className="header-icon-btn"
                onClick={() => setIsCartOpen(true)}
                title="Giỏ hàng"
              >
                <ShoppingCart size={19} />
                {totalQuantity > 0 && <span className="badge-count">{totalQuantity}</span>}
              </button>

              <button
                className="header-icon-btn"
                onClick={() => {
                  fetchMyOrders();
                  setShowOrderModal(true);
                }}
                title="Theo dõi đơn hàng"
              >
                <PackageCheck size={19} />
                {myOrders.length > 0 && (
                  <span className="badge-count badge-gold">{myOrders.length}</span>
                )}
              </button>

              <NotificationDropdown
                reservations={myReservations}
                onOpenHistory={() => {
                  fetchMyReservations();
                  setShowHistoryModal(true);
                }}
              />

              <button
                className="header-icon-btn"
                onClick={() => {
                  fetchMyReservations();
                  setShowHistoryModal(true);
                }}
                title="Lịch sử đặt bàn"
              >
                <History size={19} />
              </button>

              <div className="user-profile-badge">
                <span className="user-greeting">
                  Kính chào, <strong>{user.name}</strong>
                </span>
              </div>

              {user.role === "admin" && (
                <Link to="/admin" className="btn-admin-access">
                  <ShieldCheck size={15} />
                  <span>Quản lý</span>
                </Link>
              )}

              <button className="btn-logout" onClick={logout} title="Đăng xuất">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-gold-outline">
              ĐĂNG NHẬP
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;