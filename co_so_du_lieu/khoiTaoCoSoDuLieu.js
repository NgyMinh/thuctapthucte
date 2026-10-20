/**
 * Script tự động khởi tạo và nạp dữ liệu mẫu chuẩn Tiếng Việt UTF-8 cho CSDL
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function khoiTaoCoSoDuLieu() {
	const cauHinh = {
		host: process.env.DB_HOST || "localhost",
		port: parseInt(process.env.DB_PORT, 10) || 3309,
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		charset: "utf8mb4",
		multipleStatements: true,
	};

	console.log("--- ĐANG KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN UTF-8 ---");
	let ketNoi;
	try {
		ketNoi = await mysql.createConnection(cauHinh);
	} catch (loi) {
		console.warn(`Thử cổng 3306...`);
		cauHinh.port = 3306;
		ketNoi = await mysql.createConnection(cauHinh);
	}

	try {
		await ketNoi.query("SET NAMES utf8mb4;");
		await ketNoi.query("SET CHARACTER SET utf8mb4;");
		await ketNoi.query("SET character_set_connection=utf8mb4;");

		const duongDanSql = path.join(__dirname, "database.sql");
		const noiDungSql = fs.readFileSync(duongDanSql, "utf-8");

		// Thực thi toàn bộ script database.sql
		await ketNoi.query(noiDungSql);
		console.log("✅ Đã nạp thành công dữ liệu mẫu Tiếng Việt có dấu vào MySQL!");

		// Kiểm tra thử nghiệm hiển thị
		const [hang] = await ketNoi.query("SELECT id, tieu_de FROM quan_ly_dao_tao.khoa_hoc LIMIT 2;");
		console.log("Kiểm tra dữ liệu sau khi nạp:");
		console.log(hang);
	} catch (loi) {
		console.error("❌ Lỗi khi nạp CSDL:", loi.message);
	} finally {
		if (ketNoi) await ketNoi.end();
	}
}

if (require.main === module) {
	khoiTaoCoSoDuLieu().then(() => process.exit(0));
}

module.exports = { khoiTaoCoSoDuLieu };
