import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { HeaderProvider, HeaderContext } from './context/HeaderContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import ProductOrder from './pages/ProductOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutDetail from './pages/AboutDetail';
import Menu from './pages/Menu';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminProducts from "./pages/AdminProducts";
import AdminReservations from "./pages/AdminReservations";
import AdminQR from './pages/AdminQR';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartModal from './components/CartModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import BookingModal from './components/BookingModal';
import BookingHistoryModal from './components/BookingHistoryModal';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Lắng nghe URL parameters để bắt mã bàn từ Mã QR
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tableCode = queryParams.get('tableCode') || queryParams.get('table') || queryParams.get('table_code');

    if (tableCode) {
      // Lưu mã bàn vào LocalStorage để các component Cart/Order gửi lên Server
      localStorage.setItem('tableCode', tableCode);

      // Nếu đang ở trang chủ mà có mã bàn, tự động điều hướng sang trang Menu Đặt món
      if (location.pathname === '/') {
        navigate(`/menu?tableCode=${tableCode}`);
      }
    }
  }, [location, navigate]);

  const {
    isCartOpen, setIsCartOpen,
    showOrderModal, setShowOrderModal,
    isBookingOpen, setIsBookingOpen,
    showHistoryModal, setShowHistoryModal,
    myOrders, myReservations,
    fetchMyOrders, fetchMyReservations, handleCloseBooking
  } = useContext(HeaderContext);

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    return `${price.toLocaleString("vi-VN")} VNĐ`;
  };

  const handleOpenBooking = () => {
    if (!user) {
      navigate("/login");
    } else {
      setIsBookingOpen(true);
    }
  };

  return (
    <>
      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/xem-thuc-don" element={<Menu />} />
        <Route path="/menu" element={<ProductOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ve-chung-toi" element={<AboutDetail />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute allowedRoles={['admin']}><AdminReservations /></ProtectedRoute>} />
        <Route path="/admin/qr" element={<ProtectedRoute allowedRoles={['admin']}><AdminQR /></ProtectedRoute>} />
      </Routes>

      {/* Hiển thị Footer chung phía dưới tất cả các trang khách hàng */}
      {!isAdminRoute && <Footer />}

      {/* ALL MODALS RENDER CỐ ĐỊNH TẠI ĐÂY */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          fetchMyOrders();
        }}
      />

      <OrderTrackingModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        orders={myOrders}
        formatPrice={formatPrice}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        onSuccess={fetchMyReservations}
        defaultUser={user}
      />

      <BookingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        reservations={myReservations}
        onOpenBooking={handleOpenBooking}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HeaderProvider>
          <Router>
            <AppContent />
          </Router>
        </HeaderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;