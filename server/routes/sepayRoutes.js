const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // Kiểm tra đúng đường dẫn tới Model Order của bạn

// 1. Webhook tiếp nhận dữ liệu chuyển khoản tự động từ SePay
router.post("/webhook", async (req, res) => {
  try {
    const { content, transferAmount } = req.body;
    console.log("📩 SePay Webhook nhận giao dịch:", { content, transferAmount });

    if (!content) {
      return res.status(200).json({ success: true, message: "Nội dung chuyển khoản trống" });
    }

    // Chuyển nội dung về chữ hoa để so sánh
    const upperContent = content.toUpperCase();

    // Tìm đơn hàng chưa thanh toán có mã trùng hoặc nằm trong nội dung chuyển khoản
    const order = await Order.findOne({
      $or: [
        { code: { $regex: upperContent, $options: "i" } },
        { paymentMemo: { $regex: upperContent, $options: "i" } },
      ],
      paymentStatus: { $ne: "PAID" },
    });

    if (order) {
      // Cập nhật trạng thái thanh toán thành công
      order.paymentStatus = "PAID";
      order.status = "COMPLETED"; // Hoặc trạng thái mong muốn của bạn
      order.paidAmount = Number(transferAmount) || order.totalPrice;
      await order.save();

      console.log(`✅ [SePay] Xác nhận thanh toán thành công cho đơn: ${order._id}`);
    } else {
      console.log(`⚠️ [SePay] Không tìm thấy đơn hàng tương ứng với nội dung: "${content}"`);
    }

    // Bắt buộc trả về HTTP 200 OK cho SePay
    return res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("❌ Lỗi xử lý SePay Webhook:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. API cho Frontend gọi kiểm tra (Polling) trạng thái đơn hàng
router.get("/check-status", async (req, res) => {
  try {
    const { memo } = req.query;

    if (!memo) {
      return res.status(400).json({ isPaid: false, message: "Thiếu tham số memo" });
    }

    const order = await Order.findOne({
      $or: [
        { code: memo },
        { paymentMemo: memo },
      ],
    });

    if (order && (order.paymentStatus === "PAID" || order.status === "COMPLETED")) {
      return res.status(200).json({ isPaid: true, order });
    }

    return res.status(200).json({ isPaid: false });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
    return res.status(500).json({ isPaid: false, error: error.message });
  }
});

module.exports = router;