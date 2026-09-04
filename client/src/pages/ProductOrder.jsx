import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import {
  Utensils,
  Plus,
  Minus,
  Check,
  ShoppingCart,
  User,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import "./ProductOrder.css"; // Nhập file CSS của bạn

const API_URL = "https://lauga3vi-server.onrender.com";

export default function ProductOrder() {
  const [searchParams] = useSearchParams();
  const tableCode = searchParams.get("table");

  const { cartItems, addToCart, clearCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý Số lượng & Ghi chú riêng từng món
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [addedItemIds, setAddedItemIds] = useState([]);

  // Thông tin khách hàng
  const [customerName, setCustomerName] = useState(
    localStorage.getItem("customerName") || ""
  );
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (tableCode && !customerName) {
      setShowCustomerModal(true);
    }
  }, [tableCode, customerName]);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken")
    );
  };

  const getAuthConfig = () => {
    const token = getToken();
    if (!token) return {};
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const handleConfirmCustomer = () => {
    const name = customerName.trim();
    if (!name) {
      setNameError("Vui lòng nhập tên khách hàng.");
      return;
    }
    if (name.length < 2) {
      setNameError("Tên khách hàng phải có ít nhất 2 ký tự.");
      return;
    }
    setNameError("");
    localStorage.setItem("customerName", name);
    setCustomerName(name);
    setShowCustomerModal(false);
  };

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
          : Array.isArray(catRes.data?.data)
          ? catRes.data.data
          : Array.isArray(catRes.data?.categories)
          ? catRes.data.categories
          : [];
        setCategories(categoryData);

        const productData = Array.isArray(prodRes.data)
          ? prodRes.data
          : Array.isArray(prodRes.data?.data)
          ? prodRes.data.data
          : Array.isArray(prodRes.data?.products)
          ? prodRes.data.products
          : [];
        setProducts(productData);
      } catch (err) {
        console.error("Lỗi tải dữ liệu từ Backend:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuantityChange = (productId, delta) => {
    setItemQuantities((prev) => {
      const currentQty = prev[productId] || 1;
      const newQty = Math.max(1, currentQty + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleNoteChange = (productId, note) => {
    setItemNotes((prev) => ({ ...prev, [productId]: note }));
  };

  const handleAddToCart = (product) => {
    if (!addToCart) return;

    const pId = product._id || product.id;
    const quantity = itemQuantities[pId] || 1;
    const note = itemNotes[pId] || "";

    const productWithCustomization = {
      ...product,
      quantity,
      note,
    };

    addToCart(productWithCustomization);

    setAddedItemIds((prev) => [...prev, pId]);
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== pId));
    }, 1200);
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((item) => {
          const itemCat =
            item.category_id ||
            item.categoryId ||
            item.category?._id ||
            item.category?.id ||
            item.category;
          return String(itemCat) === String(selectedCategory);
        });

  const totalAmount = (cartItems || []).reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const totalItemCount = (cartItems || []).reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    const isDineIn = Boolean(tableCode);
    const orderType = isDineIn ? "Dine-in" : "Takeaway";

    if (isDineIn && !customerName.trim()) {
      setShowCustomerModal(true);
      return;
    }

    setIsSubmitting(true);

    const finalCustomerName =
      customerName.trim() ||
      localStorage.getItem("userName") ||
      "Khách mang về";

    const newOrder = {
      tableCode: tableCode || "",
      orderType: orderType,
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
      await axios.post(`${API_URL}/api/orders`, newOrder, getAuthConfig());

      const successMsg = isDineIn
        ? `Gửi đơn thành công!\n\nKhách: ${finalCustomerName}\nBàn: ${tableCode}\nTổng tiền: ${totalAmount.toLocaleString(
            "vi-VN"
          )} đ`
        : `Gửi đơn mang về thành công!\n\nKhách: ${finalCustomerName}\nTổng tiền: ${totalAmount.toLocaleString(
            "vi-VN"
          )} đ`;

      alert(successMsg);

      if (clearCart) clearCart();
    } catch (err) {
      console.error("Lỗi gửi đơn:", err.response?.data || err);
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
      } else {
        alert(err.response?.data?.message || "Không thể gửi đơn!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-order-page">
        <div className="container text-center pt-5">
          <div className="spinner-border text-danger" role="status" />
          <p className="mt-3 text-muted">Đang tải món ăn từ Server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-order-page">
      {/* MODAL NHẬP TÊN KHÁCH (DINE-IN) */}
      {showCustomerModal && tableCode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#fff",
              borderRadius: "20px",
              padding: "25px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="qr-order-icon mx-auto mb-3">
              <User size={28} />
            </div>

            <h4 className="text-center fw-bold mb-1">Chào mừng bạn! 👋</h4>
            <p className="text-center text-muted small mb-3">
              Bạn đang gọi món tại <span className="table-badge ms-1">Bàn {tableCode}</span>
            </p>

            <div className="customer-input-box w-100">
              <label>Tên của bạn</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmCustomer()}
                placeholder="Nhập tên để nhân viên phục vụ..."
                autoFocus
              />
            </div>
            {nameError && (
              <div className="text-danger small mt-1">{nameError}</div>
            )}

            <button
              onClick={handleConfirmCustomer}
              className="btn btn-danger btn-lg w-100 fw-bold mt-3"
              style={{ borderRadius: "12px", background: "#e52f45" }}
            >
              Bắt đầu gọi món
            </button>
          </div>
        </div>
      )}

      <div className="container pt-4">
        {/* BANNER THÔNG BÁO BÀN / MANG VỀ */}
        {tableCode ? (
          <div className="qr-order-box">
            <div className="qr-order-icon">
              <Utensils size={24} />
            </div>
            <div className="qr-order-content">
              <div className="qr-order-title">
                <span>Bạn đang gọi món tại:</span>
                <span className="table-badge">Bàn {tableCode}</span>
              </div>
              <div className="customer-input-box">
                <label>Tên khách hàng:</label>
                <input
                  type="text"
                  placeholder="Nhập tên của bạn..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    localStorage.setItem("customerName", e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="qr-order-box"
            style={{
              background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
              borderColor: "#90caf9",
            }}
          >
            <div
              className="qr-order-icon"
              style={{ background: "#1976d2", boxShadow: "0 5px 15px rgba(25, 118, 210, 0.2)" }}
            >
              <ShoppingBag size={24} />
            </div>
            <div className="qr-order-content d-flex align-items-center">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: "#0d47a1" }}>
                  Thực đơn Đặt Món Mang Về
                </h5>
                <p className="mb-0 text-muted small">
                  Chọn món yêu thích của bạn và bấm gửi đơn bên dưới.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="product-order-header">
          <div className="product-order-title">
            <h2>Thực Đơn Gọi Món</h2>
            <p>Chọn món ăn, số lượng và ghi chú sở thích của bạn</p>
          </div>

          <div className="order-summary">
            <div className="order-total">
              <small>Tổng tiền</small>
              <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !cartItems || cartItems.length === 0}
              className="btn btn-danger btn-lg fw-bold d-flex align-items-center gap-2"
              style={{
                borderRadius: "12px",
                background: "#e52f45",
                padding: "10px 20px",
              }}
            >
              <ShoppingCart size={20} />
              <span>
                {isSubmitting
                  ? "Đang gửi..."
                  : tableCode
                  ? `Gửi Đơn (Bàn ${tableCode})`
                  : "Gửi Đơn (Mang về)"}
              </span>
            </button>
          </div>
        </div>

        {/* CATEGORY LIST */}
        <div className="category-list">
          <button
            className={`category-button ${
              selectedCategory === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            🍲 Tất Cả Món
          </button>
          {Array.isArray(categories) &&
            categories.map((cat) => {
              const cId = cat._id || cat.id;
              return (
                <button
                  key={cId}
                  className={`category-button ${
                    String(selectedCategory) === String(cId) ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cId)}
                >
                  {cat.name || cat.title || "Danh mục"}
                </button>
              );
            })}
        </div>

        {/* PRODUCT LIST */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <Utensils size={50} className="text-muted mb-3" />
            <h4>Chưa có món ăn</h4>
            <p className="text-muted">Danh mục này hiện chưa có món.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProducts.map((product) => {
              const pId = product._id || product.id;
              const isAdded = addedItemIds.includes(pId);
              const image =
                product.image_url ||
                product.image ||
                "https://via.placeholder.com/300";
              const price = Number(product.price || 0);

              const currentQty = itemQuantities[pId] || 1;
              const currentNote = itemNotes[pId] || "";

              return (
                <div key={pId} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={image}
                        className="product-image"
                        alt={product.name}
                      />
                    </div>

                    <div className="product-card-body">
                      <div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">
                          {product.description ||
                            "Món ăn thơm ngon chuẩn vị."}
                        </div>
                      </div>

                      <div className="product-bottom">
                        <div className="product-price">
                          {price.toLocaleString("vi-VN")} đ
                        </div>

                        {/* SỐ LƯỢNG & GHI CHÚ */}
                        <div className="d-flex align-items-center justify-content-between mb-2 bg-light p-1 rounded-3">
                          <small className="fw-bold text-muted ps-1">
                            Số lượng
                          </small>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-white shadow-sm border rounded-circle p-0"
                              style={{ width: "26px", height: "26px" }}
                              onClick={() => handleQuantityChange(pId, -1)}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="fw-bold px-1">{currentQty}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-white shadow-sm border rounded-circle p-0"
                              style={{ width: "26px", height: "26px" }}
                              onClick={() => handleQuantityChange(pId, 1)}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="input-group input-group-sm mb-3">
                          <span className="input-group-text bg-light border-0 text-muted">
                            <MessageSquare size={13} />
                          </span>
                          <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Ghi chú (ít cay, nhiều rau...)"
                            value={currentNote}
                            onChange={(e) =>
                              handleNoteChange(pId, e.target.value)
                            }
                            style={{ fontSize: "0.8rem" }}
                          />
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`add-product-button btn ${
                            isAdded ? "btn-success" : "btn-outline-danger"
                          }`}
                        >
                          {isAdded ? (
                            <span className="d-flex align-items-center justify-content-center gap-1">
                              <Check size={18} /> Đã thêm
                            </span>
                          ) : (
                            <span className="d-flex align-items-center justify-content-center gap-1">
                              <Plus size={18} /> Chọn món
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING CART BUTTON */}
      {cartItems && cartItems.length > 0 && (
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="floating-cart d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center gap-2">
            <ShoppingCart size={22} />
            <span>{totalItemCount} món</span>
          </div>
          <div>
            <span>{totalAmount.toLocaleString("vi-VN")} đ</span>
            <span className="ms-2 fs-6 fw-normal">→</span>
          </div>
        </button>
      )}
    </div>
  );
}