import React, { useState, useEffect, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";

// IMPORT ẢNH BACKGROUND NỔI NỀN LẨU GÀ (Đảm bảo file ảnh nằm đúng vị trí này)
import bgOrder from "../assets/bg-product-order.png";

import {
  Utensils,
  Plus,
  Minus,
  ShoppingCart,
  User,
  MessageSquare,
  ShoppingBag,
  Search,
  X,
  Trash2,
  ChevronRight
} from "lucide-react";

import "../css/ProductOrder.css";

const API_URL = "https://lauga3vi-server.onrender.com";

export default function ProductOrder() {
  const [searchParams] = useSearchParams();
  const tableCode = searchParams.get("table");

  const { cartItems, addToCart, removeFromCart, clearCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNote, setModalNote] = useState("");

  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [customerName, setCustomerName] = useState(localStorage.getItem("customerName") || "");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (tableCode && !customerName) {
      setShowCustomerModal(true);
    }
  }, [tableCode, customerName]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories`),
          axios.get(`${API_URL}/api/products`),
        ]);

        const categoryData = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.data || catRes.data?.categories || [];

        const productData = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.data || prodRes.data?.products || [];

        setCategories(categoryData);
        setProducts(productData);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenProductModal = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    setModalNote("");
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProduct || !addToCart) return;

    addToCart({
      ...selectedProduct,
      quantity: modalQuantity,
      note: modalNote,
    });

    setSelectedProduct(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const itemCat = item.category_id || item.categoryId || item.category?._id || item.category;
      const matchCategory = selectedCategory === "all" || String(itemCat) === String(selectedCategory);
      const keyword = searchText.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.description || "").toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchText]);

  const totalAmount = useMemo(() => {
    return (cartItems || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [cartItems]);

  const totalItemCount = useMemo(() => {
    return (cartItems || []).reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0
    );
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) return;

    const isDineIn = Boolean(tableCode);
    if (isDineIn && !customerName.trim()) {
      setShowCustomerModal(true);
      return;
    }

    setIsSubmitting(true);
    const finalCustomerName = customerName.trim() || localStorage.getItem("userName") || "Khách mang về";

    const newOrder = {
      tableCode: tableCode || "",
      orderType: isDineIn ? "Dine-in" : "Takeaway",
      items: cartItems.map((item) => ({
        product: item._id || item.id,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        note: item.note || "",
      })),
      shippingInfo: {
        fullName: finalCustomerName,
        phone: localStorage.getItem("phone") || "0000000000",
        address: isDineIn ? `Bàn ${tableCode}` : "Mang về",
        note: isDineIn
          ? `Khách ${finalCustomerName} gọi món tại bàn ${tableCode}`
          : `Đơn đặt mang về của khách ${finalCustomerName}`,
      },
      paymentMethod: "COD",
      totalPrice: totalAmount,
    };

    try {
      await axios.post(`${API_URL}/api/orders`, newOrder);
      alert("Đặt món thành công!");
      if (clearCart) clearCart();
      setShowCartDrawer(false);
    } catch (err) {
      alert(err.response?.data?.message || "Gửi đơn thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-order-page">
        <div className="product-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thực đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="product-order-page"
      style={{
        backgroundImage: `url(${bgOrder})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* 1. THANH FLOATING THÔNG TIN CỐ ĐỊNH */}
      <div className="floating-info-bar">
        <div className={`floating-info-pill ${tableCode ? "dine-in-pill" : ""}`}>
          <div className="floating-info-icon">
            {tableCode ? <Utensils size={16} /> : <ShoppingBag size={16} />}
          </div>
          <div className="floating-info-text">
            {tableCode ? (
              <strong>Đang gọi món tại Bàn {tableCode}</strong>
            ) : (
              <>
                <strong>Đặt món mang về</strong>
                <span className="dot">•</span>
                <span className="sub-text">Chọn món yêu thích của bạn</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="product-order-container">
        {/* TÌM KIẾM */}
        <div className="top-search-container">
          <div className="menu-search">
            <Search size={18} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nhập món ăn cần tìm..."
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")} className="search-clear">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* MENU CATEGORY CĂN GIỮA MÀN HÌNH */}
        <div className="category-wrapper-center">
          <div className="category-list">
            <button
              className={`category-button ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              <span>TẤT CẢ</span>
            </button>
            {categories.map((cat) => {
              const cId = cat._id || cat.id;
              return (
                <button
                  key={cId}
                  className={`category-button ${String(selectedCategory) === String(cId) ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cId)}
                >
                  {cat.image && <img src={cat.image} alt="" className="category-image" />}
                  <span>{String(cat.name || cat.title || "Danh mục").toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DANH SÁCH CARD MÓN ĂN */}
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const pId = product._id || product.id;
            const image = product.image_url || product.image || "https://via.placeholder.com/500";
            const price = Number(product.price || 0);

            return (
              <div key={pId} className="product-card" onClick={() => handleOpenProductModal(product)}>
                <div className="product-image-wrapper">
                  <img src={image} className="product-image" alt={product.name} loading="lazy" />
                </div>
                
                <div className="product-card-body">
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description || product.name}</p>
                  </div>
                  <div className="product-card-footer">
                    <span className="product-price">
                      {price.toLocaleString("vi-VN")} đ
                    </span>
                    <button className="open-modal-btn">
                      <Plus size={16} /> Chọn món
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP TÙY CHỈNH MÓN */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>
            <div className="modal-header-img">
              <img src={selectedProduct.image_url || selectedProduct.image} alt={selectedProduct.name} />
            </div>
            <div className="modal-body">
              <h2>{selectedProduct.name}</h2>
              <p className="modal-desc">{selectedProduct.description}</p>
              <div className="modal-price">
                {(Number(selectedProduct.price) * modalQuantity).toLocaleString("vi-VN")} đ
              </div>

              <div className="modal-section">
                <label>Số lượng</label>
                <div className="quantity-box-large">
                  <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>
                    <Minus size={20} />
                  </button>
                  <span>{modalQuantity}</span>
                  <button onClick={() => setModalQuantity(modalQuantity + 1)}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-section">
                <label>Ghi chú món ăn</label>
                <div className="note-input-wrapper">
                  <MessageSquare size={18} />
                  <input
                    type="text"
                    placeholder="Ví dụ: Không cay, ít đường..."
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                  />
                </div>
              </div>

              <button className="add-to-cart-submit" onClick={handleConfirmAddToCart}>
                Thêm vào giỏ hàng • {(Number(selectedProduct.price) * modalQuantity).toLocaleString("vi-VN")} đ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIỎ HÀNG NỔI BÊN PHẢI */}
      {cartItems && cartItems.length > 0 && (
        <>
          <button className="floating-cart-btn-right" onClick={() => setShowCartDrawer(true)}>
            <div className="cart-badge">{totalItemCount}</div>
            <ShoppingCart size={22} />
            <span className="cart-text">Giỏ hàng</span>
          </button>

          {showCartDrawer && (
            <div className="drawer-overlay" onClick={() => setShowCartDrawer(false)}>
              <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                  <h3>Giỏ hàng của bạn ({totalItemCount})</h3>
                  <button onClick={() => setShowCartDrawer(false)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="drawer-body">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="drawer-item">
                      <div className="drawer-item-info">
                        <strong>{item.name} x {item.quantity}</strong>
                        {item.note && <span className="item-note">Ghi chú: {item.note}</span>}
                        <span className="item-price">
                          {(Number(item.price) * item.quantity).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <button className="remove-item-btn" onClick={() => removeFromCart && removeFromCart(item._id || item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="drawer-footer">
                  <div className="drawer-total">
                    <span>Tổng tiền:</span>
                    <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
                  </div>
                  <button className="checkout-btn" onClick={handlePlaceOrder} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : "Gửi đơn hàng"} <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOMER NAME MODAL */}
      {showCustomerModal && tableCode && (
        <div className="modal-overlay">
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-icon"><User size={30} /></div>
            <h3>Chào mừng bạn! 👋</h3>
            <p>Bạn đang gọi món tại <span className="modal-table">Bàn {tableCode}</span></p>
            <div className="customer-field">
              <label>Tên của bạn</label>
              <div className="customer-input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setNameError("");
                  }}
                  placeholder="Nhập tên..."
                  autoFocus
                />
              </div>
            </div>
            {nameError && <div className="customer-error">{nameError}</div>}
            <button
              onClick={() => {
                if (!customerName.trim()) {
                  setNameError("Vui lòng nhập tên.");
                  return;
                }
                localStorage.setItem("customerName", customerName.trim());
                setShowCustomerModal(false);
              }}
              className="customer-confirm-button"
            >
              Bắt đầu gọi món
            </button>
          </div>
        </div>
      )}
    </div>
  );
}