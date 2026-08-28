import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Star,
  Filter,
} from "lucide-react";
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
} from "../api/productApi";
import { getCategoriesApi } from "../api/categoryApi";

import AdminSidebar from "../components/AdminSidebar";
import "../css/AdminProducts.css";

// Ảnh mặc định dự phòng khi link hỏng/trống
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60";

const AdminProducts = () => {
  const { user, logout } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
    isAvailable: true,
    isBestSeller: false,
  });

  // Hàm xử lý đường dẫn ảnh linh hoạt
  const getImageUrl = (url) => {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return DEFAULT_IMAGE;
    }
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Fetch danh sách danh mục & sản phẩm
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCat, resProd] = await Promise.all([
        getCategoriesApi(),
        getProductsApi(selectedCategoryFilter),
      ]);
      setCategories(resCat.data.data);
      setProducts(resProd.data.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryFilter]);

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingId(prod._id);
      setFormData({
        name: prod.name,
        category: prod.category?._id || prod.category || "",
        price: prod.price,
        description: prod.description || "",
        image: prod.image || "",
        isAvailable: prod.isAvailable,
        isBestSeller: prod.isBestSeller,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category: categories[0]?._id || "",
        price: "",
        description: "",
        image: "",
        isAvailable: true,
        isBestSeller: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Vui lòng chọn danh mục cho món ăn!");
      return;
    }

    try {
      if (editingId) {
        await updateProductApi(editingId, formData);
      } else {
        await createProductApi(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa món "${name}"?`)) {
      try {
        await deleteProductApi(id);
        fetchData();
      } catch (err) {
        alert("Không thể xóa món ăn này");
      }
    }
  };

  return (
    <div className="admin-page">
      {/* CẢI TIẾN: Nhúng AdminSidebar component vào đây */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-top">
          <h1>Quản Lý Món Ăn</h1>
          <button className="btn-add-gold" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Thêm Món Mới
          </button>
        </div>

        {/* LỌC THEO DANH MỤC */}
        <div className="prod-filter-bar">
          <div className="filter-label">
            <Filter size={16} /> Lọc theo Danh mục:
          </div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="prod-select-filter"
          >
            <option value="">-- Tất cả danh mục --</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* BẢNG SẢN PHẨM */}
        <div className="prod-table-card">
          {loading ? (
            <div className="prod-loading">Đang tải danh sách món ăn...</div>
          ) : (
            <table className="prod-table">
              <thead>
                <tr>
                  <th>Món ăn</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th>Trạng thái</th>
                  <th>Nổi bật</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="prod-empty">
                      Không tìm thấy món ăn nào.
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item._id}>
                      <td className="prod-info-td">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="prod-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_IMAGE;
                          }}
                        />
                        <div>
                          <strong className="prod-name">{item.name}</strong>
                          <p className="prod-desc">{item.description || "—"}</p>
                        </div>
                      </td>
                      <td>
                        <span className="badge-category">
                          {item.category?.name || "Chưa phân loại"}
                        </span>
                      </td>
                      <td className="prod-price">
                        {item.price?.toLocaleString("vi-VN")}đ
                      </td>
                      <td>
                        {item.isAvailable ? (
                          <span className="badge-available">
                            <Check size={12} /> Sẵn sàng
                          </span>
                        ) : (
                          <span className="badge-unavailable">Hết hàng</span>
                        )}
                      </td>
                      <td>
                        {item.isBestSeller && (
                          <span className="badge-bestseller">
                            <Star size={12} fill="#d4af37" /> Best Seller
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-icon edit"
                          onClick={() => handleOpenModal(item)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(item._id, item.name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL THÊM / SỬA MÓN */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content modal-large">
              <div className="modal-header">
                <h2>{editingId ? "Sửa Món Ăn" : "Thêm Món Ăn Mới"}</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên món ăn *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Lẩu Gà Ớt Hiểm"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Danh Mục * (Liên kết)</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="modal-select"
                    >
                      <option value="" disabled>
                        -- Chọn danh mục --
                      </option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Giá bán (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="VD: 299000"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>URL Hình ảnh</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                    />
                    {/* Live Preview ảnh trong Modal */}
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#888" }}>
                        Xem trước:
                      </span>
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Preview"
                        style={{
                          width: "48px",
                          height: "48px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả chi tiết món ăn</label>
                  <textarea
                    rows="3"
                    placeholder="Nguyên liệu, hương vị đặc trưng..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-checkbox-group">
                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isAvailable: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="isAvailable">
                      Đang kinh doanh (Còn hàng)
                    </label>
                  </div>

                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="isBestSeller"
                      checked={formData.isBestSeller}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isBestSeller: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="isBestSeller">
                      Đánh dấu Món Bán Chạy (Best Seller)
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn-submit-gold">
                  {editingId ? "Lưu Thay Đổi" : "Thêm Món Vào Menu"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProducts;