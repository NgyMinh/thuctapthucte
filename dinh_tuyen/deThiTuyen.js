/**
 * Định tuyến các API quản lý đề thi và cấu hình trộn đề ngẫu nhiên
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const {
    layDanhSachDeThi,
    taoDeThiMoi,
    capNhatTrangThaiDeThi,
    xoaDeThi
} = require('../dieu_khien/deThiDieuKhien');
const { xacThucToken, yeuCauQuyenMentor } = require('../trung_gian/kiemTraQuyen');

boDinhTuyen.use(xacThucToken);

// Lấy danh sách đề thi (Thực tập sinh hoặc Quản lý)
boDinhTuyen.get('/', layDanhSachDeThi);

// Thao tác quản trị đề thi
boDinhTuyen.post('/', yeuCauQuyenMentor, taoDeThiMoi);
boDinhTuyen.patch('/:id/trang-thai', yeuCauQuyenMentor, capNhatTrangThaiDeThi);
boDinhTuyen.delete('/:id', yeuCauQuyenMentor, xoaDeThi);

module.exports = boDinhTuyen;
