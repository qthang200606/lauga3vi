import React, { useContext, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css"; // Style của AOS

import {
  LogOut,
  ShieldCheck,
  Utensils,
  MapPin,
  ArrowRight,
  Leaf,
  Soup,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  History,
  ShoppingCart,
  PackageCheck,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext.jsx";
import { CartContext } from "../context/CartContext";
import { getMyReservationsApi } from "../api/reservationApi";
import { getMyOrdersApi } from "../api/orderApi";

import BookingModal from "../components/BookingModal.jsx";
import NotificationDropdown from "../components/NotificationDropdown.jsx";
import BookingHistoryModal from "../components/BookingHistoryModal.jsx";
import CartModal from "../components/CartModal.jsx";
import OrderTrackingModal from "../components/OrderTrackingModal.jsx";
import aboutFood from "../assets/gioithieu.png";
import "../css/Home.css";
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
const BANNERS = [
  {
    id: 1,
    image: banner1,
    tag: "SIGNATURE EXPERIENCE",
    title: "LẨU GÀ 3 VỊ",
    subtitle: "HOÀN BẢO HƯƠNG VỊ VIỆT",
    description:
      "Thưởng thức sự hòa quyện hoàn hảo giữa 3 tầng hương vị nước dùng cô đọng từ nguyên liệu thảo mộc thượng hạng và gà đồi tươi sạch.",
    button: "ĐẶT BÀN THƯỞNG THỨC",
  },
  {
    id: 2,
    image: banner2,
    subtitle: "BÍ QUYẾT TỪ ĐẦU BẾP MÓN VIỆT",
    description:
      "Mỗi nồi lẩu là một tác phẩm nghệ thuật ẩm thực – đun nấu chuẩn giờ, giữ trọn dưỡng chất và vị ngọt tự nhiên.",
    button: "KHÁM PHÁ THỰC ĐƠN",
  },
  {
    id: 3,
    image: banner3,
    tag: "PRIVATE DINING",
    title: "SUM VẦY ẤM CỦNG",
    subtitle: "KHÔNG GIAN SANG TRỌNG",
    description:
      "Điểm đến lý tưởng cho những bữa tiệc gia đình, gặp gỡ đối tác và những khoảnh khắc gắn kết đáng nhớ.",
    button: "ĐẶT BÀN THƯỞNG THỨC",
  },
];

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const { totalQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [myReservations, setMyReservations] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Khởi tạo AOS cho hiệu ứng Scroll
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  // Banner Auto Slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

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

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    fetchMyReservations();
  };

  return (
    <div className="home-page luxury-theme">
    

   {/* HERO BANNER SLIDER */}
<section id="home" className="hero-banner-section">
  <div className="banner-slider">
    {BANNERS.map((banner, index) => (
      <div
        key={banner.id}
        className={`banner-slide ${index === currentBanner ? "active" : ""}`}
      >
        <div
          className="banner-bg-img"
          style={{ backgroundImage: `url(${banner.image})` }}
        ></div>
      </div>
    ))}

    {/* Nút chuyển ảnh slider */}
    <button className="slider-arrow prev" onClick={prevBanner}>
      <ChevronLeft size={24} />
    </button>
    <button className="slider-arrow next" onClick={nextBanner}>
      <ChevronRight size={24} />
    </button>

    {/* Chấm tròn chuyển trang bên dưới */}
    <div className="slider-indicators">
      {BANNERS.map((_, index) => (
        <button
          key={index}
          className={`indicator-dot ${index === currentBanner ? "active" : ""}`}
          onClick={() => setCurrentBanner(index)}
        >
          <span className="dot-line"></span>
        </button>
      ))}
    </div>
  </div>

  {/* QUICK FLOATING BAR */}
  <div className="quick-bar-wrapper home-container">
    <div className="quick-bar-grid">
      <div className="quick-bar-item" onClick={() => navigate("/menu")}>
        <div className="icon-box">
          <ShoppingBag size={20} />
        </div>
        <div className="quick-info">
          <strong>ĐẶT MÓN GIAO TẬN NƠI</strong>
          <span>Menu phong phú, giao nhanh 30 phút</span>
        </div>
        <ChevronRight size={18} className="arrow-icon" />
      </div>

      <div className="quick-bar-item highlight" onClick={handleOpenBooking}>
        <div className="icon-box">
          <CalendarDays size={20} />
        </div>
        <div className="quick-info">
          <strong>ĐẶT BÀN TRƯỚC</strong>
          <span>Chọn không gian & vị trí đẹp nhất</span>
        </div>
        <ChevronRight size={18} className="arrow-icon" />
      </div>

      <a href="#contact" className="quick-bar-item">
        <div className="icon-box">
          <MapPin size={20} />
        </div>
        <div className="quick-info">
          <strong>NHÀ HÀNG TẠI ĐÀ NẴNG</strong>
          <span>Vị trí đắc địa trung tâm thành phố</span>
        </div>
        <ChevronRight size={18} className="arrow-icon" />
      </a>
    </div>
  </div>
</section>

      {/* ================= GIỚI THIỆU ================= */}
      <section id="about" className="about-section">
        <div className="home-container about-grid">
          <div className="about-img-box left" data-aos="fade-right">
            <div className="img-hover-zoom">
              <img src={aboutFood} alt="Không gian Lẩu Gà 3 Vị" />
            </div>
            <div className="about-image-decoration">
              <span></span>
            </div>
          </div>

          <div className="about-center-content" data-aos="fade-left">
            <span className="gold-tag">LẨU GÀ 3 VỊ</span>
            <h2>
              Vị ngon, trọn <br /> khoảnh khắc
            </h2>
            <div className="gold-divider"></div>

            <div className="about-desc">
              <p>
                Ra đời với mong muốn mang đến những trải nghiệm ẩm thực đáng nhớ,{" "}
                <strong>Lẩu Gà 3 Vị</strong> là nơi hội tụ những hương vị truyền thống trong một không gian ấm cúng và hoài niệm.
              </p>
              <p>
                Tại <strong>Lẩu Gà 3 Vị</strong>, chúng tôi luôn lựa chọn nguồn nguyên liệu tươi sạch mỗi ngày, nước dùng ninh từ thảo mộc tự nhiên.
              </p>
              <p className="about-last-text">
                Cùng nhau, chúng ta tạo nên những khoảnh khắc trọn vẹn và đáng nhớ!
              </p>
            </div>

            <div className="about-highlights">
              <div className="hl-item">
                <Leaf size={18} className="gold-text" />
                <span>Nguyên liệu tươi sạch</span>
              </div>
              <div className="hl-item">
                <Soup size={18} className="gold-text" />
                <span>3 vị nước dùng độc bản</span>
              </div>
            </div>

            <button className="about-more-btn" onClick={() => navigate("/ve-chung-toi")}>
              <span>XEM THÊM</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ================= MENU & RESERVATION SECTION ================= */}
{/* MENU & RESERVATION SECTION */}
<section className="menu-banner-bg" id="menu">
  <div className="home-container">
    <div className="menu-buttons-wrapper" data-aos="zoom-in">
      <button className="btn-times-red" onClick={handleOpenBooking}>
        Đặt bàn
      </button>

      <Link to="/xem-thuc-don" className="btn-times-red">
        Xem menu
      </Link>
    </div>
  </div>
</section>
      

      {/* FLOATING BUTTON GIỎ HÀNG */}
      <button
        onClick={() => {
          if (!user) navigate("/login");
          else setIsCartOpen(true);
        }}
        className="floating-cart-btn pulse-animation"
      >
        <ShoppingBag size={20} />
        <span className="cart-text">Giỏ hàng</span>
        <span className="cart-badge-count">{totalQuantity || 0}</span>
      </button>

      {/* MODALS */}
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
    </div>
  );
};

export default Home;