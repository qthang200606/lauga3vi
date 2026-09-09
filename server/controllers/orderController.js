const Order = require("../models/Order");

// ======================================================
// HÀM CHUẨN HÓA MÃ BÀN
// B02 -> B02
// B2  -> B02
// 02  -> B02
// 2   -> B02
// ======================================================

const normalizeTableCode = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const code = String(value).trim().toUpperCase();

  if (!code) {
    return "";
  }

  // B02
  const matchB = code.match(/^B\s*0*(\d+)$/);

  if (matchB) {
    return `B${String(Number(matchB[1])).padStart(2, "0")}`;
  }

  // 02 / 2
  if (/^\d+$/.test(code)) {
    return `B${String(Number(code)).padStart(2, "0")}`;
  }

  return code;
};

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

    const userId =
      req.user?._id ||
      req.user?.id ||
      null;

    // ==================================================
    // CHUẨN HÓA MÃ BÀN
    // ==================================================

    const finalTableCode = normalizeTableCode(
      tableCode ||
      shippingInfo?.tableCode ||
      ""
    );

    // ==================================================
    // LOẠI ĐƠN
    // ==================================================

    const finalOrderType =
      orderType ||
      shippingInfo?.orderType ||
      (finalTableCode ? "Dine-in" : "Takeaway");

    // ==================================================
    // TÍNH TỔNG TIỀN
    // ==================================================

    const calculatedTotal = items.reduce(
      (sum, item) => {
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 1);

        return sum + price * quantity;
      },
      0
    );

    const finalTotal = Number(
      totalPrice ??
      totalAmount ??
      calculatedTotal
    );

    // ==================================================
    // FORMAT ITEMS
    // ==================================================

    const formattedItems = items.map((item) => ({
      product:
        item.product ||
        item._id ||
        item.id ||
        null,

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

      note:
        item.note || "",

      image:
        item.image ||
        item.product?.image ||
        item.product?.imageUrl ||
        item.product?.imgUrl ||
        "",
    }));

    // ==================================================
    // SHIPPING INFO
    // ==================================================

    const finalShippingInfo = {
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

      // QUAN TRỌNG
      tableCode:
        finalTableCode,

      // QUAN TRỌNG
      orderType:
        finalOrderType,
    };

    // ==================================================
    // TẠO ORDER
    // ==================================================

    const orderData = {
      user: userId,

      // LƯU Ở CẤP NGOÀI
      orderType:
        finalOrderType,

      // LƯU Ở CẤP NGOÀI
      tableCode:
        finalTableCode,

      items:
        formattedItems,

      // ĐỒNG THỜI LƯU TRONG SHIPPING INFO
      shippingInfo:
        finalShippingInfo,

      paymentMethod:
        paymentMethod ||
        "COD",

      totalPrice:
        finalTotal,

      note:
        note ||
        "",

      status:
        "pending",

      isPaid:
        false,
    };

    // ==================================================
    // SAVE
    // ==================================================

    const newOrder =
      new Order(orderData);

    await newOrder.save();

    console.log(
      "===================================="
    );

    console.log(
      "✅ ĐÃ TẠO ĐƠN HÀNG"
    );

    console.log(
      "👤 User:",
      userId || "Khách QR"
    );

    console.log(
      "🍽️ Loại:",
      finalOrderType
    );

    console.log(
      "🪑 Bàn:",
      finalTableCode || "Mang về"
    );

    console.log(
      "🍽️ Số món:",
      formattedItems.length
    );

    console.log(
      "💰 Tổng:",
      finalTotal
    );

    console.log(
      "===================================="
    );

    return res.status(201).json({
      success: true,

      message: finalTableCode
        ? `Đặt món thành công tại bàn ${finalTableCode}!`
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
      message:
        "Lỗi hệ thống khi lưu đơn hàng",
      error:
        error.message,
    });
  }
};

// ======================================================
// 2. LẤY ĐƠN CỦA USER
// ======================================================

exports.getMyOrders = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Chưa xác thực người dùng!",
      });
    }

    const orders =
      await Order.find({
        user: userId,
      })
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
      "🔥 LỖI LẤY ĐƠN HÀNG CÁ NHÂN:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Lỗi hệ thống khi lấy danh sách đơn hàng",
      error:
        error.message,
    });
  }
};

// ======================================================
// 3. ADMIN LẤY TẤT CẢ ĐƠN
// ======================================================

exports.getOrders = async (req, res) => {
  try {
    const orders =
      await Order.find()
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.product",
          "name price image imgUrl imageUrl"
        )
        .sort({
          createdAt: -1,
        });

    // ==================================================
    // CHUẨN HÓA DỮ LIỆU TRẢ VỀ
    // ==================================================

    const formattedOrders =
      orders.map((order) => {
        const obj =
          order.toObject();

        // Ưu tiên tableCode cấp ngoài
        // nếu không có thì lấy shippingInfo
        const finalTableCode =
          normalizeTableCode(
            obj.tableCode ||
            obj.shippingInfo?.tableCode ||
            ""
          );

        const finalOrderType =
          obj.orderType ||
          obj.shippingInfo?.orderType ||
          (finalTableCode
            ? "Dine-in"
            : "Takeaway");

        // Đảm bảo shippingInfo có tableCode
        obj.tableCode =
          finalTableCode;

        obj.orderType =
          finalOrderType;

        obj.shippingInfo = {
          ...(obj.shippingInfo || {}),

          tableCode:
            finalTableCode,

          orderType:
            finalOrderType,
        };

        return obj;
      });

    console.log(
      "===================================="
    );

    console.log(
      "🔥 ADMIN GET ORDERS"
    );

    console.log(
      "📦 Tổng đơn:",
      formattedOrders.length
    );

    formattedOrders.forEach(
      (order) => {
        console.log(
          "ORDER:",
          order._id,
          "| TABLE:",
          order.tableCode,
          "| TYPE:",
          order.orderType,
          "| ITEMS:",
          order.items?.length || 0
        );
      }
    );

    console.log(
      "===================================="
    );

    return res.status(200).json({
      success: true,
      data: formattedOrders,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI LẤY DANH SÁCH ĐƠN HÀNG:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Lỗi hệ thống khi lấy danh sách đơn hàng",
      error:
        error.message,
    });
  }
};

// ======================================================
// 4. ADMIN CẬP NHẬT CHI TIẾT ĐƠN
// ======================================================

exports.updateOrder = async (req, res) => {
  try {
    const { id } =
      req.params;

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
    // TÌM ORDER
    // ==================================================

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn hàng!",
      });
    }

    // ==================================================
    // ITEMS
    // ==================================================

    if (Array.isArray(items)) {

      order.items =
        items.map((item) => {

          const productId =
            item.product?._id ||
            item.product ||
            item._id ||
            item.id ||
            null;

          const productData =
            typeof item.product === "object"
              ? item.product
              : null;

          return {
            product:
              productId,

            name:
              item.name ||
              productData?.name ||
              "Món ăn",

            price:
              Number(
                item.price ||
                productData?.price ||
                0
              ),

            quantity:
              Number(
                item.quantity || 1
              ),

            note:
              item.note ||
              "",

            image:
              item.image ||
              productData?.image ||
              productData?.imageUrl ||
              productData?.imgUrl ||
              "",
          };
        });
    }

    // ==================================================
    // TÍNH TỔNG
    // ==================================================

    if (Array.isArray(items)) {

      const calculatedTotal =
        order.items.reduce(
          (sum, item) => {
            return (
              sum +
              Number(item.price || 0) *
              Number(item.quantity || 1)
            );
          },
          0
        );

      order.totalPrice =
        Number(
          totalPrice ??
          totalAmount ??
          calculatedTotal
        );
    }

    else if (
      totalPrice !== undefined ||
      totalAmount !== undefined
    ) {

      order.totalPrice =
        Number(
          totalPrice ??
          totalAmount
        );
    }

    // ==================================================
    // TABLE CODE
    // ==================================================

    if (
      tableCode !== undefined
    ) {

      const finalTableCode =
        normalizeTableCode(
          tableCode
        );

      order.tableCode =
        finalTableCode;

      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        tableCode:
          finalTableCode,
      };
    }

    // ==================================================
    // ORDER TYPE
    // ==================================================

    if (
      orderType !== undefined
    ) {

      order.orderType =
        orderType;

      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        orderType:
          orderType,
      };
    }

    // ==================================================
    // CUSTOMER NAME
    // ==================================================

    if (
      customerName !== undefined
    ) {

      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerName:
          customerName,
      };
    }

    // ==================================================
    // CUSTOMER PHONE
    // ==================================================

    if (
      customerPhone !== undefined
    ) {

      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerPhone:
          customerPhone,
      };
    }

    // ==================================================
    // SHIPPING INFO
    // ==================================================

    if (
      shippingInfo !== undefined
    ) {

      const mergedShippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        ...shippingInfo,
      };

      if (
        mergedShippingInfo.tableCode
      ) {
        mergedShippingInfo.tableCode =
          normalizeTableCode(
            mergedShippingInfo.tableCode
          );

        order.tableCode =
          mergedShippingInfo.tableCode;
      }

      if (
        mergedShippingInfo.orderType
      ) {
        order.orderType =
          mergedShippingInfo.orderType;
      }

      order.shippingInfo =
        mergedShippingInfo;
    }

    // ==================================================
    // PAYMENT
    // ==================================================

    if (
      paymentMethod !== undefined
    ) {
      order.paymentMethod =
        paymentMethod;
    }

    // ==================================================
    // NOTE
    // ==================================================

    if (
      note !== undefined
    ) {
      order.note =
        note;
    }

    // ==================================================
    // STATUS
    // ==================================================

    if (
      status !== undefined
    ) {
      order.status =
        status;
    }

    // ==================================================
    // PAYMENT STATUS
    // ==================================================

    if (
      paymentStatus !== undefined
    ) {
      order.paymentStatus =
        paymentStatus;
    }

    // ==================================================
    // IS PAID
    // ==================================================

    if (
      isPaid !== undefined
    ) {
      order.isPaid =
        isPaid;
    }

    // ==================================================
    // SAVE
    // ==================================================

    await order.save();

    console.log(
      "===================================="
    );

    console.log(
      "✅ ĐÃ CẬP NHẬT ĐƠN POS"
    );

    console.log(
      "🧾 Order ID:",
      id
    );

    console.log(
      "🪑 Bàn:",
      order.tableCode
    );

    console.log(
      "🍽️ Số món:",
      order.items?.length || 0
    );

    console.log(
      "💰 Tổng:",
      order.totalPrice
    );

    console.log(
      "===================================="
    );

    return res.status(200).json({
      success: true,
      message:
        "Cập nhật đơn hàng thành công!",
      data: order,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI UPDATE ORDER:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Lỗi hệ thống khi cập nhật đơn hàng",
      error:
        error.message,
    });
  }
};

// ======================================================
// 5. ADMIN CẬP NHẬT TRẠNG THÁI
// ======================================================

exports.updateOrderStatus =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {
        status,
        isPaid,
        paymentStatus,
      } = req.body;

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Không tìm thấy đơn hàng!",
        });
      }

      if (
        status !== undefined
      ) {
        order.status =
          status;
      }

      if (
        isPaid !== undefined
      ) {
        order.isPaid =
          isPaid;
      }

      if (
        paymentStatus !== undefined
      ) {
        order.paymentStatus =
          paymentStatus;
      }

      await order.save();

      return res.status(200).json({
        success: true,
        message:
          "Cập nhật đơn hàng thành công!",
        data: order,
      });

    } catch (error) {

      console.error(
        "🔥 LỖI CẬP NHẬT ĐƠN HÀNG:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Lỗi hệ thống khi cập nhật đơn hàng",
        error:
          error.message,
      });
    }
  };