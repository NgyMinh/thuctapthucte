/**
 * Định tuyến các API xác thực, đăng nhập và thông tin tài khoản
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const { dangNhapNguoiDung, layThongTinCaNhan, doiMatKhau, dangXuat } = require('../dieu_khien/xacThucDieuKhien');
const { xacThucToken } = require('../trung_gian/kiemTraQuyen');

// Endpoint đăng nhập phân quyền (RBAC)
boDinhTuyen.post('/dang-nhap', dangNhapNguoiDung);

// Endpoint lấy thông tin cá nhân của người dùng hiện tại
boDinhTuyen.get('/ho-so', xacThucToken, layThongTinCaNhan);

// Endpoint đổi mật khẩu
boDinhTuyen.post('/doi-mat-khau', xacThucToken, doiMatKhau);

// Endpoint đăng xuất
boDinhTuyen.post('/dang-xuat', dangXuat);

module.exports = boDinhTuyen;
