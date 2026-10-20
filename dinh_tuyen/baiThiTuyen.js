/**
 * Định tuyến các API làm bài thi trắc nghiệm trực tuyến (Chức năng cốt lõi)
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const express = require('express');
const boDinhTuyen = express.Router();
const {
    batDauLamBaiThi,
    luuTamDapAnCauHoi,
    nopBaiThiTrucTuyen,
    layKetQuaChiTietBaiThi,
    layLichSuThi
} = require('../dieu_khien/baiThiDieuKhien');
const { xacThucToken, yeuCauQuyenIntern } = require('../trung_gian/kiemTraQuyen');

boDinhTuyen.use(xacThucToken);

// Bắt đầu vào phòng thi (Exam Focus Mode)
boDinhTuyen.post('/bat-dau/:idDeThi', yeuCauQuyenIntern, batDauLamBaiThi);

// Tự động lưu đáp án tạm thời (Auto-save) sau mỗi lựa chọn
boDinhTuyen.post('/luu-tam', yeuCauQuyenIntern, luuTamDapAnCauHoi);

// Nộp bài thi trực tuyến và chấm điểm tự động
boDinhTuyen.post('/nop-bai', yeuCauQuyenIntern, nopBaiThiTrucTuyen);

// Xem kết quả chi tiết của bài thi vừa nộp
boDinhTuyen.get('/ket-qua/:id', layKetQuaChiTietBaiThi);

// Xem lại lịch sử các lần thi của cá nhân
boDinhTuyen.get('/lich-su', layLichSuThi);

module.exports = boDinhTuyen;
