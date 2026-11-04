import { Resident, InventoryItem, RondaGroup, Transaction, ForumPost, LoyaltyReward, Announcement, FasumBooking, FasumFacilityConfig, MeetingNote, AttendanceSession } from '../types';

/**
 * 58 Data Warga Perum Griya Sedayu Selaras 1
 * Extracted directly from official PDF: DATA_WARGA_PERUM_GSS_-_CheckList_DataWarga_d07bd30b.pdf
 */
export const initialResidents: Resident[] = [
  // BLOK A
  { id: 'w-a01', no: 1, name: 'BU DESTI', houseNumber: 'A 01', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7801', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-a02', no: 2, name: 'BAPAK AGUS', houseNumber: 'A 02', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7802', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 0 },
  { id: 'w-a03', no: 3, name: 'BAPAK DANANG', houseNumber: 'A 03', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7803', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-a04', no: 4, name: 'BAPAK NANDO', houseNumber: 'A 04', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7804', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-a05', no: 5, name: 'BAPAK DWI', houseNumber: 'A 05', block: 'A', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7805', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 2, unpaidMonthNames: ['September 2026', 'Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 15000, points: 0 },
  { id: 'w-a06', no: 6, name: 'BAPAK HANTORO', houseNumber: 'A 06', block: 'A', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7806', familyMembers: 2, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a07', no: 7, name: 'BAPAK ANGGO', houseNumber: 'A 07', block: 'A', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7807', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 1, unpaidMonthNames: ['Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 5000, points: 0 },
  { id: 'w-a08', no: 8, name: 'BAPAK IRVAN', houseNumber: 'A 08', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7808', familyMembers: 4, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a09', no: 9, name: 'BAPAK TRI S', houseNumber: 'A 09', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7809', familyMembers: 3, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a10', no: 10, name: 'BAPAK ILHAM', houseNumber: 'A 10', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7810', familyMembers: 2, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a11', no: 11, name: 'BAPAK CATUR', houseNumber: 'A 11', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7811', familyMembers: 4, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a12', no: 12, name: 'BAPAK IDHAM', houseNumber: 'A 12', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7812', familyMembers: 1, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 12000, previousMonthsJimpitanDeficit: 5000, points: 0 },
  { id: 'w-a13', no: 13, name: 'BAPAK WALUYO', houseNumber: 'A 13', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7813', familyMembers: 3, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a14', no: 14, name: 'BAPAK OCHIN/ BAPAK TONO', houseNumber: 'A 14', block: 'A', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7814', familyMembers: 2, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a15', no: 15, name: 'BAPAK FAJAR', houseNumber: 'A 15', block: 'A', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7815', familyMembers: 3, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-a16', no: 16, name: 'BAPAK EDI', houseNumber: 'A 16', block: 'A', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7816', familyMembers: 1, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 10000, previousMonthsJimpitanDeficit: 5000, points: 0 },

  // BLOK B
  { id: 'w-b01', no: 17, name: 'BAPAK GALIH (B01)', houseNumber: 'B 01', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7817', familyMembers: 1, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 10000, previousMonthsJimpitanDeficit: 5000, points: 0 },
  { id: 'w-b02', no: 18, name: 'BAPAK AHMAD', houseNumber: 'B 02', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'bendahara1', phone: '0812-3456-7818', familyMembers: 4, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b03', no: 19, name: 'BAPAK WIBI', houseNumber: 'B 03', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7819', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 2, unpaidMonthNames: ['September 2026', 'Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 20000, points: 0 },
  { id: 'w-b04', no: 20, name: 'BAPAK FIRMAN', houseNumber: 'B 04', block: 'B', statusRumah: 'DI HUNI KONTRAK', role: 'warga', phone: '0812-3456-7820', familyMembers: 2, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b05', no: 21, name: 'BAPAK ANDRE', houseNumber: 'B 05', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7821', familyMembers: 1, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b06', no: 22, name: 'IBU RATNA/FITRAH', houseNumber: 'B 06', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7822', familyMembers: 3, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b07', no: 23, name: 'BAPAK ANANG', houseNumber: 'B 07', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7823', familyMembers: 4, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b08', no: 24, name: 'BAPAK ASROFI', houseNumber: 'B 08', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7824', familyMembers: 3, monthlyIuranPaid: true, iuranUnpaidMonths: 0, unpaidMonthNames: [], jimpitanPaidMonth: 15000, previousMonthsJimpitanDeficit: 0, points: 0 },
  { id: 'w-b09', no: 25, name: 'BAPAK D. SUNYOTO', houseNumber: 'B 09', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7825', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 2, unpaidMonthNames: ['September 2026', 'Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 30000, points: 0 },
  { id: 'w-b10', no: 26, name: 'IBU ELVIRA', houseNumber: 'B 10', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7826', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 3, unpaidMonthNames: ['Agustus 2026', 'September 2026', 'Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 45000, points: 0 },
  { id: 'w-b11', no: 27, name: 'BAPAK RIMBA', houseNumber: 'B 11', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7827', familyMembers: 0, monthlyIuranPaid: false, iuranUnpaidMonths: 2, unpaidMonthNames: ['September 2026', 'Oktober 2026'], jimpitanPaidMonth: 0, previousMonthsJimpitanDeficit: 20000, points: 0 },
  { id: 'w-b12', no: 28, name: 'RESKY', houseNumber: 'B 12', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7828', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 0 },
  { id: 'w-b13', no: 29, name: 'BAPAK GALIH (B13)', houseNumber: 'B 13', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7829', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b14', no: 30, name: 'BAPAK GALIH (B14)', houseNumber: 'B 14', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7830', familyMembers: 2, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b15', no: 31, name: 'BAPAK GALIH (B15)', houseNumber: 'B 15', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7831', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 5000, points: 0 },
  { id: 'w-b16', no: 32, name: 'BAPAK IRWAN', houseNumber: 'B 16', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7832', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 0 },
  { id: 'w-b17', no: 33, name: 'BAPAK WINARDI', houseNumber: 'B 17', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7833', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-b18', no: 34, name: 'BAPAK GALIH (B18)', houseNumber: 'B 18', block: 'B', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7834', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 5000, points: 0 },
  { id: 'w-b19', no: 35, name: 'BAPAK EKO', houseNumber: 'B 19', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7835', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b20', no: 36, name: 'BAPAK DYO', houseNumber: 'B 20', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7836', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b21', no: 37, name: 'BAPAK RONI', houseNumber: 'B 21', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7837', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-b22', no: 38, name: 'MBAK BELLA', houseNumber: 'B 22', block: 'B', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7838', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-b23', no: 39, name: 'BAPAK SONY', houseNumber: 'B 23', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'admin_inventaris', phone: '0812-3456-7839', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b24', no: 40, name: 'BAPAK BENI', houseNumber: 'B 24', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'superadmin', phone: '0812-3456-7840', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b25', no: 41, name: 'BAPAK DEWO', houseNumber: 'B 25', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7841', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b26', no: 42, name: 'BAPAK HENGKI', houseNumber: 'B 26', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7842', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-b27', no: 43, name: 'BAPAK DWINOP (B27)', houseNumber: 'B 27', block: 'B', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7843', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },

  // BLOK C
  { id: 'w-c01', no: 44, name: 'BAPAK GAPTA', houseNumber: 'C 01', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7844', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c02', no: 45, name: 'BAPAK GALIH (C02)', houseNumber: 'C 02', block: 'C', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7845', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 0 },
  { id: 'w-c03', no: 46, name: 'BAPAK TRI CAHYADI', houseNumber: 'C 03', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7846', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c04', no: 47, name: 'BAPAK GALIH (C04)', houseNumber: 'C 04', block: 'C', statusRumah: 'KOSONG (MEMBAYAR IURAN)', role: 'warga', phone: '0812-3456-7847', familyMembers: 1, monthlyIuranPaid: true, jimpitanPaidMonth: 10000, points: 0 },
  { id: 'w-c05', no: 48, name: 'BAPAK ALID', houseNumber: 'C 05', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7848', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c06', no: 49, name: 'IBU YULIA', houseNumber: 'C 06', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7849', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c07', no: 50, name: 'KOSONG BLOK C-07', houseNumber: 'C 07', block: 'C', statusRumah: 'BELUM ADA PEMILIK', role: 'warga', phone: '-', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-c08', no: 51, name: 'BAPAK HANS', houseNumber: 'C 08', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7851', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c09', no: 52, name: 'BAPAK RANTO', houseNumber: 'C 09', block: 'C', statusRumah: 'KOSONG (ADA PEMILIK)', role: 'warga', phone: '0812-3456-7852', familyMembers: 0, monthlyIuranPaid: false, jimpitanPaidMonth: 0, points: 0 },
  { id: 'w-c10', no: 53, name: 'BAPAK RUDI', houseNumber: 'C 10', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7853', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c11', no: 54, name: 'BAPAK FALLAH', houseNumber: 'C 11', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7854', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c12', no: 55, name: 'BAPAK JOKO TRI', houseNumber: 'C 12', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7855', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c13', no: 56, name: 'BAPAK SAYOGO', houseNumber: 'C 13', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7856', familyMembers: 4, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c14', no: 57, name: 'BAPAK DIAN', houseNumber: 'C 14', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'warga', phone: '0812-3456-7857', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
  { id: 'w-c15', no: 58, name: 'BAPAK ROBY', houseNumber: 'C 15', block: 'C', statusRumah: 'DI HUNI PEMILIK', role: 'bendahara2', phone: '0812-3456-7858', familyMembers: 3, monthlyIuranPaid: true, jimpitanPaidMonth: 15000, points: 0 },
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
export const initialTransactions: Transaction[] = [];

/**
 * Initial Forum Posts
 */
export const initialForumPosts: ForumPost[] = [];

/**
 * Katalog Penukaran Poin Loyalitas Warga (GRISS-POIN)
 */
export const initialRewards: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: 'Bebas Iuran Sampah 1 Bulan',
    pointsCost: 250,
    description: 'Gratis pembayaran iuran retribusi sampah 1 bulan penuh senilai Rp 25.000.',
    icon: 'Trash2',
    stock: 20
  },
  {
    id: 'rew-2',
    title: 'Bebas Biaya Sewa Fasum Carport 1 Bulan',
    pointsCost: 300,
    description: 'Voucher sewa 1 slot carport lahan fasum timur Blok C senilai Rp 30.000.',
    icon: 'Car',
    stock: 5
  },
  {
    id: 'rew-3',
    title: 'Merchandise Eksklusif Warga GSS',
    pointsCost: 500,
    description: 'Merchandise dari warga GSS.',
    icon: 'Shirt',
    stock: 15
  },
  {
    id: 'rew-4',
    title: 'Paket Sembako Paguyuban',
    pointsCost: 650,
    description: 'Minyak goreng 2L, beras 5kg, dan gula pasir 1kg dari warga.',
    icon: 'Gift',
    stock: 10
  }
];

/**
 * Notifikasi Pengumuman Warga
 */
export const initialAnnouncements: Announcement[] = [];

/**
 * Daftar Fasilitas Umum (Fasum) Perumahan Griya Sedayu Selaras yang dapat disewa
 */
export const fasumFacilities: FasumFacilityConfig[] = [
  {
    id: 'balai_warga',
    name: 'Balai Warga/ Pendopo GSS',
    category: 'Gedung Pertemuan',
    defaultFee: 50000,
    unit: 'per acara / sesi',
    capacity: '60 - 80 Orang',
    description: 'Pendopo serbaguna warga untuk rapat warga, arisan, syukuran, hajatan keluarga, pengajian, atau acara paguyuban.',
    facilitiesIncluded: ['Meja & Kursi Napolly (tersedia hingga 0 kursi)', 'Akses Listrik & Stopkontak', 'Toilet & Wastafel Fasum', 'Area Parkir Luas'],
    rules: ['Wajib menjaga kebersihan setelah acara', 'Batas maksimal suara bising pukul 22.00 WIB'],
    icon: 'Building2',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'lapangan_olahraga',
    name: 'Meja Pingpong',
    category: 'Olahraga & Terbuka',
    defaultFee: 10000,
    unit: 'per sesi (4 jam)',
    capacity: 'Bebas',
    description: 'Meja pingpong untuk warga.',
    facilitiesIncluded: ['Meja Pingpong', 'Lampu Sorot LED Malam Hari', 'Bet', 'Tempat Sampah Terpisah'],
    rules: ['Menggunakan sepatu olahraga yang sesuai', 'Matikan lampu sorot segera setelah selesai', 'Jaga ketertiban dan tidak mengganggu warga sekitar'],
    icon: 'Activity',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'gazebo_taman',
    name: 'Gazebo Komunitas & Taman Bermain GSS (Dalam Proses Pembangunan)',
    category: 'Area Santai & Outdoor',
    defaultFee: 0,
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
    name: 'Tikar (mengisi kas ibu-ibu)',
    category: 'Peralatan Acara',
    defaultFee: 0,
    unit: 'per hari',
    capacity: '4 tikar',
    description: 'Pinjam tikar untuk acara warga atau pribadi dirumah.',
    facilitiesIncluded: ['Tersedia 4 tikar yang bisa di gunakan'],
    rules: ['Pengembalian maksimal H+1 setelah acara', 'Kerusakan atau kehilangan tikar menjadi tanggung jawab peminjam'],
    icon: 'Tent',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'sound_proyektor',
    name: 'Sound System Portable & Mic Wireless',
    category: 'Elektronik & Multimedia',
    defaultFee: 10000,
    unit: 'per pemakaian',
    capacity: 'Audio Daya 120W',
    description: 'Sound system portable 12 inch dengan 2 mic wireless.',
    facilitiesIncluded: ['1 Unit Speaker Portable Bluetooth/USB', '2 Mic Wireless + Baterai Cadangan', 'Kabel Roll 15 Meter', 'Stand Speaker'],
    rules: ['Dioperasikan dengan hati-hati dari cipratan air', 'Simpan kembali mic dalam kotak penyimpanan', 'Batas maksimal kebisingan pukul 22.00 WIB'],
    icon: 'Volume2',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  }
];

/**
 * Data Pemesanan Fasum Awal (Seed Bookings)
 */
export const initialFasumBookings: FasumBooking[] = [];

/**
 * Notulen Rapat Paguyuban Perum Griya Sedayu Selaras 1
 */
export const initialMeetingNotes: MeetingNote[] = [];

/**
 * Data Awal Sesi Absensi Warga (Ronda, Kerjabakti, Rapat Bulanan)
 */
export const initialAttendanceSessions: AttendanceSession[] = [];

