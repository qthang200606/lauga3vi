import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Utensils,
  Plus,
  ShoppingBag,
  Check,
  Minus,
  Trash2,
  X,
  Send,
  MapPin,
} from "lucide-react";

import { CartContext } from "../context/CartContext";

import "../css/ProductOrder.css";

const API_URL = "http://localhost:5000";

export default function ProductOrder() {
  const [searchParams] = useSearchParams();

  // Lấy mã bàn từ QR
  const tableCode = searchParams.get("table");

  const { cartItems, addToCart, clearCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addedItemIds, setAddedItemIds] = useState([]);

  const [showCart, setShowCart] = useState(false);

  // =========================================================
  // LẤY SẢN PHẨM + DANH MỤC
  // =========================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories`),
          axios.get(`${API_URL}/api/products`),
        ]);

        // ============================
        // XỬ LÝ CATEGORY
        // ============================
        const catData = catRes.data;

        let categoryList = [];

        if (Array.isArray(catData)) {
          categoryList = catData;
        } else if (Array.isArray(catData?.data)) {
          categoryList = catData.data;
        } else if (Array.isArray(catData?.categories)) {
          categoryList = catData.categories;
        }

        setCategories(categoryList);

        // ============================
        // XỬ LÝ PRODUCT
        // ============================
        const prodData = prodRes.data;

        let productList = [];

        if (Array.isArray(prodData)) {
          productList = prodData;
        } else if (Array.isArray(prodData?.data)) {
          productList = prodData.data;
        } else if (Array.isArray(prodData?.products)) {
          productList = prodData.products;
        }

        setProducts(productList);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================================================
  // LỌC SẢN PHẨM
  // =========================================================
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

  // =========================================================
  // THÊM VÀO GIỎ
  // =========================================================
  const handleAddToCart = (product) => {
    if (!addToCart) return;

    addToCart(product);

    const pId = product._id || product.id;

    setAddedItemIds((prev) => [...prev, pId]);

    setTimeout(() => {
      setAddedItemIds((prev) =>
        prev.filter((id) => id !== pId)
      );
    }, 1000);
  };

  // =========================================================
  // TÍNH TỔNG TIỀN
  // =========================================================
  const totalAmount = (cartItems || []).reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  // =========================================================
  // FORMAT GIÁ
  // =========================================================
  const formatPrice = (price) => {
    return `${Number(price || 0).toLocaleString("vi-VN")}đ`;
  };

  // =========================================================
  // GỬI ĐƠN
  // =========================================================
  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    if (!tableCode) {
      alert(
        "Không xác định được bàn. Vui lòng quét lại mã QR của bàn."
      );
      return;
    }

    setIsSubmitting(true);

    const newOrder = {
      tableCode: tableCode,

      // Khách tại bàn
      orderType: "Dine-in",

      items: cartItems.map((item) => ({
        productId: item._id || item.id,

        name: item.name,

        price: Number(item.price || 0),

        quantity: Number(item.quantity || 1),

        image:
          item.image ||
          item.image_url ||
          "",
      })),

      totalAmount: totalAmount,

      // Không cần user
      customerType: "GUEST",

      status: "pending",
    };

    try {
      console.log("Đang gửi đơn:", newOrder);

      const response = await axios.post(
        `${API_URL}/api/orders/table`,
        newOrder
      );

      console.log("Server response:", response.data);

      alert(
        `Đặt món thành công!\n\nBàn: ${tableCode}\nTổng tiền: ${formatPrice(
          totalAmount
        )}`
      );

      if (clearCart) {
        clearCart();
      }

      setShowCart(false);
    } catch (error) {
      console.error("Lỗi gửi đơn:", error);

      if (error.response) {
        console.error(
          "Server:",
          error.response.data
        );

        alert(
          error.response.data?.message ||
            "Không thể gửi đơn. Vui lòng thử lại!"
        );
      } else {
        alert(
          "Không thể kết nối Server!\nKiểm tra Backend đang chạy chưa."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="product-order-page">
        <div className="order-loading">
          <div className="loading-spinner"></div>
          <h3>Đang tải thực đơn...</h3>
          <p>Vui lòng chờ một chút</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-order-page">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="order-header">
        <div className="order-header-inner">

          <div className="restaurant-logo">
            <div className="logo-icon">
              <Utensils size={22} />
            </div>

            <div>
              <strong>LẨU GÀ 3 VỊ</strong>
              <span>HƯƠNG VỊ VIỆT</span>
            </div>
          </div>

          <div className="table-info">
            <MapPin size={18} />

            <div>
              <small>Đang gọi món tại</small>

              <strong>
                Bàn {tableCode || "Không xác định"}
              </strong>
            </div>
          </div>

          <button
            className="header-cart-button"
            onClick={() => setShowCart(true)}
          >
            <ShoppingBag size={20} />

            <span>
              Giỏ hàng
            </span>

            {cartItems?.length > 0 && (
              <b>
                {cartItems.reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 1),
                  0
                )}
              </b>
            )}
          </button>

        </div>
      </header>

      {/* =====================================================
          WELCOME
      ===================================================== */}
      <section className="order-welcome">

        <div className="welcome-inner">

          <span className="welcome-label">
            🍲 LẨU GÀ 3 VỊ
          </span>

          <h1>
            Chọn món bạn <span>yêu thích</span>
          </h1>

          <p>
            Thưởng thức món ngon tại bàn
            <strong>
              {tableCode ? ` Bàn ${tableCode}` : ""}
            </strong>
          </p>

        </div>

      </section>

      {/* =====================================================
          CATEGORY
      ===================================================== */}
      <section className="category-section">

        <div className="category-container">

          <button
            className={
              selectedCategory === "all"
                ? "category-button active"
                : "category-button"
            }
            onClick={() => setSelectedCategory("all")}
          >
            🍲 Tất cả món
          </button>

          {Array.isArray(categories) &&
            categories.map((cat) => {

              const cId =
                cat._id ||
                cat.id;

              return (
                <button
                  key={cId}
                  className={
                    String(selectedCategory) ===
                    String(cId)
                      ? "category-button active"
                      : "category-button"
                  }
                  onClick={() =>
                    setSelectedCategory(cId)
                  }
                >
                  {cat.name ||
                    cat.title ||
                    "Danh mục"}
                </button>
              );
            })}

        </div>

      </section>

      {/* =====================================================
          PRODUCT
      ===================================================== */}
      <main className="products-container">

        {filteredProducts.length === 0 ? (

          <div className="empty-products">
            <Utensils size={50} />

            <h3>
              Chưa có món ăn
            </h3>

            <p>
              Danh mục này hiện chưa có món.
            </p>
          </div>

        ) : (

          <div className="products-grid">

            {filteredProducts.map((product, index) => {

              const pId =
                product._id ||
                product.id;

              const isAdded =
                addedItemIds.includes(pId);

              const image =
                product.image_url ||
                product.image ||
                "https://via.placeholder.com/500";

              return (

                <article
                  className="product-card"
                  key={pId}
                >

                  {/* IMAGE */}
                  <div className="product-image">

                    <img
                      src={image}
                      alt={product.name}
                    />

                    <span className="product-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                  </div>

                  {/* CONTENT */}
                  <div className="product-content">

                    <div className="product-title-row">

                      <h3>
                        {product.name}
                      </h3>

                      <strong>
                        {formatPrice(
                          product.price
                        )}
                      </strong>

                    </div>

                    <p>
                      {product.description ||
                        "Món ngon được chế biến từ nguyên liệu tươi ngon."}
                    </p>

                    <div className="product-bottom">

                      <div className="product-rating">
                        <span>★</span>
                        <b>4.9</b>
                        <small>
                          Yêu thích
                        </small>
                      </div>

                      <button
                        className={
                          isAdded
                            ? "add-button added"
                            : "add-button"
                        }
                        onClick={() =>
                          handleAddToCart(product)
                        }
                      >
                        {isAdded ? (
                          <>
                            <Check size={17} />
                            Đã thêm
                          </>
                        ) : (
                          <>
                            <Plus size={17} />
                            Chọn món
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                </article>

              );
            })}

          </div>

        )}

      </main>

      {/* =====================================================
          FLOATING CART
      ===================================================== */}
      {cartItems?.length > 0 && (

        <button
          className="floating-cart"
          onClick={() => setShowCart(true)}
        >

          <ShoppingBag size={21} />

          <div>
            <span>
              {cartItems.reduce(
                (sum, item) =>
                  sum + Number(item.quantity || 1),
                0
              )} món
            </span>

            <strong>
              {formatPrice(totalAmount)}
            </strong>
          </div>

          <Send size={19} />

        </button>

      )}

      {/* =====================================================
          CART DRAWER
      ===================================================== */}
      {showCart && (

        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >

          <div
            className="cart-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>
                <h2>
                  Giỏ món
                </h2>

                <span>
                  Bàn {tableCode}
                </span>
              </div>

              <button
                onClick={() =>
                  setShowCart(false)
                }
              >
                <X size={22} />
              </button>

            </div>

            <div className="cart-items">

              {cartItems?.map((item) => {

                const itemId =
                  item._id ||
                  item.id;

                return (

                  <div
                    className="cart-item"
                    key={itemId}
                  >

                    <img
                      src={
                        item.image ||
                        item.image_url ||
                        "https://via.placeholder.com/100"
                      }
                      alt={item.name}
                    />

                    <div className="cart-item-info">

                      <h4>
                        {item.name}
                      </h4>

                      <strong>
                        {formatPrice(
                          item.price
                        )}
                      </strong>

                      <div className="quantity-control">

                        <button
                          onClick={() => {
                            if (
                              item.quantity <=
                              1
                            ) {
                              return;
                            }

                            // Tùy CartContext của bạn
                            // có hỗ trợ update hay không
                          }}
                        >
                          <Minus size={15} />
                        </button>

                        <span>
                          {item.quantity || 1}
                        </span>

                        <button
                          onClick={() =>
                            addToCart(item)
                          }
                        >
                          <Plus size={15} />
                        </button>

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

            {/* CART FOOTER */}
            <div className="cart-footer">

              <div className="cart-total">

                <span>
                  Tổng cộng
                </span>

                <strong>
                  {formatPrice(
                    totalAmount
                  )}
                </strong>

              </div>

              <button
                className="place-order-button"
                onClick={handlePlaceOrder}
                disabled={
                  isSubmitting ||
                  !cartItems?.length
                }
              >

                {isSubmitting ? (
                  <>
                    <div className="button-spinner"></div>
                    Đang gửi đơn...
                  </>
                ) : (
                  <>
                    <Send size={19} />
                    Gửi đơn đến bếp
                  </>
                )}

              </button>

              <small>
                Kiểm tra món trước khi gửi đơn.
              </small>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}