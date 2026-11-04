import React, { useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { DayOfWeek } from '../types';
import {
  Coins,
  ReceiptText,
  Users,
  Shield,
  Package,
  BookOpen,
  MessageSquare,
  Award,
  Clock,
  Key,
  TrendingUp,
  AlertOctagon,
  ChevronRight,
  Sparkles,
  Wallet,
  CheckCircle2,
  CalendarCheck,
  Building2,
  FileText
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser: authUser,
    residents,
    totalIncome,
    totalExpense,
    currentBalance,
    rondaSchedule,
    announcements,
    setActiveView
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDay: DayOfWeek = days[new Date().getDay()] || 'Sabtu';

  const dutyGroup = rondaSchedule.find((g) => g.day === todayDay);

  // Resident's own jimpitan status
  const currentResident = residents.find((r) => r.houseNumber === currentUser.houseNumber);
  const userJimpitanPaid = currentResident?.jimpitanPaidMonth || 0;
  const userJimpitanDeficit = Math.max(0, 15000 - userJimpitanPaid);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles size={14} className="text-amber-300" />
            <span>Portal Resmi Paguyuban Griya Sedayu Selaras 1</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Sugeng Rawuh, Bpk/Ibu {currentUser.name}
          </h2>
          <p className="mt-1 text-slate-300 text-xs sm:text-sm">
            Rumah {currentUser.houseNumber} &bull; Role Akses:{' '}
            <span className="font-extrabold uppercase text-amber-300">{currentUser.role}</span> &bull;{' '}
            <span className="text-emerald-400 font-bold">{currentUser.points || 0} GRISS-Poin</span>
          </p>

          <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Aplikasi GRISSPO memudahkan pengelolaan jimpitan ronda keliling online, transparansi kas keuangan RT, peminjaman inventaris, kependudukan 58 warga, dan forum guyub rukun.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveView('jimpitan')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition"
            >
              <Coins size={16} />
              <span>Jimpit Ronda Online</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveView('keuangan')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-2"
            >
              <ReceiptText size={16} />
              <span>Pantau Kas Transparan</span>
            </button>

            <button
              onClick={() => setActiveView('fasum')}
              className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-white text-xs font-bold rounded-xl border border-blue-400/40 transition flex items-center gap-2"
            >
              <Building2 size={16} className="text-blue-300" />
              <span>Sewa Fasum GSS</span>
            </button>

            <button
              onClick={() => setActiveView('notulen')}
              className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-white text-xs font-bold rounded-xl border border-emerald-400/40 transition flex items-center gap-2"
            >
              <FileText size={16} className="text-emerald-300" />
              <span>Notulen & Absensi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Announcement Alert */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4.5 text-amber-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertOctagon className="text-amber-700" size={22} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-amber-800 tracking-wider">
                Pengumuman Penting Pengurus:
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {announcements[0].title}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                {announcements[0].message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('tatib')}
            className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
          >
            Baca Tatib 2026
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Kas */}
        <div
          onClick={() => setActiveView('keuangan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Saldo Kas Paguyuban</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            Rp {currentBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp size={12} />
            <span>Transparansi 100% Real-time</span>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div
          onClick={() => setActiveView('keuangan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Iuran Rp 25k, Sampah, Jimpit & Sewa Fasum
          </div>
        </div>

        {/* Jimpitan Rumah Anda */}
        <div
          onClick={() => setActiveView('jimpitan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Jimpitan Rumah {currentUser.houseNumber}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            Rp {userJimpitanPaid.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-slate-400">/ 15rb</span>
          </div>
          <div className="text-[11px] mt-1 font-bold">
            {userJimpitanDeficit === 0 ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> LUNAS BULAN INI
              </span>
            ) : (
              <span className="text-amber-600">Kurang Rp {userJimpitanDeficit.toLocaleString('id-ID')}</span>
            )}
          </div>
        </div>

        {/* Poin Loyalitas Anda */}
        <div
          onClick={() => setActiveView('poin')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">GRISS-Poin Anda</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {currentUser.points || 0} <span className="text-xs font-normal text-slate-400">Poin</span>
          </div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold flex items-center gap-1">
            <span>Tukarkan Benefit Bebas Iuran</span>
            <ChevronRight size={11} />
          </div>
        </div>
      </div>

      {/* Ronda Malam Hari Ini Widget */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield size={24} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Jadwal Ronda Malam Ini
              </span>
              <h3 className="text-lg font-black text-white">
                Hari {todayDay} ({dutyGroup?.members.length} Petugas)
              </h3>
            </div>
          </div>

          <button
            onClick={() => setActiveView('jimpitan')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Coins size={14} />
            <span>Mulai Input Jimpitan Online</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Petugas Ronda Malam Ini:</span>
            <span className="text-xs font-bold text-amber-300 mt-1 block">
              {dutyGroup?.members.join(', ') || 'Belum diatur'}
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Ketentuan Kunci Portal:</span>
            <span className="text-xs font-bold text-white mt-1 block">
              Tepat Pukul 21.00 WIB Dikunci
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Standar Jimpitan Harian:</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">
              Rp 500 / Rumah / Hari
            </span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold">Denda Tidak Ronda:</span>
            <span className="text-xs font-bold text-red-400 mt-1 block">
              Rp 15.000 / Regu
            </span>
          </div>
        </div>
      </div>

      {/* Informasi Pengurus Paguyuban Warga Perum GSS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Struktur Organisasi Resmi
              </span>
              <h3 className="text-base font-black text-slate-900">
                Informasi Pengurus Paguyuban Warga Perum GSS 1
              </h3>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
            Periode 2026
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Ketua: Beni */}
          <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                Ketua Paguyuban
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. BENI
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah B 24</span>
            </div>
            <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-md">
              Superadmin
            </span>
          </div>

          {/* Wakil Ketua: Waluyo */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Wakil Ketua
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. WALUYO
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah A 13</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
              Wakil
            </span>
          </div>

          {/* Bendahara 1: Ahmad */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Bendahara 1
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. AHMAD
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah B 02</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
              Kas Utama
            </span>
          </div>

          {/* Bendahara 2: Robi */}
          <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Bendahara 2
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. ROBI
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah C 15</span>
            </div>
            <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-md">
              Sampah/Fasum
            </span>
          </div>

          {/* Sekretaris: Asrofi */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Sekretaris
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. ASROFI
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah B 08</span>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-md">
              Administrasi
            </span>
          </div>

          {/* Koordinator Kamtibmas: Joko Tri */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Koord. Kamtibmas
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                Bpk. JOKO TRI
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Rumah C 12</span>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md">
              Keamanan
            </span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <span>Menu Layanan Aplikasi GRISSPO:</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveView('jimpitan')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Coins size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Jimpit Online</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Input jimpitan harian, kelipatan 500, rekap pendapatan & kekurangan warga.
            </p>
          </button>

          <button
            onClick={() => setActiveView('keuangan')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <ReceiptText size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Kas Transparan</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Pemasukan & pengeluaran kas paguyuban, grafik analitik, ekspor PDF & Excel.
            </p>
          </button>

          <button
            onClick={() => setActiveView('fasum')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Building2 size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Sewa Fasum</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Pemesanan Balai, Lapangan, Tenda & Sound dengan integrasi pembayaran kas.
            </p>
          </button>

          <button
            onClick={() => setActiveView('warga')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Users size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Data 58 Warga</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Checklist kependudukan Blok A, B, C, status hunian pemilik/kontrak.
            </p>
          </button>

          <button
            onClick={() => setActiveView('ronda')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Shield size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Jadwal Ronda</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Grup ronda 7 hari, jam kunci portal 21.00 WIB, denda regu tidak ronda.
            </p>
          </button>

          <button
            onClick={() => setActiveView('inventaris')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Package size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Inventaris (33 Item)</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Aset paguyuban: sound, piring, gelas, lampu sorot, terpal, pinjam barang.
            </p>
          </button>

          <button
            onClick={() => setActiveView('tatib')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <BookOpen size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Tata Tertib 2026</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Aturan resmi iuran bulanan Rp 25k, sampah, jam malam, sewa fasum Rp 30k.
            </p>
          </button>

          <button
            onClick={() => setActiveView('forum')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <MessageSquare size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Forum Diskusi</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Rembug warga: Keamanan, Kebersihan, Kerja Bakti, Saran Umum (+5 Poin).
            </p>
          </button>

          <button
            onClick={() => setActiveView('poin')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Award size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">GRISS-Poin</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Poin loyalitas gotong royong, penukaran benefit gratis iuran sampah & sembako.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
