const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");

// Lấy thông tin ca làm việc hiện tại (đang mở hay đã đóng)
router.get("/current", shiftController.getCurrentShift);

// Mở ca làm việc mới (Nhập tiền đầu ca)
router.post("/open", shiftController.openShift);

// Xem trước báo cáo chốt ca (Preview dữ liệu doanh thu, tiền mặt, nhóm món)
router.get("/preview-report", shiftController.getShiftReportPreview);

// Xác nhận chốt ca (Đóng ca & Lưu kết quả kiểm kê)
router.post("/close", shiftController.closeShift);
// Lấy lịch sử ca đã chốt
router.get("/history", shiftController.getShiftHistory);
// Lấy chi tiết 1 ca để xem/in lại phiếu
router.get("/detail/:shiftId", shiftController.getShiftDetail);
module.exports = router;