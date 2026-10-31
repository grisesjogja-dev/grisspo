/**
 * Type definitions for GRISSPO (Griya Sedayu Selaras Portal Online)
 */

export type UserRole = 'superadmin' | 'bendahara1' | 'bendahara2' | 'admin_inventaris' | 'warga';

export type StatusRumah =
  | 'DI HUNI PEMILIK'
  | 'DI HUNI KONTRAK'
  | 'KOSONG (MEMBAYAR IURAN)'
  | 'KOSONG (ADA PEMILIK)'
  | 'BELUM ADA PEMILIK';

export interface Resident {
  id: string;
  no: number;
  name: string;
  houseNumber: string; // e.g. "A 01", "B 05"
  block: 'A' | 'B' | 'C';
  statusRumah: StatusRumah;
  phone?: string;
  role: UserRole;
  familyMembers?: number;
  vehicles?: string;
  monthlyIuranPaid?: boolean;
  jimpitanPaidMonth?: number; // total paid this month
  points: number;
  password?: string;
}

export interface User {
  id: string;
  username: string; // e.g. "GrissA01", "GrissSuperadmin", "GrissB05"
  name: string;
  houseNumber: string;
  role: UserRole;
  points: number;
  phone?: string;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface RondaGroup {
  day: DayOfWeek;
  members: string[]; // resident names
  captain?: string;
  dendaMissed?: number; // Rp 15.000
}

export interface JimpitEntryDetail {
  houseNumber: string;
  residentName: string;
  nominal: number; // min 500, multiples of 500
  paymentMethod: 'cash' | 'transfer';
  timestamp: string;
  collectedBy: string;
}

export interface JimpitDailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  collectedBy: string;
  entries: JimpitEntryDetail[];
  totalNominal: number;
  notes?: string;
  createdAt: string;
}

export type IncomeCategory =
  | 'Iuran Bulanan (Rp 25.000)'
  | 'Iuran Sampah (Rp 25.000)'
  | 'Sewa Fasum (Rp 30.000/bln)'
  | 'Sewa Fasum'
  | 'Pemasukan Jimpitan Bulanan'
  | 'Sumbangan Sukarela'
  | 'Lain-lain Pemasukan';

export type ExpenseCategory =
  | 'Bayar Sampah'
  | 'Bantuan Snack Rapat'
  | 'Konsumsi Kerjabakti'
  | 'Sumbangan Warga (Tali Asih/Duka)'
  | 'Perawatan Fasum'
  | 'Operasional & Lain-lain';

export interface Transaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  recordedBy: string;
  userRole: UserRole;
  sourceHouse?: string;
  encryptedHash: string; // Integrity verification (SHA-256)
  isAnomaly?: boolean;
  anomalyReason?: string;
  timestamp: number;
}

export type InventoryCondition = 'BAIK' | 'LENGKAP' | 'RUSAK' | 'HABIS' | 'HILANG';

export interface InventoryItem {
  id: string;
  no: number;
  namaBarang: string;
  jumlah: number | string;
  satuan?: string;
  tahunPerolehan?: string | number;
  kondisi: InventoryCondition;
  catatan?: string;
  statusPinjam: 'Tersedia' | 'Dipinjam' | 'Dalam Perbaikan';
  peminjamTerakhir?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: 'Keamanan' | 'Kebersihan' | 'Acara Komunitas' | 'Saran Umum';
  authorId: string;
  authorName: string;
  authorHouse: string;
  authorRole: UserRole;
  createdAt: string;
  likes: string[]; // user IDs who liked
  isPinned?: boolean;
  comments: ForumComment[];
}

export interface ForumComment {
  id: string;
  authorName: string;
  authorHouse: string;
  content: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  icon: string;
  stock: number;
}

export interface PointLog {
  id: string;
  userId: string;
  houseNumber: string;
  userName: string;
  pointsChange: number;
  reason: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: 'Darurat' | 'Ronda' | 'Keuangan' | 'Kegiatan' | 'Umum';
  date: string;
  isImportant: boolean;
  readBy?: string[];
}

export type FasumFacilityType =
  | 'balai_warga'
  | 'lapangan_olahraga'
  | 'gazebo_taman'
  | 'tenda_kursi'
  | 'sound_proyektor';

export interface FasumFacilityConfig {
  id: FasumFacilityType;
  name: string;
  category: string;
  defaultFee: number;
  unit: string;
  capacity: string;
  description: string;
  facilitiesIncluded: string[];
  rules: string[];
  icon: string;
  badgeColor: string;
}

export type FasumTimeSlot = 'pagi' | 'siang' | 'malam' | 'seharian' | 'custom';

export type FasumBookingStatus = 'menunggu_konfirmasi' | 'disetujui' | 'ditolak' | 'selesai' | 'dibatalkan';

export type FasumPaymentStatus = 'menunggu_pembayaran' | 'menunggu_konfirmasi' | 'lunas' | 'dibatalkan';

export type FasumPaymentMethod = 'qris' | 'transfer_bank' | 'tunai_bendahara';

export interface FasumBooking {
  id: string;
  facilityType: FasumFacilityType;
  facilityName: string;
  date: string; // YYYY-MM-DD
  timeSlot: FasumTimeSlot;
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  purpose: string;
  residentId: string;
  residentName: string;
  residentHouse: string;
  residentPhone?: string;
  rentalFee: number;
  paymentMethod: FasumPaymentMethod;
  paymentStatus: FasumPaymentStatus;
  status: FasumBookingStatus;
  paymentDate?: string;
  transactionId?: string; // Connected to KeuanganTransaksi
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  e2eHash?: string;
}

