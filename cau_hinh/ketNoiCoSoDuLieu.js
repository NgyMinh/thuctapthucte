/**
 * Tập tin cấu hình và tạo kết nối đến Cơ sở dữ liệu MySQL
 * Dự án: Hệ thống trực tuyến hỗ trợ quản lý đào tạo nội bộ tại Công ty FPT Software
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Cấu hình thông số kết nối CSDL từ biến môi trường với mã hóa UTF-8 đầy đủ
const cauHinhKetNoi = {
	host: process.env.DB_HOST || "localhost",
	port: parseInt(process.env.DB_PORT, 10) || 3309,
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "quan_ly_dao_tao",
	waitForConnections: true,
	connectionLimit: 15,
	queueLimit: 0,
	charset: "utf8mb4",
};

// Tạo Connection Pool phục vụ tái sử dụng kết nối tối ưu hiệu năng
let poolKetNoi = mysql.createPool(cauHinhKetNoi);

/**
 * Hàm kiểm tra kết nối CSDL khi khởi động hệ thống
 * Có cơ chế tự động thử kết nối cổng dự phòng (3306 hoặc 3309) nếu cổng mặc định chưa mở
 */
async function kiemTraKetNoiCoSoDuLieu() {
	try {
		const ketNoiThuNghiem = await poolKetNoi.getConnection();
		await ketNoiThuNghiem.query("SET NAMES utf8mb4;");
		await ketNoiThuNghiem.query("SET CHARACTER SET utf8mb4;");
		console.log(`[CƠ SỞ DỮ LIỆU] Kết nối thành công tới MySQL CSDL '${cauHinhKetNoi.database}' trên cổng ${cauHinhKetNoi.port}!`);
		ketNoiThuNghiem.release();
		return true;
	} catch (loiKetNoi) {
		console.warn(`[CƠ SỞ DỮ LIỆU] Cảnh báo lỗi kết nối cổng ${cauHinhKetNoi.port}: ${loiKetNoi.message}`);

		// Thử chuyển đổi giữa cổng 3309 và 3306 nếu gặp lỗi
		const congThuNghiem = cauHinhKetNoi.port === 3309 ? 3306 : 3309;
		try {
			console.log(`[CƠ SỞ DỮ LIỆU] Đang thử kết nối lại trên cổng dự phòng ${congThuNghiem}...`);
			const cauHinhDuPhong = { ...cauHinhKetNoi, port: congThuNghiem };
			const poolDuPhong = mysql.createPool(cauHinhDuPhong);
			const ketNoiDuPhong = await poolDuPhong.getConnection();
			await ketNoiDuPhong.query("SET NAMES utf8mb4;");
			await ketNoiDuPhong.query("SET CHARACTER SET utf8mb4;");
			ketNoiDuPhong.release();
			poolKetNoi = poolDuPhong;
			console.log(`[CƠ SỞ DỮ LIỆU] Kết nối dự phòng thành công tới cổng ${congThuNghiem}!`);
			return true;
		} catch (loiDuPhong) {
			console.error(`[CƠ SỞ DỮ LIỆU] Lỗi nghiêm trọng: Không thể kết nối tới MySQL trên cả 2 cổng. Chi tiết: ${loiDuPhong.message}`);
			return false;
		}
	}
}

/**
 * Hàm tiện ích thực thi câu lệnh SQL với tham số an toàn (tránh SQL Injection)
 * @param {string} cauLenhSql - Câu truy vấn SQL
 * @param {Array} thamSo - Mảng các tham số truyền vào câu lệnh
 * @returns {Promise<Array>} Kết quả trả về từ MySQL
 */
async function thucThiTruyVan(cauLenhSql, thamSo = []) {
	try {
		const [ketQua] = await poolKetNoi.query(cauLenhSql, thamSo);
		return ketQua;
	} catch (loiTruyVan) {
		console.error("[LỖI THỰC THI SQL]:", loiTruyVan.message, "SQL:", cauLenhSql);
		throw loiTruyVan;
	}
}

module.exports = {
	poolKetNoi,
	kiemTraKetNoiCoSoDuLieu,
	thucThiTruyVan,
};
