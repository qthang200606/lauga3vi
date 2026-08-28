import React, { useState, useEffect } from 'react';
import { ZoomIn, ArrowUp, X } from 'lucide-react';
import menuBannerImg from "../assets/banner1.png";
import "../css/Menu.css";

// Tự động lấy tất cả ảnh menu từ folder src/assets/menu/
const menuImagesObjects = import.meta.glob('../assets/menu/*.{png,jpg,jpeg,webp}', { 
  eager: true, 
  import: 'default' 
});
const menuImages = Object.values(menuImagesObjects);

function Menu() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Nhóm chính xác 2 ảnh thành 1 cặp song song
  const pairedImages = [];
  for (let i = 0; i < menuImages.length; i += 2) {
    pairedImages.push(menuImages.slice(i, i + 2));
  }

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="menu-page-wrapper">
      {/* Banner */}
      <section className="menu-banner-section position-relative">
        <img src={menuBannerImg} alt="Menu Banner" className="w-100 banner-img" />
        <div className="banner-overlay d-flex flex-column align-items-center justify-content-center text-white">
         
        </div>
      </section>

      {/* Danh sách ảnh dạng sách 2 trang song song */}
      <main className="menu-content-container py-5">
        <div className="container-fluid px-md-5">
          {menuImages.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>Chưa tìm thấy ảnh trong thư mục <code>src/assets/menu/</code></p>
            </div>
          ) : (
            <div className="menu-book-wrapper d-flex flex-column align-items-center">
              {pairedImages.map((pair, pageIndex) => (
                <div key={pageIndex} className="menu-spread-row">
                  {pair.map((src, imgIndex) => (
                    <div key={imgIndex} className="menu-page-half" onClick={() => setSelectedImage(src)}>
                      <img 
                        src={src} 
                        alt={`Trang menu ${pageIndex * 2 + imgIndex + 1}`} 
                        className="menu-page-img"
                      />
                      <div className="img-hover-overlay">
                        <span className="btn btn-light btn-sm rounded-pill fw-semibold">
                          <ZoomIn size={16} className="me-1" /> Phóng to
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Phóng To Ảnh */}
      {selectedImage && (
        <div className="modal-backdrop-custom" onClick={() => setSelectedImage(null)}>
          <div className="position-relative max-w-100" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-custom" onClick={() => setSelectedImage(null)}>
              <X size={20} />
            </button>
            <img src={selectedImage} alt="Phóng to" className="img-fluid modal-img" />
          </div>
        </div>
      )}

      {/* Nút Cuộn Về Đầu Trang */}
      {showScrollTop && (
        <button className="btn-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUp size={22} />
        </button>
      )}
    </div>
  );
}

export default Menu;