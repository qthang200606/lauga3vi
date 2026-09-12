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
exports.openShift = async (req, res) => {
  try {
    const { initialCash, openedBy } = req.body;

    // Kiểm tra xem đã có ca nào đang mở chưa
    const activeShift = await Shift.findOne({ status: "open" });
    if (activeShift) {
      return res.status(400).json({ message: "Đã có ca đang mở, không thể mở thêm!" });
    }

    const newShift = new Shift({
      initialCash: Number(initialCash) || 0,
      openedBy,
      openedAt: new Date(),
      status: "open"
    });

    await newShift.save();
    res.status(201).json({ message: "Mở ca thành công!", shift: newShift });
  } catch (error) {
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

    // Lấy tất cả các đơn hàng thành công phát sinh trong ca
    const orders = await Order.find({
      createdAt: { $gte: startTime, $lte: endTime },
      status: "completed"
    }).populate("items.product");

    // --- Tính toán dữ liệu theo mẫu phiếu iPOS ---
    const initialCash = activeShift.initialCash || 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let cashSales = 0;
    let transferSales = 0;
    let cashTxCount = 0;
    let transferTxCount = 0;
    const categoryStats = {};

    orders.forEach((order) => {
      totalGross += order.totalAmount || 0;
      totalDiscount += order.discountAmount || 0;

      // Phân loại Phương thức thanh toán
      const method = (order.paymentMethod || "").toLowerCase();
      if (method === "cash" || method === "tien_mat") {
        cashSales += order.totalAmount || 0;
        cashTxCount++;
      } else {
        transferSales += order.totalAmount || 0;
        transferTxCount++;
      }

      // Thống kê Doanh thu theo Nhóm món
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const categoryName = item.product?.categoryName || item.category || "UnCategory";
          const qty = item.quantity || 1;
          const revenue = (item.price || 0) * qty;

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
      createdAt: { $gte: shift.openedAt, $lte: new Date() },
      status: "completed"
    });

    let cashSales = 0;
    let transferSales = 0;
    orders.forEach((o) => {
      const method = (o.paymentMethod || "").toLowerCase();
      if (method === "cash" || method === "tien_mat") cashSales += o.totalAmount || 0;
      else transferSales += o.totalAmount || 0;
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