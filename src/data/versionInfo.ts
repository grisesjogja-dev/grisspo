export interface SystemUpdateRelease {
  version: string;
  releaseDate: string;
  releaseTitle: string;
  badge?: string;
  highlights: string[];
}

export const APP_VERSION = 'v1.8.0';
export const APP_BUILD_DATE = '12 November 2026';
export const APP_BUILD_CODE = '2026.11.12-v1.8.0';
export const APP_RELEASE_NAME = 'Edisi Pembaruan Absensi Ronda, Jimpitan Fleksibel & Konfirmasi Keamanan Global';

export const SYSTEM_UPDATE_HISTORY: SystemUpdateRelease[] = [
  {
    version: 'v1.8.0',
    releaseDate: '12 November 2026',
    releaseTitle: 'Perbaikan Absensi Ronda, Aturan Baru Jimpitan & Konfirmasi Keamanan Global',
    badge: 'Terbaru',
    highlights: [
      'Perbaikan Absensi Ronda Real-Time: Absensi ronda kini selalu tersinkronisasi dari database cloud, mendukung pembaruan ulang pada hari yang sama, dan memperbaiki pencocokan nama petugas.',
      'Integrasi Pemasukan Jimpitan Langsung ke Kas & History Jimpitan: Pemasukan jimpitan harian maupun pelunasan tidak lagi masuk ke Riwayat Pembayaran Kas, bebas duplikasi kwitansi, namun langsung menambah Total Pemasukan dan Saldo Kas Paguyuban.',
      'Nominal Jimpitan Fleksibel & Kartu Ringkas: Minimal jimpitan tetap Rp 500 tanpa aturan kelipatan (input bebas minimal 500) dengan tampilan kartu Jimpit Online yang lebih ringkas.',
      'Otorisasi Ketat Tombol Kirim Jimpit: Tombol Kirim Jimpit hanya aktif di akun petugas ronda hari tersebut dan Superadmin.',
      'Filter Rumah Wajib Jimpitan: Rumah berstatus "KOSONG (ADA PEMILIK)" dan "BELUM ADA PEMILIK" otomatis dikecualikan dari daftar wajib jimpitan dan perhitungan target bulanan.',
      'Konfirmasi Keamanan Global (Batal / Setuju): Setiap aksi ubah dan hapus data di seluruh modul aplikasi kini menampilkan modal konfirmasi untuk mencegah kesalahan input.'
    ]
  },
  {
    version: 'v1.7.1',
    releaseDate: '11 November 2026',
    releaseTitle: 'Otorisasi Khusus Absensi Ronda & Sinkronisasi Real-Time Kas Masuk',
    highlights: [
      'Otorisasi Ketat Absensi Ronda: Khusus hanya petugas ronda yang bertugas pada hari tersebut dan Pengurus/Admin yang memiliki wewenang melakukan checklist dan menyimpan absensi ronda.',
      'Perbaikan Bug Sinkronisasi Kas Masuk Multi-Device: Setiap pencatatan kas masuk oleh admin/bendahara dari perangkat berbeda (baik via Loket Kas maupun Catat Transaksi Keuangan) langsung otomatis tersinkronisasi secara real-time ke Riwayat Pembayaran Kas, Buku Kas, dan database cloud.',
      'Rekonsiliasi Kwitansi & Transaksi Dua Arah (Bidirectional Cloud Sync) menjamin seluruh data mutasi kas paguyuban selalu konsisten di semua perangkat warga dan pengurus.'
    ]
  },
  {
    version: 'v1.7.0',
    releaseDate: '11 November 2026',
    releaseTitle: 'Penataan Menu Navigasi Terpadu & Sinkronisasi Tanggal Transaksi',
    highlights: [
      'Struktur Menu Atas baru yang rapi: dashboard, jimpit, keuangan (dropdown: sewa fasum dan kas), info (dropdown: data warga, jadwal ronda, notulen & absensi, tata tertib), inventaris, forum, Grisspoin.',
      'Tanggal transaksi kas dan kwitansi yang tersimpan dalam database kini 100% menggunakan tanggal yang dipilih pada formulir (bukan tanggal perangkat).',
      'Desain navigasi responsif multi-device: dropdown desktop interaktif serta bottom navigation sheet yang mulus untuk pengguna ponsel dan tablet.'
    ]
  },
  {
    version: 'v1.6.0',
    releaseDate: '11 November 2026',
    releaseTitle: 'Tombol Detail Rapi, Status Rumah Kosong (Dijimpit) & Sinkronisasi Real-Time',
    highlights: [
      'Tombol "Detail" ukuran kecil untuk menyembunyikan keterangan panjang agar tampilan portal selalu rapi dan nyaman dibaca.',
      'Penambahan pilihan status rumah "KOSONG (DIJIMPIT)" pada data warga, filter hunian, dan formulir data kependudukan.',
      'Kartu Jimpit Online kini otomatis menampilkan dan mensinkronkan rumah dengan status "DI HUNI PEMILIK", "DI HUNI KONTRAK", dan "KOSONG (DIJIMPIT)".',
      'Seluruh inputan, editan, dan penghapusan data tersinkronisasi secara real-time via Google Cloud Firestore ke seluruh user di berbagai perangkat.'
    ]
  },
  {
    version: 'v1.5.2',
    releaseDate: '10 November 2026',
    releaseTitle: 'Sinkronisasi Kontak Pengurus & Penataan Navigasi Darurat',
    highlights: [
      'Nomor kontak & nama pengurus paguyuban di modal "Pengurus Paguyuban" tersinkronisasi otomatis dengan Data Warga.',
      'Penghapusan tombol darurat berkedip di deretan menu bar header; kontak darurat kini eksklusif di bilah atas portal.',
      'Penambahan penomoran versi aplikasi resmi & riwayat pembaruan sistem (changelog) pada footer aplikasi.'
    ]
  },
  {
    version: 'v1.5.0',
    releaseDate: '10 November 2026',
    releaseTitle: 'Pilihan Tanggal Loket Kas, Sinkronisasi Pemasukan & Filter Jimpit',
    highlights: [
      'Penambahan input pilihan Tanggal Transaksi pada Formulir Loket Pembayaran Kas (Bendahara/Superadmin).',
      'Penyempurnaan engine sinkronisasi otomatis Total Pemasukan Kas dengan seluruh riwayat kwitansi pembayaran warga.',
      'Filter kartu checklist Jimpit Online eksklusif hanya untuk rumah berstatus "DI HUNI PEMILIK", tersinkron real-time.',
      'Bilah hotline darurat Sedayu terpadu (112, Polsek, Ambulans, Damkar) tersinkronisasi dengan kontak penting.',
      'Penyederhanaan dashboard dengan memindahkan struktur organisasi resmi ke tombol khusus di header.'
    ]
  },
  {
    version: 'v1.4.0',
    releaseDate: '9 November 2026',
    releaseTitle: 'Login Biometrik WebAuthn & Proteksi RBAC Superadmin',
    highlights: [
      'Fitur Login Warga dengan Biometrik (Fingerprint & Face ID) menggunakan Web Authentication API.',
      'Input Saldo Kas Awal pada pencatatan transaksi keuangan (khusus hak akses Superadmin).',
      'Proteksi ketat Role-Based Access Control (RBAC): penghapusan data transaksi, kwitansi, warga, dan inventaris hanya bisa dilakukan oleh Superadmin.'
    ]
  },
  {
    version: 'v1.3.0',
    releaseDate: '8 November 2026',
    releaseTitle: 'Loket Kas Resmi, Kwitansi Digital & Sesi Keamanan',
    highlights: [
      'Penerbitan kwitansi digital otomatis bernomor resmi (KWT-GSS-YYYYMMDD-XXXX) dengan format PDF & WhatsApp.',
      'Fitur Monitoring Pengguna Online (Active Sessions) dan auto-logout keamanan setelah 600 detik (10 menit) tanpa aktivitas.'
    ]
  },
  {
    version: 'v1.2.0',
    releaseDate: '7 November 2026',
    releaseTitle: 'Absensi Multi-Kegiatan & Notulen Rapat Digital',
    highlights: [
      'Pencatatan absensi real-time untuk Ronda Malam, Kerja Bakti, dan Rapat Rutin dengan reward otomatis GRISS-POIN.',
      'Arsip notulen rapat digital warga paguyuban dengan penanggung jawab dan status tindak lanjut.',
      'Manajemen fasilitas sewa fasum secara dinamis dari database.'
    ]
  },
  {
    version: 'v1.1.0',
    releaseDate: '6 November 2026',
    releaseTitle: 'Firebase Cloud Real-Time & Integritas Kas SHA-256',
    highlights: [
      'Integrasi Firebase Firestore real-time cloud sync lintas perangkat warga.',
      'Algoritma enkripsi hash SHA-256 anti-manipulasi data transaksi kas serta notifikasi anomali finansial via email.'
    ]
  },
  {
    version: 'v1.0.0',
    releaseDate: '5 November 2026',
    releaseTitle: 'Peluncuran Perdana Portal Warga GRISSPO 2026',
    highlights: [
      'Peluncuran sistem portal daring warga Griya Sedayu Selaras 1.',
      'Modul utama: Jimpitan Online (kelipatan Rp 500), Kas Transparan, Data 58 Warga Blok A/B/C, Jadwal Ronda 7 Hari, 33 Inventaris Paguyuban, Sewa Fasum, Tata Tertib, Forum Diskusi, dan Katalog Benefit Loyalitas.'
    ]
  }
];
