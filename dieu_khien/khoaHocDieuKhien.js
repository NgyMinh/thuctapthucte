/**
 * Điều khiển quản lý khóa học, bài học và theo dõi tiến độ đào tạo
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');

/**
 * Hàm lấy danh sách khóa học phù hợp với vai trò người dùng
 * - Thực tập sinh: Chỉ xem các khóa học được phân công cùng phần trăm tiến độ
 * - Người hướng dẫn: Xem toàn bộ các khóa học đang quản lý
 */
async function layDanhSachKhoaHoc(yeuCau, phanHoi) {
    try {
        const nguoiDung = yeuCau.nguoiDungHienTai;

        if (nguoiDung.vaiTro === 'thuc_tap_sinh') {
            // Lấy danh sách khóa học được phân công cho thực tập sinh hiện tại
            const cauLenh = `
                SELECT 
                    kh.id, 
                    kh.ma_khoa_hoc, 
                    kh.tieu_de, 
                    kh.mo_ta, 
                    kh.anh_khoa_hoc, 
                    kh.thoi_luong_gio, 
                    kh.trang_thai,
                    pc.ngay_phan_cong,
                    pc.han_hoan_thanh,
                    pc.trang_thai AS trang_thai_hoc,
                    (SELECT COUNT(*) FROM bai_hoc bh WHERE bh.khoa_hoc_id = kh.id) AS tong_so_bai_hoc,
                    (SELECT COUNT(*) FROM tien_do_bai_hoc td 
                     WHERE td.khoa_hoc_id = kh.id AND td.nguoiDung_id = ? AND td.da_hoan_thanh = 1) AS so_bai_da_hoan_thanh
                FROM phan_cong_khoa_hoc pc
                JOIN khoa_hoc kh ON pc.khoa_hoc_id = kh.id
                WHERE pc.nguoiDung_id = ?
                ORDER BY pc.ngay_phan_cong DESC
            `;
            // Chú ý: Cột người dùng trong bảng là nguoi_dung_id
            const cauLenhChuan = `
                SELECT 
                    kh.id, 
                    kh.ma_khoa_hoc, 
                    kh.tieu_de, 
                    kh.mo_ta, 
                    kh.anh_khoa_hoc, 
                    kh.thoi_luong_gio, 
                    kh.trang_thai,
                    pc.ngay_phan_cong,
                    pc.han_hoan_thanh,
                    pc.trang_thai AS trang_thai_hoc,
                    (SELECT COUNT(*) FROM bai_hoc bh WHERE bh.khoa_hoc_id = kh.id) AS tong_so_bai_hoc,
                    (SELECT COUNT(*) FROM tien_do_bai_hoc td 
                     WHERE td.khoa_hoc_id = kh.id AND td.nguoi_dung_id = ? AND td.da_hoan_thanh = 1) AS so_bai_da_hoan_thanh
                FROM phan_cong_khoa_hoc pc
                JOIN khoa_hoc kh ON pc.khoa_hoc_id = kh.id
                WHERE pc.nguoi_dung_id = ?
                ORDER BY pc.ngay_phan_cong DESC
            `;
            const danhSachKhoaHoc = await thucThiTruyVan(cauLenhChuan, [nguoiDung.id, nguoiDung.id]);

            // Tính toán phần trăm tiến độ học tập
            const danhSachKemTienDo = danhSachKhoaHoc.map(khoaHoc => {
                const tongBai = khoaHoc.tong_so_bai_hoc || 0;
                const baiXong = khoaHoc.so_bai_da_hoan_thanh || 0;
                const phanTram = tongBai > 0 ? Math.round((baiXong / tongBai) * 100) : 0;
                return {
                    ...khoaHoc,
                    phanTramTienDo: phanTram
                };
            });

            return phanHoi.status(200).json({
                thanhCong: true,
                duLieu: danhSachKemTienDo
            });
        } else {
            // Dành cho Người hướng dẫn / Quản trị viên
            const cauLenhAdmin = `
                SELECT 
                    kh.id, 
                    kh.ma_khoa_hoc, 
                    kh.tieu_de, 
                    kh.mo_ta, 
                    kh.anh_khoa_hoc, 
                    kh.thoi_luong_gio, 
                    kh.trang_thai,
                    kh.ngay_tao,
                    nd.ho_ten AS ten_nguoi_tao,
                    (SELECT COUNT(*) FROM chuong_bai_hoc c WHERE c.khoa_hoc_id = kh.id) AS tong_so_chuong,
                    (SELECT COUNT(*) FROM bai_hoc bh WHERE bh.khoa_hoc_id = kh.id) AS tong_so_bai_hoc,
                    (SELECT COUNT(*) FROM phan_cong_khoa_hoc pc WHERE pc.khoa_hoc_id = kh.id) AS so_hoc_vien_tham_gia
                FROM khoa_hoc kh
                LEFT JOIN nguoi_dung nd ON kh.nguoi_tao_id = nd.id
                ORDER BY kh.ngay_tao DESC
            `;
            const danhSachKhoaHoc = await thucThiTruyVan(cauLenhAdmin);

            return phanHoi.status(200).json({
                thanhCong: true,
                duLieu: danhSachKhoaHoc
            });
        }
    } catch (loi) {
        console.error('[LỖI LẤY DANH SÁCH KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải danh sách khóa học.'
        });
    }
}

/**
 * Hàm lấy chi tiết khóa học, bao gồm các chương và bài học bên trong
 */
async function layChiTietKhoaHoc(yeuCau, phanHoi) {
    try {
        const idKhoaHoc = yeuCau.params.id;
        const nguoiDung = yeuCau.nguoiDungHienTai;

        const cauLenhKhoaHoc = `SELECT * FROM khoa_hoc WHERE id = ?`;
        const danhSachKhoaHoc = await thucThiTruyVan(cauLenhKhoaHoc, [idKhoaHoc]);

        if (danhSachKhoaHoc.length === 0) {
            return phanHoi.status(404).json({
                thanhCong: false,
                thongBao: 'Không tìm thấy thông tin khóa học yêu cầu!'
            });
        }

        const thongTinKhoaHoc = danhSachKhoaHoc[0];

        // Lấy danh sách chương bài học
        const cauLenhChuong = `SELECT * FROM chuong_bai_hoc WHERE khoa_hoc_id = ? ORDER BY thu_tu ASC`;
        const danhSachChuong = await thucThiTruyVan(cauLenhChuong, [idKhoaHoc]);

        // Lấy danh sách toàn bộ bài học của khóa học kèm trạng thái hoàn thành nếu là thực tập sinh
        let cauLenhBaiHoc = `
            SELECT 
                bh.id, 
                bh.chuong_id, 
                bh.khoa_hoc_id, 
                bh.tieu_de_bai_hoc, 
                bh.loai_bai_hoc, 
                bh.duong_dan_noi_dung, 
                bh.noi_dung_van_ban, 
                bh.thoi_luong_phut, 
                bh.thu_tu,
                COALESCE(td.da_hoan_thanh, 0) AS da_hoan_thanh
            FROM bai_hoc bh
            LEFT JOIN tien_do_bai_hoc td ON bh.id = td.bai_hoc_id AND td.nguoi_dung_id = ?
            WHERE bh.khoa_hoc_id = ?
            ORDER BY bh.thu_tu ASC
        `;
        const danhSachBaiHoc = await thucThiTruyVan(cauLenhBaiHoc, [nguoiDung.id, idKhoaHoc]);

        // Nhóm bài học theo từng chương
        const danhSachChuongKemBaiHoc = danhSachChuong.map(chuong => {
            const cacBaiThuocChuong = danhSachBaiHoc.filter(b => b.chuong_id === chuong.id);
            return {
                ...chuong,
                danhSachBaiHoc: cacBaiThuocChuong
            };
        });

        // Tính tổng phần trăm hoàn thành của khóa học
        const tongSoBai = danhSachBaiHoc.length;
        const soBaiHoanThanh = danhSachBaiHoc.filter(b => b.da_hoan_thanh == 1).length;
        const phanTramHoanThanh = tongSoBai > 0 ? Math.round((soBaiHoanThanh / tongSoBai) * 100) : 0;

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: {
                ...thongTinKhoaHoc,
                tongSoBai,
                soBaiHoanThanh,
                phanTramHoanThanh,
                danhSachChuong: danhSachChuongKemBaiHoc
            }
        });

    } catch (loi) {
        console.error('[LỖI LẤY CHI TIẾT KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải nội dung khóa học.'
        });
    }
}

/**
 * Hàm đánh dấu bài học đã hoàn thành hoặc chưa hoàn thành (Cập nhật tiến độ)
 */
async function capNhatTienDoHocTap(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const { idBaiHoc, idKhoaHoc, daHoanThanh } = yeuCau.body;

        if (!idBaiHoc || !idKhoaHoc) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Thiếu thông tin mã bài học hoặc khóa học!'
            });
        }

        const trangThaiMoi = daHoanThanh ? 1 : 0;
        const thoiGianHoanThanh = trangThaiMoi ? new Date() : null;

        // Lưu hoặc cập nhật trạng thái bài học vào bảng tien_do_bai_hoc
        const cauLenh = `
            INSERT INTO tien_do_bai_hoc (nguoi_dung_id, bai_hoc_id, khoa_hoc_id, da_hoan_thanh, ngay_hoan_thanh)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE da_hoan_thanh = VALUES(da_hoan_thanh), ngay_hoan_thanh = VALUES(ngay_hoan_thanh)
        `;
        await thucThiTruyVan(cauLenh, [idNguoiDung, idBaiHoc, idKhoaHoc, trangThaiMoi, thoiGianHoanThanh]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: trangThaiMoi ? 'Đã ghi nhận hoàn thành bài học!' : 'Đã bỏ đánh dấu hoàn thành bài học.',
            daHoanThanh: trangThaiMoi
        });

    } catch (loi) {
        console.error('[LỖI CẬP NHẬT TIẾN ĐỘ]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi ghi nhận tiến độ học tập.'
        });
    }
}

/**
 * Hàm thêm mới khóa học đào tạo (Dành cho Mentor / Quản lý)
 */
async function themKhoaHocMoi(yeuCau, phanHoi) {
    try {
        const idNguoiTao = yeuCau.nguoiDungHienTai.id;
        const { maKhoaHoc, tieuDe, moTa, anhKhoaHoc, thoiLuongGio } = yeuCau.body;

        if (!maKhoaHoc || !tieuDe) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Mã khóa học và tiêu đề không được để trống!'
            });
        }

        const cauLenhThem = `
            INSERT INTO khoa_hoc (ma_khoa_hoc, tieu_de, mo_ta, anh_khoa_hoc, thoi_luong_gio, nguoi_tao_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const ketQua = await thucThiTruyVan(cauLenhThem, [
            maKhoaHoc.trim().toUpperCase(),
            tieuDe.trim(),
            moTa || '',
            anhKhoaHoc || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
            parseInt(thoiLuongGio, 10) || 40,
            idNguoiTao
        ]);

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Thêm mới khóa học đào tạo thành công!',
            khoaHocId: ketQua.insertId
        });
    } catch (loi) {
        console.error('[LỖI THÊM KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi khi tạo khóa học mới: ' + (loi.code === 'ER_DUP_ENTRY' ? 'Mã khóa học đã tồn tại!' : loi.message)
        });
    }
}

/**
 * Hàm cập nhật thông tin khóa học
 */
async function capNhatKhoaHoc(yeuCau, phanHoi) {
    try {
        const idKhoaHoc = yeuCau.params.id;
        const { tieuDe, moTa, anhKhoaHoc, thoiLuongGio, trangThai } = yeuCau.body;

        const cauLenhSua = `
            UPDATE khoa_hoc 
            SET tieu_de = ?, mo_ta = ?, anh_khoa_hoc = ?, thoi_luong_gio = ?, trang_thai = ?
            WHERE id = ?
        `;
        await thucThiTruyVan(cauLenhSua, [tieuDe, moTa, anhKhoaHoc, thoiLuongGio, trangThai, idKhoaHoc]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Cập nhật thông tin khóa học thành công!'
        });
    } catch (loi) {
        console.error('[LỖI SỬA KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi cập nhật khóa học.'
        });
    }
}

/**
 * Hàm xóa khóa học
 */
async function xoaKhoaHoc(yeuCau, phanHoi) {
    try {
        const idKhoaHoc = yeuCau.params.id;
        await thucThiTruyVan('DELETE FROM khoa_hoc WHERE id = ?', [idKhoaHoc]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Đã xóa khóa học thành công!'
        });
    } catch (loi) {
        console.error('[LỖI XÓA KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi xóa khóa học.'
        });
    }
}

/**
 * Hàm thêm chương mới vào khóa học
 */
async function themChuongMoi(yeuCau, phanHoi) {
    try {
        const { khoaHocId, tieuDeChuong, thuTu } = yeuCau.body;
        if (!khoaHocId || !tieuDeChuong) {
            return phanHoi.status(400).json({ thanhCong: false, thongBao: 'Vui lòng cung cấp tiêu đề chương!' });
        }

        const cauLenh = `INSERT INTO chuong_bai_hoc (khoa_hoc_id, tieu_de_chuong, thu_tu) VALUES (?, ?, ?)`;
        const ketQua = await thucThiTruyVan(cauLenh, [khoaHocId, tieuDeChuong, thuTu || 1]);

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Thêm chương học thành công!',
            chuongId: ketQua.insertId
        });
    } catch (loi) {
        console.error('[LỖI THÊM CHƯƠNG]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi khi thêm chương học!' });
    }
}

/**
 * Hàm thêm bài học chi tiết (Video / Tài liệu PDF / Slide / Văn bản)
 */
async function themBaiHocMoi(yeuCau, phanHoi) {
    try {
        const { chuongId, khoaHocId, tieuDeBaiHoc, loaiBaiHoc, duongDanNoiDung, noiDungVanBan, thoiLuongPhut, thuTu } = yeuCau.body;

        if (!chuongId || !khoaHocId || !tieuDeBaiHoc) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng nhập đầy đủ tiêu đề và chương bài học!'
            });
        }

        const cauLenh = `
            INSERT INTO bai_hoc (chuong_id, khoa_hoc_id, tieu_de_bai_hoc, loai_bai_hoc, duong_dan_noi_dung, noi_dung_van_ban, thoi_luong_phut, thu_tu)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const ketQua = await thucThiTruyVan(cauLenh, [
            chuongId,
            khoaHocId,
            tieuDeBaiHoc,
            loaiBaiHoc || 'video',
            duongDanNoiDung || '',
            noiDungVanBan || '',
            parseInt(thoiLuongPhut, 10) || 30,
            parseInt(thuTu, 10) || 1
        ]);

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Thêm bài học mới thành công!',
            baiHocId: ketQua.insertId
        });
    } catch (loi) {
        console.error('[LỖI THÊM BÀI HỌC]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi khi tạo bài học mới!' });
    }
}

/**
 * Hàm xóa bài học
 */
async function xoaBaiHoc(yeuCau, phanHoi) {
    try {
        const idBaiHoc = yeuCau.params.id;
        await thucThiTruyVan('DELETE FROM bai_hoc WHERE id = ?', [idBaiHoc]);
        return phanHoi.status(200).json({ thanhCong: true, thongBao: 'Đã xóa bài học thành công!' });
    } catch (loi) {
        console.error('[LỖI XÓA BÀI HỌC]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi khi xóa bài học!' });
    }
}

/**
 * Hàm phân công khóa học cho thực tập sinh
 */
async function phanCongKhoaHocChoNguoiDung(yeuCau, phanHoi) {
    try {
        const { khoaHocId, nguoiDungId, hanHoanThanh } = yeuCau.body;

        if (!khoaHocId || !nguoiDungId) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng chọn khóa học và thực tập sinh cần phân công!'
            });
        }

        const cauLenh = `
            INSERT INTO phan_cong_khoa_hoc (khoa_hoc_id, nguoi_dung_id, han_hoan_thanh, trang_thai)
            VALUES (?, ?, ?, 'dang_hoc')
            ON DUPLICATE KEY UPDATE han_hoan_thanh = VALUES(han_hoan_thanh)
        `;
        await thucThiTruyVan(cauLenh, [khoaHocId, nguoiDungId, hanHoanThanh || null]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Phân công khóa học cho thực tập sinh thành công!'
        });
    } catch (loi) {
        console.error('[LỖI PHÂN CÔNG KHÓA HỌC]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi khi phân công khóa học!' });
    }
}

module.exports = {
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
};
