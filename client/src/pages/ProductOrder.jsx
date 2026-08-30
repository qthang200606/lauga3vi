import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import {
  Utensils,
  Plus,
  ShoppingBag,
  Check,
  ShoppingCart,
} from "lucide-react";

// =========================================================
// BACKEND RENDER
// =========================================================
const API_URL = "https://lauga3vi-server.onrender.com";

export default function ProductOrder() {
  const [searchParams] = useSearchParams();

  // =========================================================
  // LẤY MÃ BÀN TỪ QR
  // Ví dụ:
  // https://lauga3vi.vercel.app/menu?table=B01
  // => tableCode = B01
  // =========================================================
  const tableCode = searchParams.get("table");

  const { cartItems, addToCart, clearCart } =
    useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [addedItemIds, setAddedItemIds] =
    useState([]);

  // =========================================================
  // LẤY TOKEN ĐĂNG NHẬP
  // =========================================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken")
    );
  };

  // =========================================================
  // CONFIG AXIOS
  // =========================================================
  const getAuthConfig = () => {
    const token = getToken();

    if (!token) {
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =========================================================
  // LẤY CATEGORY + PRODUCT
  // =========================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [catRes, prodRes] =
          await Promise.all([
            axios.get(
              `${API_URL}/api/categories`
            ),
            axios.get(
              `${API_URL}/api/products`
            ),
          ]);

        // =====================================================
        // CATEGORY
        // =====================================================
        const categoryData =
          Array.isArray(catRes.data)
            ? catRes.data
            : Array.isArray(catRes.data?.data)
            ? catRes.data.data
            : Array.isArray(
                catRes.data?.categories
              )
            ? catRes.data.categories
            : [];

        setCategories(categoryData);

        // =====================================================
        // PRODUCT
        // =====================================================
        const productData =
          Array.isArray(prodRes.data)
            ? prodRes.data
            : Array.isArray(prodRes.data?.data)
            ? prodRes.data.data
            : Array.isArray(
                prodRes.data?.products
              )
            ? prodRes.data.products
            : [];

        setProducts(productData);

        console.log(
          "CATEGORY API:",
          catRes.data
        );

        console.log(
          "PRODUCT API:",
          prodRes.data
        );
      } catch (err) {
        console.error(
          "Lỗi tải dữ liệu từ Backend:",
          err.response?.data || err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================================================
  // LỌC SẢN PHẨM THEO DANH MỤC
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

          return (
            String(itemCat) ===
            String(selectedCategory)
          );
        });

  // =========================================================
  // THÊM MÓN VÀO GIỎ
  // =========================================================
  const handleAddToCart = (product) => {
    if (!addToCart) {
      return;
    }

    addToCart(product);

    const pId =
      product._id || product.id;

    setAddedItemIds((prev) => [
      ...prev,
      pId,
    ]);

    setTimeout(() => {
      setAddedItemIds((prev) =>
        prev.filter(
          (id) => id !== pId
        )
      );
    }, 1000);
  };

  // =========================================================
  // TÍNH TỔNG TIỀN
  // =========================================================
  const totalAmount =
    (cartItems || []).reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 1),
      0
    );

  // =========================================================
  // ĐẶT HÀNG
  // =========================================================
  const handlePlaceOrder = async () => {
    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    // Nếu khách quét QR thì bắt buộc phải có mã bàn
    if (!tableCode) {
      alert(
        "Không xác định được bàn. Vui lòng quét lại mã QR của bàn."
      );
      return;
    }

    const token = getToken();

    // Backend hiện tại của bạn đang dùng protect
    if (!token) {
      alert(
        "Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt món!"
      );
      return;
    }

    setIsSubmitting(true);

    // =====================================================
    // DỮ LIỆU GỬI SERVER
    // =====================================================
    const newOrder = {
      tableCode: tableCode,

      orderType: "Dine-in",

      items: cartItems.map((item) => ({
        product:
          item._id || item.id,

        name: item.name,

        price: Number(
          item.price || 0
        ),

        quantity: Number(
          item.quantity || 1
        ),
      })),

      shippingInfo: {
        fullName:
          localStorage.getItem(
            "fullName"
          ) || "Khách tại bàn",

        phone:
          localStorage.getItem(
            "phone"
          ) || "0000000000",

        address:
          `Bàn ${tableCode}`,

        note:
          `Khách gọi món tại bàn ${tableCode}`,
      },

      paymentMethod: "COD",

      totalPrice: totalAmount,
    };

    console.log(
      "ORDER GỬI SERVER:",
      newOrder
    );

    try {
      const res = await axios.post(
        `${API_URL}/api/orders`,
        newOrder,
        getAuthConfig()
      );

      console.log(
        "ORDER RESPONSE:",
        res.data
      );

      alert(
        `Gửi đơn thành công!\n\nBàn: ${tableCode}\nTổng tiền: ${totalAmount.toLocaleString(
          "vi-VN"
        )} đ`
      );

      if (clearCart) {
        clearCart();
      }
    } catch (err) {
      console.error(
        "Lỗi gửi đơn:",
        err.response?.data || err
      );

      if (
        err.response?.status === 401
      ) {
        alert(
          "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!"
        );
      } else {
        alert(
          err.response?.data?.message ||
            "Không thể gửi đơn. Vui lòng thử lại!"
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
        <div className="container py-5">
          <div className="text-center">
            <div
              className="spinner-border text-danger"
              role="status"
            ></div>

            <p className="mt-3 text-muted">
              Đang tải món ăn từ Server...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // GIAO DIỆN
  // =========================================================
  return (
    <div className="product-order-page">

      <div className="container py-4">

        {/* ===================================================
            THÔNG BÁO BÀN
        =================================================== */}
        {tableCode ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 fw-bold shadow-sm mb-4">

            <Utensils size={20} />

            <span>
              Bạn đang gọi món tại bàn:

              <span className="badge bg-danger fs-6 ms-2">
                {tableCode}
              </span>
            </span>

          </div>
        ) : (
          <div className="alert alert-info d-flex align-items-center gap-2 shadow-sm mb-4">

            <ShoppingBag size={20} />

            <span>
              Bạn đang chọn thực đơn{" "}
              <strong>
                Đặt món mang về
              </strong>
              .
            </span>

          </div>
        )}

        {/* ===================================================
            HEADER
        =================================================== */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">

          <div>
            <h2 className="fw-bold mb-1">
              Thực Đơn Gọi Món
            </h2>

            <p className="text-muted mb-0">
              Chọn món ăn bạn muốn đặt
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">

            <div className="text-end">
              <small className="text-muted">
                Tổng tiền
              </small>

              <div className="fw-bold text-danger fs-5">
                {totalAmount.toLocaleString(
                  "vi-VN"
                )}{" "}
                đ
              </div>
            </div>

            <button
              onClick={
                handlePlaceOrder
              }
              disabled={
                isSubmitting ||
                !cartItems ||
                cartItems.length === 0
              }
              className="btn btn-danger btn-lg fw-bold shadow-sm"
            >

              <ShoppingCart
                size={20}
                className="me-2"
              />

              {isSubmitting
                ? "Đang gửi..."
                : `Gửi Đơn (${
                    tableCode ||
                    "Mang về"
                  })`}

            </button>

          </div>
        </div>

        {/* ===================================================
            DANH MỤC
        =================================================== */}
        <div className="d-flex gap-2 overflow-auto mb-4 pb-2">

          <button
            className={`btn px-4 py-2 rounded-pill fw-bold ${
              selectedCategory ===
              "all"
                ? "btn-danger"
                : "btn-outline-secondary"
            }`}
            onClick={() =>
              setSelectedCategory(
                "all"
              )
            }
          >
            🍲 Tất Cả Món
          </button>

          {Array.isArray(
            categories
          ) &&
            categories.map(
              (cat) => {
                const cId =
                  cat._id ||
                  cat.id;

                return (
                  <button
                    key={cId}
                    className={`btn px-4 py-2 rounded-pill fw-bold ${
                      String(
                        selectedCategory
                      ) ===
                      String(cId)
                        ? "btn-danger"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() =>
                      setSelectedCategory(
                        cId
                      )
                    }
                  >
                    {cat.name ||
                      cat.title ||
                      "Danh mục"}
                  </button>
                );
              }
            )}

        </div>

        {/* ===================================================
            DANH SÁCH MÓN
        =================================================== */}
        {filteredProducts.length ===
        0 ? (

          <div className="text-center py-5">

            <Utensils
              size={55}
              className="text-muted mb-3"
            />

            <h4>
              Chưa có món ăn
            </h4>

            <p className="text-muted">
              Danh mục này hiện chưa
              có món.
            </p>

          </div>

        ) : (

          <div className="row g-4">

            {filteredProducts.map(
              (product) => {

                const pId =
                  product._id ||
                  product.id;

                const isAdded =
                  addedItemIds.includes(
                    pId
                  );

                const image =
                  product.image_url ||
                  product.image ||
                  "https://via.placeholder.com/300";

                const price =
                  Number(
                    product.price || 0
                  );

                return (
                  <div
                    key={pId}
                    className="col-12 col-sm-6 col-md-4 col-lg-3"
                  >

                    <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">

                      {/* IMAGE */}
                      <div
                        style={{
                          position:
                            "relative",
                          height:
                            "180px",
                          overflow:
                            "hidden",
                        }}
                      >

                        <img
                          src={image}
                          className="card-img-top"
                          alt={
                            product.name
                          }
                          style={{
                            height:
                              "180px",
                            width:
                              "100%",
                            objectFit:
                              "cover",
                          }}
                        />

                      </div>

                      {/* CONTENT */}
                      <div className="card-body d-flex flex-column justify-content-between">

                        <div>

                          <h5 className="card-title fw-bold mb-1">
                            {
                              product.name
                            }
                          </h5>

                          <p className="card-text text-muted small mb-2">
                            {product.description ||
                              "Món ăn ngon đặc trưng của Lẩu Gà 3 Vị."}
                          </p>

                        </div>

                        <div>

                          <div className="fw-bold text-danger fs-5 mb-2">
                            {price.toLocaleString(
                              "vi-VN"
                            )}{" "}
                            đ
                          </div>

                          <button
                            onClick={() =>
                              handleAddToCart(
                                product
                              )
                            }
                            className={`btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                              isAdded
                                ? "btn-success"
                                : "btn-outline-danger"
                            }`}
                          >

                            {isAdded ? (
                              <Check
                                size={18}
                              />
                            ) : (
                              <Plus
                                size={18}
                              />
                            )}

                            {isAdded
                              ? "Đã thêm"
                              : "Chọn món"}

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          GIỎ HÀNG NỔI
      ===================================================== */}
      {cartItems &&
        cartItems.length > 0 && (

          <div
            style={{
              position:
                "fixed",
              bottom: "20px",
              right: "20px",
              zIndex: 1000,
            }}
          >

            <button
              onClick={
                handlePlaceOrder
              }
              disabled={
                isSubmitting
              }
              className="btn btn-danger shadow-lg rounded-pill px-4 py-3 fw-bold d-flex align-items-center gap-2"
            >

              <ShoppingCart
                size={21}
              />

              <span>
                {cartItems.reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.quantity ||
                        1
                    ),
                  0
                )}{" "}
                món
              </span>

              <span>
                •
              </span>

              <span>
                {totalAmount.toLocaleString(
                  "vi-VN"
                )}{" "}
                đ
              </span>

            </button>

          </div>
        )}

    </div>
  );
}