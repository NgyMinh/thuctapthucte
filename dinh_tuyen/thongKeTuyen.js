/**
 * Định tuyến các API thống kê, báo cáo bảng điểm và quản lý thực tập sinh
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const {
    layThongKeTongQuanMentor,
    layThongKeTongQuanIntern,
    layBangDiemTongHop,
    layDanhSachThucTapSinh
} = require('../dieu_khien/thongKeDieuKhien');
const { xacThucToken, yeuCauQuyenMentor } = require('../trung_gian/kiemTraQuyen');

boDinhTuyen.use(xacThucToken);

// Thống kê tổng quan cho màn hình Dashboard
boDinhTuyen.get('/tong-quan-mentor', yeuCauQuyenMentor, layThongKeTongQuanMentor);
boDinhTuyen.get('/tong-quan-intern', layThongKeTongQuanIntern);

// Bảng điểm tổng hợp với khoảng cách rộng rãi, bộ lọc nâng cao
boDinhTuyen.get('/bang-diem', yeuCauQuyenMentor, layBangDiemTongHop);

// Danh sách quản lý thực tập sinh
boDinhTuyen.get('/thuc-tap-sinh', yeuCauQuyenMentor, layDanhSachThucTapSinh);

module.exports = boDinhTuyen;
