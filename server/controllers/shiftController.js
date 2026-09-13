const Shift = require("../models/Shift");
const Order = require("../models/Order");

// 1. LẤY CA LÀM VIỆC HIỆN TẠI (ĐANG MỞ)
exports.getCurrentShift = async (req, res) => {
  try {
    const activeShift = await Shift.findOne({ status: "open" }).populate("openedBy", "name");
    if (!activeShift) {
      return res.status(404).json({ message: "Không có ca nào đang mở!" });
    }
    res.status(200).json(activeShift);
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra ca hiện tại", error: error.message });
  }
};

// 2. MỞ CA LÀM VIỆC MỚI
// 2. MỞ CA LÀM VIỆC MỚI
exports.openShift = async (req, res) => {
  try {
    // Nhận linh hoạt userId hoặc openedBy từ Frontend gửi lên
    const { initialCash, userId, openedBy } = req.body;
    const staffId = userId || openedBy;

    if (!staffId) {
      return res.status(400).json({ message: "Thiếu thông tin người mở ca (userId)!" });
    }

    // Kiểm tra xem đã có ca nào đang mở chưa
    const activeShift = await Shift.findOne({ status: "open" });
    if (activeShift) {
      return res.status(400).json({ message: "Đã có ca đang mở, không thể mở thêm!" });
    }

    const newShift = new Shift({
      initialCash: Number(initialCash) || 0,
      openedBy: staffId, // Đảm bảo gán đúng ObjectId vào trường openedBy
      openedAt: new Date(),
      status: "open"
    });

    await newShift.save();

    // Populate thông tin người mở ca để trả về Frontend render ngay
    await newShift.populate("openedBy", "name");

    res.status(201).json({ message: "Mở ca thành công!", shift: newShift });
  } catch (error) {
    console.error("Lỗi chi tiết khi mở ca:", error);
    res.status(500).json({ message: "Lỗi mở ca làm việc", error: error.message });
  }
};
// 3. LẤY BÁO CÁO XEM TRƯỚC (PREVIEW) TRƯỚC KHI BẤM CHỐT CA
exports.getShiftReportPreview = async (req, res) => {
  try {
    const activeShift = await Shift.findOne({ status: "open" }).populate("openedBy", "name");
    if (!activeShift) {
      return res.status(404).json({ message: "Không có ca nào đang mở!" });
    }

    const startTime = activeShift.openedAt;
    const endTime = new Date();

    // Lấy các đơn đã hoàn thành/thanh toán trong khoảng thời gian của ca
    // Kiểm tra thời điểm thanh toán (paidAt) hoặc cập nhật đơn (updatedAt) nằm trong ca
    const orders = await Order.find({
      status: { $in: ["completed", "Hoàn thành", "paid", "success", "da_thanh_toan"] },
      $or: [
        { paidAt: { $gte: startTime, $lte: endTime } },
        { updatedAt: { $gte: startTime, $lte: endTime } },
        { createdAt: { $gte: startTime, $lte: endTime } }
      ]
    }).populate("items.product");

    const initialCash = activeShift.initialCash || 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let cashSales = 0;
    let transferSales = 0;
    let cashTxCount = 0;
    let transferTxCount = 0;
    const categoryStats = {};

    orders.forEach((order) => {
      // 1. Sửa trường lấy tổng tiền chuẩn theo DB: totalPrice (hoặc fallback các tên khác)
      const orderAmount = order.totalPrice || order.totalAmount || order.total || 0;
      totalGross += orderAmount;
      totalDiscount += order.discountAmount || order.discount || 0;

      // 2. Nhận diện phương thức thanh toán "CASH"
      const method = (order.paymentMethod || "").toUpperCase();
      if (
        method === "CASH" ||
        method.includes("CASH") ||
        method.includes("TIEN_MAT") ||
        method.includes("TIỀN MẶT") ||
        method.includes("COD")
      ) {
        cashSales += orderAmount;
        cashTxCount++;
      } else {
        transferSales += orderAmount;
        transferTxCount++;
      }

      // 3. Thống kê Doanh thu theo Nhóm món
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const categoryName = item.product?.categoryName || item.category || "UnCategory";
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const revenue = price * qty;

          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = { quantity: 0, revenue: 0 };
          }
          categoryStats[categoryName].quantity += qty;
          categoryStats[categoryName].revenue += revenue;
        });
      }
    });

    const netSales = totalGross - totalDiscount;
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(netSales / totalOrders) : 0;

    const totalExpenses = activeShift.totalExpenses || 0;
    const expectedCashInDrawer = initialCash + cashSales - totalExpenses;

    const reportData = {
      shiftId: activeShift._id,
      openedAt: activeShift.openedAt,
      closedAt: endTime,
      openedBy: activeShift.openedBy?.name || "Thu ngân",
      initialCash,
      totalGross,
      totalDiscount,
      netSales,
      totalOrders,
      avgOrderValue,
      paymentMethods: {
        transfer: { count: transferTxCount, amount: transferSales },
        cash: { count: cashTxCount, amount: cashSales }
      },
      totalExpenses,
      expectedCashInDrawer,
      categoryStats: Object.keys(categoryStats).map((cat) => ({
        name: cat,
        quantity: categoryStats[cat].quantity,
        revenue: categoryStats[cat].revenue
      }))
    };

    res.status(200).json(reportData);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo báo cáo chốt ca", error: error.message });
  }
};

// 4. LƯU VÀ XÁC NHẬN ĐÓNG CA (CHỐT CA)
exports.closeShift = async (req, res) => {
  try {
    const { shiftId, realCashInDrawer, closedBy } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift || shift.status === "closed") {
      return res.status(400).json({ message: "Ca không tồn tại hoặc đã đóng!" });
    }

    const orders = await Order.find({
      status: { $in: ["completed", "Hoàn thành", "paid", "success", "da_thanh_toan"] },
      $or: [
        { paidAt: { $gte: shift.openedAt, $lte: new Date() } },
        { updatedAt: { $gte: shift.openedAt, $lte: new Date() } },
        { createdAt: { $gte: shift.openedAt, $lte: new Date() } }
      ]
    });

    let cashSales = 0;
    let transferSales = 0;
    orders.forEach((o) => {
      const orderAmount = o.totalPrice || o.totalAmount || o.total || 0;
      const method = (o.paymentMethod || "").toUpperCase();
      if (
        method === "CASH" ||
        method.includes("CASH") ||
        method.includes("TIEN_MAT") ||
        method.includes("TIỀN MẶT") ||
        method.includes("COD")
      ) {
        cashSales += orderAmount;
      } else {
        transferSales += orderAmount;
      }
    });

    const expectedCash = shift.initialCash + cashSales - (shift.totalExpenses || 0);
    const difference = Number(realCashInDrawer) - expectedCash;

    shift.status = "closed";
    shift.closedBy = closedBy;
    shift.closedAt = new Date();
    shift.totalCashSales = cashSales;
    shift.totalTransferSales = transferSales;
    shift.realCashInDrawer = Number(realCashInDrawer);
    shift.difference = difference;

    await shift.save();

    res.status(200).json({ message: "Chốt ca thành công!", shift });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi chốt ca", error: error.message });
  }
};

// 5. LẤY LỊCH SỬ CÁC CA ĐÃ CHỐT (CÓ BỘ LỌC)
exports.getShiftHistory = async (req, res) => {
  try {
    const { startDate, endDate, staffName } = req.query;
    let query = { status: "closed" };

    // Lọc theo khoảng thời gian chốt ca
    if (startDate || endDate) {
      query.closedAt = {};
      if (startDate) query.closedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.closedAt.$lte = end;
      }
    }

    const shifts = await Shift.find(query)
      .populate("openedBy", "name")
      .populate("closedBy", "name")
      .sort({ closedAt: -1 });

    // Lọc theo tên thu ngân nếu có
    let filteredShifts = shifts;
    if (staffName) {
      filteredShifts = shifts.filter((s) => {
        const name = s.openedBy?.name || s.closedBy?.name || "";
        return name.toLowerCase().includes(staffName.toLowerCase());
      });
    }

    res.status(200).json(filteredShifts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử ca làm việc", error: error.message });
  }
};

// 6. LẤY CHI TIẾT 1 CA ĐỂ IN LẠI PHIẾU
exports.getShiftDetail = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const shift = await Shift.findById(shiftId)
      .populate("openedBy", "name")
      .populate("closedBy", "name");

    if (!shift) {
      return res.status(404).json({ message: "Không tìm thấy ca làm việc!" });
    }

    // Lấy danh sách đơn hàng đã thanh toán trong khoảng thời gian ca này
    const orders = await Order.find({
      status: { $in: ["completed", "Hoàn thành", "paid", "success", "da_thanh_toan"] },
      $or: [
        { paidAt: { $gte: shift.openedAt, $lte: shift.closedAt } },
        { updatedAt: { $gte: shift.openedAt, $lte: shift.closedAt } },
        { createdAt: { $gte: shift.openedAt, $lte: shift.closedAt } }
      ]
    }).populate("items.product");

    let totalGross = 0;
    let totalDiscount = 0;
    let cashSales = 0;
    let transferSales = 0;
    let cashTxCount = 0;
    let transferTxCount = 0;
    const categoryStats = {};

    orders.forEach((order) => {
      const orderAmount = order.totalPrice || order.totalAmount || order.total || 0;
      totalGross += orderAmount;
      totalDiscount += order.discountAmount || order.discount || 0;

      const method = (order.paymentMethod || "").toUpperCase();
      if (
        method === "CASH" ||
        method.includes("CASH") ||
        method.includes("TIEN_MAT") ||
        method.includes("TIỀN MẶT") ||
        method.includes("COD")
      ) {
        cashSales += orderAmount;
        cashTxCount++;
      } else {
        transferSales += orderAmount;
        transferTxCount++;
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const categoryName = item.product?.categoryName || item.category || "UnCategory";
          const qty = item.quantity || 1;
          const price = item.price || 0;

          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = { quantity: 0, revenue: 0 };
          }
          categoryStats[categoryName].quantity += qty;
          categoryStats[categoryName].revenue += price * qty;
        });
      }
    });

    const netSales = totalGross - totalDiscount;
    const totalOrders = orders.length;

    const reportData = {
      shiftId: shift._id,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openedBy: shift.openedBy?.name || "Thu ngân",
      initialCash: shift.initialCash || 0,
      totalGross,
      totalDiscount,
      netSales,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(netSales / totalOrders) : 0,
      paymentMethods: {
        transfer: { count: transferTxCount, amount: transferSales },
        cash: { count: cashTxCount, amount: cashSales }
      },
      totalExpenses: shift.totalExpenses || 0,
      expectedCashInDrawer: (shift.initialCash || 0) + cashSales - (shift.totalExpenses || 0),
      realCashInDrawer: shift.realCashInDrawer,
      difference: shift.difference,
      categoryStats: Object.keys(categoryStats).map((cat) => ({
        name: cat,
        quantity: categoryStats[cat].quantity,
        revenue: categoryStats[cat].revenue
      }))
    };

    res.status(200).json(reportData);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết ca", error: error.message });
  }
};