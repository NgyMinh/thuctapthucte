/**
 * Máy chủ trung tâm ứng dụng Quản lý đào tạo nội bộ FPT Software
 * Công nghệ: Node.js (Express.js) & MySQL
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { congMayChu } = require('./cau_hinh/cauHinhHeThong');
const { kiemTraKetNoiCoSoDuLieu } = require('./cau_hinh/ketNoiCoSoDuLieu');

// Nạp các tuyến API nghiệp vụ
const xacThucTuyen = require('./dinh_tuyen/xacThucTuyen');
const khoaHocTuyen = require('./dinh_tuyen/khoaHocTuyen');
const cauHoiTuyen = require('./dinh_tuyen/cauHoiTuyen');
const deThiTuyen = require('./dinh_tuyen/deThiTuyen');
const baiThiTuyen = require('./dinh_tuyen/baiThiTuyen');
const thongKeTuyen = require('./dinh_tuyen/thongKeTuyen');

// Khởi tạo ứng dụng Express
const ungDung = express();

// Cấu hình các middleware cơ bản
ungDung.use(cors());
ungDung.use(express.json());
ungDung.use(express.urlencoded({ extended: true }));
ungDung.use(cookieParser());

// Cấu hình phục vụ các tệp tĩnh (Giao diện HTML/CSS/JS/Hình ảnh)
ungDung.use('/giao-dien', express.static(path.join(__dirname, 'giao_dien')));
ungDung.use('/cong-khai', express.static(path.join(__dirname, 'cong_khai')));

// Điều hướng trang chủ mặc định về màn hình Đăng nhập
ungDung.get('/', (yeuCau, phanHoi) => {
    phanHoi.redirect('/giao-dien/dang-nhap.html');
});

// Đăng ký các bộ định tuyến RESTful API
ungDung.use('/api/xac-thuc', xacThucTuyen);
ungDung.use('/api/khoa-hoc', khoaHocTuyen);
ungDung.use('/api/cau-hoi', cauHoiTuyen);
ungDung.use('/api/de-thi', deThiTuyen);
ungDung.use('/api/bai-thi', baiThiTuyen);
ungDung.use('/api/thong-ke', thongKeTuyen);

// Xử lý trang lỗi 404 cho các API không tồn tại
ungDung.use((yeuCau, phanHoi) => {
    phanHoi.status(404).json({
        thanhCong: false,
        thongBao: 'Đường dẫn API yêu cầu không tồn tại trên hệ thống FPT!'
    });
});

/**
 * Khởi động máy chủ sau khi kiểm tra kết nối CSDL thành công
 */
async function khoiDongMayChu() {
    await kiemTraKetNoiCoSoDuLieu();

    ungDung.listen(congMayChu, () => {
        console.log('================================================================');
        console.log('🚀 HỆ THỐNG TRỰC TUYẾN QUẢN LÝ ĐÀO TẠO NỘI BỘ - FPT SOFTWARE');
        console.log(`🌐 Máy chủ đang chạy tại: http://localhost:${congMayChu}`);
        console.log(`👉 Truy cập giao diện: http://localhost:${congMayChu}/giao-dien/dang-nhap.html`);
        console.log('================================================================');
    });
}

khoiDongMayChu();
