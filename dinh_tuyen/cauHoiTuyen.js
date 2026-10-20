/**
 * Định tuyến các API quản lý ngân hàng câu hỏi trắc nghiệm và chủ đề
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const {
    layDanhSachChuDe,
    layDanhSachCauHoi,
    themCauHoiMoi,
    capNhatCauHoi,
    xoaCauHoi
} = require('../dieu_khien/cauHoiDieuKhien');
const { xacThucToken, yeuCauQuyenMentor } = require('../trung_gian/kiemTraQuyen');

boDinhTuyen.use(xacThucToken);

// Lấy danh sách các chủ đề công nghệ (Java, Frontend, Agile, SQL...)
boDinhTuyen.get('/chu-de', layDanhSachChuDe);

// Lấy ngân hàng câu hỏi (Mentor quản lý hoặc xem chi tiết)
boDinhTuyen.get('/', yeuCauQuyenMentor, layDanhSachCauHoi);

// Thêm, sửa, xóa câu hỏi (chỉ dành cho Mentor)
boDinhTuyen.post('/', yeuCauQuyenMentor, themCauHoiMoi);
boDinhTuyen.put('/:id', yeuCauQuyenMentor, capNhatCauHoi);
boDinhTuyen.delete('/:id', yeuCauQuyenMentor, xoaCauHoi);

module.exports = boDinhTuyen;
