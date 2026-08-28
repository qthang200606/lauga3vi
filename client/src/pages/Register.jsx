
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";
import {
  Flame,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";

import "../css/Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
  });

  const [error, setError] = useState("");

  const { loginSuccess } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await registerApi(formData);

      loginSuccess(res.data);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng ký thất bại"
      );
    }
  };

  return (
    <div className="register-page">
      <div className="register-overlay">

        <div className="register-card">

          {/* Logo */}
          <div className="register-logo">
            <Flame className="register-logo-icon" />
          </div>

          {/* Title */}
          <h1 className="register-title">
            Đăng Ký Thành Viên
          </h1>

          <p className="register-subtitle">
            Tham gia cùng Lẩu Gà 3 Vị
          </p>

          {/* Error */}
          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="register-form"
          >

            {/* Họ tên */}
            <div className="register-group">
              <label className="register-label">
                Họ & Tên
              </label>

              <div className="register-input-wrapper">
                <UserIcon className="register-input-icon" />

                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="register-input"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            {/* Email */}
            <div className="register-group">
              <label className="register-label">
                Email
              </label>

              <div className="register-input-wrapper">
                <Mail className="register-input-icon" />

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
                  className="register-input"
                  placeholder="khachhang@gmail.com"
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="register-group">
              <label className="register-label">
                Số Điện Thoại
              </label>

              <div className="register-input-wrapper">
                <Phone className="register-input-icon" />

                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="register-input"
                  placeholder="0901234567"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="register-group">
              <label className="register-label">
                Mật khẩu
              </label>

              <div className="register-input-wrapper">
                <Lock className="register-input-icon" />

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
                  className="register-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role */}
            <div className="register-group">
              <label className="register-label">
                Loại tài khoản
              </label>

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
                className="register-select"
              >
                <option value="customer">
                  Khách hàng
                </option>

                <option value="admin">
                  Quản trị viên (Admin)
                </option>
              </select>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="register-button"
            >
              Tạo Tài Khoản
            </button>

          </form>

          {/* Login */}
          <p className="register-login">
            Đã có tài khoản?

            <Link
              to="/login"
              className="register-login-link"
            >
              Đăng nhập
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;
