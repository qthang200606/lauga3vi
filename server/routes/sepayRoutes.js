
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ======================================================
// CHUẨN HÓA PAYMENT CODE
// Ví dụ:
// LG3V-B02-8003DD
// LG3VB02-8003DD
// LG3VB028003DD
// LG3V B02 8003DD
// LG3V-TAKEAWAY-3A7161
// ======================================================

function normalizePaymentCode(code) {
  if (!code) return null;

  const raw = String(code).trim().toUpperCase();

  // Mã đã đúng định dạng
  const directMatch = raw.match(/LG3V-[A-Z0-9]+-[A-Z0-9]+/);
  if (directMatch) return directMatch[0];

  // Bỏ khoảng trắng và ký tự đặc biệt
  const normalized = raw.replace(/[^A-Z0-9]/g, "");

  // Mã mang về
  const takeawayMatch = normalized.match(
    /LG3VTAKEAWAY([A-Z0-9]{5,8})/
  );

  if (takeawayMatch) {
    return `LG3V-TAKEAWAY-${takeawayMatch[1]}`;
  }

  // Mã bàn B01, B02...
  const tableMatch = normalized.match(
    /LG3VB(\d{2})([A-Z0-9]{5,8})/
  );

  if (tableMatch) {
    return `LG3V-B${tableMatch[1]}-${tableMatch[2]}`;
  }

  // Fallback cho mã bàn tùy chỉnh
  const fallbackMatch = normalized.match(
    /LG3V([A-Z0-9]+?)([A-Z0-9]{6})$/
  );

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
    console.log(JSON.stringify(payload, null, 2));
    console.log("====================================");

    const {
      id,
      content,
      transferAmount,
      transferType,
      referenceCode,
      gateway,
    } = payload;

    // 1. Chỉ xử lý giao dịch tiền vào
    if (
      transferType &&
      String(transferType).toLowerCase() !== "in"
    ) {
      return res.status(200).json({
        success: true,
        message: "Không phải giao dịch tiền vào",
      });
    }

    // 2. Lấy nội dung chuyển khoản
    const transferContent = String(content || "").trim();

    if (!transferContent) {
      return res.status(200).json({
        success: true,
        message: "Nội dung chuyển khoản trống",
      });
    }

    console.log("📝 NỘI DUNG:", transferContent);

    // 3. Tìm mã thanh toán
    const paymentCode = normalizePaymentCode(transferContent);

    if (!paymentCode) {
      console.log("⚠️ Không tìm thấy payment code:", transferContent);

      return res.status(200).json({
        success: true,
        message: "Không tìm thấy mã thanh toán",
      });
    }

    console.log("🔎 PAYMENT CODE:", paymentCode);

    // 4. Kiểm tra số tiền nhận
    const amount = Number(transferAmount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(200).json({
        success: true,
        message: "Số tiền giao dịch không hợp lệ",
      });
    }

    console.log("💰 SỐ TIỀN NHẬN:", amount);

    // 5. Tìm đơn đại diện theo paymentCode
    const order = await Order.findOne({
      paymentCode,
    });

    if (!order) {
      console.log("❌ Không tìm thấy đơn:", paymentCode);

      return res.status(200).json({
        success: true,
        message: "Không tìm thấy đơn hàng",
        paymentCode,
      });
    }

    console.log("🧾 ORDER ID:", order._id);
    console.log("🪑 TABLE:", order.tableCode || "Không có");
    console.log("💳 PAYMENT CODE:", order.paymentCode);
    console.log("🧩 CHECKOUT ID:", order.checkoutId || "Đơn cũ");

    // 6. Lấy đúng nhóm đơn thuộc hóa đơn checkout
    // Đơn cũ không có checkoutId chỉ xử lý chính nó.
    const checkoutOrders = order.checkoutId
      ? await Order.find({
          checkoutId: order.checkoutId,
        })
      : [order];

    if (!checkoutOrders.length) {
      return res.status(200).json({
        success: true,
        message: "Không tìm thấy các đơn thuộc hóa đơn",
        paymentCode,
      });
    }

    // 7. Nếu toàn bộ nhóm đã thanh toán thì không xử lý lại
    const allAlreadyPaid = checkoutOrders.every(
      (item) =>
        item.isPaid === true ||
        String(item.paymentStatus || "").toUpperCase() === "PAID"
    );

    if (allAlreadyPaid) {
      console.log("ℹ️ Hóa đơn đã thanh toán trước đó");

      return res.status(200).json({
        success: true,
        message: "Hóa đơn đã được thanh toán",
        checkoutId: order.checkoutId || null,
        orderId: order._id,
        paymentCode,
      });
    }

    // 8. Tính tổng tiền hóa đơn
    // checkoutTotal là tổng tiền đã chốt ở POS, nếu có.
    // Với dữ liệu cũ, cộng totalPrice của các đơn tìm được.
    const savedCheckoutTotal = Number(order.checkoutTotal || 0);

    const groupTotal = checkoutOrders.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    const expectedAmount =
      Number.isFinite(savedCheckoutTotal) && savedCheckoutTotal > 0
        ? savedCheckoutTotal
        : groupTotal;

    console.log("💰 TỔNG HÓA ĐƠN:", expectedAmount);
    console.log("💵 TIỀN CHUYỂN:", amount);

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(200).json({
        success: true,
        message: "Tổng tiền hóa đơn không hợp lệ",
        expectedAmount,
      });
    }

    if (amount < expectedAmount) {
      console.log(
        `⚠️ Thanh toán thiếu: cần ${expectedAmount}, nhận ${amount}`
      );

      return res.status(200).json({
        success: true,
        message: "Số tiền thanh toán chưa đủ",
        expectedAmount,
        receivedAmount: amount,
        paymentCode,
      });
    }

    // 9. Cập nhật thanh toán cho đúng các bản ghi trong checkout
    // paidAmount của từng bản ghi là tiền của chính bản ghi đó,
    // không ghi tổng hóa đơn vào tất cả bản ghi.
    const paidAt = new Date();

    const transactionId = String(
      id || referenceCode || ""
    );

    const gatewayName = gateway || "SePay";

    const updateOperations = checkoutOrders
      .filter(
        (item) =>
          item.isPaid !== true &&
          String(item.paymentStatus || "").toUpperCase() !== "PAID"
      )
      .map((item) => ({
        updateOne: {
          filter: {
            _id: item._id,
            isPaid: { $ne: true },
            paymentStatus: { $ne: "PAID" },
          },
          update: {
            $set: {
              isPaid: true,
              paymentStatus: "PAID",
              paidAmount: Number(item.totalPrice || 0),
              paymentTransactionId: transactionId,
              paymentGateway: gatewayName,
              paidAt,
              status: "COMPLETED",
            },
          },
        },
      }));

    if (!updateOperations.length) {
      return res.status(200).json({
        success: true,
        message: "Hóa đơn đã được xử lý",
        checkoutId: order.checkoutId || null,
        paymentCode,
      });
    }

    const updateResult = await Order.bulkWrite(updateOperations);

    console.log("\n====================================");
    console.log("✅ THANH TOÁN SEPAY THÀNH CÔNG");
    console.log("🧾 ORDER:", order._id);
    console.log("🧩 CHECKOUT ID:", order.checkoutId || "Đơn cũ");
    console.log("💳 PAYMENT CODE:", paymentCode);
    console.log("💰 AMOUNT:", amount);
    console.log("💳 TRANSACTION:", transactionId);
    console.log("📌 UPDATED:", updateResult.modifiedCount);
    console.log("⏰ PAID AT:", paidAt);
    console.log("====================================\n");

    return res.status(200).json({
      success: true,
      message:
        updateResult.modifiedCount > 0
          ? "Đã xác nhận thanh toán hóa đơn"
          : "Hóa đơn đã được xử lý",
      orderId: order._id,
      checkoutId: order.checkoutId || null,
      paymentCode,
      amount,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("\n❌ LỖI SEPAY WEBHOOK:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi xử lý thanh toán",
    });
  }
});

// ======================================================
// KIỂM TRA TRẠNG THÁI THANH TOÁN
// GET /api/sepay/check-status?memo=LG3V-B02-8003DD
// GET /api/sepay/check-status?paymentCode=LG3V-B02-8003DD
// ======================================================

router.get("/check-status", async (req, res) => {
  try {
    const { memo, paymentCode } = req.query;

    const rawCode = paymentCode || memo || "";

    if (!String(rawCode).trim()) {
      return res.status(400).json({
        isPaid: false,
        message: "Thiếu mã thanh toán",
      });
    }

    // 1. Chuẩn hóa mã
    const code = normalizePaymentCode(rawCode);

    if (!code) {
      return res.status(200).json({
        isPaid: false,
        message: "Mã thanh toán không hợp lệ",
      });
    }

    console.log("🔎 CHECK PAYMENT:", code);

    // 2. Tìm đơn theo mã thanh toán
    const order = await Order.findOne({
      paymentCode: code,
    });

    if (!order) {
      return res.status(200).json({
        isPaid: false,
        message: "Không tìm thấy đơn hàng",
        paymentCode: code,
      });
    }

    // 3. Lấy nhóm đơn trong cùng checkout
    const checkoutOrders = order.checkoutId
      ? await Order.find({
          checkoutId: order.checkoutId,
        })
      : [order];

    // Hóa đơn chỉ được xem là đã thanh toán khi tất cả bản ghi
    // trong checkout đều được đánh dấu đã thanh toán.
    const isPaid =
      checkoutOrders.length > 0 &&
      checkoutOrders.every(
        (item) =>
          item.isPaid === true ||
          String(item.paymentStatus || "").toUpperCase() === "PAID"
      );

    console.log("🧩 CHECKOUT ID:", order.checkoutId || "Đơn cũ");
    console.log("💳 PAYMENT STATUS:", order.paymentStatus);
    console.log("✔️ IS PAID:", isPaid);

    return res.status(200).json({
      isPaid,
      paymentStatus: isPaid ? "PAID" : order.paymentStatus,
      checkoutId: order.checkoutId || null,
      paymentCode: code,
      order,
      orderCount: checkoutOrders.length,
      totalAmount: checkoutOrders.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      ),
    });
  } catch (error) {
    console.error("❌ LỖI CHECK PAYMENT:", error);

    return res.status(500).json({
      isPaid: false,
      message: error.message || "Lỗi kiểm tra thanh toán",
    });
  }
});

module.exports = router;