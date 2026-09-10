const Order = require("../models/Order");

// ======================================================
// CHUẨN HÓA MÃ BÀN
// B02 -> B02
// B2  -> B02
// 02  -> B02
// 2   -> B02
// ======================================================

const normalizeTableCode = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  let code = String(value).trim().toUpperCase();

  if (!code) {
    return "";
  }

  code = code
    .replace(/^BÀN\s*/i, "")
    .replace(/^BAN\s*/i, "")
    .replace(/^B\s*/i, "");

  if (/^\d+$/.test(code)) {
    return `B${String(Number(code)).padStart(2, "0")}`;
  }

  return code;
};

// ======================================================
// LẤY ID PRODUCT
// ======================================================

const getProductId = (item) => {
  if (!item) return null;

  if (
    item.product &&
    typeof item.product === "object"
  ) {
    return (
      item.product._id ||
      item.product.id ||
      null
    );
  }

  return (
    item.product ||
    item.productId ||
    item._id ||
    item.id ||
    null
  );
};

// ======================================================
// FORMAT ITEM
// ======================================================

const formatOrderItem = (item) => {
  if (!item) return null;

  const productObject =
    item.product &&
    typeof item.product === "object"
      ? item.product
      : null;

  const productId =
    getProductId(item);

  const name =
    item.name ||
    productObject?.name ||
    "Món ăn";

  const price = Number(
    item.price ??
      productObject?.price ??
      0
  );

  const quantity = Math.max(
    1,
    Number(
      item.quantity ??
        item.qty ??
        1
    )
  );

  const note = String(
    item.note || ""
  ).trim();

  const image =
    item.image ||
    item.imageUrl ||
    item.imgUrl ||
    productObject?.image ||
    productObject?.imageUrl ||
    productObject?.imgUrl ||
    "";

  return {
    product: productId,
    name,
    price,
    quantity,
    note,
    image,
  };
};

// ======================================================
// 1. TẠO ĐƠN
// ======================================================

exports.createOrder = async (req, res) => {
  try {
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
    } = req.body;

    console.log("====================================");
    console.log("🔥 CREATE ORDER");
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("====================================");

    // --------------------------------------------------
    // KIỂM TRA ITEMS
    // --------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng đang trống!",
      });
    }

    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const userId =
      req.user?._id ||
      req.user?.id ||
      null;

    // --------------------------------------------------
    // TABLE
    // --------------------------------------------------

    const finalTableCode =
      normalizeTableCode(
        tableCode ||
          shippingInfo?.tableCode ||
          ""
      );

    // --------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------

    const finalOrderType =
      orderType ||
      shippingInfo?.orderType ||
      (finalTableCode
        ? "Dine-in"
        : "Takeaway");

    // --------------------------------------------------
    // FORMAT ITEMS
    // --------------------------------------------------

    const formattedItems =
      items
        .map(formatOrderItem)
        .filter(Boolean);

    console.log(
      "🔥 FORMATTED ITEMS:",
      JSON.stringify(
        formattedItems,
        null,
        2
      )
    );

    if (formattedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Không có món ăn hợp lệ!",
      });
    }

    // --------------------------------------------------
    // TÍNH TỔNG TỪ ITEMS
    // --------------------------------------------------

    const calculatedTotal =
      formattedItems.reduce(
        (sum, item) => {
          return (
            sum +
            Number(item.price || 0) *
              Number(
                item.quantity || 1
              )
          );
        },
        0
      );

    const finalTotal =
      totalPrice !== undefined &&
      totalPrice !== null
        ? Number(totalPrice)
        : totalAmount !== undefined &&
          totalAmount !== null
        ? Number(totalAmount)
        : calculatedTotal;

    // --------------------------------------------------
    // SHIPPING INFO
    // --------------------------------------------------

    const finalShippingInfo = {
      ...(shippingInfo || {}),

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

      tableCode:
        finalTableCode,

      orderType:
        finalOrderType,
    };

    // --------------------------------------------------
    // ORDER DATA
    // --------------------------------------------------

    const orderData = {
      user: userId,

      orderType:
        finalOrderType,

      tableCode:
        finalTableCode,

      items:
        formattedItems,

      shippingInfo:
        finalShippingInfo,

      paymentMethod:
        paymentMethod ||
        "COD",

      totalPrice:
        finalTotal,

      note:
        note || "",

      status:
        "pending",

      isPaid:
        false,
    };

    console.log(
      "🔥 ORDER DATA TRƯỚC SAVE:",
      JSON.stringify(
        orderData,
        null,
        2
      )
    );

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    const newOrder =
      new Order(orderData);

    await newOrder.save();

    console.log(
      "===================================="
    );

    console.log(
      "✅ ĐÃ SAVE ORDER"
    );

    console.log(
      "ID:",
      newOrder._id
    );

    console.log(
      "BÀN:",
      newOrder.tableCode
    );

    console.log(
      "SỐ MÓN:",
      newOrder.items?.length || 0
    );

    console.log(
      "ITEMS SAU SAVE:",
      JSON.stringify(
        newOrder.items,
        null,
        2
      )
    );

    console.log(
      "TỔNG:",
      newOrder.totalPrice
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
      "🔥 LỖI CREATE ORDER:",
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
// 2. USER LẤY ĐƠN
// ======================================================

exports.getMyOrders = async (
  req,
  res
) => {
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
      "🔥 LỖI GET MY ORDERS:",
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

exports.getOrders = async (
  req,
  res
) => {
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

    const formattedOrders =
      orders.map((order) => {
        const obj =
          order.toObject();

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

    formattedOrders.forEach(
      (order) => {
        console.log(
          "ORDER:",
          order._id,
          "| TABLE:",
          order.tableCode,
          "| ITEMS:",
          order.items?.length || 0,
          "| TOTAL:",
          order.totalPrice
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
      "🔥 LỖI GET ORDERS:",
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
// 4. UPDATE ORDER
// ======================================================

exports.updateOrder = async (
  req,
  res
) => {
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

    console.log(
      "===================================="
    );

    console.log(
      "🔥 UPDATE ORDER:",
      id
    );

    console.log(
      "BODY:",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    // --------------------------------------------------
    // TÌM ORDER
    // --------------------------------------------------

    const order =
      await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn hàng!",
      });
    }

    // --------------------------------------------------
    // ITEMS
    // --------------------------------------------------

    if (Array.isArray(items)) {

      const formattedItems =
        items
          .map(formatOrderItem)
          .filter(Boolean);

      /*
       * CHỈ CẬP NHẬT ITEMS KHI REQUEST
       * THỰC SỰ GỬI ITEMS.
       */

      order.items =
        formattedItems;

      // Tính tổng từ items
      const calculatedTotal =
        formattedItems.reduce(
          (sum, item) => {
            return (
              sum +
              Number(item.price || 0) *
                Number(
                  item.quantity || 1
                )
            );
          },
          0
        );

      order.totalPrice =
        totalPrice !== undefined
          ? Number(totalPrice)
          : totalAmount !== undefined
          ? Number(totalAmount)
          : calculatedTotal;
    }

    // --------------------------------------------------
    // NẾU KHÔNG GỬI ITEMS
    // KHÔNG ĐỤNG VÀO order.items
    // --------------------------------------------------

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

    // --------------------------------------------------
    // TABLE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------

    if (
      customerName !== undefined
    ) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerName,
      };
    }

    if (
      customerPhone !== undefined
    ) {
      order.shippingInfo = {
        ...(order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {}),

        customerPhone,
      };
    }

    // --------------------------------------------------
    // SHIPPING INFO
    // --------------------------------------------------

    if (
      shippingInfo !== undefined
    ) {
      const currentShipping =
        order.shippingInfo?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo || {};

      const mergedShippingInfo = {
        ...currentShipping,
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

    // --------------------------------------------------
    // PAYMENT
    // --------------------------------------------------

    if (
      paymentMethod !== undefined
    ) {
      order.paymentMethod =
        paymentMethod;
    }

    // --------------------------------------------------
    // NOTE
    // --------------------------------------------------

    if (
      note !== undefined
    ) {
      order.note = note;
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (
      status !== undefined
    ) {
      order.status = status;
    }

    // --------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------

    if (
      paymentStatus !== undefined
    ) {
      order.paymentStatus =
        paymentStatus;
    }

    // --------------------------------------------------
    // PAID
    // --------------------------------------------------

    if (
      isPaid !== undefined
    ) {
      order.isPaid = isPaid;
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    await order.save();

    console.log(
      "✅ UPDATE THÀNH CÔNG"
    );

    console.log(
      "ORDER:",
      order._id
    );

    console.log(
      "TABLE:",
      order.tableCode
    );

    console.log(
      "ITEMS:",
      order.items?.length || 0
    );

    console.log(
      "ITEM DATA:",
      JSON.stringify(
        order.items,
        null,
        2
      )
    );

    console.log(
      "TOTAL:",
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
// 5. UPDATE STATUS
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
        order.status = status;
      }

      if (
        isPaid !== undefined
      ) {
        order.isPaid = isPaid;
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
        "🔥 LỖI UPDATE STATUS:",
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