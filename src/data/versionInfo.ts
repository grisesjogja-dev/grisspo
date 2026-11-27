export interface SystemUpdateRelease {
  version: string;
  releaseDate: string;
  releaseTitle: string;
  badge?: string;
  highlights: string[];
}

export const APP_VERSION = 'v1.9.10';
export const APP_BUILD_DATE = '27 November 2026';
export const APP_BUILD_CODE = '2026.11.27-v1.9.10';
export const APP_RELEASE_NAME = 'Penyederhanaan Dashboard (Penghapusan Kartu Keaktifan Ronda & Akses Cepat)';

export const SYSTEM_UPDATE_HISTORY: SystemUpdateRelease[] = [
  {
    version: 'v1.9.10',
    releaseDate: '27 November 2026',
    releaseTitle: 'Penyederhanaan Dashboard (Penghapusan Kartu Keaktifan Ronda & Akses Cepat)',
    badge: 'Terbaru',
    highlights: [
      'Penyederhanaan Tampilan Dashboard Utama: Kartu "Chart Keaktifan Warga Hadir Ronda" dan kartu "Akses Cepat Layanan" telah dihapus dari halaman dashboard utama untuk membuat tampilan dashboard lebih rapi, bersih, dan ringkas.'
    ]
  },
  {
    version: 'v1.9.9',
    releaseDate: '27 November 2026',
    releaseTitle: 'Penambahan Fasilitas Sewa Lahan Parkir & Carport (Rp 30.000 / Bulan)',
    badge: 'Terbaru',
    highlights: [
      'Menu Sewa Lahan Parkir / Carport: Ditambahkan opsi fasilitas baru pada menu Sewa Fasum yaitu "Sewa Lahan Parkir / Carport" dengan tarif resmi Rp 30.000 / bulan.',
      'Integrasi Pemesanan & Kas: Warga dapat langsung melakukan pemesanan dan pembayaran sewa lahan parkir lingkungan perumahan yang terhubung otomatis dengan buku kas dan laporan keuangan.'
    ]
  },
  {
    version: 'v1.9.8',
    releaseDate: '26 November 2026',
    releaseTitle: 'Penyempurnaan Hak Akses Petugas Ronda Terjadwal untuk Absen & Jimpitan',
    badge: 'Terbaru',
    highlights: [
      'Otorisasi Penuh Petugas Ronda Terjadwal: Setiap warga yang terdaftar sebagai petugas ronda pada jadwal 7 hari kini dijamin memiliki hak penuh untuk melakukan absensi ronda dan mengirimkan input jimpitan harian.',
      'Resolusi Kendala Akun B25 (Dewa Anugrah Senki): Pengecekan otorisasi petugas (isAnyRondaOfficer) kini mendeteksi akun dengan sempurna sehingga kendala izin akses absensi dan input jimpit pada akun B25 teratasi sepenuhnya.'
    ]
  },
  {
    version: 'v1.9.7',
    releaseDate: '26 November 2026',
    releaseTitle: 'Perbaikan Pencocokan Petugas Ronda & Input Jimpitan Dewa Anugrah Senki',
    badge: 'Terbaru',
    highlights: [
      'Sinkronisasi Nama & Jadwal Ronda Dewa Anugrah Senki: Nama warga untuk Rumah B 25 diperbarui menjadi "DEWA ANUGRAH SENKI" serta diperluas kamus alias pencocokan nama ronda (dewa, dewo, dewa anugrah senki, senki, anugrah).',
      'Kelancaran Input Jimpitan Petugas: Petugas ronda terjadwal (termasuk Bpk. Dewa Anugrah Senki di hari Kamis) kini dapat dengan lancar melakukan absensi dan menginput jimpitan harian tanpa kendala otorisasi.'
    ]
  },
  {
    version: 'v1.9.6',
    releaseDate: '24 November 2026',
    releaseTitle: 'Penambahan Role Koordinator Kamtibmas & Hak Akses Ganti PIN Portal',
    badge: 'Terbaru',
    highlights: [
      'Role Baru "Koordinator Kamtibmas": Ditambahkan role resmi pengurus Koordinator Kamtibmas (dijabat oleh Bpk. Joko Tri - Rumah C 12) yang terintegrasi penuh dalam struktur pengurus dan hak akses sistem.',
      'Hak Akses Penggantian PIN Portal: Kode/PIN Portal gerbang perumahan kini tidak hanya dapat diganti dan dikelola oleh Superadmin, tetapi juga secara resmi dapat diubah dan dikelola oleh Koordinator Kamtibmas.'
    ]
  },
  {
    version: 'v1.9.5',
    releaseDate: '23 November 2026',
    releaseTitle: 'Penguncian Otomatis Seluruh Menu (Kecuali Jimpit) Penunggak >= 2 Bulan',
    badge: 'Terbaru',
    highlights: [
      'Kunci Otomatis Sistem (Kecuali Menu Jimpit): Pengguna yang memiliki tunggakan iuran bulanan 2 bulan atau lebih otomatis terkunci aksesnya pada seluruh menu navigasi (Dashboard, PIN Portal, Keuangan, Info, Inventaris, Forum, Info Blast, Kontak Penting) dan langsung diarahkan ke menu Jimpit.',
      'Pembukaan Akses Otomatis & Konfirmasi Bendahara 1: Banner pemberitahuan sistem menyediakan akses langsung pelunasan tunggakan dan konfirmasi ke WhatsApp Bendahara 1; seluruh menu otomatis terbuka kembali segera setelah tunggakan dilunasi.'
    ]
  },
  {
    version: 'v1.9.4',
    releaseDate: '23 November 2026',
    releaseTitle: 'Kapitalisasi Penamaan Seluruh Menu Navigasi',
    highlights: [
      'Penulisan Huruf Kapital Awal Pada Semua Menu: Seluruh nama menu utama dan submenu di navigasi desktop serta mobile kini diawali huruf kapital (Dashboard, PIN Portal, Jimpit, Info Blast, Keuangan, Sewa Fasum, Kas, Info, Data Warga, Jadwal Ronda, Notulen & Absensi, Tata Tertib, Grisspoin, Inventaris, Forum, dan Lainnya).'
    ]
  },
  {
    version: 'v1.9.3',
    releaseDate: '23 November 2026',
    releaseTitle: 'Menu PIN Portal & Integrasi Grisspoin ke Menu Info',
    highlights: [
      'Menu Baru "PIN Portal" di Sebelah Dashboard: Ditambahkan menu "PIN Portal" tepat di samping menu "Dashboard" dengan indikator berkedip permanen (selalu berkedip).',
      'Pembatasan Akses PIN Portal (< 2 Bulan Tunggakan): Menu "PIN Portal" hanya dapat diakses dan menampilkan kode PIN gerbang perumahan bagi pengguna dengan tunggakan iuran kurang dari 2 bulan (pengguna dengan tunggakan >= 2 bulan akan diarahkan ke halaman pembatasan akses & konfirmasi pelunasan).',
      'Menu "Grisspoin" Masuk ke Menu "Info": Menu "Grisspoin" kini dipindahkan ke dalam dropdown/submenu "Info" baik di navigasi desktop maupun mobile.'
    ]
  },
  {
    version: 'v1.9.2',
    releaseDate: '23 November 2026',
    releaseTitle: 'Default Pos Pembayaran Iuran Bulanan + Sampah',
    highlights: [
      'Default Jenis Transaksi / Pos Pembayaran: Pilihan bawaan pada menu Jenis Transaksi / Pos Pembayaran di Loket Pembayaran Kas dan Catat Transaksi Keuangan kini otomatis terpilih pada "Iuran Bulanan + Sampah (Rp 50.000)".'
    ]
  },
  {
    version: 'v1.9.1',
    releaseDate: '23 November 2026',
    releaseTitle: 'Konfirmasi Pelunasan Langsung ke WhatsApp Bendahara 1',
    highlights: [
      'Konfirmasi Pelunasan Terpusat ke WA Bendahara 1: Setiap konfirmasi pelunasan yang dilakukan seluruh pengguna (pelunasan tunggakan iuran, pembayaran kekurangan jimpitan, pelunasan sewa fasum, loket kas, dan tagihan rumah di Dashboard) otomatis diarahkan ke nomor WhatsApp resmi Bendahara 1 (Bpk. Ahmad - Rumah B 02).',
      'Tombol & Rincian Bukti Pelunasan Otomatis: Pesan WhatsApp memuat rincian nama warga, nomor rumah, kategori transaksi, nominal, metode bayar, dan nomor bukti transaksi untuk verifikasi cepat oleh Bendahara 1.'
    ]
  },
  {
    version: 'v1.9.0',
    releaseDate: '23 November 2026',
    releaseTitle: 'Otorisasi Notif WA Penunggak Iuran & View-Only Daftar Warga',
    highlights: [
      'Khusus Pengurus untuk Notif WA Tunggakan Iuran: Fitur kirim notifikasi WhatsApp kepada warga penunggak iuran kini hanya dapat diakses dan dieksekusi oleh akun Pengurus (Superadmin, Sekretaris, Bendahara 1/2, dan Admin Inventaris).',
      'Mode View-Only Role Warga di Daftar Warga: Akun dengan role "warga" kini bersifat view-only pada seluruh menu Daftar Warga (tanpa tombol kirim WA langsung, tanpa aksi penagihan WA, dan tanpa akses edit/hapus).'
    ]
  },
  {
    version: 'v1.8.9',
    releaseDate: '23 November 2026',
    releaseTitle: 'Tarif Jimpit Bulanan Rp 25.000 & Sinkronisasi Laporan Keuangan',
    highlights: [
      'Kewajiban Jimpitan Rp 25.000/Bulan: Warga dengan status rumah "DI HUNI PEMILIK (JIMPIT BULANAN)" otomatis memiliki tagihan jimpitan sebesar Rp 25.000/bulan di Dashboard, Data Warga, Rekap Bulanan Jimpit, Modal Pelunasan Jimpitan, serta ekspor PDF & Excel.',
      'Sinkronisasi Laporan Keuangan & Kas: Pembayaran serta tagihan jimpitan bulanan Rp 25.000 terhitung penuh pada seluruh laporan keuangan kas, ringkasan integrasi jimpitan, dan rekonsiliasi otomatis transaksi kas.'
    ]
  },
  {
    version: 'v1.8.8',
    releaseDate: '23 November 2026',
    releaseTitle: 'Status Rumah Di Huni Pemilik (Jimpit Bulanan)',
    highlights: [
      'Pilihan Status Rumah Baru: Ditambahkan opsi status rumah "DI HUNI PEMILIK (JIMPIT BULANAN)" pada menu filter dan formulir Tambah/Edit Data Warga.',
      'Filter Otomatis Kartu Jimpit Online: Warga dengan status "DI HUNI PEMILIK (JIMPIT BULANAN)" secara otomatis tidak dimunculkan pada daftar checklist Kartu Jimpit Online harian.'
    ]
  },
  {
    version: 'v1.8.7',
    releaseDate: '23 November 2026',
    releaseTitle: 'Pelunasan & Sinkronisasi Otomatis Tunggakan Warga',
    highlights: [
      'Pelunasan Tunggakan Otomatis Real-Time: Setiap transaksi pembayaran iuran/pelunasan tunggakan warga (baik melalui Catat Transaksi Keuangan maupun Loket Pembayaran Kas, termasuk pembayaran multi-bulan sekaligus seperti Rp 75.000 untuk tunggakan 3 bulan) otomatis memotong atau melunasi seluruh tunggakan di Dashboard, Loket Kas, Data Warga, Tab Tunggakan Iuran, dan Modal Peringatan.',
      'Rekonsiliasi & Rollback Pembayaran Akurat: Pencocokan transaksi kini mendukung identifikasi berdasarkan nomor rumah maupun nama warga pada deskripsi transaksi, serta otomatis menyesuaikan kembali apabila nominal pembayaran diedit atau dihapus oleh Superadmin.'
    ]
  },
  {
    version: 'v1.8.6',
    releaseDate: '23 November 2026',
    releaseTitle: 'Sinkronisasi Tagihan Warga & Pemilihan Jenis Iuran Superadmin',
    highlights: [
      'Sinkronisasi Tagihan Warga Real-Time: Tagihan dan tunggakan warga di seluruh fitur (Dashboard, Loket Kas, Data Warga, Modal Peringatan Iuran, dan WhatsApp Notif) kini otomatis tersinkronisasi dengan jenis iuran/tarif bulanan masing-masing warga (contoh: Rp 50.000 x 2 bulan = Rp 100.000).',
      'Pemilihan Jenis Iuran Warga (Superadmin): Superadmin dapat memilih dan mengatur tarif iuran bulanan warga secara langsung melalui formulir Tambah/Edit Data Warga.'
    ]
  },
  {
    version: 'v1.8.5',
    releaseDate: '23 November 2026',
    releaseTitle: 'Klasifikasi Jenis Pembayaran Warga & Hak Akses Superadmin',
    highlights: [
      'Jenis Pembayaran di Data Warga: Ditambahkan informasi jenis pembayaran iuran bulanan (Rp 50.000 untuk iuran + sampah bagi warga berstatus "rumah di huni" kecuali Fajar dan Arnado, serta Rp 25.000 untuk kategori lainnya) pada tabel Data Warga.',
      'Otorisasi Edit & Hapus Eksklusif Superadmin: Hak akses untuk mengubah dan menghapus data warga pada fitur Data Warga secara ketat dikhususkan untuk Superadmin.'
    ]
  },
  {
    version: 'v1.8.4',
    releaseDate: '22 November 2026',
    releaseTitle: 'Redesain & Penyederhanaan Tata Letak Dashboard Utama',
    highlights: [
      'Tata Letak Dashboard Lebih Simpel & Rapi: Tampilan ringkasan dashboard didesain ulang dengan struktur dua kolom responsif yang rapi, mengelompokkan informasi penting, chart keaktifan ronda, tagihan, dan akses cepat secara intuitif.',
      'Navigasi Pengguna yang Lebih Mudah: Peningkatan keterbacaan dan hierarki visual untuk kenyamanan seluruh warga dan pengurus.'
    ]
  },
  {
    version: 'v1.8.3',
    releaseDate: '21 November 2026',
    releaseTitle: 'Chart Keaktifan Warga Hadir Ronda & Manajemen Sesi Absensi Real-Time',
    highlights: [
      'Chart Keaktifan Warga Hadir Ronda: Ditambahkan widget visual statistik dan grafik peringkat keaktifan kehadiran ronda malam seluruh warga di Dashboard utama.',
      'Manajemen Sesi Absensi Superadmin: Superadmin kini dapat menambah dan menghapus nama anggota/warga secara langsung di dalam log sesi absensi.',
      'Pembaruan Versi Sistem Real-Time: Setiap pembaruan sistem dan fitur baru secara otomatis memperbarui nomor versi aplikasi dan catatan rilis.'
    ]
  },
  {
    version: 'v1.8.2',
    releaseDate: '16 November 2026',
    releaseTitle: 'Konfirmasi Absen Ronda Jimpit, Palette Hijau Soft Natural & Ekspor Keuangan Responsif',
    highlights: [
      'Validasi Absen Ronda Saat Kirim Jimpit: Tombol Kirim Jimpit kini memvalidasi apakah absen ronda sudah disubmit (pilihan "Belum" otomatis mengarahkan ke checklist absensi ronda, pilihan "Sudah" langsung memproses pengiriman jimpit).',
      'Palette Warna Natural Soft Green & Earth Tones: Tampilan antarmuka disempurnakan dengan nuansa hijau lembut (emerald/teal) yang natural dan menenangkan.',
      'Ekspor Laporan Keuangan & Jimpit Responsif: Dokumen PDF dan Excel dirancang lebih responsif dengan pelipatan teks deskripsi yang rapi.',
      'Keamanan & Otomatisasi Sesi: Auto-logout otomatis ketika browser ditutup serta perlindungan data real-time via Cloud Firestore.'
    ]
  },
  {
    version: 'v1.8.1',
    releaseDate: '13 November 2026',
    releaseTitle: 'Rekonsiliasi Keuangan Real-Time, Sinkronisasi Kas Otomatis & Pembersihan Kwitansi Duplikat',
    highlights: [
      'Rekonsiliasi Total Keuangan Real-Time: Seluruh transaksi kas, loket pembayaran, iuran, jimpitan, sumbangan, saldo awal, dan sewa fasum otomatis masuk ke Distribusi Sumber Pemasukan dan Saldo Kas Dashboard secara akurat 100%.',
      'Sinkronisasi Dua Arah Sewa Fasum: Perubahan status lunas, nominal, atau tanggal pemesanan Fasum otomatis memperbarui buku kas dan transaksi terkait.',
      'Pembersihan Kwitansi Yatim & Duplikat: Penghapusan transaksi otomatis membersihkan seluruh kwitansi terkait di Riwayat Pembayaran Kas.',
      'Peningkatan Fleksibilitas Input: Input nominal kas & edit kwitansi mendukung kelipatan bebas tanpa batasan minimum.'
    ]
  },
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
