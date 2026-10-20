/**
 * Điều khiển xử lý làm bài thi trắc nghiệm trực tuyến (Chức năng cốt lõi)
 * Bao gồm: Bắt đầu thi, Auto-save đáp án, Tự động thu bài, Chấm điểm và Xem kết quả
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');
const { tronNgauNhienMang, kiemTraDapAnDung } = require('../tien_ich/hoTroTinhDiem');

/**
 * Hàm khởi tạo hoặc tiếp tục phiên làm bài thi (Exam Focus Mode)
 * - Tự động xáo trộn ngẫu nhiên thứ tự câu hỏi và đáp án cho từng thí sinh (Trộn đề)
 * - Ẩn đáp án đúng để bảo mật tuyệt đối
 */
async function batDauLamBaiThi(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const idDeThi = yeuCau.params.idDeThi;

        // Kiểm tra đề thi có tồn tại và đang kích hoạt hay không
        const danhSachDeThi = await thucThiTruyVan('SELECT * FROM de_thi WHERE id = ?', [idDeThi]);
        if (danhSachDeThi.length === 0) {
            return phanHoi.status(404).json({ thanhCong: false, thongBao: 'Không tìm thấy đề thi yêu cầu!' });
        }

        const thongTinDeThi = danhSachDeThi[0];
        if (thongTinDeThi.trang_thai !== 'kich_hoat') {
            return phanHoi.status(400).json({ thanhCong: false, thongBao: 'Đề thi này hiện đang tạm đóng!' });
        }

        // Kiểm tra xem thí sinh có phiên làm bài nào đang dở dang (chưa nộp) hay không
        const cauLenhKiemTraDangLam = `
            SELECT * FROM bai_thi_nguoi_dung 
            WHERE de_thi_id = ? AND nguoi_dung_id = ? AND trang_thai_nop = 'dang_lam'
            ORDER BY id DESC LIMIT 1
        `;
        const danhSachDangLam = await thucThiTruyVan(cauLenhKiemTraDangLam, [idDeThi, idNguoiDung]);

        let idBaiThi = null;
        let thoiGianConLaiGiay = thongTinDeThi.thoi_gian_lam_bai_phut * 60;

        if (danhSachDangLam.length > 0) {
            // Tiếp tục phiên thi hiện tại
            const phienThiCu = danhSachDangLam[0];
            idBaiThi = phienThiCu.id;

            // Tính thời gian thực tế đã trôi qua kể từ khi bắt đầu
            const thoiDiemBatDau = new Date(phienThiCu.thoi_gian_bat_dau).getTime();
            const thoiDiemHienTai = new Date().getTime();
            const giayDaTroiQua = Math.floor((thoiDiemHienTai - thoiDiemBatDau) / 1000);
            const tongGiayChoPhep = thongTinDeThi.thoi_gian_lam_bai_phut * 60;

            thoiGianConLaiGiay = Math.max(0, tongGiayChoPhep - giayDaTroiQua);

            // Nếu thời gian đã hết, tự động nộp bài
            if (thoiGianConLaiGiay <= 0) {
                return phanHoi.status(400).json({
                    thanhCong: false,
                    thongBao: 'Thời gian làm bài thi của bạn đã kết thúc!',
                    baiThiId: idBaiThi,
                    daHetGio: true
                });
            }
        } else {
            // Khởi tạo phiên thi mới
            const maBaiThiMoi = `BT_${idNguoiDung}_${Date.now()}`;
            const cauLenhTaoBaiThi = `
                INSERT INTO bai_thi_nguoi_dung (
                    ma_bai_thi, de_thi_id, nguoi_dung_id, 
                    thoi_gian_bat_dau, thoi_gian_con_lai_giay, 
                    ket_qua, trang_thai_nop
                ) VALUES (?, ?, ?, NOW(), ?, 'dang_lam', 'dang_lam')
            `;
            const ketQuaTao = await thucThiTruyVan(cauLenhTaoBaiThi, [
                maBaiThiMoi,
                idDeThi,
                idNguoiDung,
                thoiGianConLaiGiay
            ]);
            idBaiThi = ketQuaTao.insertId;
        }

        // Lấy danh sách câu hỏi thuộc đề thi
        const cauLenhLayCauHoi = `
            SELECT 
                ch.id AS cau_hoi_id,
                ch.noi_dung_cau_hoi,
                ch.loai_cau_hoi,
                ch.muc_do,
                dtch.diem_cau_hoi,
                dtch.thu_tu
            FROM de_thi_cau_hoi dtch
            JOIN ngan_hang_cau_hoi ch ON dtch.cau_hoi_id = ch.id
            WHERE dtch.de_thi_id = ?
            ORDER BY dtch.thu_tu ASC
        `;
        let danhSachCauHoi = await thucThiTruyVan(cauLenhLayCauHoi, [idDeThi]);

        // Nếu đề cho phép trộn đề: Xáo trộn ngẫu nhiên thứ tự câu hỏi
        if (thongTinDeThi.cho_phep_tron_de == 1) {
            danhSachCauHoi = tronNgauNhienMang(danhSachCauHoi);
        }

        // Lấy danh sách các đáp án cho từng câu hỏi (chỉ lấy ID và nội dung, KHÔNG gửi cột la_dap_an_dung về client)
        const danhSachIdCauHoi = danhSachCauHoi.map(ch => ch.cau_hoi_id);
        const cauLenhLayDapAn = `
            SELECT id, cau_hoi_id, noi_dung_dap_an, thu_tu 
            FROM dap_an_lua_chon 
            WHERE cau_hoi_id IN (?)
            ORDER BY thu_tu ASC
        `;
        const danhSachDapAn = await thucThiTruyVan(cauLenhLayDapAn, [danhSachIdCauHoi]);

        // Lấy các đáp án đã lưu tạm trước đó của thí sinh (nếu có)
        const cauLenhLuuTam = `SELECT cau_hoi_id, dap_an_da_chon FROM chi_tiet_bai_thi WHERE bai_thi_id = ?`;
        const danhSachLuuTam = await thucThiTruyVan(cauLenhLuuTam, [idBaiThi]);
        const banDoLuuTam = {};
        danhSachLuuTam.forEach(item => {
            try {
                banDoLuuTam[item.cau_hoi_id] = JSON.parse(item.dap_an_da_chon);
            } catch (e) {
                banDoLuuTam[item.cau_hoi_id] = [];
            }
        });

        // Ghép danh sách đáp án vào câu hỏi và trộn ngẫu nhiên thứ tự đáp án nếu cho phép
        const danhSachCauHoiHoanChinh = danhSachCauHoi.map((cauHoi, chiSo) => {
            let cacDapAn = danhSachDapAn.filter(da => da.cau_hoi_id === cauHoi.cau_hoi_id);
            if (thongTinDeThi.cho_phep_tron_de == 1) {
                cacDapAn = tronNgauNhienMang(cacDapAn);
            }
            return {
                stt: chiSo + 1,
                cauHoiId: cauHoi.cau_hoi_id,
                noiDungCauHoi: cauHoi.noi_dung_cau_hoi,
                loaiCauHoi: cauHoi.loai_cau_hoi,
                diemCauHoi: cauHoi.diem_cau_hoi,
                dapAnDaChon: banDoLuuTam[cauHoi.cau_hoi_id] || [],
                danhSachDapAn: cacDapAn.map(da => ({
                    id: da.id,
                    noiDungDapAn: da.noi_dung_dap_an
                }))
            };
        });

        return phanHoi.status(200).json({
            thanhCong: true,
            baiThiId: idBaiThi,
            deThi: {
                id: thongTinDeThi.id,
                tieuDe: thongTinDeThi.tieu_de_de_thi,
                moTa: thongTinDeThi.mo_ta,
                thoiGianLamBaiPhut: thongTinDeThi.thoi_gian_lam_bai_phut,
                thoiGianConLaiGiay: thoiGianConLaiGiay,
                tongSoCau: danhSachCauHoiHoanChinh.length,
                diemChuanDat: thongTinDeThi.diem_chuan_dat
            },
            danhSachCauHoi: danhSachCauHoiHoanChinh
        });

    } catch (loi) {
        console.error('[LỖI BẮT ĐẦU BÀI THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi thiết lập phòng thi.'
        });
    }
}

/**
 * Hàm tự động lưu tạm thời đáp án (Auto-save) sau mỗi lựa chọn của thí sinh
 */
async function luuTamDapAnCauHoi(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const { baiThiId, cauHoiId, dapAnDaChon, thoiGianConLaiGiay } = yeuCau.body;

        if (!baiThiId || !cauHoiId) {
            return phanHoi.status(400).json({ thanhCong: false, thongBao: 'Thiếu thông tin bài thi hoặc câu hỏi!' });
        }

        // Đảm bảo bài thi thuộc về người dùng đang đăng nhập và còn đang mở
        const cauLenhKiemTra = `SELECT id FROM bai_thi_nguoi_dung WHERE id = ? AND nguoi_dung_id = ? AND trang_thai_nop = 'dang_lam'`;
        const hopLe = await thucThiTruyVan(cauLenhKiemTra, [baiThiId, idNguoiDung]);

        if (hopLe.length === 0) {
            return phanHoi.status(403).json({ thanhCong: false, thongBao: 'Phiên thi không hợp lệ hoặc đã nộp!' });
        }

        // Lưu câu trả lời dưới dạng JSON chuỗi (ví dụ: "[2, 5]")
        const chuoiDapAnJson = JSON.stringify(Array.isArray(dapAnDaChon) ? dapAnDaChon : [dapAnDaChon]);

        // Cập nhật hoặc chèn mới vào chi_tiet_bai_thi
        const cauLenhLuu = `
            INSERT INTO chi_tiet_bai_thi (bai_thi_id, cau_hoi_id, dap_an_da_chon)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE dap_an_da_chon = VALUES(dap_an_da_chon), thoi_diem_luu_tam = NOW()
        `;
        await thucThiTruyVan(cauLenhLuu, [baiThiId, cauHoiId, chuoiDapAnJson]);

        // Cập nhật thời gian còn lại vào bảng bai_thi_nguoi_dung
        if (typeof thoiGianConLaiGiay === 'number') {
            await thucThiTruyVan(
                'UPDATE bai_thi_nguoi_dung SET thoi_gian_con_lai_giay = ? WHERE id = ?',
                [thoiGianConLaiGiay, baiThiId]
            );
        }

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Đã tự động lưu đáp án tạm thời.',
            thoiDiemLuu: new Date().toISOString()
        });

    } catch (loi) {
        console.error('[LỖI AUTO-SAVE ĐÁP ÁN]:', loi);
        return phanHoi.status(500).json({ thanhCong: false, thongBao: 'Lỗi khi lưu tạm đáp án!' });
    }
}

/**
 * Hàm nộp bài thi (Chủ động nộp hoặc Tự động thu bài khi hết giờ)
 * Chấm điểm tự động và xác định trạng thái Đạt / Không đạt (Pass/Fail)
 */
async function nopBaiThiTrucTuyen(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;
        const { baiThiId, tuDongNop, danhSachCauTraLoi } = yeuCau.body;

        if (!baiThiId) {
            return phanHoi.status(400).json({ thanhCong: false, thongBao: 'Thiếu thông tin mã bài thi!' });
        }

        // Kiểm tra bài thi
        const cauLenhBaiThi = `
            SELECT bt.*, dt.diem_chuan_dat, dt.tong_diem, dt.so_cau_hoi 
            FROM bai_thi_nguoi_dung bt
            JOIN de_thi dt ON bt.de_thi_id = dt.id
            WHERE bt.id = ? AND bt.nguoi_dung_id = ?
        `;
        const danhSachBaiThi = await thucThiTruyVan(cauLenhBaiThi, [baiThiId, idNguoiDung]);

        if (danhSachBaiThi.length === 0) {
            return phanHoi.status(404).json({ thanhCong: false, thongBao: 'Không tìm thấy bài thi!' });
        }

        const thongTinBaiThi = danhSachBaiThi[0];
        if (thongTinBaiThi.trang_thai_nop !== 'dang_lam') {
            return phanHoi.status(400).json({ thanhCong: false, thongBao: 'Bài thi này đã được nộp trước đó!' });
        }

        // Nếu client gửi kèm danh sách câu trả lời mới nhất, cập nhật vào chi_tiet_bai_thi
        if (Array.isArray(danhSachCauTraLoi)) {
            for (const phanTraLoi of danhSachCauTraLoi) {
                const chuoiJson = JSON.stringify(Array.isArray(phanTraLoi.dapAnDaChon) ? phanTraLoi.dapAnDaChon : [phanTraLoi.dapAnDaChon]);
                await thucThiTruyVan(
                    `INSERT INTO chi_tiet_bai_thi (bai_thi_id, cau_hoi_id, dap_an_da_chon) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE dap_an_da_chon = VALUES(dap_an_da_chon)`,
                    [baiThiId, phanTraLoi.cauHoiId, chuoiJson]
                );
            }
        }

        // Lấy danh sách câu hỏi và điểm số quy định của đề thi này
        const cauLenhDeThiCauHoi = `
            SELECT dtch.cau_hoi_id, dtch.diem_cau_hoi, ch.loai_cau_hoi
            FROM de_thi_cau_hoi dtch
            JOIN ngan_hang_cau_hoi ch ON dtch.cau_hoi_id = ch.id
            WHERE dtch.de_thi_id = ?
        `;
        const danhSachCauHoiDe = await thucThiTruyVan(cauLenhDeThiCauHoi, [thongTinBaiThi.de_thi_id]);

        // Lấy toàn bộ đáp án đúng của các câu hỏi thuộc đề này
        const danhSachIdCauHoi = danhSachCauHoiDe.map(c => c.cau_hoi_id);
        const cauLenhDapAnDung = `
            SELECT id, cau_hoi_id 
            FROM dap_an_lua_chon 
            WHERE cau_hoi_id IN (?) AND la_dap_an_dung = 1
        `;
        const danhSachDapAnDung = await thucThiTruyVan(cauLenhDapAnDung, [danhSachIdCauHoi]);

        // Tạo bản đồ các đáp án đúng theo từng câu hỏi: { [cauHoiId]: [idDapAn1, idDapAn2] }
        const banDoDapAnDung = {};
        danhSachDapAnDung.forEach(da => {
            if (!banDoDapAnDung[da.cau_hoi_id]) {
                banDoDapAnDung[da.cau_hoi_id] = [];
            }
            banDoDapAnDung[da.cau_hoi_id].push(da.id);
        });

        // Lấy các câu trả lời mà thí sinh đã lưu trong chi_tiet_bai_thi
        const cauLenhChiTiet = `SELECT * FROM chi_tiet_bai_thi WHERE bai_thi_id = ?`;
        const danhSachChiTiet = await thucThiTruyVan(cauLenhChiTiet, [baiThiId]);

        const banDoChiTiet = {};
        danhSachChiTiet.forEach(ct => {
            try {
                banDoChiTiet[ct.cau_hoi_id] = JSON.parse(ct.dap_an_da_chon);
            } catch (e) {
                banDoChiTiet[ct.cau_hoi_id] = [];
            }
        });

        // BẮT ĐẦU CHẤM ĐIỂM TỰ ĐỘNG
        let tongDiemDatDuoc = 0.0;
        let soCauDung = 0;

        for (const cauHoi of danhSachCauHoiDe) {
            const dapAnHocVien = banDoChiTiet[cauHoi.cau_hoi_id] || [];
            const dapAnDung = banDoDapAnDung[cauHoi.cau_hoi_id] || [];
            const dungHoanToan = kiemTraDapAnDung(dapAnHocVien, dapAnDung, cauHoi.loai_cau_hoi);

            let diemCauNay = 0.0;
            if (dungHoanToan) {
                diemCauNay = parseFloat(cauHoi.diem_cau_hoi) || 1.0;
                tongDiemDatDuoc += diemCauNay;
                soCauDung++;
            }

            // Cập nhật điểm và kết quả đúng/sai cho câu hỏi này trong chi_tiet_bai_thi
            await thucThiTruyVan(
                `UPDATE chi_tiet_bai_thi 
                 SET diem_cau_nay = ?, la_dung = ? 
                 WHERE bai_thi_id = ? AND cau_hoi_id = ?`,
                [diemCauNay, dungHoanToan ? 1 : 0, baiThiId, cauHoi.cau_hoi_id]
            );
        }

        // So sánh với điểm chuẩn đạt (Pass Score)
        const diemChuanDat = parseFloat(thongTinBaiThi.diem_chuan_dat) || 8.0;
        const ketQuaCuoiCung = tongDiemDatDuoc >= diemChuanDat ? 'dat' : 'khong_dat';
        const trangThaiNop = tuDongNop ? 'tu_dong_nop' : 'da_nop';

        // Cập nhật bảng bai_thi_nguoi_dung
        const cauLenhCapNhatBaiThi = `
            UPDATE bai_thi_nguoi_dung 
            SET thoi_gian_nop_bai = NOW(), 
                tong_diem_dat_duoc = ?, 
                ket_qua = ?, 
                trang_thai_nop = ? 
            WHERE id = ?
        `;
        await thucThiTruyVan(cauLenhCapNhatBaiThi, [
            tongDiemDatDuoc.toFixed(2),
            ketQuaCuoiCung,
            trangThaiNop,
            baiThiId
        ]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: ketQuaCuoiCung === 'dat' 
                ? 'Chúc mừng! Bạn đã hoàn thành và ĐẠT bài thi đánh giá năng lực.' 
                : 'Bạn đã hoàn thành bài thi nhưng CHƯA ĐẠT điểm chuẩn yêu cầu.',
            baiThiId,
            tongDiemDatDuoc: parseFloat(tongDiemDatDuoc.toFixed(2)),
            diemChuanDat,
            ketQua: ketQuaCuoiCung,
            soCauDung,
            tongSoCau: danhSachCauHoiDe.length,
            trangThaiNop
        });

    } catch (loi) {
        console.error('[LỖI NỘP BÀI THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi nộp và chấm điểm bài thi.'
        });
    }
}

/**
 * Hàm lấy kết quả chi tiết của một bài thi vừa hoàn thành hoặc xem lại từ lịch sử
 */
async function layKetQuaChiTietBaiThi(yeuCau, phanHoi) {
    try {
        const idBaiThi = yeuCau.params.id;
        const nguoiDung = yeuCau.nguoiDungHienTai;

        // Lấy thông tin bài thi
        let cauLenhBaiThi = `
            SELECT 
                bt.id,
                bt.ma_bai_thi,
                bt.thoi_gian_bat_dau,
                bt.thoi_gian_nop_bai,
                bt.tong_diem_dat_duoc,
                bt.ket_qua,
                bt.trang_thai_nop,
                dt.id AS de_thi_id,
                dt.tieu_de_de_thi,
                dt.thoi_gian_lam_bai_phut,
                dt.diem_chuan_dat,
                dt.tong_diem,
                nd.ho_ten,
                nd.ma_nguoi_dung,
                nd.nhom_thuc_tap
            FROM bai_thi_nguoi_dung bt
            JOIN de_thi dt ON bt.de_thi_id = dt.id
            JOIN nguoi_dung nd ON bt.nguoi_dung_id = nd.id
            WHERE bt.id = ?
        `;
        const thamSo = [idBaiThi];

        // Nếu là thực tập sinh, chỉ được xem kết quả của chính mình
        if (nguoiDung.vaiTro === 'thuc_tap_sinh') {
            cauLenhBaiThi += ' AND bt.nguoi_dung_id = ?';
            thamSo.push(nguoiDung.id);
        }

        const danhSachBaiThi = await thucThiTruyVan(cauLenhBaiThi, thamSo);

        if (danhSachBaiThi.length === 0) {
            return phanHoi.status(404).json({ thanhCong: false, thongBao: 'Không tìm thấy kết quả bài thi!' });
        }

        const thongTinBaiThi = danhSachBaiThi[0];

        // Lấy chi tiết từng câu hỏi trong bài làm kèm đáp án đúng và lời giải thích
        const cauLenhChiTiet = `
            SELECT 
                ch.id AS cau_hoi_id,
                ch.noi_dung_cau_hoi,
                ch.loai_cau_hoi,
                ch.muc_do,
                ch.giai_thich_dap_an,
                ct.dap_an_da_chon,
                ct.diem_cau_nay,
                ct.la_dung
            FROM chi_tiet_bai_thi ct
            JOIN ngan_hang_cau_hoi ch ON ct.cau_hoi_id = ch.id
            WHERE ct.bai_thi_id = ?
            ORDER BY ct.id ASC
        `;
        const danhSachCauHoiChiTiet = await thucThiTruyVan(cauLenhChiTiet, [idBaiThi]);

        // Lấy toàn bộ các đáp án của các câu hỏi này
        if (danhSachCauHoiChiTiet.length > 0) {
            const danhSachIdCauHoi = danhSachCauHoiChiTiet.map(c => c.cau_hoi_id);
            const cauLenhDapAn = `
                SELECT id, cau_hoi_id, noi_dung_dap_an, la_dap_an_dung, thu_tu 
                FROM dap_an_lua_chon 
                WHERE cau_hoi_id IN (?)
                ORDER BY thu_tu ASC
            `;
            const danhSachDapAn = await thucThiTruyVan(cauLenhDapAn, [danhSachIdCauHoi]);

            danhSachCauHoiChiTiet.forEach(item => {
                try {
                    item.dapAnDaChon = JSON.parse(item.dap_an_da_chon) || [];
                } catch (e) {
                    item.dapAnDaChon = [];
                }
                item.danhSachDapAn = danhSachDapAn.filter(da => da.cau_hoi_id === item.cau_hoi_id);
            });
        }

        const soCauDung = danhSachCauHoiChiTiet.filter(c => c.la_dung == 1).length;

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: {
                ...thongTinBaiThi,
                soCauDung,
                tongSoCau: danhSachCauHoiChiTiet.length,
                chiTietCauHoi: danhSachCauHoiChiTiet
            }
        });

    } catch (loi) {
        console.error('[LỖI XEM KẾT QUẢ BÀI THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải kết quả bài thi.'
        });
    }
}

/**
 * Hàm lấy lịch sử tất cả các lần thi của người dùng hiện tại
 */
async function layLichSuThi(yeuCau, phanHoi) {
    try {
        const idNguoiDung = yeuCau.nguoiDungHienTai.id;

        const cauLenh = `
            SELECT 
                bt.id,
                bt.ma_bai_thi,
                bt.thoi_gian_bat_dau,
                bt.thoi_gian_nop_bai,
                bt.tong_diem_dat_duoc,
                bt.ket_qua,
                bt.trang_thai_nop,
                dt.tieu_de_de_thi,
                dt.thoi_gian_lam_bai_phut,
                dt.diem_chuan_dat,
                dt.tong_diem,
                kh.tieu_de AS ten_khoa_hoc
            FROM bai_thi_nguoi_dung bt
            JOIN de_thi dt ON bt.de_thi_id = dt.id
            LEFT JOIN khoa_hoc kh ON dt.khoa_hoc_id = kh.id
            WHERE bt.nguoi_dung_id = ?
            ORDER BY bt.id DESC
        `;
        const danhSachLichSu = await thucThiTruyVan(cauLenh, [idNguoiDung]);

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: danhSachLichSu
        });
    } catch (loi) {
        console.error('[LỖI LẤY LỊCH SỬ THI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải lịch sử bài thi.'
        });
    }
}

module.exports = {
    batDauLamBaiThi,
    luuTamDapAnCauHoi,
    nopBaiThiTrucTuyen,
    layKetQuaChiTietBaiThi,
    layLichSuThi
};
