const Order = require("../models/Order");
const crypto = require("crypto");

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
// TẠO MÃ THANH TOÁN SEPAY
//
// Ví dụ:
// LG3V-B02-A8F31C
// LG3V-TAKEAWAY-7C92AB
// ======================================================

const generatePaymentCode = (tableCode = "") => {
  const table =
    normalizeTableCode(tableCode) ||
    "TAKEAWAY";

  const randomCode = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `LG3V-${table}-${randomCode}`;
};

// ======================================================
// KIỂM TRA PHƯƠNG THỨC THANH TOÁN CHUYỂN KHOẢN
// ======================================================

const isBankPayment = (paymentMethod) => {
  const method = String(
    paymentMethod || ""
  )
    .trim()
    .toUpperCase();

  return (
    method === "BANK" ||
    method === "BANKING" ||
    method === "TRANSFER" ||
    method === "VIETQR" ||
    method === "SEPAY"
  );
};

// ======================================================
// LẤY ID PRODUCT
// ======================================================

const getProductId = (item) => {
  if (!item) {
    return null;
  }

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
  if (!item) {
    return null;
  }

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

exports.createOrder = async (
  req,
  res
) => {
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

    console.log(
      "===================================="
    );

    console.log(
      "🔥 CREATE ORDER"
    );

    console.log(
      "BODY:",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    console.log(
      "===================================="
    );

    // --------------------------------------------------
    // KIỂM TRA ITEMS
    // --------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Giỏ hàng đang trống!",
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
    // PAYMENT METHOD
    // --------------------------------------------------

    const finalPaymentMethod =
      paymentMethod ||
      "COD";

    // --------------------------------------------------
    // PAYMENT CODE
    //
    // Chỉ tạo mã nếu thanh toán chuyển khoản.
    // COD không cần paymentCode.
    // --------------------------------------------------

    let paymentCode = "";

    if (
      isBankPayment(
        finalPaymentMethod
      )
    ) {
      paymentCode =
        generatePaymentCode(
          finalTableCode
        );
    }

    console.log(
      "💳 PAYMENT METHOD:",
      finalPaymentMethod
    );

    console.log(
      "💳 PAYMENT CODE:",
      paymentCode || "(Không có)"
    );

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

    if (
      formattedItems.length === 0
    ) {
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
            Number(
              item.price || 0
            ) *
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
        : totalAmount !==
              undefined &&
            totalAmount !== null
        ? Number(totalAmount)
        : calculatedTotal;

    // --------------------------------------------------
    // KIỂM TRA TOTAL
    // --------------------------------------------------

    if (
      !Number.isFinite(
        finalTotal
      ) ||
      finalTotal < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Tổng tiền đơn hàng không hợp lệ!",
      });
    }

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
        finalPaymentMethod,

      paymentStatus:
        "UNPAID",

      paymentCode:
        paymentCode || undefined,

      paidAmount:
        0,

      paymentTransactionId:
        "",

      paymentGateway:
        "",

      paidAt:
        null,

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

    // --------------------------------------------------
    // LOG
    // --------------------------------------------------

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
      "LOẠI:",
      newOrder.orderType
    );

    console.log(
      "SỐ MÓN:",
      newOrder.items?.length ||
        0
    );

    console.log(
      "TỔNG:",
      newOrder.totalPrice
    );

    console.log(
      "PAYMENT METHOD:",
      newOrder.paymentMethod
    );

    console.log(
      "PAYMENT CODE:",
      newOrder.paymentCode ||
        "(Không có)"
    );

    console.log(
      "===================================="
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        finalTableCode
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
              obj.shippingInfo
                ?.tableCode ||
              ""
          );

        const finalOrderType =
          obj.orderType ||
          obj.shippingInfo
            ?.orderType ||
          (finalTableCode
            ? "Dine-in"
            : "Takeaway");

        obj.tableCode =
          finalTableCode;

        obj.orderType =
          finalOrderType;

        obj.shippingInfo = {
          ...(obj.shippingInfo ||
            {}),

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
          order.items?.length ||
            0,
          "| TOTAL:",
          order.totalPrice,
          "| PAYMENT:",
          order.paymentStatus,
          "| PAID:",
          order.isPaid,
          "| PAYMENT CODE:",
          order.paymentCode ||
            "-"
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
// 4. LẤY 1 ĐƠN THEO ID
// ======================================================

exports.getOrderById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const order =
      await Order.findById(id)
        .populate(
          "user",
          "name email"
        )
        .populate(
          "items.product",
          "name price image imgUrl imageUrl"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy đơn hàng!",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error(
      "🔥 LỖI GET ORDER BY ID:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Lỗi hệ thống khi lấy đơn hàng",
      error:
        error.message,
    });
  }
};

// ======================================================
// 5. UPDATE ORDER
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

      // SEPAY
      paymentCode,
      paidAmount,
      paymentTransactionId,
      paymentGateway,
      paidAt,
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

    if (
      Array.isArray(items)
    ) {
      const formattedItems =
        items
          .map(formatOrderItem)
          .filter(Boolean);

      order.items =
        formattedItems;

      const calculatedTotal =
        formattedItems.reduce(
          (sum, item) => {
            return (
              sum +
              Number(
                item.price || 0
              ) *
                Number(
                  item.quantity || 1
                )
            );
          },
          0
        );

      order.totalPrice =
        totalPrice !==
        undefined
          ? Number(totalPrice)
          : totalAmount !==
              undefined
          ? Number(
              totalAmount
            )
          : calculatedTotal;
    }

    // --------------------------------------------------
    // KHÔNG GỬI ITEMS
    // CHỈ UPDATE TOTAL
    // --------------------------------------------------

    else if (
      totalPrice !==
        undefined ||
      totalAmount !==
        undefined
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
      tableCode !==
      undefined
    ) {
      const finalTableCode =
        normalizeTableCode(
          tableCode
        );

      order.tableCode =
        finalTableCode;

      const currentShipping =
        order.shippingInfo
          ?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo ||
            {};

      order.shippingInfo = {
        ...currentShipping,

        tableCode:
          finalTableCode,
      };
    }

    // --------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------

    if (
      orderType !==
      undefined
    ) {
      order.orderType =
        orderType;

      const currentShipping =
        order.shippingInfo
          ?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo ||
            {};

      order.shippingInfo = {
        ...currentShipping,

        orderType:
          orderType,
      };
    }

    // --------------------------------------------------
    // CUSTOMER NAME
    // --------------------------------------------------

    if (
      customerName !==
      undefined
    ) {
      const currentShipping =
        order.shippingInfo
          ?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo ||
            {};

      order.shippingInfo = {
        ...currentShipping,

        customerName:
          customerName,
      };
    }

    // --------------------------------------------------
    // CUSTOMER PHONE
    // --------------------------------------------------

    if (
      customerPhone !==
      undefined
    ) {
      const currentShipping =
        order.shippingInfo
          ?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo ||
            {};

      order.shippingInfo = {
        ...currentShipping,

        customerPhone:
          customerPhone,
      };
    }

    // --------------------------------------------------
    // SHIPPING INFO
    // --------------------------------------------------

    if (
      shippingInfo !==
      undefined
    ) {
      const currentShipping =
        order.shippingInfo
          ?.toObject
          ? order.shippingInfo.toObject()
          : order.shippingInfo ||
            {};

      const mergedShippingInfo =
        {
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
    // PAYMENT METHOD
    // --------------------------------------------------

    if (
      paymentMethod !==
      undefined
    ) {
      order.paymentMethod =
        paymentMethod;

      // Nếu đổi sang BANK mà chưa có paymentCode
      if (
        isBankPayment(
          paymentMethod
        ) &&
        !order.paymentCode
      ) {
        order.paymentCode =
          generatePaymentCode(
            order.tableCode
          );
      }
    }

    // --------------------------------------------------
    // PAYMENT CODE
    // --------------------------------------------------

    if (
      paymentCode !==
        undefined &&
      paymentCode !==
        null &&
      paymentCode !== ""
    ) {
      order.paymentCode =
        paymentCode;
    }

    // --------------------------------------------------
    // PAID AMOUNT
    // --------------------------------------------------

    if (
      paidAmount !==
      undefined
    ) {
      order.paidAmount =
        Number(paidAmount);
    }

    // --------------------------------------------------
    // PAYMENT TRANSACTION ID
    // --------------------------------------------------

    if (
      paymentTransactionId !==
      undefined
    ) {
      order.paymentTransactionId =
        paymentTransactionId;
    }

    // --------------------------------------------------
    // PAYMENT GATEWAY
    // --------------------------------------------------

    if (
      paymentGateway !==
      undefined
    ) {
      order.paymentGateway =
        paymentGateway;
    }

    // --------------------------------------------------
    // PAID AT
    // --------------------------------------------------

    if (
      paidAt !==
      undefined
    ) {
      order.paidAt =
        paidAt;
    }

    // --------------------------------------------------
    // NOTE
    // --------------------------------------------------

    if (
      note !==
      undefined
    ) {
      order.note =
        note;
    }

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (
      status !==
      undefined
    ) {
      order.status =
        status;
    }

    // --------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------

    if (
      paymentStatus !==
      undefined
    ) {
      order.paymentStatus =
        paymentStatus;
    }

    // --------------------------------------------------
    // IS PAID
    // --------------------------------------------------

    if (
      isPaid !==
      undefined
    ) {
      order.isPaid =
        isPaid;
    }

    // --------------------------------------------------
    // NẾU ĐÃ PAID
    // TỰ ĐỒNG BỘ PAYMENT STATUS
    // --------------------------------------------------

    if (
      order.isPaid ===
      true
    ) {
      order.paymentStatus =
        "PAID";

      if (
        !order.paidAt
      ) {
        order.paidAt =
          new Date();
      }
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    await order.save();

    console.log(
      "===================================="
    );

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
      order.items?.length ||
        0
    );

    console.log(
      "TOTAL:",
      order.totalPrice
    );

    console.log(
      "PAYMENT:",
      order.paymentStatus
    );

    console.log(
      "PAYMENT CODE:",
      order.paymentCode ||
        "-"
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
// 6. UPDATE STATUS
// ======================================================

exports.updateOrderStatus =
  async (
    req,
    res
  ) => {
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

      // --------------------------------------------------
      // STATUS
      // --------------------------------------------------

      if (
        status !==
        undefined
      ) {
        order.status =
          status;
      }

      // --------------------------------------------------
      // IS PAID
      // --------------------------------------------------

      if (
        isPaid !==
        undefined
      ) {
        order.isPaid =
          isPaid;
      }

      // --------------------------------------------------
      // PAYMENT STATUS
      // --------------------------------------------------

      if (
        paymentStatus !==
        undefined
      ) {
        order.paymentStatus =
          paymentStatus;
      }

      // --------------------------------------------------
      // NẾU ĐÃ THANH TOÁN
      // --------------------------------------------------

      if (
        order.isPaid ===
        true
      ) {
        order.paymentStatus =
          "PAID";

        if (
          !order.paidAt
        ) {
          order.paidAt =
            new Date();
        }
      }

      await order.save();

      console.log(
        "✅ UPDATE STATUS:",
        order._id,
        "| STATUS:",
        order.status,
        "| PAID:",
        order.isPaid,
        "| PAYMENT:",
        order.paymentStatus
      );

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