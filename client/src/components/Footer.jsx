import React from "react";
import { Utensils, Phone } from "lucide-react";
import "../css/Footer.css";

const Footer = () => {
  return (
    <footer className="footer-gold-container" id="contact">
      <div className="footer-gold-content">
        {/* Cột 1: Logo & Tên Thương Hiệu */}
        <div className="footer-col brand-col">
          <div className="brand-logo-box">
            <Utensils size={28} className="brand-icon" />
            <div className="brand-text">
              <span className="brand-title">LẨU GÀ 3 VỊ</span>
              <span className="brand-sub">FINE VIETNAMESE CUISINE</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Địa chỉ */}
        <div className="footer-col">
          <h4 className="footer-heading">Địa chỉ</h4>
          <p className="footer-text">Số 460 Trần Đại Nghĩa, phường Hòa Hải, Q. Ngũ Hành Sơn, TP. Đà Nẵng</p>
        </div>

        {/* Cột 3: Thời gian mở cửa */}
        <div className="footer-col">
          <h4 className="footer-heading">Thời gian mở cửa</h4>
          <p className="footer-text">6:30 – 21:30</p>
          <p className="footer-text">Thứ Hai – Chủ Nhật</p>
        </div>

        {/* Cột 4: Liên hệ */}
        <div className="footer-col">
          <h4 className="footer-heading">Liên hệ</h4>
          <p className="footer-text">sales@laugaba.com</p>
          <p className="footer-text highlight-phone">0935 123 456</p>
        </div>

        {/* Cột 5: Theo dõi & Mạng xã hội */}
        <div className="footer-col">
          <h4 className="footer-heading">Theo dõi</h4>
          <div className="social-icons">
            {/* Facebook Icon SVG */}
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>

            {/* Instagram Icon SVG */}
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Nút Gọi Nhanh Nổi Bên Phải */}
      <a href="tel:0935123456" className="floating-call-btn" title="Gọi ngay">
        <Phone size={22} />
      </a>
    </footer>
  );
};

export default Footer;