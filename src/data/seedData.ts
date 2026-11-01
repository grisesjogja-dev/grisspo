import { Resident, InventoryItem, RondaGroup, Transaction, ForumPost, LoyaltyReward, Announcement, FasumBooking, FasumFacilityConfig } from '../types';

/**
 * 58 Data Warga Perum Griya Sedayu Selaras 1
 * Extracted directly from official PDF: DATA_WARGA_PERUM_GSS_-_CheckList_DataWarga_d07bd30b.pdf
 */
export const initialResidents: Resident[] = [
  // BLOK A
  { id: 'w-a01', no: 1, name: 'BU DESTI', houseNumber: 'A 01', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7801', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 140 },
  { id: 'w-a02', no: 2, name: 'BAPAK AGUS', houseNumber: 'A 02', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7802', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 60 },
  { id: 'w-a03', no: 3, name: 'BAPAK DANANG', houseNumber: 'A 03', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7803', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 210 },
  { id: 'w-a04', no: 4, name: 'BAPAK NANDO', houseNumber: 'A 04', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7804', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 180 },
  { id: 'w-a05', no: 5, name: 'BAPAK DWI', houseNumber: 'A 05', block: 'A', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7805', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 20 },
  { id: 'w-a06', no: 6, name: 'BAPAK HANTORO', houseNumber: 'A 06', block: 'A', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7806', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 120 },
  { id: 'w-a07', no: 7, name: 'BAPAK ANGGO', houseNumber: 'A 07', block: 'A', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7807', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 10 },
  { id: 'w-a08', no: 8, name: 'BAPAK IRVAN', houseNumber: 'A 08', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7808', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 195 },
  { id: 'w-a09', no: 9, name: 'BAPAK TRI S', houseNumber: 'A 09', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7809', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 175 },
  { id: 'w-a10', no: 10, name: 'BAPAK ILHAM', houseNumber: 'A 10', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7810', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 160 },
  { id: 'w-a11', no: 11, name: 'BAPAK CATUR', houseNumber: 'A 11', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7811', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 220 },
  { id: 'w-a12', no: 12, name: 'BAPAK IDHAM', houseNumber: 'A 12', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7812', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 12000, points: 70 },
  { id: 'w-a13', no: 13, name: 'BAPAK WALUYO', houseNumber: 'A 13', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7813', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 260 },
  { id: 'w-a14', no: 14, name: 'BAPAK OCHIN/ BAPAK TONO', houseNumber: 'A 14', block: 'A', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7814', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 145 },
  { id: 'w-a15', no: 15, name: 'BAPAK FAJAR', houseNumber: 'A 15', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7815', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 190 },
  { id: 'w-a16', no: 16, name: 'BAPAK EDI', houseNumber: 'A 16', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7816', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 85 },

  // BLOK B
  { id: 'w-b01', no: 17, name: 'BAPAK GALIH (B01)', houseNumber: 'B 01', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7817', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 65 },
  { id: 'w-b02', no: 18, name: 'BAPAK AHMAD', houseNumber: 'B 02', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'bendahara1', phone: '0812-3456-7818', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 350 },
  { id: 'w-b03', no: 19, name: 'BAPAK WIBI', houseNumber: 'B 03', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7819', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 15 },
  { id: 'w-b04', no: 20, name: 'BAPAK FIRMAN', houseNumber: 'B 04', block: 'B', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7820', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 130 },
  { id: 'w-b05', no: 21, name: 'BAPAK ANDRE', houseNumber: 'B 05', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7821', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 90 },
  { id: 'w-b06', no: 22, name: 'IBU RATNA/FITRAH', houseNumber: 'B 06', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7822', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 160 },
  { id: 'w-b07', no: 23, name: 'BAPAK ANANG', houseNumber: 'B 07', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7823', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 220 },
  { id: 'w-b08', no: 24, name: 'BAPAK ASROFI', houseNumber: 'B 08', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7824', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 175 },
  { id: 'w-b09', no: 25, name: 'BAPAK D. SUNYOTO', houseNumber: 'B 09', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7825', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 20 },
  { id: 'w-b10', no: 26, name: 'IBU ELVIRA', houseNumber: 'B 10', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7826', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 25 },
  { id: 'w-b11', no: 27, name: 'BAPAK RIMBA', houseNumber: 'B 11', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7827', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 10 },
  { id: 'w-b12', no: 28, name: 'RESKY', houseNumber: 'B 12', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7828', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 70 },
  { id: 'w-b13', no: 29, name: 'BAPAK GALIH (B13)', houseNumber: 'B 13', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7829', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 190 },
  { id: 'w-b14', no: 30, name: 'BAPAK GALIH (B14)', houseNumber: 'B 14', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7830', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 140 },
  { id: 'w-b15', no: 31, name: 'BAPAK GALIH (B15)', houseNumber: 'B 15', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7831', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 5000, points: 40 },
  { id: 'w-b16', no: 32, name: 'BAPAK IRWAN', houseNumber: 'B 16', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7832', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 80 },
  { id: 'w-b17', no: 33, name: 'BAPAK WINARDI', houseNumber: 'B 17', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7833', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 10 },
  { id: 'w-b18', no: 34, name: 'BAPAK GALIH (B18)', houseNumber: 'B 18', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7834', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 5000, points: 45 },
  { id: 'w-b19', no: 35, name: 'BAPAK EKO', houseNumber: 'B 19', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7835', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 215 },
  { id: 'w-b20', no: 36, name: 'BAPAK DYO', houseNumber: 'B 20', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7836', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 185 },
  { id: 'w-b21', no: 37, name: 'BAPAK RONI', houseNumber: 'B 21', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7837', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 15 },
  { id: 'w-b22', no: 38, name: 'MBAK BELLA', houseNumber: 'B 22', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7838', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 30 },
  { id: 'w-b23', no: 39, name: 'BAPAK SONY', houseNumber: 'B 23', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'admin_inventaris', phone: '0812-3456-7839', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 300 },
  { id: 'w-b24', no: 40, name: 'BAPAK BENI', houseNumber: 'B 24', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'superadmin', phone: '0812-3456-7840', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 450 },
  { id: 'w-b25', no: 41, name: 'BAPAK DEWO', houseNumber: 'B 25', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7841', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 170 },
  { id: 'w-b26', no: 42, name: 'BAPAK HENGKI', houseNumber: 'B 26', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7842', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 200 },
  { id: 'w-b27', no: 43, name: 'BAPAK DWINOP (B27)', houseNumber: 'B 27', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7843', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 175 },

  // BLOK C
  { id: 'w-c01', no: 44, name: 'BAPAK GAPTA', houseNumber: 'C 01', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7844', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 180 },
  { id: 'w-c02', no: 45, name: 'BAPAK GALIH (C02)', houseNumber: 'C 02', block: 'C', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7845', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 60 },
  { id: 'w-c03', no: 46, name: 'BAPAK TRI CAHYADI', houseNumber: 'C 03', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7846', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 195 },
  { id: 'w-c04', no: 47, name: 'BAPAK GALIH (C04)', houseNumber: 'C 04', block: 'C', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7847', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 65 },
  { id: 'w-c05', no: 48, name: 'BAPAK ALID', houseNumber: 'C 05', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7848', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 170 },
  { id: 'w-c06', no: 49, name: 'IBU YULIA', houseNumber: 'C 06', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7849', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 165 },
  { id: 'w-c07', no: 50, name: 'KOSONG BLOK C-07', houseNumber: 'C 07', block: 'C', statusRumah: 'BELUM ADA PEMILIK', role: 'warga', phone: '-', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-c08', no: 51, name: 'BAPAK HANS', houseNumber: 'C 08', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7851', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 185 },
  { id: 'w-c09', no: 52, name: 'BAPAK RANTO', houseNumber: 'C 09', block: 'C', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7852', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 10 },
  { id: 'w-c10', no: 53, name: 'BAPAK RUDI', houseNumber: 'C 10', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7853', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 280 },
  { id: 'w-c11', no: 54, name: 'BAPAK FALLAH', houseNumber: 'C 11', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7854', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 175 },
  { id: 'w-c12', no: 55, name: 'BAPAK JOKO TRI', houseNumber: 'C 12', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7855', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 230 },
  { id: 'w-c13', no: 56, name: 'BAPAK SAYOGO', houseNumber: 'C 13', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7856', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 210 },
  { id: 'w-c14', no: 57, name: 'BAPAK DIAN', houseNumber: 'C 14', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7857', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 180 },
  { id: 'w-c15', no: 58, name: 'BAPAK ROBY', houseNumber: 'C 15', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'bendahara2', phone: '0812-3456-7858', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 340 },
];

/**
 * Struktur Resmi Pengurus Paguyuban Warga Perum GSS
 */
export interface PengurusInfo {
  position: string;
  name: string;
  houseNumber: string;
  phone: string;
  role: 'superadmin' | 'bendahara1' | 'bendahara2' | 'admin_inventaris' | 'warga';
  tasks: string[];
}

export const dataPengurusGSS: PengurusInfo[] = [
  {
    position: 'Ketua Paguyuban',
    name: 'BENI',
    houseNumber: 'B 24',
    phone: '0812-3456-7840',
    role: 'superadmin',
    tasks: ['Memimpin jalannya paguyuban warga', 'Pengambilan keputusan tertinggi & musyawarah', 'Penanggung jawab portal, fasum, dan ketertiban']
  },
  {
    position: 'Wakil Ketua Paguyuban',
    name: 'WALUYO',
    houseNumber: 'A 13',
    phone: '0812-3456-7813',
    role: 'warga',
    tasks: ['Mendampingi Ketua Paguyuban', 'Koordinasi kegiatan lapangan & kerja bakti warga', 'Penyelesaian perselisihan warga secara musyawarah']
  },
  {
    position: 'Bendahara 1',
    name: 'AHMAD',
    houseNumber: 'B 02',
    phone: '0812-3456-7818',
    role: 'bendahara1',
    tasks: ['Pengelolaan kas utama paguyuban', 'Pencatatan iuran wajib bulanan Rp 25.000', 'Verifikasi real-time pendapatan jimpitan online']
  },
  {
    position: 'Bendahara 2',
    name: 'ROBI',
    houseNumber: 'C 15',
    phone: '0812-3456-7858',
    role: 'bendahara2',
    tasks: ['Pengelolaan iuran sampah & sewa fasum carport', 'Pencatatan pengeluaran operasional & tali asih', 'Audit pembukuan kas & laporan keuangan otomatis']
  },
  {
    position: 'Sekretaris',
    name: 'ASROFI',
    houseNumber: 'B 08',
    phone: '0812-3456-7824',
    role: 'warga',
    tasks: ['Administrasi data kependudukan 58 warga', 'Pencatatan notulensi rapat bulanan', 'Penyusunan surat pengantar & arsip paguyuban']
  },
  {
    position: 'Koordinator Kamtibmas',
    name: 'JOKO TRI',
    houseNumber: 'C 12',
    phone: '0812-3456-7855',
    role: 'warga',
    tasks: ['Koordinator jadwal ronda 7 hari', 'Pengawasan jam kunci portal (21.00 WIB)', 'Penegakan tata tertib keamanan & ketertiban lingkungan']
  }
];

/**
 * 33 Data Inventaris Paguyuban GSS
 * Extracted directly from official PDF: INVENTARIS_PERUM_-_Inventory_cf9b6f65.pdf
 */
export const initialInventory: InventoryItem[] = [
  { id: 'inv-1', no: 1, namaBarang: 'GELAS', jumlah: 53, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Untuk acara pertemuan rutin & rapat paguyuban', statusPinjam: 'Tersedia' },
  { id: 'inv-2', no: 2, namaBarang: 'SENDOK', jumlah: 59, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Sendok makan stainless steel', statusPinjam: 'Tersedia' },
  { id: 'inv-3', no: 3, namaBarang: 'SOTIL', jumlah: 1, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Peralatan masak dapur paguyuban', statusPinjam: 'Tersedia' },
  { id: 'inv-4', no: 4, namaBarang: 'SEROK SARINGAN', jumlah: 1, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Alat penggorengan / saringan', statusPinjam: 'Tersedia' },
  { id: 'inv-5', no: 5, namaBarang: 'CORONG KECIL', jumlah: 1, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Corong pengisi minyak/cairan', statusPinjam: 'Tersedia' },
  { id: 'inv-6', no: 6, namaBarang: 'TALI TAMPAR', jumlah: '1 gulung', satuan: 'roll', kondisi: 'LENGKAP', catatan: 'Tali tambang tampar untuk tenda / bendera', statusPinjam: 'Tersedia' },
  { id: 'inv-7', no: 7, namaBarang: 'TIKAR HIJAU', jumlah: '4 lembar', satuan: 'lembar', kondisi: 'LENGKAP', catatan: 'Tikar hijau alas lesehan pendopo', statusPinjam: 'Tersedia' },
  { id: 'inv-8', no: 8, namaBarang: 'TERPAL', jumlah: 1, satuan: 'lembar', kondisi: 'RUSAK', catatan: 'Ada sobek di bagian sudut, butuh tambal', statusPinjam: 'Dalam Perbaikan' },
  { id: 'inv-9', no: 9, namaBarang: 'UMBUL-UMBUL', jumlah: 19, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Untuk peringatan HUT RI / acara perumahan', statusPinjam: 'Tersedia' },
  { id: 'inv-10', no: 10, namaBarang: 'LAMPU HIAS', jumlah: 1, satuan: 'set', kondisi: 'RUSAK', catatan: 'Kabel lampu hias putus perlu disolder', statusPinjam: 'Dalam Perbaikan' },
  { id: 'inv-11', no: 11, namaBarang: 'PIRING', jumlah: 56, satuan: 'buah', kondisi: 'LENGKAP', catatan: 'Piring makan melamin paguyuban', statusPinjam: 'Tersedia' },
  { id: 'inv-12', no: 12, namaBarang: 'JUMBO', jumlah: 1, satuan: 'buah', kondisi: 'RUSAK', catatan: 'Butuh Perbaikan (penggunaan diharapkan hati2)', statusPinjam: 'Dalam Perbaikan' },
  { id: 'inv-13', no: 13, namaBarang: 'KERAD GELAS', jumlah: 1, satuan: 'rak', kondisi: 'BAIK', catatan: 'Rak keranjang penyimpanan gelas', statusPinjam: 'Tersedia' },
  { id: 'inv-14', no: 14, namaBarang: 'KONTAINER BOX', jumlah: 2, satuan: 'box', kondisi: 'BAIK', catatan: 'Penyimpanan perlengkapan dan kabel', statusPinjam: 'Tersedia' },
  { id: 'inv-15', no: 15, namaBarang: 'GEMBOK', jumlah: 1, satuan: 'buah', kondisi: 'BAIK', catatan: 'Kunci cadangan portal & pintu pos pendopo', statusPinjam: 'Tersedia' },
  { id: 'inv-16', no: 16, namaBarang: 'WD 40', jumlah: 1, satuan: 'kaleng', kondisi: 'HABIS', catatan: 'Cairan pelumas engsel portal (perlu beli baru)', statusPinjam: 'Tersedia' },
  { id: 'inv-17', no: 17, namaBarang: 'SAKLAR', jumlah: 1, satuan: 'buah', kondisi: 'RUSAK', catatan: 'Saklar lampu pendopo perlu diganti', statusPinjam: 'Dalam Perbaikan' },
  { id: 'inv-18', no: 18, namaBarang: 'MCB', jumlah: 1, satuan: 'buah', kondisi: 'HILANG', catatan: 'MCB cadangan pos satpam hilang tercatat', statusPinjam: 'Tersedia' },
  { id: 'inv-19', no: 19, namaBarang: 'BENDERA PLASTIK', jumlah: 4, satuan: 'pack', kondisi: 'HABIS', catatan: 'Bendera plastik agustusan habis', statusPinjam: 'Tersedia' },
  { id: 'inv-20', no: 20, namaBarang: 'WADAH SAYUR', jumlah: '2 set', satuan: 'set', kondisi: 'BAIK', catatan: 'Prasmanan wadah sayur stainless', statusPinjam: 'Tersedia' },
  { id: 'inv-21', no: 21, namaBarang: 'KABEL 10 METER', jumlah: 1, satuan: 'roll', kondisi: 'BAIK', catatan: 'Kabel perpanjangan roll 10m', statusPinjam: 'Tersedia' },
  { id: 'inv-22', no: 22, namaBarang: 'PANCI', jumlah: 1, satuan: 'buah', kondisi: 'BAIK', catatan: 'Panci besar untuk masak air/makanan', statusPinjam: 'Tersedia' },
  { id: 'inv-23', no: 23, namaBarang: 'WAJAN', jumlah: 1, satuan: 'buah', kondisi: 'BAIK', catatan: 'Wajan penggorengan besar', statusPinjam: 'Tersedia' },
  { id: 'inv-24', no: 24, namaBarang: 'GALON', jumlah: 1, satuan: 'buah', kondisi: 'BAIK', catatan: 'Galon air mineral pendopo', statusPinjam: 'Tersedia' },
  { id: 'inv-25', no: 25, namaBarang: 'JUMBO PANAS', jumlah: 1, satuan: 'buah', kondisi: 'BAIK', catatan: 'Dari sumbangan Ibu2 (Termos air panas)', statusPinjam: 'Tersedia' },
  { id: 'inv-26', no: 26, namaBarang: 'JUMBO DINGIN', jumlah: 1, satuan: 'buah', kondisi: 'HILANG', catatan: 'Dari sumbangan Ibu2 (Termos es) - hilang', statusPinjam: 'Tersedia' },
  { id: 'inv-27', no: 27, namaBarang: 'LAMPU LED KOTAK (100 W)', jumlah: 2, satuan: 'unit', kondisi: 'BAIK', catatan: 'Lampu sorot sorot fasum lapangan/pendopo', statusPinjam: 'Tersedia' },
  { id: 'inv-28', no: 28, namaBarang: 'SENG GULUNG', jumlah: 1, satuan: 'gulung', kondisi: 'HILANG', catatan: 'Seng talang penutup sementara', statusPinjam: 'Tersedia' },
  { id: 'inv-29', no: 29, namaBarang: 'TIKAR TENUN', jumlah: 2, satuan: 'lembar', kondisi: 'BAIK', catatan: 'Dari sumbangan Ibu2', statusPinjam: 'Tersedia' },
  { id: 'inv-30', no: 30, namaBarang: 'LED RGB 9 METER', jumlah: 9, satuan: 'unit', tahunPerolehan: '2023', kondisi: 'BAIK', catatan: 'Lampu dekorasi gapura & pendopo tahun 2023', statusPinjam: 'Tersedia' },
  { id: 'inv-31', no: 31, namaBarang: 'LED RGB 9 METER (RUSAK)', jumlah: 1, satuan: 'unit', tahunPerolehan: '2023', kondisi: 'RUSAK', catatan: 'Trafo adaptor konslet', statusPinjam: 'Dalam Perbaikan' },
  { id: 'inv-32', no: 32, namaBarang: 'STOP KONTAK CABANG 2', jumlah: 10, satuan: 'buah', tahunPerolehan: '2023', kondisi: 'BAIK', catatan: 'Kabel colokan cabang dua pembelian 2023', statusPinjam: 'Tersedia' },
  { id: 'inv-33', no: 33, namaBarang: 'SENTER KEPALA', jumlah: 3, satuan: 'unit', kondisi: 'HILANG', catatan: 'Senter ronda kepala (hilang/tidak kembali)', statusPinjam: 'Tersedia' },
];

/**
 * Grup Jadwal Ronda 7 Hari (Senin - Minggu)
 * Extracted directly from official PDF: Grup_Ronda_-_Sheet1_d4335556.pdf
 */
export const initialRondaSchedule: RondaGroup[] = [
  { day: 'Senin', members: ['RUDI', 'SAYOGO', 'TRI S', 'FAJAR'], captain: 'RUDI', dendaMissed: 15000 },
  { day: 'Selasa', members: ['BENI', 'ANANG', 'TONO', 'CATUR', 'EDI'], captain: 'BENI', dendaMissed: 15000 },
  { day: 'Rabu', members: ['AHMAD', 'DWI', 'GAPTA', 'IRWAN'], captain: 'AHMAD', dendaMissed: 15000 },
  { day: 'Kamis', members: ['DEWA', 'EKO', 'ALID', 'NANDO'], captain: 'DEWA', dendaMissed: 15000 },
  { day: 'Jumat', members: ['IRVAN', 'DYO', 'FALLAH', 'ILHAM'], captain: 'IRVAN', dendaMissed: 15000 },
  { day: 'Sabtu', members: ['WALUYO', 'SONY', 'DIAN', 'ASROFI', 'HENGKI'], captain: 'WALUYO', dendaMissed: 15000 },
  { day: 'Minggu', members: ['JOKO TRI', 'DANANG', 'ROBI', 'HANS'], captain: 'DANANG', dendaMissed: 15000 },
];

/**
 * 2026 Tata Tertib Warga Paguyuban Perum Griya Sedayu Selaras 1
 * Extracted directly from official PDF: tatib_warga_2026_d67d8ce4.pdf
 */
export const officialTataTertib = {
  title: 'TATA TERTIB WARGA PAGUYUBAN PERUM GRIYA SEDAYU SELARAS 1',
  period: 'Berlaku 2026 (Disahkan Bantul, 1 Nopember 2023 & Diperbarui untuk 2026)',
  sections: [
    {
      number: 1,
      title: 'Ketentuan Umum Warga',
      items: [
        'Warga Perum GSS 1 adalah pemilik rumah dan atau pengontrak dan atau yang memiliki kewenangan, beserta orang yang menetap dan tinggal di Perum Griya Sedayu Selaras 1.',
        'Seluruh warga diwajibkan untuk mengikuti kegiatan yang diadakan di Perum GSS 1 (Jimpit, Kerja Bakti, Kegiatan Sosial, Pertemuan Rutin Bulanan, dll).'
      ]
    },
    {
      number: 2,
      title: 'Administrasi Keuangan Perum GSS 1',
      items: [
        'Setiap KK/ Warga yang menetap/ tinggal menempati rumah di Perum GSS dikenakan Iuran Pokok Wajib sebesar Rp 300.000,00/ KK (Termasuk Warga Pengontrak).',
        'Iuran Wajib Paguyuban GSS 1: Rp 25.000 / bulan.',
        'Iuran Sampah: Rp 25.000 / bulan (Tidak wajib bagi yang mengelola sampah mandiri).',
        'Bagi rumah yang tidak ditempati, pemilik atau yang memiliki kewenangan wajib membayar iuran paguyuban sebesar Rp 25.000 / bulan (Berlaku mulai iuran bulan November 2023).',
        'Tali Asih sebesar Rp 100.000,00 diambil dari dana kas paguyuban untuk warga yang sakit (Rawat Inap di Rumah Sakit).',
        'Uang bantuan snack bagi warga yang ketempatan pertemuan rutin bulanan adalah sebesar Rp 7.500 x jumlah rumah yang ditempati.'
      ]
    },
    {
      number: 3,
      title: 'Aturan Tinggal di Perum GSS 1',
      items: [
        'Setiap warga wajib mengumpulkan fotokopi dokumen kependudukan (KTP, KK, Surat Nikah) dan fotokopi kartu BPJS kepada pengurus paguyuban.',
        'Setiap tambahan anggota penghuni rumah yang tidak memiliki hubungan kekeluargaan garis lurus dengan warga, wajib mengumpulkan fotokopi dokumen kependudukan dan foto diri.',
        'Bagi warga yang mempekerjakan orang di rumahnya (asisten rumah tangga/pekerja), wajib melaporkan data diri (KTP dan foto diri).',
        'Untuk rumah yang dikontrakkan, pemilik rumah wajib memberikan data diri pengontrak dan bagi pengontrak wajib menaati peraturan di dalam paguyuban.',
        'Tamu menginap/ tinggal 1 x 24 jam atau lebih WAJIB lapor pengurus paguyuban (RT/Pengurus).'
      ]
    },
    {
      number: 4,
      title: 'Keamanan, Kenyamanan & Ketertiban Lingkungan',
      items: [
        'Pemulung dan pengamen DILARANG MASUK ke lingkungan perumahan demi kenyamanan bersama.',
        'Setiap rumah wajib memiliki tempat sampah tertutup yang diletakkan di depan rumah masing-masing.',
        'Setiap rumah wajib memasang lampu penerangan jalan depan rumah, dan menyalakan lampu saat malam hari baik saat berada di rumah maupun saat bepergian (kosong).',
        'Hewan peliharaan harap untuk dijaga dan TIDAK DILEPAS LIARKAN di lingkungan perumahan.',
        'Dilarang mabuk-mabukan, narkoba, judi, dan berbuat asusila di lingkungan perumahan.',
        'Ronda malam adalah kegiatan mengambil jimpitan dan menutup portal gerbang perumahan.',
        'Waktu ronda malam + pengambilan jimpitan: Dimulai maksimal pukul 20.00 WIB dan selesai minimal pukul 22.00 WIB.',
        'Portal gerbang perumahan WAJIB DITUTUP DAN DIKUNCI pada pukul 21.00 WIB oleh grup jimpit pada hari tersebut.',
        'Setiap rumah menyediakan uang jimpitan Rp 500,00 / hari (diletakkan di tempat yang mudah diambil / kotak jimpit).',
        'Apabila ada grup ronda yang TIDAK MENGAMBIL JIMPITAN, maka grup tersebut WAJIB MEMBAYAR DENDA Rp 15.000,00 / grup / jimpit.',
        'Setiap warga wajib menutup dan mengunci kembali portal ketika keluar masuk perumahan (apabila portal sudah dalam keadaan terkunci).',
        'Sebelum selesai ronda, tim jimpit diharuskan membersihkan kembali area pendopo perumahan (sapu, pel) dan tidak meninggalkan sampah di pendopo.',
        'PIN CODE PORTAL diganti setidaknya satu bulan sekali saat pertemuan rutin bulanan (maksimal tanggal 15 pada bulan tersebut).'
      ]
    },
    {
      number: 5,
      title: 'Fasilitas Umum, Jalan & Parkir Kendaraan',
      items: [
        'Angkutan material bertonase besar dilarang melintas (maksimal truk engkel). Jika terpaksa melintas dan membuat jalan rusak, maka pemilik material wajib memperbaiki jalan yang rusak.',
        'Pemilik kendaraan bermotor (roda dua/roda empat) dihimbau untuk memarkir kendaraan di carport rumah masing-masing.',
        'Warga dapat memanfaatkan lahan fasum sebelah timur Blok C untuk membuat carport dengan biaya sewa Rp 30.000 (bulanan).',
        'Warga diperkenankan menyewa lahan fasum yang masih kosong dengan aturan: (1) Menandatangani surat perjanjian sewa lahan fasum, (2) Sewa minimal 1 slot (5,0m x 2,5m) biaya sewa Rp 2.400 / m² / bulan, (3) Lahan fasum boleh didirikan bangunan tidak permanen, (4) Wajib menyerahkan kembali jika diperlukan untuk kepentingan umum.',
        'Parkir kendaraan roda 4 / roda 2 tamu diperbolehkan di badan jalan/fasum dengan catatan TIDAK mengganggu arus lalu lintas perumahan. Apabila menginap, wajib menghubungi pengurus untuk dicarikan tempat parkir sementara.'
      ]
    },
    {
      number: 6,
      title: 'Penyelesaian Perselisihan',
      items: [
        'Jika terdapat perselisihan antar warga di dalam paguyuban, maka akan diselesaikan secara musyawarah dan kekeluargaan, KECUALI tindakan kriminal.'
      ]
    }
  ]
};

/**
 * Initial Transaksi Keuangan Paguyuban GSS
 */
export const initialTransactions: Transaction[] = [
  {
    id: 'trx-001',
    type: 'pemasukan',
    category: 'Iuran Bulanan (Rp 25.000)',
    amount: 1125000,
    date: '2026-10-05',
    description: 'Penerimaan Iuran Paguyuban 45 KK aktif bulan Oktober 2026',
    recordedBy: 'CATUR (Bendahara 1)',
    userRole: 'bendahara1',
    encryptedHash: 'e7a83f9801b6c7de8921a41bc954f912e52b890d2381e9f0298a8ef9a01b6c7d',
    isAnomaly: false,
    timestamp: 1793836800000
  },
  {
    id: 'trx-002',
    type: 'pemasukan',
    category: 'Iuran Sampah (Rp 25.000)',
    amount: 1000000,
    date: '2026-10-05',
    description: 'Penerimaan Iuran Sampah 40 KK bulan Oktober 2026',
    recordedBy: 'AHMAD 2 (Bendahara 2)',
    userRole: 'bendahara2',
    encryptedHash: 'c4b82d9101f3e7bb8120c42ac951e901f41b789c1270d8e9187a7de8f90a5b6c',
    isAnomaly: false,
    timestamp: 1793840400000
  },
  {
    id: 'trx-003',
    type: 'pemasukan',
    category: 'Pemasukan Jimpitan Bulanan',
    amount: 625000,
    date: '2026-10-15',
    description: 'Akumulasi Jimpitan Ronda Online paruh pertama Oktober 2026',
    recordedBy: 'CATUR (Bendahara 1)',
    userRole: 'bendahara1',
    encryptedHash: 'a12b34cd56ef7890123456789abcdef0123456789abcdef0123456789abcdef0',
    isAnomaly: false,
    timestamp: 1794700800000
  },
  {
    id: 'trx-004',
    type: 'pemasukan',
    category: 'Sewa Fasum (Rp 30.000/bln)',
    amount: 180000,
    date: '2026-10-07',
    description: 'Sewa Carport Fasum Blok C (6 slot x Rp 30.000)',
    recordedBy: 'CATUR (Bendahara 1)',
    userRole: 'bendahara1',
    encryptedHash: 'f45d6789e012ab34cd56ef7890123456789abcdef0123456789abcdef0123456',
    isAnomaly: false,
    timestamp: 1794009600000
  },
  {
    id: 'trx-005',
    type: 'pengeluaran',
    category: 'Bayar Sampah',
    amount: 750000,
    date: '2026-10-10',
    description: 'Pembayaran armada pengangkutan sampah bulanan DLH/petugas',
    recordedBy: 'AHMAD 2 (Bendahara 2)',
    userRole: 'bendahara2',
    encryptedHash: 'b98c7654d321ef0123456789abcdef0123456789abcdef0123456789abcdef01',
    isAnomaly: false,
    timestamp: 1794268800000
  },
  {
    id: 'trx-006',
    type: 'pengeluaran',
    category: 'Bantuan Snack Rapat',
    amount: 337500,
    date: '2026-10-12',
    description: 'Bantuan snack pertemuan warga bulanan (45 rumah x Rp 7.500)',
    recordedBy: 'CATUR (Bendahara 1)',
    userRole: 'bendahara1',
    encryptedHash: 'd321ef0123456789abcdef0123456789abcdef0123456789abcdef0123456789a',
    isAnomaly: false,
    timestamp: 1794441600000
  },
  {
    id: 'trx-007',
    type: 'pengeluaran',
    category: 'Perawatan Fasum',
    amount: 250000,
    date: '2026-10-18',
    description: 'Penggantian lampu sorot LED 100W gapura masuk & perbaikan engsel portal',
    recordedBy: 'BENI (Superadmin)',
    userRole: 'superadmin',
    encryptedHash: '987abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
    isAnomaly: false,
    timestamp: 1794960000000
  },
  {
    id: 'trx-008',
    type: 'pengeluaran',
    category: 'Sumbangan Warga (Tali Asih/Duka)',
    amount: 100000,
    date: '2026-10-22',
    description: 'Tali Asih rawat inap warga Blok A 08 (Bpk Irvan) sesuai Tatib Pasal 2',
    recordedBy: 'CATUR (Bendahara 1)',
    userRole: 'bendahara1',
    encryptedHash: '876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9',
    isAnomaly: false,
    timestamp: 1795305600000
  },
  {
    id: 'trx-009',
    type: 'pemasukan',
    category: 'Sumbangan Sukarela',
    amount: 500000,
    date: '2026-10-25',
    description: 'Sumbangan sukarela donatur warga untuk pengecatan pendopo',
    recordedBy: 'AHMAD 2 (Bendahara 2)',
    userRole: 'bendahara2',
    encryptedHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    isAnomaly: false,
    timestamp: 1795564800000
  }
];

/**
 * Initial Forum Posts
 */
export const initialForumPosts: ForumPost[] = [
  {
    id: 'forum-1',
    title: 'Pemberitahuan Penggantian PIN Portal Masuk Bulan November 2026',
    content: 'Assalamu alaikum wr. wb. Bapak/Ibu warga Perum GSS. Mengingat Tatib pasal 4 poin 14 bahwa PIN Portal diganti setiap bulan, PIN Portal baru akan diumumkan pada pertemuan rutin tanggal 10 November 2026. Mohon warga tidak membocorkan PIN kepada pihak luar perumahan.',
    category: 'Keamanan',
    authorId: 'w-b24',
    authorName: 'BENI',
    authorHouse: 'B 24',
    authorRole: 'superadmin',
    createdAt: '2026-10-28T14:30:00Z',
    likes: ['w-c13', 'w-a03', 'w-b07', 'w-a11'],
    isPinned: true,
    comments: [
      {
        id: 'c-1',
        authorName: 'SAYOGO',
        authorHouse: 'C 13',
        content: 'Siap Pak RT, mohon tim ronda malam Jumat dan Sabtu pastikan portal sudah terkunci jam 21.00 WIB tepat.',
        createdAt: '2026-10-28T15:10:00Z'
      },
      {
        id: 'c-2',
        authorName: 'CATUR',
        authorHouse: 'A 11',
        content: 'Noted Pak RT. Untuk tamu yang menginap lebih dari 24 jam tetap wajib lapor ya.',
        createdAt: '2026-10-28T16:05:00Z'
      }
    ]
  },
  {
    id: 'forum-2',
    title: 'Jadwal Kerja Bakti Pembersihan Saluran Air Menghadapi Musim Hujan',
    content: 'Dihimbau kepada seluruh bapak-bapak dan pemuda GSS untuk kerja bakti membersihkan selokan Blok A, B, dan C pada Minggu pagi pukul 06.30 WIB. Konsumsi dan snack disediakan dari kas paguyuban.',
    category: 'Kebersihan',
    authorId: 'w-a03',
    authorName: 'DANANG',
    authorHouse: 'A 03',
    authorRole: 'warga',
    createdAt: '2026-10-29T09:15:00Z',
    likes: ['w-b24', 'w-c10', 'w-b08'],
    isPinned: false,
    comments: [
      {
        id: 'c-3',
        authorName: 'BENI',
        authorHouse: 'B 24',
        content: 'Insya Allah hadir bawa cangkul dan sekop sendiri dari rumah.',
        createdAt: '2026-10-29T10:00:00Z'
      }
    ]
  },
  {
    id: 'forum-3',
    title: 'Usulan Pengadaan Tenda Tambahan dan Sound Portable Baru',
    content: 'Melihat inventaris Jumbo dingin hilang dan beberapa perlengkapan butuh peremajaan, bagaimana jika di musyawarah nanti dialokasikan dana kas untuk pengadaan sound portable yang lebih jernih?',
    category: 'Saran Umum',
    authorId: 'w-b26',
    authorName: 'HENGKI',
    authorHouse: 'B 26',
    authorRole: 'admin_inventaris',
    createdAt: '2026-10-30T11:20:00Z',
    likes: ['w-c10', 'w-b02', 'w-a11'],
    isPinned: false,
    comments: []
  }
];

/**
 * Katalog Penukaran Poin Loyalitas Warga (GRISS-POIN)
 */
export const initialRewards: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: 'Bebas Iuran Sampah 1 Bulan',
    pointsCost: 150,
    description: 'Gratis pembayaran iuran retribusi sampah 1 bulan penuh senilai Rp 25.000.',
    icon: 'Trash2',
    stock: 20
  },
  {
    id: 'rew-2',
    title: 'Bebas Biaya Sewa Fasum Carport 1 Bulan',
    pointsCost: 200,
    description: 'Voucher sewa 1 slot carport lahan fasum timur Blok C senilai Rp 30.000.',
    icon: 'Car',
    stock: 5
  },
  {
    id: 'rew-3',
    title: 'Merchandise Kaos Eksklusif Warga GSS',
    pointsCost: 250,
    description: 'Kaos polo katun bordir Paguyuban Griya Sedayu Selaras kualitas premium.',
    icon: 'Shirt',
    stock: 15
  },
  {
    id: 'rew-4',
    title: 'Paket Sembako Paguyuban',
    pointsCost: 300,
    description: 'Minyak goreng 2L, beras 5kg, dan gula pasir 1kg dari koperasi warga.',
    icon: 'Gift',
    stock: 10
  }
];

/**
 * Notifikasi Pengumuman Warga
 */
export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Tutup Portal Pukul 21.00 WIB Tepat!',
    message: 'Diingatkan kepada Tim Ronda malam ini: Portal gerbang perumahan WAJIB ditutup dan dikunci pukul 21.00 WIB sesuai Tata Tertib Perum GSS.',
    category: 'Ronda',
    date: 'Hari ini',
    isImportant: true
  },
  {
    id: 'ann-2',
    title: 'Laporan Jimpitan Online Telah Dibuka',
    message: 'Petugas ronda sekarang dapat langsung menginput jimpitan harian secara online lewat menu Jimpit Ronda Online. Terima kasih atas partisipasi bapak-bapak!',
    category: 'Kegiatan',
    date: 'Hari ini',
    isImportant: false
  },
  {
    id: 'ann-3',
    title: 'Iuran Paguyuban Bulan Berjalan',
    message: 'Pencatatan iuran wajib Rp 25.000 dan iuran sampah Rp 25.000 dapat dibayarkan langsung ke Bendahara 1 (Pak Ahmad B 02) atau Bendahara 2 (Pak Robi C 15).',
    category: 'Keuangan',
    date: 'Kemarin',
    isImportant: false
  }
];

/**
 * Daftar Fasilitas Umum (Fasum) Perumahan Griya Sedayu Selaras yang dapat disewa
 */
export const fasumFacilities: FasumFacilityConfig[] = [
  {
    id: 'balai_warga',
    name: 'Balai Pertemuan Warga / Pendopo GSS',
    category: 'Gedung Pertemuan',
    defaultFee: 30000,
    unit: 'per acara / sesi',
    capacity: '60 - 80 Orang',
    description: 'Pendopo serbaguna warga untuk rapat warga, arisan, syukuran, hajatan keluarga, pengajian, atau acara paguyuban.',
    facilitiesIncluded: ['Meja & Kursi Napolly (tersedia hingga 50 kursi)', 'Akses Listrik & Stopkontak', 'Toilet & Wastafel Fasum', 'Area Parkir Luas'],
    rules: ['Wajib menjaga kebersihan setelah acara', 'Matikan lampu dan kran air setelah selesai', 'Dilarang merokok di dalam area tertutup pendopo', 'Batas maksimal suara bising pukul 22.00 WIB'],
    icon: 'Building2',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'lapangan_olahraga',
    name: 'Lapangan Serbaguna & Badminton GSS',
    category: 'Olahraga & Terbuka',
    defaultFee: 20000,
    unit: 'per sesi (4 jam)',
    capacity: '30 Orang',
    description: 'Lapangan serbaguna dengan penerangan malam hari untuk bulutangkis, senam pagi warga, voli, atau perlombaan komunitas.',
    facilitiesIncluded: ['Tiang & Net Badminton Siap Pakai', 'Lampu Sorot LED Malam Hari', 'Bangku Penonton', 'Tempat Sampah Terpisah'],
    rules: ['Menggunakan sepatu olahraga yang sesuai', 'Matikan lampu sorot segera setelah selesai', 'Jaga ketertiban dan tidak mengganggu warga sekitar'],
    icon: 'Activity',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'gazebo_taman',
    name: 'Gazebo Komunitas & Taman Bermain GSS',
    category: 'Area Santai & Outdoor',
    defaultFee: 20000,
    unit: 'per sesi (4 jam)',
    capacity: '20 - 25 Orang',
    description: 'Gazebo kayu santai di taman terbuka perumahan, cocok untuk arisan ibu-ibu, kumpul santai keluarga, les anak-anak, atau barbecue.',
    facilitiesIncluded: ['Meja Kayu & Karpet Lesehan', 'Stopkontak Listrik', 'Dekat Area Bermain Anak', 'Pemandangan Taman Asri'],
    rules: ['Sampah sisa makanan wajib dibuang ke tempat sampah', 'Awasi anak-anak saat bermain di taman', 'Tidak diperkenankan menyalakan api unggun sembarangan'],
    icon: 'Trees',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  {
    id: 'tenda_kursi',
    name: 'Paket Tenda Terpal & 50 Kursi Paguyuban',
    category: 'Peralatan Acara',
    defaultFee: 30000,
    unit: 'per hari',
    capacity: '50 Kursi + 2 Tenda',
    description: 'Penyewaan tenda terpal perumahan dan kursi Napolly paguyuban untuk dipasang di depan rumah warga saat acara pribadi.',
    facilitiesIncluded: ['2 Unit Rangka & Tenda Terpal Paguyuban', '50 Unit Kursi Plastik Hijau/Merah', 'Pemasangan dibantu tim inventaris/pemuda'],
    rules: ['Pengembalian maksimal H+1 setelah acara', 'Kerusakan atau kehilangan kursi menjadi tanggung jawab penyewa', 'Koordinasikan penempatan dengan tetangga'],
    icon: 'Tent',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'sound_proyektor',
    name: 'Sound System Portable & Mic Wireless',
    category: 'Elektronik & Multimedia',
    defaultFee: 25000,
    unit: 'per pemakaian',
    capacity: 'Audio Daya 120W',
    description: 'Sound system portable 12 inch dengan 2 mic wireless dan layar proyektor paguyuban untuk presentasi, pengajian, atau nobar warga.',
    facilitiesIncluded: ['1 Unit Speaker Portable Bluetooth/USB', '2 Mic Wireless + Baterai Cadangan', 'Kabel Roll 15 Meter', 'Stand Speaker'],
    rules: ['Dioperasikan dengan hati-hati dari cipratan air', 'Simpan kembali mic dalam kotak penyimpanan', 'Batas maksimal kebisingan pukul 22.00 WIB'],
    icon: 'Volume2',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  }
];

/**
 * Data Pemesanan Fasum Awal (Seed Bookings)
 */
export const initialFasumBookings: FasumBooking[] = [
  {
    id: 'fsm-001',
    facilityType: 'balai_warga',
    facilityName: 'Balai Pertemuan Warga / Pendopo GSS',
    date: '2026-11-05',
    timeSlot: 'malam',
    startTime: '19:30',
    endTime: '22:00',
    purpose: 'Arisan Paguyuban Ibu-Ibu RT Blok A & B',
    residentId: 'w-a11',
    residentName: 'CATUR',
    residentHouse: 'A 11',
    residentPhone: '0812-3456-7811',
    rentalFee: 30000,
    paymentMethod: 'qris',
    paymentStatus: 'lunas',
    status: 'disetujui',
    paymentDate: '2026-10-28 14:20',
    transactionId: 'trx-fsm-101',
    notes: 'Butuh 30 kursi dan sound portable',
    approvedBy: 'ROBI (Bendahara 2)',
    approvedAt: '2026-10-28 14:25',
    createdAt: '2026-10-28 14:15',
    e2eHash: 'a7f3c4980e12dcba5621'
  },
  {
    id: 'fsm-002',
    facilityType: 'lapangan_olahraga',
    facilityName: 'Lapangan Serbaguna & Badminton GSS',
    date: '2026-11-08',
    timeSlot: 'pagi',
    startTime: '07:00',
    endTime: '11:00',
    purpose: 'Latihan Badminton & Senam Sehat Pemuda GSS',
    residentId: 'w-a03',
    residentName: 'DANANG',
    residentHouse: 'A 03',
    residentPhone: '0812-3456-7803',
    rentalFee: 20000,
    paymentMethod: 'transfer_bank',
    paymentStatus: 'lunas',
    status: 'disetujui',
    paymentDate: '2026-10-29 09:10',
    transactionId: 'trx-fsm-102',
    notes: 'Perlu lampu lapangan jika mendung',
    approvedBy: 'AHMAD (Bendahara 1)',
    approvedAt: '2026-10-29 09:30',
    createdAt: '2026-10-29 09:00',
    e2eHash: '9b28a17df302e1c94d11'
  },
  {
    id: 'fsm-003',
    facilityType: 'tenda_kursi',
    facilityName: 'Paket Tenda Terpal & 50 Kursi Paguyuban',
    date: '2026-11-12',
    timeSlot: 'seharian',
    startTime: '08:00',
    endTime: '21:00',
    purpose: 'Syukuran Akikah Keluarga di Rumah B 25',
    residentId: 'w-b25',
    residentName: 'DEWO',
    residentHouse: 'B 25',
    residentPhone: '0812-3456-7841',
    rentalFee: 30000,
    paymentMethod: 'tunai_bendahara',
    paymentStatus: 'menunggu_konfirmasi',
    status: 'menunggu_konfirmasi',
    notes: 'Uang titip di Bendahara 2 (Pak Robi C15)',
    createdAt: '2026-10-31 08:30',
    e2eHash: 'c4e901a884ef23b7a123'
  }
];

