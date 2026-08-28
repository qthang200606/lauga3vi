import React, { useContext, useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Banknote,
  QrCode,
  CheckCircle2,
  Copy,
  Info,
} from "lucide-react";
import { CartContext } from "../context/CartContext";
import { createOrderApi } from "../api/orderApi";
import "../css/CartModal.css";

// THÔNG TIN TÀI KHOẢN NGÂN HÀNG QUÁN
const BANK_INFO = {
  bankName: "MB BANK (Ngân hàng Quân Đội)",
  accountNo: "0905123456",
  accountHolder: "LAU GA 3 VI",
};

const CartModal = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, clearCart } =
    useContext(CartContext);

  const [step, setStep] = useState("cart"); // 'cart' | 'checkout' | 'success'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Thông tin giao hàng & Thanh toán
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "", // Ghi chú chung cho toàn bộ đơn hàng
  });
  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' | 'BANK_TRANSFER'

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  // Sao chép số tài khoản
  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        items: cartItems.map((item) => ({
          product: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note || "", // Truyền ghi chú riêng từng món lên Backend
        })),
        shippingInfo,
        paymentMethod,
        totalPrice,
        isPaid: false,
      };

      await createOrderApi(orderData);

      // Chuyển sang màn hình Đặt hàng thành công
      setStep("success");
      clearCart();
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAll = () => {
    setStep("cart");
    onClose();
  };

  // URL tạo VietQR tự động
  const qrUrl = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNo}-compact2.png?amount=${totalPrice}&addInfo=LAUGA3VI%20${shippingInfo.phone}&accountName=${encodeURIComponent(
    BANK_INFO.accountHolder
  )}`;

  return (
    <div className="cart-overlay" onClick={handleCloseAll}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            {step === "checkout" && (
              <button className="back-btn" onClick={() => setStep("cart")}>
                <ArrowLeft size={18} />
              </button>
            )}
            {step === "cart" && <ShoppingBag size={20} className="header-icon" />}
            <h3>
              {step === "cart" && "Giỏ món ăn của bạn"}
              {step === "checkout" && "Thanh toán & Giao hàng"}
              {step === "success" && "Đặt hàng thành công"}
            </h3>
          </div>
          <button className="close-cart-btn" onClick={handleCloseAll}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: GIỎ HÀNG */}
        {step === "cart" && (
          <>
            <div className="cart-body">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p>Chưa có món nào trong giỏ hàng.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={`${item._id}-${idx}`} className="cart-item">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80"
                      }
                      alt={item.name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      
                      {/* Hiển thị Ghi chú từng món (nếu có) */}
                      {item.note && (
                        <div className="cart-item-note">
                          📝 {item.note}
                        </div>
                      )}

                      <div className="cart-item-price">
                        {item.price
                          ? `${item.price.toLocaleString("vi-VN")}đ`
                          : "0đ"}
                      </div>

                      <div className="cart-quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item._id, item.note, -1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item._id, item.note, 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item._id, item.note)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-row">
                  <span>Tổng tiền món:</span>
                  <span className="cart-total-price">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={() => setStep("checkout")}
                >
                  Xác nhận giao hàng
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN */}
        {step === "checkout" && (
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <div className="cart-body">
              {/* Khối 1: Thông tin người nhận */}
              <div className="checkout-section">
                <h4 className="section-title">1. Thông tin người nhận</h4>
                <div className="form-group">
                  <label>Họ và tên người nhận *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Nhập họ và tên..."
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Nhập số điện thoại..."
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ giao hàng *</label>
                  <textarea
                    name="address"
                    required
                    rows="2"
                    placeholder="Số nhà, tên đường, phường/xã..."
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Ghi chú chung cho đơn hàng</label>
                  <input
                    type="text"
                    name="note"
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    value={shippingInfo.note}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Khối 2: Phương thức thanh toán */}
              <div className="checkout-section">
                <h4 className="section-title">2. Phương thức thanh toán</h4>
                <div className="payment-options">
                  {/* Option 1: COD */}
                  <label
                    className={`payment-card ${
                      paymentMethod === "COD" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                    />
                    <div className="payment-icon red">
                      <Banknote size={20} />
                    </div>
                    <div className="payment-text">
                      <strong>Tiền mặt khi nhận hàng (COD)</strong>
                      <span>Thanh toán cho shipper khi nhận được đồ ăn</span>
                    </div>
                  </label>

                  {/* Option 2: Chuyển khoản */}
                  <label
                    className={`payment-card ${
                      paymentMethod === "BANK_TRANSFER" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === "BANK_TRANSFER"}
                      onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    />
                    <div className="payment-icon blue">
                      <QrCode size={20} />
                    </div>
                    <div className="payment-text">
                      <strong>Chuyển khoản Ngân hàng (QR Code)</strong>
                      <span>Quét mã VietQR chuyển khoản nhanh</span>
                    </div>
                  </label>
                </div>

                {/* Khối hiển thị mã QR nếu chọn chuyển khoản */}
                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="bank-details-box">
                    <div className="qr-container">
                      <img
                        src={qrUrl}
                        alt="Mã QR Chuyển khoản"
                        className="qr-code-img"
                      />
                    </div>
                    <div className="bank-info-list">
                      <div className="bank-info-row">
                        <span className="label">Ngân hàng:</span>
                        <span className="value font-bold">
                          {BANK_INFO.bankName}
                        </span>
                      </div>
                      <div className="bank-info-row">
                        <span className="label">Số tài khoản:</span>
                        <div className="value-copy">
                          <span className="account-number">
                            {BANK_INFO.accountNo}
                          </span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={handleCopyAccount}
                          >
                            <Copy size={13} /> {copied ? "Đã chép" : "Sao chép"}
                          </button>
                        </div>
                      </div>
                      <div className="bank-info-row">
                        <span className="label">Chủ tài khoản:</span>
                        <span className="value">{BANK_INFO.accountHolder}</span>
                      </div>
                      <div className="bank-info-row">
                        <span className="label">Nội dung CK:</span>
                        <span className="value highlight">
                          LAUGA3VI {shippingInfo.phone || "SĐT CỦA BẠN"}
                        </span>
                      </div>
                    </div>
                    <div className="bank-note">
                      <Info size={14} /> Vui lòng hoàn tất chuyển khoản sau khi
                      bấm xác nhận đặt hàng.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Tổng tiền thanh toán:</span>
                <span className="cart-total-price">
                  {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <button
                type="submit"
                className="checkout-btn"
                disabled={loading}
              >
                {loading ? "Đang tạo đơn hàng..." : "XÁC NHẬN ĐẶT HÀNG"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: THÀNH CÔNG */}
        {step === "success" && (
          <div className="cart-body success-body">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={60} color="#2e7d32" />
            </div>
            <h2>ĐẶT HÀNG THÀNH CÔNG!</h2>
            <p className="success-msg">
              Cảm ơn bạn đã ủng hộ <strong>Lẩu Gà 3 Vị</strong>. Nhân viên quán sẽ
              liên hệ qua số điện thoại <strong>{shippingInfo.phone}</strong> để
              xác nhận đơn hàng trong giây lát.
            </p>

            {paymentMethod === "BANK_TRANSFER" && (
              <div className="success-payment-reminder">
                <p>
                  Quý khách vui lòng chuyển khoản tổng tiền{" "}
                  <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong> theo nội
                  dung:
                </p>
                <div className="reminder-code">
                  LAUGA3VI {shippingInfo.phone}
                </div>
              </div>
            )}

            <button className="checkout-btn" onClick={handleCloseAll}>
              ĐỒNG Ý & ĐÓNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;