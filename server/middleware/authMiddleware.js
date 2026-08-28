const jwt = require('jsonwebtoken');

// Xác thực JWT Token
const protect = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  } else {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }
};

// Phân quyền Admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.' });
  }
};

module.exports = { protect, adminOnly };