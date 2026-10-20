/**
 * Định tuyến các API quản lý khóa học, bài học và tiến độ đào tạo
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const {
    layDanhSachKhoaHoc,
    layChiTietKhoaHoc,
    capNhatTienDoHocTap,
    themKhoaHocMoi,
    capNhatKhoaHoc,
    xoaKhoaHoc,
    themChuongMoi,
    themBaiHocMoi,
    xoaBaiHoc,
    phanCongKhoaHocChoNguoiDung
} = require('../dieu_khien/khoaHocDieuKhien');
const { xacThucToken, yeuCauQuyenMentor } = require('../trung_gian/kiemTraQuyen');

// Áp dụng xác thực đăng nhập cho tất cả các endpoint khóa học
boDinhTuyen.use(xacThucToken);

// Lấy danh sách khóa học (tự động phân loại theo Intern hoặc Mentor)
boDinhTuyen.get('/', layDanhSachKhoaHoc);

// Lấy chi tiết một khóa học cụ thể
boDinhTuyen.get('/:id', layChiTietKhoaHoc);

// Cập nhật tiến độ hoàn thành bài học (dành cho thực tập sinh)
boDinhTuyen.post('/cap-nhat-tien-do', capNhatTienDoHocTap);

// Các thao tác quản trị (chỉ dành cho Mentor / Quản lý)
boDinhTuyen.post('/', yeuCauQuyenMentor, themKhoaHocMoi);
boDinhTuyen.put('/:id', yeuCauQuyenMentor, capNhatKhoaHoc);
boDinhTuyen.delete('/:id', yeuCauQuyenMentor, xoaKhoaHoc);

// Quản lý chương và bài học
boDinhTuyen.post('/chuong', yeuCauQuyenMentor, themChuongMoi);
boDinhTuyen.post('/bai-hoc', yeuCauQuyenMentor, themBaiHocMoi);
boDinhTuyen.delete('/bai-hoc/:id', yeuCauQuyenMentor, xoaBaiHoc);

// Phân công khóa học cho thực tập sinh
boDinhTuyen.post('/phan-cong', yeuCauQuyenMentor, phanCongKhoaHocChoNguoiDung);

module.exports = boDinhTuyen;
