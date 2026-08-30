import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";
import { Flame, Lock, Mail } from "lucide-react";

import "../css/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginSuccess } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Chuẩn hóa dữ liệu input từ điện thoại
    const cleanedData = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
    };

    try {
      const res = await loginApi(cleanedData);

      // Lưu Token vào localStorage ngay khi đăng nhập thành công
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      loginSuccess(res.data);

      if (res.data?.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      // Bắt toàn bộ lỗi chi tiết nhất từ Server trả về
      const serverError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng thử lại!";

      setError(
        typeof serverError === "object"
          ? JSON.stringify(serverError)
          : serverError
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <Flame className="login-logo-icon" />
          </div>

          {/* Title */}
          <h1 className="login-title">Lẩu Gà 3 Vị</h1>

          <p className="login-subtitle">
            Trải nghiệm ẩm thực thượng hạng
          </p>

          {/* Error Box - Hiển thị chi tiết lỗi từ Server */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Email Input */}
            <div className="login-group">
              <label className="login-label">Email</label>

              <div className="login-input-wrapper">
                <Mail className="login-input-icon" />

                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="login-input"
                  placeholder="admin@lauga3vi.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-group">
              <label className="login-label">Mật khẩu</label>

              <div className="login-input-wrapper">
                <Lock className="login-input-icon" />

                <input
                  type="password"
                  required
                  autoCapitalize="none"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="login-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>

          </form>

          {/* Link sang trang Register */}
          <p className="login-register">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="login-register-link">
              Đăng ký ngay
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;