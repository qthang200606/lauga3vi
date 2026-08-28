import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  Trash2,
  Printer,
  QrCode,
  Download,
  X,
  Search,
  RefreshCw,
  Armchair,
  Power,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import "../css/AdminQR.css";

const STORAGE_KEY = "lauga3vi_tables";

const DEFAULT_TABLES = [
  { id: 1, name: "Bàn 01", code: "B01", isActive: true },
  { id: 2, name: "Bàn 02", code: "B02", isActive: true },
];

function AdminQR() {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);

  const qrRefs = useRef({});

  useEffect(() => {
    try {
      const savedTables = localStorage.getItem(STORAGE_KEY);
      if (savedTables) {
        setTables(JSON.parse(savedTables));
      } else {
        setTables(DEFAULT_TABLES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TABLES));
      }
    } catch (error) {
      console.error("Lỗi đọc danh sách bàn:", error);
      setTables(DEFAULT_TABLES);
    }
  }, []);

  useEffect(() => {
    if (tables.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }
  }, [tables]);

  const baseUrl = window.location.origin;

  const generateNextCode = () => {
    let number = 1;
    while (tables.some((table) => table.code === `B${String(number).padStart(2, "0")}`)) {
      number++;
    }
    return `B${String(number).padStart(2, "0")}`;
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    const name = newTableName.trim();
    if (!name) {
      alert("Vui lòng nhập tên bàn!");
      return;
    }

    const code = generateNextCode();
    const newTable = { id: Date.now(), name, code, isActive: true };

    setTables((prev) => [...prev, newTable]);
    setNewTableName("");
  };

  const handleDelete = (id) => {
    const table = tables.find((item) => item.id === id);
    if (!table) return;

    const confirmDelete = window.confirm(`Bạn có chắc muốn xóa ${table.name} (${table.code}) không?`);
    if (!confirmDelete) return;

    setTables((prev) => prev.filter((item) => item.id !== id));
    if (selectedTable?.id === id) setSelectedTable(null);
  };

  const handleToggleStatus = (id) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === id ? { ...table, isActive: !table.isActive } : table
      )
    );
  };

  const getQrUrl = (code) => `${baseUrl}/menu?table=${encodeURIComponent(code)}`;

  const getQrSvgString = (table) => {
    const svgElement = qrRefs.current[table.id];
    return svgElement ? new XMLSerializer().serializeToString(svgElement) : "";
  };

  const handleDownload = (table) => {
    const svgElement = qrRefs.current[table.id];
    if (!svgElement) {
      alert("Không tìm thấy mã QR!");
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 1000;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 100, 100, 800, 800);

      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `QR-${table.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Không thể tạo ảnh QR!");
    };

    img.src = url;
  };

  const handlePrint = (table) => {
    const qrUrl = getQrUrl(table.code);
    const printWindow = window.open("", "_blank", "width=600,height=700");

    if (!printWindow) {
      alert("Trình duyệt đã chặn cửa sổ in. Hãy cho phép popup.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>${table.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 30px; font-family: Arial, sans-serif; text-align: center; background: white; }
          .qr-card { width: 100%; max-width: 500px; margin: 0 auto; padding: 30px; border: 2px solid #222; border-radius: 20px; }
          h1 { margin: 0 0 8px; font-size: 32px; }
          .subtitle { color: #666; margin-bottom: 20px; }
          img { width: 320px; height: 320px; }
          .code { font-size: 22px; font-weight: bold; margin-top: 15px; }
          .instruction { margin-top: 15px; font-size: 18px; font-weight: 600; }
          .url { margin-top: 10px; color: #777; font-size: 12px; word-break: break-all; }
          @media print { body { padding: 0; } .qr-card { border: none; } }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <h1>${table.name}</h1>
          <div class="subtitle">Lẩu Gà 3 Vị</div>
          <img id="qrImage" alt="QR ${table.code}" />
          <div class="code">${table.code}</div>
          <div class="instruction">Quét mã QR để gọi món</div>
          <div class="url">${qrUrl}</div>
        </div>
        <script>
          const qrSvg = ${JSON.stringify(getQrSvgString(table))};
          const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const img = document.getElementById("qrImage");
          img.src = url;
          img.onload = function () {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTables = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return tables;
    return tables.filter(
      (table) =>
        table.name.toLowerCase().includes(keyword) ||
        table.code.toLowerCase().includes(keyword)
    );
  }, [tables, searchTerm]);

  const handleReset = () => {
    if (window.confirm("Bạn có chắc muốn khôi phục danh sách bàn mặc định?")) {
      setTables(DEFAULT_TABLES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TABLES));
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />

      <main className="admin-main qr-page">
        {/* HEADER */}
        <div className="qr-header">
          <div>
            <h1>Quản Lý QR Bàn</h1>
            <p>Tạo mã QR để khách quét và gọi món trực tiếp tại bàn</p>
          </div>

          <button type="button" onClick={handleReset} className="qr-reset-btn">
            <RefreshCw size={16} />
            <span>Khôi phục mặc định</span>
          </button>
        </div>

        {/* THÊM BÀN */}
        <div className="qr-card-section">
          <h3>Thêm bàn mới</h3>
          <form onSubmit={handleAddTable} className="qr-add-form">
            <input
              type="text"
              placeholder="Nhập tên bàn, ví dụ: Bàn VIP 01..."
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
            <button type="submit" className="qr-primary-btn">
              <Plus size={18} />
              <span>Thêm bàn</span>
            </button>
          </form>
        </div>

        {/* BỘ LỌC & TÌM KIẾM */}
        <div className="qr-toolbar">
          <div className="qr-search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã bàn (Ví dụ: B01)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="qr-count-badge">
            Tổng số bàn: <strong>{tables.length}</strong>
          </div>
        </div>

        {/* DANH SÁCH BÀN */}
        {filteredTables.length === 0 ? (
          <div className="qr-empty-state">
            <QrCode size={48} />
            <h4>Không tìm thấy bàn</h4>
            <p>Hãy thử từ khóa tìm kiếm khác hoặc thêm bàn mới.</p>
          </div>
        ) : (
          <div className="qr-grid">
            {filteredTables.map((table) => {
              const qrUrl = getQrUrl(table.code);

              return (
                <div key={table.id} className="qr-table-card">
                  <div className="qr-card-header">
                    <div className="table-info">
                      <Armchair size={18} className="icon-chair" />
                      <div>
                        <h4>{table.name}</h4>
                        <span className="code-tag">Mã: {table.code}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`status-btn ${table.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleStatus(table.id)}
                      title="Bật / Tắt trạng thái"
                    >
                      <Power size={12} />
                      {table.isActive ? "Hoạt động" : "Tắt"}
                    </button>
                  </div>

                  <div className="qr-code-box">
                    <QRCodeSVG
                      value={qrUrl}
                      size={150}
                      level="H"
                      includeMargin={true}
                      ref={(element) => {
                        if (element) qrRefs.current[table.id] = element;
                      }}
                    />
                  </div>

                  <div className="qr-url-text" title={qrUrl}>
                    {qrUrl}
                  </div>

                  <div className="qr-card-actions">
                    <button
                      type="button"
                      className="qr-action-btn view"
                      onClick={() => setSelectedTable(table)}
                    >
                      <QrCode size={15} /> Xem QR
                    </button>

                    <div className="action-row">
                      <button
                        type="button"
                        className="qr-action-btn download"
                        onClick={() => handleDownload(table)}
                      >
                        <Download size={15} /> Tải
                      </button>

                      <button
                        type="button"
                        className="qr-action-btn print"
                        onClick={() => handlePrint(table)}
                      >
                        <Printer size={15} /> In
                      </button>
                    </div>

                    <button
                      type="button"
                      className="qr-action-btn delete"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 size={15} /> Xóa bàn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL XEM QR */}
        {selectedTable && (
          <div className="qr-modal-overlay" onClick={() => setSelectedTable(null)}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-header">
                <div>
                  <h3>{selectedTable.name}</h3>
                  <span>Mã bàn: {selectedTable.code}</span>
                </div>
                <button
                  type="button"
                  className="qr-modal-close"
                  onClick={() => setSelectedTable(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="qr-modal-body">
                <div className="qr-modal-code-box">
                  <QRCodeSVG
                    value={getQrUrl(selectedTable.code)}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <h4>Quét mã để gọi món</h4>
                <p>Khách hàng quét mã này sẽ chuyển tới menu của bàn.</p>

                <div className="qr-url-text">{getQrUrl(selectedTable.code)}</div>
              </div>

              <div className="qr-modal-footer">
                <button
                  type="button"
                  className="modal-btn download"
                  onClick={() => handleDownload(selectedTable)}
                >
                  <Download size={16} /> Tải ảnh QR
                </button>
                <button
                  type="button"
                  className="modal-btn print"
                  onClick={() => handlePrint(selectedTable)}
                >
                  <Printer size={16} /> In QR
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminQR;