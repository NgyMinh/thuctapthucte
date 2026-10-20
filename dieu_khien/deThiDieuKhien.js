/**
 * Điều khiển quản lý Đề thi và cấu hình Trộn đề tự động
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');

/**
 * Hàm lấy danh sách đề thi theo vai trò
 * - Thực tập sinh: Xem danh sách các bài thi đang mở kèm trạng thái đã làm hay chưa
 * - Người hướng dẫn: Quản lý tất cả đề thi cùng thống kê tổng số bài nộp
 */
async function layDanhSachDeThi(yeuCau, phanHoi) {
    try {
        const nguoiDung = yeuCau.nguoiDungHienTai;

        if (nguoiDung.vaiTro === 'thuc_tap_sinh') {
            const cauLenh = `
                SELECT 
                    dt.id,
                    dt.ma_de_thi,
                    dt.tieu_de_de_thi,
                    dt.mo_ta,
                    dt.thoi_gian_lam_bai_phut,
                    dt.diem_chuan_dat,
                    dt.so_cau_hoi,
                    dt.tong_diem,
                    dt.ngay_bat_dau,
                    dt.ngay_ket_thuc,
                    kh.tieu_de AS ten_khoa_hoc,
                    (SELECT COUNT(*) FROM bai_thi_nguoi_dung bt 
                     WHERE bt.de_thi_id = dt.id AND bt.nguoi_dung_id = ?) AS so_lan_da_thi,
                    (SELECT bt.tong_diem_dat_duoc FROM bai_thi_nguoi_dung bt 
                     WHERE bt.de_thi_id = dt.id AND bt.nguoi_dung_id = ? 
                     ORDER BY bt.id DESC LIMIT 1) AS diem_thi_gan_nhat,
                    (SELECT bt.ket_qua FROM bai_thi_nguoi_dung bt 
                     WHERE bt.de_thi_id = dt.id AND bt.nguoi_dung_id = ? 
                     ORDER BY bt.id DESC LIMIT 1) AS ket_qua_gan_nhat
                FROM de_thi dt
                LEFT JOIN khoa_hoc kh ON dt.khoa_hoc_id = kh.id
                WHERE dt.trang_thai = 'kich_hoat'
                ORDER BY dt.id DESC
            `;
            const danhSachDeThi = await thucThiTruyVan(cauLenh, [nguoiDung.id, nguoiDung.id, nguoiDung.id]);

            return phanHoi.status(200).json({
                thanhCong: true,
                duLieu: danhSachDeThi
            });
        } else {
            // Cho người hướng dẫn
            const cauLenhAdmin = `
                SELECT 
                    dt.id,
                    dt.ma_de_thi,
                    dt.tieu_de_de_thi,
                    dt.mo_ta,
                    dt.thoi_gian_lam_bai_phut,
                    dt.diem_chuan_dat,
                    dt.so_cau_hoi,
                    dt.tong_diem,
                    dt.cho_phep_tron_de,
                    dt.trang_thai,
                    dt.ngay_bat_dau,
                    dt.ngay_ket_thuc,
                    dt.ngay_tao,
                    kh.tieu_de AS ten_khoa_hoc,
                    nd.ho_ten AS ten_nguoi_tao,
                    (SELECT COUNT(*) FROM bai_thi_nguoi_dung bt WHERE bt.de_thi_id = dt.id) AS tong_so_luot_thi,
                    (SELECT COUNT(*) FROM bai_thi_nguoi_dung bt WHERE bt.de_thi_id = dt.id AND bt.ket_qua = 'dat') AS so_luot_dat
                FROM de_thi dt
                LEFT JOIN khoa_hoc kh ON dt.khoa_hoc_id = kh.id
                LEFT JOIN nguoi_dung nd ON dt.nguoi_tao_id = nd.id
                ORDER BY dt.id DESC
            `;
            const danhSachDeThi = await thucThiTruyVan(cauLenhAdmin);

            return phanHoi.status(200).json({
                thanhCong: true,
                duLieu: danhSachDeThi
            });
        }
    } catch (loi) {
        console.error('[LỖI LẤY DANH SÁCH ĐỀ THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải danh sách đề thi.'
        });
    }
}

/**
 * Hàm tạo đề thi mới kèm cấu hình trộn đề hoặc chọn câu hỏi từ ngân hàng
 */
async function taoDeThiMoi(yeuCau, phanHoi) {
    try {
        const idNguoiTao = yeuCau.nguoiDungHienTai.id;
        const {
            maDeThi,
            tieuDeDeThi,
            moTa,
            khoaHocId,
            thoiGianLamBaiPhut,
            diemChuanDat,
            soCauHoi,
            tongDiem,
            choPhepTronDe,
            danhSachCauHoiId, // Mảng ID câu hỏi nếu chỉ định thủ công
            danhSachChuDeId   // Hoặc cấu hình chủ đề để trộn tự động
        } = yeuCau.body;

        if (!maDeThi || !tieuDeDeThi || !thoiGianLamBaiPhut) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng điền đầy đủ mã đề thi, tiêu đề và thời gian làm bài!'
            });
        }

        const soLuongCau = parseInt(soCauHoi, 10) || 10;
        const diemTong = parseFloat(tongDiem) || 10.0;
        const diemMoiCau = (diemTong / soLuongCau).toFixed(2);

        // Lưu thông tin đề thi vào bảng de_thi
        const cauLenhDeThi = `
            INSERT INTO de_thi (
                ma_de_thi, tieu_de_de_thi, mo_ta, khoa_hoc_id, 
                thoi_gian_lam_bai_phut, diem_chuan_dat, so_cau_hoi, 
                tong_diem, cho_phep_tron_de, trang_thai, nguoi_tao_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'kich_hoat', ?)
        `;
        const ketQuaDeThi = await thucThiTruyVan(cauLenhDeThi, [
            maDeThi.trim().toUpperCase(),
            tieuDeDeThi.trim(),
            moTa || '',
            khoaHocId || null,
            parseInt(thoiGianLamBaiPhut, 10),
            parseFloat(diemChuanDat) || 8.0,
            soLuongCau,
            diemTong,
            choPhepTronDe ? 1 : 0,
            idNguoiTao
        ]);

        const idDeThiMoi = ketQuaDeThi.insertId;

        // Nếu người dùng chọn danh sách câu hỏi cụ thể
        if (Array.isArray(danhSachCauHoiId) && danhSachCauHoiId.length > 0) {
            for (let chiSo = 0; chiSo < danhSachCauHoiId.length; chiSo++) {
                const idCauHoi = danhSachCauHoiId[chiSo];
                await thucThiTruyVan(
                    'INSERT INTO de_thi_cau_hoi (de_thi_id, cau_hoi_id, diem_cau_hoi, thu_tu) VALUES (?, ?, ?, ?)',
                    [idDeThiMoi, idCauHoi, diemMoiCau, chiSo + 1]
                );
            }
        } else {
            // Tự động chọn câu hỏi ngẫu nhiên từ ngân hàng theo chủ đề (hoặc toàn bộ ngân hàng)
            let cauLenhLayCauHoi = 'SELECT id FROM ngan_hang_cau_hoi';
            const thamSo = [];
            if (Array.isArray(danhSachChuDeId) && danhSachChuDeId.length > 0) {
                cauLenhLayCauHoi += ' WHERE chu_de_id IN (?)';
                thamSo.push(danhSachChuDeId);
            }
            cauLenhLayCauHoi += ' ORDER BY RAND() LIMIT ?';
            thamSo.push(soLuongCau);

            const danhSachCauHoiRandom = await thucThiTruyVan(cauLenhLayCauHoi, thamSo);

            for (let chiSo = 0; chiSo < danhSachCauHoiRandom.length; chiSo++) {
                const idCauHoi = danhSachCauHoiRandom[chiSo].id;
                await thucThiTruyVan(
                    'INSERT INTO de_thi_cau_hoi (de_thi_id, cau_hoi_id, diem_cau_hoi, thu_tu) VALUES (?, ?, ?, ?)',
                    [idDeThiMoi, idCauHoi, diemMoiCau, chiSo + 1]
                );
            }
        }

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Tạo đề thi mới thành công!',
            deThiId: idDeThiMoi
        });

    } catch (loi) {
        console.error('[LỖI TẠO ĐỀ THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi khi tạo đề thi mới: ' + (loi.code === 'ER_DUP_ENTRY' ? 'Mã đề thi đã tồn tại!' : loi.message)
        });
    }
}

/**
 * Hàm thay đổi trạng thái kích hoạt / đóng đề thi
 */
async function capNhatTrangThaiDeThi(yeuCau, phanHoi) {
    try {
        const idDeThi = yeuCau.params.id;
        const { trangThai } = yeuCau.body;

        await thucThiTruyVan('UPDATE de_thi SET trang_thai = ? WHERE id = ?', [trangThai, idDeThi]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Cập nhật trạng thái đề thi thành công!'
        });
    } catch (loi) {
        console.error('[LỖI CẬP NHẬT TRẠNG THÁI ĐỀ]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi máy chủ khi đổi trạng thái đề thi!' });
    }
}

/**
 * Hàm xóa đề thi
 */
async function xoaDeThi(yeuCau, phanHoi) {
    try {
        const idDeThi = yeuCau.params.id;
        await thucThiTruyVan('DELETE FROM de_thi WHERE id = ?', [idDeThi]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Đã xóa đề thi thành công!'
        });
    } catch (loi) {
        console.error('[LỖI XÓA ĐỀ THI]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi máy chủ khi xóa đề thi.' });
    }
}

module.exports = {
    layDanhSachDeThi,
    taoDeThiMoi,
    capNhatTrangThaiDeThi,
    xoaDeThi
};
