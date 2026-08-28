import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { getMyReservationsApi } from '../api/reservationApi';
import { getMyOrdersApi } from '../api/orderApi';

export const HeaderContext = createContext();

export function HeaderProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [myReservations, setMyReservations] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  // Bê nguyên xi hàm fetchMyReservations từ Home.jsx
  const fetchMyReservations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyReservationsApi();
      if (res.data?.success) {
        setMyReservations(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử đặt bàn:", err);
    }
  }, [user]);

  // Bê nguyên xi hàm fetchMyOrders từ Home.jsx
  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyOrdersApi();
      const orderList = res.data?.data || res.data || [];
      setMyOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      console.error("Lỗi lấy danh sách đơn hàng:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyReservations();
      fetchMyOrders();
    } else {
      setMyReservations([]);
      setMyOrders([]);
    }
  }, [user, fetchMyReservations, fetchMyOrders]);

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    fetchMyReservations();
  };

  return (
    <HeaderContext.Provider value={{
      isBookingOpen, setIsBookingOpen,
      showHistoryModal, setShowHistoryModal,
      isCartOpen, setIsCartOpen,
      showOrderModal, setShowOrderModal,
      myReservations, myOrders,
      fetchMyReservations, fetchMyOrders,
      handleCloseBooking
    }}>
      {children}
    </HeaderContext.Provider>
  );
}