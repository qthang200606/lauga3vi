
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

  const { loginSuccess } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await loginApi(formData);

      loginSuccess(res.data);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng nhập thất bại"
      );
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
          <h1 className="login-title">
            Lẩu Gà 3 Vị
          </h1>

          <p className="login-subtitle">
            Trải nghiệm ẩm thực thượng hạng
          </p>

          {/* Error */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* Email */}
            <div className="login-group">
              <label className="login-label">
                Email
              </label>

              <div className="login-input-wrapper">
                <Mail className="login-input-icon" />

                <input
                  type="email"
                  required
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

            {/* Password */}
            <div className="login-group">
              <label className="login-label">
                Mật khẩu
              </label>

              <div className="login-input-wrapper">
                <Lock className="login-input-icon" />

                <input
                  type="password"
                  required
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

            {/* Button */}
            <button
              type="submit"
              className="login-button"
            >
              Đăng Nhập
            </button>

          </form>

          {/* Register */}
          <p className="login-register">
            Chưa có tài khoản?

            <Link
              to="/register"
              className="login-register-link"
            >
              Đăng ký ngay
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
