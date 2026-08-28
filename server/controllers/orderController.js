const Order = require("../models/Order");

// ======================================================
// 1. TẠO ĐƠN HÀNG
// ======================================================
// Hỗ trợ:
// - Khách quét QR tại bàn: KHÔNG cần đăng nhập
// - Khách đăng nhập đặt món: CÓ user
// ======================================================

exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingInfo,
      paymentMethod,
      totalPrice,

      // Dữ liệu từ ProductOrder khi quét QR
      tableCode,
      orderType,
      totalAmount,

      customerName,
      customerPhone,
    } = req.body;

    // ==================================================
    // KIỂM TRA GIỎ HÀNG
    // ==================================================

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng đang trống!",
      });
    }

    // ==================================================
    // XÁC ĐỊNH USER
    // ==================================================
    // Nếu khách đăng nhập -> có req.user
    // Nếu khách quét QR -> req.user không tồn tại
    //
    // KHÔNG được bắt buộc user nữa.
    // ==================================================

    const userId = req.user?._id || req.user?.id || null;

    // ==================================================
    // TÍNH TỔNG TIỀN
    // ==================================================

    const calculatedTotal = items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);

      return sum + price * quantity;
    }, 0);

    // Ưu tiên totalPrice nếu hệ thống cũ gửi lên
    // Nếu QR gửi totalAmount thì dùng totalAmount
    const finalTotal = Number(
      totalPrice ?? totalAmount ?? calculatedTotal
    );

    // ==================================================
    // FORMAT SẢN PHẨM
    // ==================================================

    const formattedItems = items.map((item) => ({
      product: item.product || item._id || item.id,

      name: item.name,

      price: Number(item.price || 0),

      quantity: Number(item.quantity || 1),

      // Nếu model Order không có image thì có thể xóa dòng này
      ...(item.image ? { image: item.image } : {}),
    }));

    // ==================================================
    // SHIPPING INFO
    // ==================================================
    // Với QR:
    //
    // tableCode = B01
    // orderType = Dine-in
    //
    // Ta lưu vào shippingInfo để tận dụng
    // cấu trúc Order hiện tại.
    // ==================================================

    const finalShippingInfo = {
      ...(shippingInfo || {}),

      // Nếu QR tại bàn
      tableCode:
        tableCode ||
        shippingInfo?.tableCode ||
        "",

      orderType:
        orderType ||
        shippingInfo?.orderType ||
        (tableCode ? "Dine-in" : "Takeaway"),

      customerName:
        customerName ||
        shippingInfo?.customerName ||
        "",

      customerPhone:
        customerPhone ||
        shippingInfo?.customerPhone ||
        "",
    };

    // ==================================================
    // TẠO ORDER
    // ==================================================

    const orderData = {
      // QR không có user -> null
      user: userId,

      items: formattedItems,

      shippingInfo: finalShippingInfo,

      paymentMethod:
        paymentMethod || "COD",

      totalPrice: finalTotal,

      status: "pending",

      isPaid: false,
    };

    // ==================================================
    // LƯU DATABASE
    // ==================================================

    const newOrder = new Order(orderData);

    await newOrder.save();

    console.log("====================================");
    console.log("✅ ĐÃ TẠO ĐƠN HÀNG");
    console.log("👤 User:", userId || "Khách QR");
    console.log(
      "🍽️ Loại:",
      finalShippingInfo.orderType
    );
    console.log(
      "🪑 Bàn:",
      finalShippingInfo.tableCode || "Mang về"
    );
    console.log("💰 Tổng:", finalTotal);
    console.log("====================================");

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message: tableCode
        ? `Đặt món thành công tại bàn ${tableCode}!`
        : "Đặt hàng thành công!",

      data: newOrder,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI TẠO ĐƠN HÀNG (createOrder):",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lưu đơn hàng",

      error: error.message,
    });
  }
};


// ======================================================
// 2. LẤY ĐƠN HÀNG CỦA USER ĐANG ĐĂNG NHẬP
// ======================================================

exports.getMyOrders = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng!",
      });
    }

    const orders = await Order.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI LẤY ĐƠN HÀNG CÁ NHÂN:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách đơn hàng",

      error: error.message,
    });
  }
};


// ======================================================
// 3. ADMIN LẤY TẤT CẢ ĐƠN HÀNG
// ======================================================

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI LẤY DANH SÁCH ĐƠN HÀNG:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách đơn hàng",

      error: error.message,
    });
  }
};


// ======================================================
// 4. ADMIN CẬP NHẬT TRẠNG THÁI ĐƠN
// ======================================================

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      isPaid,
    } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // ================================================
    // CẬP NHẬT TRẠNG THÁI
    // ================================================

    if (status !== undefined) {
      order.status = status;
    }

    // ================================================
    // CẬP NHẬT THANH TOÁN
    // ================================================

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    await order.save();

    return res.status(200).json({
      success: true,

      message: "Cập nhật đơn hàng thành công!",

      data: order,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI CẬP NHẬT ĐƠN HÀNG:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi cập nhật đơn hàng",

      error: error.message,
    });
  }
};