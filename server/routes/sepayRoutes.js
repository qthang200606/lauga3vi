const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ======================================================
// SEPAY WEBHOOK
// POST /api/sepay/webhook
// ======================================================

router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body || {};

    console.log("====================================");
    console.log("📩 SEPAY WEBHOOK");
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
      gateway,
    } = payload;

    // --------------------------------------------------
    // CHỈ XỬ LÝ TIỀN CHUYỂN VÀO
    // --------------------------------------------------

    if (
      transferType &&
      String(transferType).toLowerCase() !== "in"
    ) {
      console.log(
        "⚠️ Không phải giao dịch tiền vào"
      );

      return res.status(200).json({
        success: true,
        message:
          "Không phải giao dịch tiền vào",
      });
    }

    // --------------------------------------------------
    // LẤY NỘI DUNG CHUYỂN KHOẢN
    // --------------------------------------------------

    const transferContent =
      String(content || "").trim();

    if (!transferContent) {
      console.log(
        "⚠️ Nội dung chuyển khoản trống"
      );

      return res.status(200).json({
        success: true,
        message:
          "Nội dung chuyển khoản trống",
      });
    }

    // --------------------------------------------------
    // CHUYỂN SANG CHỮ HOA
    // --------------------------------------------------

    const upperContent =
      transferContent.toUpperCase();

    // --------------------------------------------------
    // TÌM PAYMENT CODE
    //
    // Ví dụ:
    // LG3V-B02-A8F31C
    //
    // Nếu SePay gửi:
    // "Thanh toan LG3V-B02-A8F31C"
    //
    // vẫn lấy được:
    // LG3V-B02-A8F31C
    // --------------------------------------------------

    const paymentCodeMatch =
      upperContent.match(
        /LG3V-[A-Z0-9-]+/
      );

    if (!paymentCodeMatch) {
      console.log(
        "⚠️ Không tìm thấy paymentCode trong:",
        transferContent
      );

      return res.status(200).json({
        success: true,
        message:
          "Không tìm thấy mã thanh toán",
      });
    }

    const paymentCode =
      paymentCodeMatch[0];

    console.log(
      "🔎 PAYMENT CODE:",
      paymentCode
    );

    // --------------------------------------------------
    // SỐ TIỀN CHUYỂN
    // --------------------------------------------------

    const amount =
      Number(transferAmount || 0);

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
          "Số tiền giao dịch không hợp lệ",
      });
    }

    // --------------------------------------------------
    // TÌM ĐƠN HÀNG BẰNG PAYMENT CODE
    // --------------------------------------------------

    const order =
      await Order.findOne({
        paymentCode:
          paymentCode,
      });

    // --------------------------------------------------
    // KHÔNG TÌM THẤY ORDER
    // --------------------------------------------------

    if (!order) {
      console.log(
        "⚠️ Không tìm thấy đơn hàng:",
        paymentCode
      );

      return res.status(200).json({
        success: true,
        message:
          "Không tìm thấy đơn hàng",
      });
    }

    console.log(
      "🧾 ORDER ID:",
      order._id
    );

    console.log(
      "🪑 TABLE:",
      order.tableCode
    );

    console.log(
      "💰 ORDER TOTAL:",
      order.totalPrice
    );

    console.log(
      "💵 TRANSFER:",
      amount
    );

    // --------------------------------------------------
    // ĐƠN ĐÃ THANH TOÁN
    //
    // Tránh SePay gửi webhook lại nhiều lần
    // --------------------------------------------------

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
      });
    }

    // --------------------------------------------------
    // KIỂM TRA SỐ TIỀN
    // --------------------------------------------------

    const orderTotal =
      Number(
        order.totalPrice || 0
      );

    if (amount < orderTotal) {
      console.log(
        `⚠️ Thanh toán thiếu: cần ${orderTotal}, nhận ${amount}`
      );

      return res.status(200).json({
        success: true,
        message:
          "Số tiền thanh toán chưa đủ",
        required:
          orderTotal,
        received:
          amount,
      });
    }

    // --------------------------------------------------
    // CẬP NHẬT THANH TOÁN
    // --------------------------------------------------

    order.isPaid = true;

    order.paymentStatus =
      "PAID";

    order.status =
      "COMPLETED";

    order.paidAmount =
      amount;

    order.paymentTransactionId =
      String(
        id ||
          referenceCode ||
          ""
      );

    order.paymentGateway =
      gateway ||
      "SePay";

    order.paidAt =
      new Date();

    await order.save();

    // --------------------------------------------------
    // LOG THÀNH CÔNG
    // --------------------------------------------------

    console.log(
      "===================================="
    );

    console.log(
      "✅ THANH TOÁN SEPAY THÀNH CÔNG"
    );

    console.log(
      "ORDER:",
      order._id
    );

    console.log(
      "PAYMENT CODE:",
      order.paymentCode
    );

    console.log(
      "AMOUNT:",
      amount
    );

    console.log(
      "TRANSACTION:",
      order.paymentTransactionId
    );

    console.log(
      "===================================="
    );

    // --------------------------------------------------
    // TRẢ 200 CHO SEPAY
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Thanh toán thành công",
      orderId:
        order._id,
      paymentCode:
        order.paymentCode,
    });

  } catch (error) {
    console.error(
      "❌ LỖI SEPAY WEBHOOK:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
});

// ======================================================
// KIỂM TRA TRẠNG THÁI THANH TOÁN
//
// GET:
// /api/sepay/check-status?memo=LG3V-B02-A8F31C
// ======================================================

router.get(
  "/check-status",
  async (req, res) => {
    try {
      const {
        memo,
        paymentCode,
      } = req.query;

      const code =
        String(
          paymentCode ||
            memo ||
            ""
        )
          .trim()
          .toUpperCase();

      if (!code) {
        return res.status(400).json({
          isPaid: false,
          message:
            "Thiếu mã thanh toán",
        });
      }

      // --------------------------------------------------
      // TÌM ORDER
      // --------------------------------------------------

      const order =
        await Order.findOne({
          paymentCode: code,
        });

      if (!order) {
        return res.status(200).json({
          isPaid: false,
          message:
            "Không tìm thấy đơn hàng",
        });
      }

      // --------------------------------------------------
      // KIỂM TRA ĐÃ THANH TOÁN
      // --------------------------------------------------

      const isPaid =
        order.isPaid === true ||
        String(
          order.paymentStatus || ""
        ).toUpperCase() === "PAID";

      return res.status(200).json({
        isPaid,

        order,
      });

    } catch (error) {
      console.error(
        "❌ LỖI CHECK PAYMENT:",
        error
      );

      return res.status(500).json({
        isPaid: false,

        message:
          error.message,
      });
    }
  }
);

module.exports = router;