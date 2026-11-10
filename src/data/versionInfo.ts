export interface SystemUpdateRelease {
  version: string;
  releaseDate: string;
  releaseTitle: string;
  badge?: string;
  highlights: string[];
}

export const APP_VERSION = 'v1.5.2';
export const APP_BUILD_DATE = '10 November 2026';
export const APP_BUILD_CODE = '2026.11.10-patch2';
export const APP_RELEASE_NAME = 'Edisi Pemutakhiran Layanan & Keamanan Terpadu';

export const SYSTEM_UPDATE_HISTORY: SystemUpdateRelease[] = [
  {
    version: 'v1.5.2',
    releaseDate: '10 November 2026',
    releaseTitle: 'Sinkronisasi Kontak Pengurus & Penataan Navigasi Darurat',
    badge: 'Terbaru',
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
