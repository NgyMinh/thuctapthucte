/**
 * Middleware trung gian kiểm tra xác thực JWT và phân quyền người dùng (RBAC)
 * Đảm bảo chỉ người dùng có quyền hợp lệ mới được truy cập phân hệ tương ứng
 */

const jwt = require('jsonwebtoken');
const { khoaBiMatJwt } = require('../cau_hinh/cauHinhHeThong');

/**
 * Hàm trung gian xác thực Token từ Header Authorization hoặc Cookie
 * @param {Object} yeuCau - Yêu cầu từ Client (Request)
 * @param {Object} phanHoi - Phản hồi tới Client (Response)
 * @param {Function} tiepTuc - Hàm chuyển tiếp tới middleware/controller tiếp theo
 */
function xacThucToken(yeuCau, phanHoi, tiepTuc) {
    let chuoiToken = null;

    // Lấy token từ Header 'Authorization: Bearer <token>'
    const tieuDeXacThuc = yeuCau.headers['authorization'];
    if (tieuDeXacThuc && tieuDeXacThuc.startsWith('Bearer ')) {
        chuoiToken = tieuDeXacThuc.split(' ')[1];
    } else if (yeuCau.cookies && yeuCau.cookies.token_fpt) {
        // Hoặc lấy token từ Cookie nếu có
        chuoiToken = yeuCau.cookies.token_fpt;
    }

    if (!chuoiToken) {
        return phanHoi.status(401).json({
            thanhCong: false,
            thongBao: 'Vui lòng đăng nhập để tiếp tục truy cập hệ thống!'
        });
    }

    try {
        const duLieuGiaiMa = jwt.verify(chuoiToken, khoaBiMatJwt);
        // Gán thông tin người dùng đã xác thực vào request để controller sử dụng
        yeuCau.nguoiDungHienTai = duLieuGiaiMa;
        tiepTuc();
    } catch (loiXacThuc) {
        return phanHoi.status(401).json({
            thanhCong: false,
            thongBao: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
        });
    }
}

/**
 * Hàm phân quyền yêu cầu vai trò Người hướng dẫn / Quản lý (Mentor / Admin)
 */
function yeuCauQuyenMentor(yeuCau, phanHoi, tiepTuc) {
    if (!yeuCau.nguoiDungHienTai) {
        return phanHoi.status(401).json({
            thanhCong: false,
            thongBao: 'Yêu cầu đăng nhập trước khi thực hiện thao tác này!'
        });
    }

    if (yeuCau.nguoiDungHienTai.vaiTro !== 'nguoi_huong_dan') {
        return phanHoi.status(403).json({
            thanhCong: false,
            thongBao: 'Từ chối truy cập: Bạn không có quyền Người hướng dẫn / Quản trị viên!'
        });
    }

    tiepTuc();
}

/**
 * Hàm phân quyền cho Thực tập sinh (Intern)
 */
function yeuCauQuyenIntern(yeuCau, phanHoi, tiepTuc) {
    if (!yeuCau.nguoiDungHienTai) {
        return phanHoi.status(401).json({
            thanhCong: false,
            thongBao: 'Yêu cầu đăng nhập trước khi thực hiện thao tác này!'
        });
    }

    if (yeuCau.nguoiDungHienTai.vaiTro !== 'thuc_tap_sinh' && yeuCau.nguoiDungHienTai.vaiTro !== 'nguoi_huong_dan') {
        return phanHoi.status(403).json({
            thanhCong: false,
            thongBao: 'Từ chối truy cập: Tài khoản không có quyền làm bài hoặc học tập!'
        });
    }

    tiepTuc();
}

module.exports = {
    xacThucToken,
    yeuCauQuyenMentor,
    yeuCauQuyenIntern
};
