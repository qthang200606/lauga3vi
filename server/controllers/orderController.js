const Order = require("../models/Order");

// ======================================================
// 1. TẠO ĐƠN HÀNG
// ======================================================

exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingInfo,
      paymentMethod,
      totalPrice,
      tableCode,
      orderType,
      totalAmount,
      customerName,
      customerPhone,
      note,
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
    // USER
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

    const finalTotal = Number(
      totalPrice ?? totalAmount ?? calculatedTotal
    );

    // ==================================================
    // FORMAT ITEMS
    // ==================================================

    const formattedItems = items.map((item) => ({
      product: item.product || item._id || item.id,

      name: item.name || "Món ăn",

      price: Number(item.price || 0),

      quantity: Number(item.quantity || 1),

      ...(item.note ? { note: item.note } : {}),

      ...(item.image ? { image: item.image } : {}),
    }));

    // ==================================================
    // SHIPPING INFO
    // ==================================================

    const finalShippingInfo = {
      ...(shippingInfo || {}),

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
  user: userId,

  // QUAN TRỌNG
  orderType:
    orderType ||
    shippingInfo?.orderType ||
    (tableCode ? "Dine-in" : "Takeaway"),

  // QUAN TRỌNG
  tableCode:
    tableCode ||
    shippingInfo?.tableCode ||
    "",

  items: formattedItems,

  shippingInfo: {
    fullName:
      shippingInfo?.fullName ||
      "",

    phone:
      shippingInfo?.phone ||
      "",

    address:
      shippingInfo?.address ||
      "",

    note:
      shippingInfo?.note ||
      "",

    customerName:
      customerName ||
      shippingInfo?.customerName ||
      "",

    customerPhone:
      customerPhone ||
      shippingInfo?.customerPhone ||
      "",
  },

  paymentMethod:
    paymentMethod || "COD",

  totalPrice: finalTotal,

  note: note || "",

  status: "pending",

  isPaid: false,
};

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

    return res.status(201).json({
      success: true,

      message: tableCode
        ? `Đặt món thành công tại bàn ${tableCode}!`
        : "Đặt hàng thành công!",

      data: newOrder,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI TẠO ĐƠN HÀNG:",
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
// 2. LẤY ĐƠN HÀNG CỦA USER
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
      .populate(
        "items.product",
        "name price image imgUrl imageUrl"
      )
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
// 4. ADMIN CẬP NHẬT CHI TIẾT ĐƠN HÀNG
// ======================================================
// Dùng cho POS:
//
// - Thêm món
// - Xóa món
// - Sửa số lượng
// - Sửa ghi chú
// - Cập nhật tổng tiền
// - Cập nhật khách hàng
// ======================================================

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      items,
      shippingInfo,
      paymentMethod,
      totalPrice,
      totalAmount,
      tableCode,
      orderType,
      customerName,
      customerPhone,
      note,
      status,
      paymentStatus,
      isPaid,
    } = req.body;

    // ==================================================
    // TÌM ĐƠN
    // ==================================================

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // ==================================================
    // CẬP NHẬT DANH SÁCH MÓN
    // ==================================================

    if (Array.isArray(items)) {
      if (items.length === 0) {
        order.items = [];
      } else {
        order.items = items.map((item) => ({
          product:
            item.product ||
            item._id ||
            item.id,

          name:
            item.name ||
            item.product?.name ||
            "Món ăn",

          price:
            Number(
              item.price ||
              item.product?.price ||
              0
            ),

          quantity:
            Number(item.quantity || 1),

          ...(item.note
            ? { note: item.note }
            : {}),

          ...(item.image
            ? { image: item.image }
            : {}),
        }));
      }
    }

    // ==================================================
    // TỰ TÍNH LẠI TỔNG TIỀN
    // ==================================================

    if (Array.isArray(items)) {
      const calculatedTotal = order.items.reduce(
        (sum, item) => {
          return (
            sum +
            Number(item.price || 0) *
              Number(item.quantity || 1)
          );
        },
        0
      );

      // Ưu tiên totalPrice frontend gửi lên,
      // nếu không có thì dùng tổng tự tính
      order.totalPrice = Number(
        totalPrice ??
        totalAmount ??
        calculatedTotal
      );
    } else if (
      totalPrice !== undefined ||
      totalAmount !== undefined
    ) {
      order.totalPrice = Number(
        totalPrice ?? totalAmount
      );
    }

    // ==================================================
    // CẬP NHẬT THÔNG TIN BÀN
    // ==================================================

    if (tableCode !== undefined) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        tableCode,
      };
    }

    // ==================================================
    // CẬP NHẬT ORDER TYPE
    // ==================================================

    if (orderType !== undefined) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        orderType,
      };
    }

    // ==================================================
    // CẬP NHẬT KHÁCH HÀNG
    // ==================================================

    if (customerName !== undefined) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerName,
      };
    }

    if (customerPhone !== undefined) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerPhone,
      };
    }

    // ==================================================
    // CẬP NHẬT SHIPPING INFO
    // ==================================================

    if (shippingInfo !== undefined) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        ...shippingInfo,
      };
    }

    // ==================================================
    // PAYMENT METHOD
    // ==================================================

    if (paymentMethod !== undefined) {
      order.paymentMethod = paymentMethod;
    }

    // ==================================================
    // NOTE
    // ==================================================

    if (note !== undefined) {
      order.note = note;
    }

    // ==================================================
    // STATUS
    // ==================================================

    if (status !== undefined) {
      order.status = status;
    }

    // ==================================================
    // PAYMENT STATUS
    // ==================================================

    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;
    }

    // ==================================================
    // IS PAID
    // ==================================================

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    // ==================================================
    // LƯU DATABASE
    // ==================================================

    await order.save();

    console.log("====================================");
    console.log("✅ ĐÃ CẬP NHẬT ĐƠN POS");
    console.log("🧾 Order ID:", id);
    console.log(
      "🍽️ Số món:",
      order.items?.length || 0
    );
    console.log(
      "💰 Tổng mới:",
      order.totalPrice
    );
    console.log("====================================");

    return res.status(200).json({
      success: true,
      message: "Cập nhật đơn hàng thành công!",
      data: order,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI UPDATE ORDER:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};


// ======================================================
// 5. ADMIN CẬP NHẬT TRẠNG THÁI ĐƠN
// ======================================================

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      isPaid,
      paymentStatus,
    } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      });
    }

    // ==================================================
    // STATUS
    // ==================================================

    if (status !== undefined) {
      order.status = status;
    }

    // ==================================================
    // IS PAID
    // ==================================================

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    // ==================================================
    // PAYMENT STATUS
    // ==================================================

    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;
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