/**
 * Điều khiển xử lý đăng nhập, xác thực và quản lý tài khoản người dùng
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');
const { khoaBiMatJwt, thoiHanToken } = require('../cau_hinh/cauHinhHeThong');

/**
 * Hàm xử lý đăng nhập hệ thống dựa trên RBAC (Role-Based Access Control)
 * Tự động kiểm tra vai trò người dùng trong CSDL và phản hồi đường dẫn chuyển hướng chính xác
 */
async function dangNhapNguoiDung(yeuCau, phanHoi) {
    try {
        const { taiKhoan, matKhau } = yeuCau.body;

        if (!taiKhoan || !matKhau) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng nhập đầy đủ tên đăng nhập hoặc email và mật khẩu!'
            });
        }

        // Tìm người dùng theo tên đăng nhập hoặc email
        const cauLenhTim = `
            SELECT id, ma_nguoi_dung, ho_ten, ten_dang_nhap, email, mat_khau, vai_tro, nhom_thuc_tap, anh_dai_dien 
            FROM nguoi_dung 
            WHERE ten_dang_nhap = ? OR email = ?
            LIMIT 1
        `;
        const danhSachTimThay = await thucThiTruyVan(cauLenhTim, [taiKhoan.trim(), taiKhoan.trim()]);

        if (danhSachTimThay.length === 0) {
            return phanHoi.status(401).json({
                thanhCong: false,
                thongBao: 'Tài khoản hoặc email không tồn tại trong hệ thống đào tạo FPT!'
            });
        }

        const nguoiDung = danhSachTimThay[0];

        // Kiểm tra mật khẩu mã hóa bằng bcrypt
        const matKhauChinhXac = await bcrypt.compare(matKhau, nguoiDung.mat_khau);
        if (!matKhauChinhXac) {
            return phanHoi.status(401).json({
                thanhCong: false,
                thongBao: 'Mật khẩu đăng nhập không chính xác. Vui lòng thử lại!'
            });
        }

        // Tạo JWT Token chứa vai trò và thông tin định danh
        const duLieuToken = {
            id: nguoiDung.id,
            maNguoiDung: nguoiDung.ma_nguoi_dung,
            hoTen: nguoiDung.ho_ten,
            email: nguoiDung.email,
            vaiTro: nguoiDung.vai_tro,
            nhomThucTap: nguoiDung.nhom_thuc_tap
        };

        const maToken = jwt.sign(duLieuToken, khoaBiMatJwt, { expiresIn: thoiHanToken });

        // Lưu cookie bảo mật
        phanHoi.cookie('token_fpt', maToken, {
            httpOnly: false, // Để JavaScript frontend có thể đọc và đồng bộ trạng thái
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        // Xác định đường dẫn điều hướng tương ứng với vai trò
        const duongDanChuyenHuong = nguoiDung.vai_tro === 'nguoi_huong_dan'
            ? '/giao-dien/quan-tri/tong-quan.html'
            : '/giao-dien/thuc-tap-sinh/tong-quan.html';

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: `Đăng nhập thành công! Chào mừng ${nguoiDung.ho_ten} trở lại hệ thống.`,
            token: maToken,
            vaiTro: nguoiDung.vai_tro,
            duongDanChuyenHuong,
            nguoiDung: {
                id: nguoiDung.id,
                maNguoiDung: nguoiDung.ma_nguoi_dung,
                hoTen: nguoiDung.ho_ten,
                email: nguoiDung.email,
                vaiTro: nguoiDung.vai_tro,
                nhomThucTap: nguoiDung.nhom_thuc_tap,
                anhDaiDien: nguoiDung.anh_dai_dien
            }
        });

    } catch (loiXuLy) {
        console.error('[LỖI ĐĂNG NHẬP]:', loiXuLy);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Đã xảy ra sự cố trong quá trình đăng nhập. Vui lòng thử lại sau!'
        });
    }
}

/**
 * Hàm lấy thông tin cá nhân của người dùng hiện tại đang đăng nhập
 */
async function layThongTinCaNhan(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const cauLenh = `
            SELECT id, ma_nguoi_dung, ho_ten, ten_dang_nhap, email, so_dien_thoai, vai_tro, nhom_thuc_tap, anh_dai_dien, ngay_tao
            FROM nguoi_dung
            WHERE id = ?
        `;
        const ketQua = await thucThiTruyVan(cauLenh, [idNguoiDung]);

        if (ketQua.length === 0) {
            return phanHoi.status(404).json({
                thanhCong: false,
                thongBao: 'Không tìm thấy thông tin tài khoản người dùng!'
            });
        }

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: ketQua[0]
        });
    } catch (loi) {
        console.error('[LỖI LẤY THÔNG TIN CÁ NHÂN]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi hệ thống khi tải thông tin hồ sơ cá nhân.'
        });
    }
}

/**
 * Hàm xử lý đổi mật khẩu cá nhân
 */
async function doiMatKhau(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const { matKhauCu, matKhauMoi } = yeuCau.body;

        if (!matKhauCu || !matKhauMoi) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!'
            });
        }

        if (matKhauMoi.length < 6) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên!'
            });
        }

        const danhSachNguoiDung = await thucThiTruyVan('SELECT mat_khau FROM nguoi_dung WHERE id = ?', [idNguoiDung]);
        if (danhSachNguoiDung.length === 0) {
            return phanHoi.status(404).json({ thanhCong: false, thongBao: 'Người dùng không tồn tại!' });
        }

        const khopMatKhauCu = await bcrypt.compare(matKhauCu, danhSachNguoiDung[0].mat_khau);
        if (!khopMatKhauCu) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại!'
            });
        }

        // Băm mật khẩu mới
        const matKhauBcrypt = await bcrypt.hash(matKhauMoi, 10);
        await thucThiTruyVan('UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?', [matKhauBcrypt, idNguoiDung]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Cập nhật mật khẩu mới thành công!'
        });
    } catch (loi) {
        console.error('[LỖI ĐỔI MẬT KHẨU]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi cập nhật mật khẩu!'
        });
    }
}

/**
 * Hàm đăng xuất khỏi hệ thống
 */
function dangXuat(yeuCau, phanHoi) {
    phanHoi.clearCookie('token_fpt');
    return phanHoi.status(200).json({
        thanhCong: true,
        thongBao: 'Đăng xuất thành công khỏi hệ thống.'
    });
}

/**
 * Hàm xử lý đăng ký tài khoản người dùng mới (Mặc định vai trò: Thực tập sinh / Người học)
 * Bao gồm kiểm tra hợp lệ dữ liệu toàn diện, kiểm tra trùng lặp và băm mật khẩu bảo mật
 */
async function dangKyTaiKhoan(yeuCau, phanHoi) {
    try {
        const { hoTen, tenDangNhap, email, matKhau, xacNhanMatKhau, soDienThoai, nhomThucTap } = yeuCau.body;

        // 1. Kiểm tra các trường bắt buộc
        if (!hoTen || !tenDangNhap || !email || !matKhau || !xacNhanMatKhau) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng điền đầy đủ các thông tin bắt buộc: Họ và tên, Tên đăng nhập, Email, Mật khẩu và Xác nhận mật khẩu!'
            });
        }

        const hoTenChuan = hoTen.trim();
        const tenDangNhapChuan = tenDangNhap.trim().toLowerCase();
        const emailChuan = email.trim().toLowerCase();

        // 2. Kiểm tra độ dài và định dạng Họ và tên
        if (hoTenChuan.length < 2 || hoTenChuan.length > 100) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự!'
            });
        }

        // 3. Kiểm tra định dạng Tên đăng nhập (chỉ chứa chữ cái, số, gạch dưới, từ 3 đến 30 ký tự)
        const bieuThucTenDangNhap = /^[a-zA-Z0-9_]{3,30}$/;
        if (!bieuThucTenDangNhap.test(tenDangNhapChuan)) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Tên đăng nhập phải có từ 3 đến 30 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới, không chứa khoảng trắng!'
            });
        }

        // 4. Kiểm tra định dạng Email chuẩn RFC
        const bieuThucEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!bieuThucEmail.test(emailChuan)) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Địa chỉ Email không đúng định dạng. Vui lòng kiểm tra lại!'
            });
        }

        // 5. Kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự)
        if (matKhau.length < 6) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!'
            });
        }

        // 6. Kiểm tra khớp mật khẩu
        if (matKhau !== xacNhanMatKhau) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập!'
            });
        }

        // 7. Kiểm tra trùng lặp Email hoặc Tên đăng nhập trong CSDL
        const cauLenhKiemTraTrung = `
            SELECT id, email, ten_dang_nhap 
            FROM nguoi_dung 
            WHERE email = ? OR ten_dang_nhap = ? 
            LIMIT 1
        `;
        const danhSachTrung = await thucThiTruyVan(cauLenhKiemTraTrung, [emailChuan, tenDangNhapChuan]);

        if (danhSachTrung.length > 0) {
            const banGhiTrung = danhSachTrung[0];
            if (banGhiTrung.email.toLowerCase() === emailChuan) {
                return phanHoi.status(409).json({
                    thanhCong: false,
                    thongBao: 'Địa chỉ Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng Email khác hoặc đăng nhập!'
                });
            }
            if (banGhiTrung.ten_dang_nhap.toLowerCase() === tenDangNhapChuan) {
                return phanHoi.status(409).json({
                    thanhCong: false,
                    thongBao: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn một tên đăng nhập khác!'
                });
            }
        }

        // 8. Tự động sinh mã người dùng duy nhất chuẩn Thực tập sinh FPT (FPT_INT_...)
        const [ketQuaMaxId] = await thucThiTruyVan('SELECT MAX(id) AS idLonNhat FROM nguoi_dung');
        const soThuTu = (ketQuaMaxId.idLonNhat || 0) + 1;
        const chuoiNgauNhien = Math.floor(100 + Math.random() * 900);
        const maNguoiDungMoi = `FPT_INT_${String(soThuTu).padStart(3, '0')}_${chuoiNgauNhien}`;

        // 9. Băm mật khẩu bằng thuật toán Bcrypt an toàn
        const matKhauBcrypt = await bcrypt.hash(matKhau, 10);

        // 10. Chèn người dùng mới vào bảng nguoi_dung (Luôn luôn gán vai_tro = 'thuc_tap_sinh')
        const cauLenhThemNguoiDung = `
            INSERT INTO nguoi_dung (
                ma_nguoi_dung, ho_ten, ten_dang_nhap, email, 
                mat_khau, so_dien_thoai, vai_tro, nhom_thuc_tap, anh_dai_dien
            ) VALUES (?, ?, ?, ?, ?, ?, 'thuc_tap_sinh', ?, ?)
        `;

        const soDienThoaiLuu = soDienThoai ? soDienThoai.trim() : null;
        const nhomThucTapLuu = nhomThucTap ? nhomThucTap.trim() : 'Fresher K18';
        const anhDaiDienMacDinh = '/giao-dien/hinh-anh/avatar-mac-dinh.png';

        const ketQuaThem = await thucThiTruyVan(cauLenhThemNguoiDung, [
            maNguoiDungMoi,
            hoTenChuan,
            tenDangNhapChuan,
            emailChuan,
            matKhauBcrypt,
            soDienThoaiLuu,
            nhomThucTapLuu,
            anhDaiDienMacDinh
        ]);

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Đăng ký tài khoản thành công! Chào mừng bạn gia nhập chương trình đào tạo FPT Software. Vui lòng đăng nhập để tiếp tục.',
            maNguoiDung: maNguoiDungMoi,
            id: ketQuaThem.insertId,
            duongDanChuyenHuong: '/giao-dien/dang-nhap.html'
        });

    } catch (loiXuLy) {
        console.error('[LỖI ĐĂNG KÝ TÀI KHOẢN]:', loiXuLy);

        // Bắt lỗi trùng lặp do xung đột đồng thời (Concurrency / Race condition)
        if (loiXuLy.code === 'ER_DUP_ENTRY' || loiXuLy.errno === 1062) {
            return phanHoi.status(409).json({
                thanhCong: false,
                thongBao: 'Email hoặc Tên đăng nhập đã được đăng ký bởi người dùng khác trong hệ thống!'
            });
        }

        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Đã xảy ra lỗi máy chủ trong quá trình đăng ký. Vui lòng thử lại sau!'
        });
    }
}

module.exports = {
    dangNhapNguoiDung,
    dangKyTaiKhoan,
    layThongTinCaNhan,
    doiMatKhau,
    dangXuat
};
