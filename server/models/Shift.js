const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người mở ca
    initialCash: { type: Number, required: true, default: 0 }, // Tiền đầu ca (Tiền thối)
    
    // Các trường này sẽ cập nhật khi ĐÓNG CA
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "closed"], default: "open" }, // Trạng thái ca
    
    // Thống kê tự động khi kết ca
    totalCashSales: { type: Number, default: 0 }, // Tổng doanh thu tiền mặt
    totalTransferSales: { type: Number, default: 0 }, // Tổng doanh thu chuyển khoản
    realCashInDrawer: { type: Number, default: 0 }, // Tiền mặt thực tế kiểm kê trong két
    difference: { type: Number, default: 0 }, // Tiền chênh lệch (Thừa/Thiếu)
    
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shift", shiftSchema);