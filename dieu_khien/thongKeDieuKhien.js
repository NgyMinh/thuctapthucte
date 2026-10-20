/**
 * Điều khiển Thống kê kết quả thi, Bảng điểm tổng hợp và Quản lý thực tập sinh
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');

/**
 * Hàm lấy số liệu thống kê tổng quan cho màn hình Dashboard của Mentor / Quản lý
 */
async function layThongKeTongQuanMentor(yeuCau, phanHoi) {
    try {
        // 1. Tổng số thực tập sinh
        const [kqNguoiDung] = await thucThiTruyVan(`SELECT COUNT(*) AS tong_so FROM nguoi_dung WHERE vai_tro = 'thuc_tap_sinh'`);
        const tongThucTapSinh = kqNguoiDung.tong_so || 0;

        // 2. Tổng số khóa học đào tạo
        const [kqKhoaHoc] = await thucThiTruyVan(`SELECT COUNT(*) AS tong_so FROM khoa_hoc`);
        const tongKhoaHoc = kqKhoaHoc.tong_so || 0;

        // 3. Tổng số đề thi đang hoạt động
        const [kqDeThi] = await thucThiTruyVan(`SELECT COUNT(*) AS tong_so FROM de_thi WHERE trang_thai = 'kich_hoat'`);
        const tongDeThi = kqDeThi.tong_so || 0;

        // 4. Tổng số lượt thi và thống kê Đạt / Không đạt
        const [kqLuotThi] = await thucThiTruyVan(`
            SELECT 
                COUNT(*) AS tong_luot_thi,
                SUM(CASE WHEN ket_qua = 'dat' THEN 1 ELSE 0 END) AS so_luot_dat,
                SUM(CASE WHEN ket_qua = 'khong_dat' THEN 1 ELSE 0 END) AS so_luot_truot,
                AVG(tong_diem_dat_duoc) AS diem_trung_binh
            FROM bai_thi_nguoi_dung
            WHERE trang_thai_nop IN ('da_nop', 'tu_dong_nop')
        `);

        const tongLuotThi = kqLuotThi.tong_luot_thi || 0;
        const soLuotDat = kqLuotThi.so_luot_dat || 0;
        const soLuotTruot = kqLuotThi.so_luot_truot || 0;
        const diemTrungBinh = kqLuotThi.diem_trung_binh ? parseFloat(kqLuotThi.diem_trung_binh).toFixed(1) : 0;
        const tyLeDatPhanTram = tongLuotThi > 0 ? Math.round((soLuotDat / tongLuotThi) * 100) : 0;

        // 5. Lấy danh sách 5 bài thi nộp gần nhất
        const danhSachThiGanDay = await thucThiTruyVan(`
            SELECT 
                bt.id,
                bt.tong_diem_dat_duoc,
                bt.ket_qua,
                bt.thoi_gian_nop_bai,
                nd.ho_ten,
                nd.ma_nguoi_dung,
                nd.nhom_thuc_tap,
                dt.tieu_de_de_thi,
                dt.diem_chuan_dat
            FROM bai_thi_nguoi_dung bt
            JOIN nguoi_dung nd ON bt.nguoi_dung_id = nd.id
            JOIN de_thi dt ON bt.de_thi_id = dt.id
            WHERE bt.trang_thai_nop IN ('da_nop', 'tu_dong_nop')
            ORDER BY bt.thoi_gian_nop_bai DESC
            LIMIT 5
        `);

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: {
                tongThucTapSinh,
                tongKhoaHoc,
                tongDeThi,
                tongLuotThi,
                soLuotDat,
                soLuotTruot,
                diemTrungBinh,
                tyLeDatPhanTram,
                danhSachThiGanDay
            }
        });

    } catch (loi) {
        console.error('[LỖI THỐNG KÊ TỔNG QUAN MENTOR]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải thống kê tổng quan Mentor.'
        });
    }
}

/**
 * Hàm lấy số liệu tổng quan cho màn hình Dashboard của Thực tập sinh
 */
async function layThongKeTongQuanIntern(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;

        // 1. Số khóa học được gán
        const [kqKhoaHoc] = await thucThiTruyVan(`
            SELECT COUNT(*) AS tong_so FROM phan_cong_khoa_hoc WHERE nguoi_dung_id = ?
        `, [idNguoiDung]);
        const soKhoaHocDuocGan = kqKhoaHoc.tong_so || 0;

        // 2. Số bài thi còn hiệu lực cần làm
        const [kqDeThi] = await thucThiTruyVan(`
            SELECT COUNT(*) AS tong_so FROM de_thi WHERE trang_thai = 'kich_hoat'
        `);
        const tongDeThiKhaDung = kqDeThi.tong_so || 0;

        // 3. Số bài thi đã hoàn thành và điểm trung bình
        const [kqThi] = await thucThiTruyVan(`
            SELECT 
                COUNT(*) AS so_lan_thi,
                SUM(CASE WHEN ket_qua = 'dat' THEN 1 ELSE 0 END) AS so_lan_dat,
                AVG(tong_diem_dat_duoc) AS diem_tb
            FROM bai_thi_nguoi_dung
            WHERE nguoi_dung_id = ? AND trang_thai_nop IN ('da_nop', 'tu_dong_nop')
        `, [idNguoiDung]);

        const soLanThi = kqThi.so_lan_thi || 0;
        const soLanDat = kqThi.so_lan_dat || 0;
        const diemTrungBinh = kqThi.diem_tb ? parseFloat(kqThi.diem_tb).toFixed(1) : 0;

        // 4. Tính toán tiến độ học tập trung bình trên tất cả các khóa được gán
        const [kqTienDo] = await thucThiTruyVan(`
            SELECT 
                COUNT(bh.id) AS tong_bai,
                SUM(CASE WHEN td.da_hoan_thanh = 1 THEN 1 ELSE 0 END) AS bai_hoan_thanh
            FROM phan_cong_khoa_hoc pc
            JOIN bai_hoc bh ON pc.khoa_hoc_id = bh.khoa_hoc_id
            LEFT JOIN tien_do_bai_hoc td ON td.bai_hoc_id = bh.id AND td.nguoi_dung_id = pc.nguoi_dung_id
            WHERE pc.nguoi_dung_id = ?
        `, [idNguoiDung]);

        const tongBai = kqTienDo.tong_bai || 0;
        const baiHoanThanh = kqTienDo.bai_hoan_thanh || 0;
        const phanTramTienDoTrungBinh = tongBai > 0 ? Math.round((baiHoanThanh / tongBai) * 100) : 0;

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: {
                soKhoaHocDuocGan,
                tongDeThiKhaDung,
                soLanThi,
                soLanDat,
                diemTrungBinh,
                phanTramTienDoTrungBinh
            }
        });

    } catch (loi) {
        console.error('[LỖI THỐNG KÊ TỔNG QUAN INTERN]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải số liệu tổng quan người học.'
        });
    }
}

/**
 * Hàm lấy Bảng điểm tổng hợp với khoảng cách hàng/cột rộng rãi, dễ tra cứu
 */
async function layBangDiemTongHop(yeuCau, phanHoi) {
    try {
        const { deThiId, nhomThucTap, ketQua, tuKhoa } = yeuCau.query;

        let cauLenh = `
            SELECT 
                bt.id,
                bt.ma_bai_thi,
                bt.thoi_gian_bat_dau,
                bt.thoi_gian_nop_bai,
                bt.tong_diem_dat_duoc,
                bt.ket_qua,
                bt.trang_thai_nop,
                TIMESTAMPDIFF(MINUTE, bt.thoi_gian_bat_dau, bt.thoi_gian_nop_bai) AS thoi_luong_phut,
                nd.ma_nguoi_dung,
                nd.ho_ten,
                nd.email,
                nd.nhom_thuc_tap,
                dt.id AS de_thi_id,
                dt.tieu_de_de_thi,
                dt.diem_chuan_dat,
                dt.tong_diem
            FROM bai_thi_nguoi_dung bt
            JOIN nguoi_dung nd ON bt.nguoi_dung_id = nd.id
            JOIN de_thi dt ON bt.de_thi_id = dt.id
            WHERE bt.trang_thai_nop IN ('da_nop', 'tu_dong_nop')
        `;
        const thamSo = [];

        if (deThiId) {
            cauLenh += ' AND dt.id = ?';
            thamSo.push(deThiId);
        }

        if (nhomThucTap) {
            cauLenh += ' AND nd.nhom_thuc_tap = ?';
            thamSo.push(nhomThucTap);
        }

        if (ketQua) {
            cauLenh += ' AND bt.ket_qua = ?';
            thamSo.push(ketQua);
        }

        if (tuKhoa) {
            cauLenh += ' AND (nd.ho_ten LIKE ? OR nd.ma_nguoi_dung LIKE ? OR dt.tieu_de_de_thi LIKE ?)';
            thamSo.push(`%${tuKhoa}%`, `%${tuKhoa}%`, `%${tuKhoa}%`);
        }

        cauLenh += ' ORDER BY bt.thoi_gian_nop_bai DESC';

        const danhSachBangDiem = await thucThiTruyVan(cauLenh, thamSo);

        // Tính toán tóm tắt cho bộ lọc hiện tại
        const tongSoBanGhi = danhSachBangDiem.length;
        const soBanGhiDat = danhSachBangDiem.filter(b => b.ket_qua === 'dat').length;
        const soBanGhiKhongDat = tongSoBanGhi - soBanGhiDat;
        const tyLeDat = tongSoBanGhi > 0 ? Math.round((soBanGhiDat / tongSoBanGhi) * 100) : 0;

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: {
                tongSoBanGhi,
                soBanGhiDat,
                soBanGhiKhongDat,
                tyLeDat,
                danhSachBangDiem
            }
        });

    } catch (loi) {
        console.error('[LỖI LẤY BẢNG ĐIỂM TỔNG HỢP]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải bảng điểm tổng hợp.'
        });
    }
}

/**
 * Hàm lấy danh sách thực tập sinh thuộc nhóm quản lý
 */
async function layDanhSachThucTapSinh(yeuCau, phanHoi) {
    try {
        const { nhomThucTap, tuKhoa } = yeuCau.query;

        let cauLenh = `
            SELECT 
                nd.id,
                nd.ma_nguoi_dung,
                nd.ho_ten,
                nd.ten_dang_nhap,
                nd.email,
                nd.so_dien_thoai,
                nd.nhom_thuc_tap,
                nd.anh_dai_dien,
                nd.ngay_tao,
                (SELECT COUNT(*) FROM phan_cong_khoa_hoc pc WHERE pc.nguoi_dung_id = nd.id) AS so_khoa_hoc_duoc_gan,
                (SELECT COUNT(*) FROM bai_thi_nguoi_dung bt WHERE bt.nguoi_dung_id = nd.id AND bt.trang_thai_nop IN ('da_nop', 'tu_dong_nop')) AS so_bai_da_thi,
                (SELECT AVG(bt.tong_diem_dat_duoc) FROM bai_thi_nguoi_dung bt WHERE bt.nguoi_dung_id = nd.id AND bt.trang_thai_nop IN ('da_nop', 'tu_dong_nop')) AS diem_trung_binh
            FROM nguoi_dung nd
            WHERE nd.vai_tro = 'thuc_tap_sinh'
        `;
        const thamSo = [];

        if (nhomThucTap) {
            cauLenh += ' AND nd.nhom_thuc_tap = ?';
            thamSo.push(nhomThucTap);
        }

        if (tuKhoa) {
            cauLenh += ' AND (nd.ho_ten LIKE ? OR nd.ma_nguoi_dung LIKE ? OR nd.email LIKE ?)';
            thamSo.push(`%${tuKhoa}%`, `%${tuKhoa}%`, `%${tuKhoa}%`);
        }

        cauLenh += ' ORDER BY nd.id ASC';

        const danhSach = await thucThiTruyVan(cauLenh, thamSo);

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: danhSach
        });
    } catch (loi) {
        console.error('[LỖI LẤY DANH SÁCH THỰC TẬP SINH]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải danh sách thực tập sinh.'
        });
    }
}

module.exports = {
    layThongKeTongQuanMentor,
    layThongKeTongQuanIntern,
    layBangDiemTongHop,
    layDanhSachThucTapSinh
};
