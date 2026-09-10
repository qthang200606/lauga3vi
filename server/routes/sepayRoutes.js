const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ======================================================
// HÀM CHUẨN HÓA PAYMENT CODE
// LG3V-B02-8003DD
// LG3VB028003DD
// LG3V B02 8003DD
// => LG3V-B02-8003DD
// ======================================================

// ======================================================
// HÀM CHUẨN HÓA PAYMENT CODE (SỬA LỖI TAKEAWAY)
// LG3V-B02-8003DD       => LG3V-B02-8003DD
// LG3V-TAKEAWAY-3A7161 => LG3V-TAKEAWAY-3A7161
// LG3VTAKEAWAY3A7161   => LG3V-TAKEAWAY-3A7161
// ======================================================

function normalizePaymentCode(code) {
  if (!code) return null;

  // Nếu chuỗi đã có sẵn định dạng chuẩn dạng LG3V-xxx-xxx thì giữ nguyên
  const raw = String(code).trim().toUpperCase();
  const directMatch = raw.match(/LG3V-[A-Z0-9]+-[A-Z0-9]+/);
  if (directMatch) return directMatch[0];

  // Loại bỏ tất cả ký tự đặc biệt chỉ giữ lại chữ và số
  const normalized = raw.replace(/[^A-Z0-9]/g, "");

  // Match 1: Trường hợp Mang về (TAKEAWAY + 6 ký tự hex ở cuối)
  const takeawayMatch = normalized.match(/LG3VTAKEAWAY([A-Z0-9]{5,8})/);
  if (takeawayMatch) {
    return `LG3V-TAKEAWAY-${takeawayMatch[1]}`;
  }

  // Match 2: Trường hợp Tại bàn (B01, B02 + 6 ký tự hex ở cuối)
  const tableMatch = normalized.match(/LG3VB(\d{2})([A-Z0-9]{5,8})/);
  if (tableMatch) {
    return `LG3V-B${tableMatch[1]}-${tableMatch[2]}`;
  }

  // Match 3: Fallback linh hoạt cho các mã bàn custom khác
  const fallbackMatch = normalized.match(/LG3V([A-Z0-9]+?)([A-Z0-9]{6})$/);
  if (fallbackMatch) {
    return `LG3V-${fallbackMatch[1]}-${fallbackMatch[2]}`;
  }

  return null;
}

// ======================================================
// SEPAY WEBHOOK
// POST /api/sepay/webhook
// ======================================================

router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body || {};

    console.log("\n====================================");
    console.log("📩 SEPAY WEBHOOK");
    console.log("====================================");
    console.log(
      JSON.stringify(payload, null, 2)
    );
    console.log("====================================");

    const {
      id,
      content,
      transferAmount,
      transferType,
      referenceCode,
      gateway
    } = payload;

    // ==================================================
    // 1. CHỈ XỬ LÝ TIỀN VÀO
    // ==================================================

    if (
      transferType &&
      String(transferType).toLowerCase() !== "in"
    ) {
      console.log(
        "⚠️ Không phải giao dịch tiền vào"
      );

      return res.status(200).json({
        success: true,
        message: "Không phải giao dịch tiền vào"
      });
    }

    // ==================================================
    // 2. LẤY NỘI DUNG CHUYỂN KHOẢN
    // ==================================================

    const transferContent =
      String(content || "").trim();

    if (!transferContent) {
      console.log(
        "⚠️ Nội dung chuyển khoản trống"
      );

      return res.status(200).json({
        success: true,
        message: "Nội dung chuyển khoản trống"
      });
    }

    console.log(
      "📝 NỘI DUNG:",
      transferContent
    );

    // ==================================================
    // 3. TÌM PAYMENT CODE
    //
    // Hỗ trợ:
    //
    // LG3V-B02-8003DD
    // LG3VB02-8003DD
    // LG3VB028003DD
    // LG3V B02 8003DD
    //
    // SePay thực tế có thể gửi:
    //
    // ZP7D9FCI4O7J SEVQR LG3VB028003DD
    // ==================================================

    const paymentCode =
      normalizePaymentCode(
        transferContent
      );

    if (!paymentCode) {
      console.log(
        "⚠️ KHÔNG TÌM THẤY PAYMENT CODE"
      );

      console.log(
        "Nội dung:",
        transferContent
      );

      return res.status(200).json({
        success: true,
        message:
          "Không tìm thấy mã thanh toán"
      });
    }

    console.log(
      "🔎 PAYMENT CODE:",
      paymentCode
    );

    // ==================================================
    // 4. LẤY SỐ TIỀN
    // ==================================================

    const amount =
      Number(transferAmount || 0);

    console.log(
      "💰 SỐ TIỀN:",
      amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      console.log(
        "⚠️ Số tiền giao dịch không hợp lệ:",
        transferAmount
      );

      return res.status(200).json({
        success: true,
        message:
          "Số tiền giao dịch không hợp lệ"
      });
    }

    // ==================================================
    // 5. TÌM ORDER
    // ==================================================

    console.log(
      "🔍 ĐANG TÌM ORDER:",
      paymentCode
    );

    const order =
      await Order.findOne({
        paymentCode: paymentCode
      });

    // ==================================================
    // 6. KHÔNG TÌM THẤY ORDER
    // ==================================================

    if (!order) {
      console.log(
        "❌ KHÔNG TÌM THẤY ORDER"
      );

      console.log(
        "Payment Code:",
        paymentCode
      );

      return res.status(200).json({
        success: true,
        message:
          "Không tìm thấy đơn hàng",
        paymentCode: paymentCode
      });
    }

    // ==================================================
    // 7. LOG THÔNG TIN ORDER
    // ==================================================

    console.log("\n====================================");
    console.log("🧾 ORDER ID:", order._id);
    console.log(
      "🪑 TABLE:",
      order.tableCode || "Không có"
    );
    console.log(
      "💳 PAYMENT CODE:",
      order.paymentCode
    );
    console.log(
      "💰 ORDER TOTAL:",
      order.totalPrice
    );
    console.log(
      "💵 TRANSFER:",
      amount
    );
    console.log(
      "💳 PAYMENT STATUS:",
      order.paymentStatus
    );
    console.log(
      "✔️ IS PAID:",
      order.isPaid
    );
    console.log("====================================");

    // ==================================================
    // 8. ĐƠN ĐÃ THANH TOÁN
    // ==================================================

    if (
      order.isPaid === true ||
      String(
        order.paymentStatus || ""
      ).toUpperCase() === "PAID"
    ) {
      console.log(
        "ℹ️ Đơn hàng đã thanh toán trước đó"
      );

      return res.status(200).json({
        success: true,
        message:
          "Đơn hàng đã được thanh toán",
        orderId: order._id
      });
    }

    // ==================================================
    // 9. KIỂM TRA TỔNG TIỀN
    // ==================================================

    const orderTotal =
      Number(order.totalPrice || 0);

    console.log(
      "💰 CẦN THANH TOÁN:",
      orderTotal
    );

    console.log(
      "💵 ĐÃ NHẬN:",
      amount
    );

    if (
      amount < orderTotal
    ) {
      console.log(
        `⚠️ THANH TOÁN THIẾU: Cần ${orderTotal}, nhận ${amount}`
      );

      return res.status(200).json({
        success: true,
        message:
          "Số tiền thanh toán chưa đủ",
        required: orderTotal,
        received: amount
      });
    }

    // ==================================================
    // 10. CẬP NHẬT THANH TOÁN
    // ==================================================

    order.isPaid = true;

    order.paymentStatus = "PAID";

    order.status = "COMPLETED";

    order.paidAmount = amount;

    order.paymentTransactionId =
      String(
        id ||
        referenceCode ||
        ""
      );

    order.paymentGateway =
      gateway || "SePay";

    order.paidAt =
      new Date();

    await order.save();

    // ==================================================
    // 11. XÁC NHẬN SAU KHI SAVE
    // ==================================================

    console.log("\n====================================");
    console.log(
      "✅ THANH TOÁN SEPAY THÀNH CÔNG"
    );
    console.log("====================================");
    console.log(
      "🧾 ORDER:",
      order._id
    );
    console.log(
      "💳 PAYMENT CODE:",
      order.paymentCode
    );
    console.log(
      "💰 AMOUNT:",
      amount
    );
    console.log(
      "💳 TRANSACTION:",
      order.paymentTransactionId
    );
    console.log(
      "📌 STATUS:",
      order.paymentStatus
    );
    console.log(
      "✔️ IS PAID:",
      order.isPaid
    );
    console.log(
      "⏰ PAID AT:",
      order.paidAt
    );
    console.log("====================================\n");

    // ==================================================
    // 12. TRẢ KẾT QUẢ CHO SEPAY
    // ==================================================

    return res.status(200).json({
      success: true,
      message:
        "Thanh toán thành công",
      orderId:
        order._id,
      paymentCode:
        order.paymentCode,
      amount:
        amount
    });

  } catch (error) {
    console.error(
      "\n❌ LỖI SEPAY WEBHOOK:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
});

// ======================================================
// CHECK PAYMENT STATUS
//
// GET:
// /api/sepay/check-status?memo=LG3V-B02-8003DD
//
// hoặc:
//
// /api/sepay/check-status?paymentCode=LG3V-B02-8003DD
// ======================================================

router.get(
  "/check-status",
  async (req, res) => {
    try {
      const {
        memo,
        paymentCode
      } = req.query;

      const rawCode =
        paymentCode ||
        memo ||
        "";

      if (!String(rawCode).trim()) {
        return res.status(400).json({
          isPaid: false,
          message:
            "Thiếu mã thanh toán"
        });
      }

      // ==================================================
      // CHUẨN HÓA PAYMENT CODE
      // ==================================================

      const code =
        normalizePaymentCode(
          rawCode
        );

      if (!code) {
        console.log(
          "⚠️ PAYMENT CODE KHÔNG HỢP LỆ:",
          rawCode
        );

        return res.status(200).json({
          isPaid: false,
          message:
            "Mã thanh toán không hợp lệ"
        });
      }

      console.log(
        "🔎 CHECK PAYMENT:",
        code
      );

      // ==================================================
      // TÌM ORDER
      // ==================================================

      const order =
        await Order.findOne({
          paymentCode: code
        });

      if (!order) {
        console.log(
          "⚠️ CHECK STATUS - KHÔNG TÌM THẤY ORDER:",
          code
        );

        return res.status(200).json({
          isPaid: false,
          message:
            "Không tìm thấy đơn hàng",
          paymentCode:
            code
        });
      }

      // ==================================================
      // KIỂM TRA THANH TOÁN
      // ==================================================

      const isPaid =
        order.isPaid === true ||
        String(
          order.paymentStatus || ""
        ).toUpperCase() === "PAID";

      console.log(
        "💳 PAYMENT STATUS:",
        order.paymentStatus
      );

      console.log(
        "✔️ IS PAID:",
        isPaid
      );

      return res.status(200).json({
        isPaid: isPaid,
        paymentStatus:
          order.paymentStatus,
        order: order
      });

    } catch (error) {
      console.error(
        "❌ LỖI CHECK PAYMENT:",
        error
      );

      return res.status(500).json({
        isPaid: false,
        message:
          error.message
      });
    }
  }
);

module.exports = router;