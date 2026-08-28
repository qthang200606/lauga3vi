import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Check } from "lucide-react";
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../api/categoryApi";

import AdminSidebar from "../components/AdminSidebar";
import "../css/AdminCategories.css";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res.data.data);
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingId(cat._id);
      setFormData({
        name: cat.name,
        description: cat.description || "",
        image: cat.image || "",
        isActive: cat.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", description: "", image: "", isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategoryApi(editingId, formData);
      } else {
        await createCategoryApi(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      try {
        await deleteCategoryApi(id);
        fetchCategories();
      } catch (err) {
        alert("Không thể xóa danh mục này");
      }
    }
  };

  return (
    <div className="admin-page">
      {/* SIDEBAR COMPONENT */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-top">
          <h1>Quản Lý Danh Mục</h1>
          <button className="btn-add-gold" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Thêm Danh Mục
          </button>
        </div>

        {/* TABLE LIST */}
        <div className="cat-table-card">
          {loading ? (
            <div className="cat-loading">Đang tải danh mục...</div>
          ) : (
            <table className="cat-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="cat-empty">
                      Chưa có danh mục nào.
                    </td>
                  </tr>
                ) : (
                  categories.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <img
                          src={
                            item.image ||
                            "https://via.placeholder.com/60?text=No+Image"
                          }
                          alt={item.name}
                          className="cat-thumb"
                        />
                      </td>
                      <td className="cat-name">{item.name}</td>
                      <td className="cat-desc">{item.description || "—"}</td>
                      <td>
                        {item.isActive ? (
                          <span className="badge-active">
                            <Check size={12} /> Hiển thị
                          </span>
                        ) : (
                          <span className="badge-inactive">Ẩn</span>
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

        {/* MODAL THÊM / SỬA */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingId ? "Sửa Danh Mục" : "Thêm Danh Mục Mới"}</h2>
                <button
                  className="modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tên Danh Mục *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lẩu Chính, Món Nhúng..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>URL Hình Ảnh</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <textarea
                    rows="3"
                    placeholder="Nhập mô tả danh mục..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <label htmlFor="isActive">Hiển thị danh mục này</label>
                </div>

                <button type="submit" className="btn-submit-gold">
                  {editingId ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCategories;