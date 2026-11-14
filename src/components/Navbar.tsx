import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Coins,
  ReceiptText,
  Users,
  Shield,
  Package,
  BookOpen,
  MessageSquare,
  Award,
  Building2,
  FileText,
  ChevronDown,
  X,
  Menu,
  Sparkles,
  Megaphone
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, currentUser: authUser } = useApp();
  const currentUser = authUser || { role: 'warga' };

  // Dropdown states for Desktop
  const [openDropdown, setOpenDropdown] = useState<'keuangan' | 'info' | null>(null);

  // Mobile popover sheet state
  const [mobileSheet, setMobileSheet] = useState<'keuangan' | 'info' | 'lainnya' | null>(null);

  const desktopNavRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isKeuanganActive = activeView === 'fasum' || activeView === 'keuangan';
  const isInfoActive = ['warga', 'ronda', 'notulen', 'tatib'].includes(activeView);

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP TOP HORIZONTAL NAVBAR                                             */}
      {/* ========================================================================= */}
      <nav
        ref={desktopNavRef}
        className="hidden md:block bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1.5 py-2 overflow-x-visible">
            {/* 1. dashboard */}
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>dashboard</span>
            </button>

            {/* 2. jimpit */}
            <button
              type="button"
              onClick={() => {
                setActiveView('jimpitan');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'jimpitan'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Coins size={15} className={activeView === 'jimpitan' ? 'text-slate-950' : 'text-amber-600'} />
              <span>jimpit</span>
              {activeView !== 'jimpitan' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>

            {/* Info Blast (Superadmin only) */}
            {currentUser.role === 'superadmin' && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('infoblast');
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeView === 'infoblast'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <Megaphone size={15} />
                <span>info blast</span>
              </button>
            )}

            {/* 3. keuangan (dropdown: sewa fasum dan kas) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'keuangan' ? null : 'keuangan')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isKeuanganActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : openDropdown === 'keuangan'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ReceiptText size={15} />
                <span>keuangan</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${openDropdown === 'keuangan' ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu for keuangan */}
              {openDropdown === 'keuangan' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Menu Keuangan
                  </div>

                  {/* sewa fasum */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('fasum');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'fasum'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <Building2 size={16} className={activeView === 'fasum' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>sewa fasum</span>
                      <span className="text-[10px] font-normal text-slate-400">Balai pertemuan, tenda & kursi</span>
                    </div>
                  </button>

                  {/* kas */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('keuangan');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'keuangan'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <ReceiptText size={16} className={activeView === 'keuangan' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>kas</span>
                      <span className="text-[10px] font-normal text-slate-400">Buku kas & laporan transaksi</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. info (dropdown: data warga, jadwal ronda, notulen & absensi, tata tertib) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'info' ? null : 'info')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isInfoActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : openDropdown === 'info'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users size={15} />
                <span>info</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${openDropdown === 'info' ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu for info */}
              {openDropdown === 'info' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Informasi & Regulasi Paguyuban
                  </div>

                  {/* data warga */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('warga');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'warga'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <Users size={16} className={activeView === 'warga' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>data warga</span>
                      <span className="text-[10px] font-normal text-slate-400">Data 58 warga & status hunian</span>
                    </div>
                  </button>

                  {/* jadwal ronda */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('ronda');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'ronda'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <Shield size={16} className={activeView === 'ronda' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>jadwal ronda</span>
                      <span className="text-[10px] font-normal text-slate-400">Jadwal ronda malam & petugas</span>
                    </div>
                  </button>

                  {/* notulen & absensi */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('notulen');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'notulen'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <FileText size={16} className={activeView === 'notulen' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>notulen & absensi</span>
                      <span className="text-[10px] font-normal text-slate-400">Hasil rapat & presensi warga</span>
                    </div>
                  </button>

                  {/* tata tertib */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('tatib');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'tatib'
                        ? 'bg-blue-50 text-blue-700 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <BookOpen size={16} className={activeView === 'tatib' ? 'text-blue-600' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>tata tertib</span>
                      <span className="text-[10px] font-normal text-slate-400">Aturan resmi paguyuban 2026</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 5. inventaris */}
            <button
              type="button"
              onClick={() => {
                setActiveView('inventaris');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'inventaris'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package size={15} />
              <span>inventaris</span>
            </button>

            {/* 6. forum */}
            <button
              type="button"
              onClick={() => {
                setActiveView('forum');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'forum'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={15} />
              <span>forum</span>
            </button>

            {/* 7. Grisspoin */}
            <button
              type="button"
              onClick={() => {
                setActiveView('poin');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'poin'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Award size={15} />
              <span>Grisspoin</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE RESPONSIVE BOTTOM NAVIGATION BAR                                   */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white z-40 px-2 py-1.5 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {/* 1. dashboard */}
          <button
            type="button"
            onClick={() => {
              setActiveView('dashboard');
              setMobileSheet(null);
            }}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              activeView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[10px] mt-0.5">dashboard</span>
          </button>

          {/* 2. jimpit */}
          <button
            type="button"
            onClick={() => {
              setActiveView('jimpitan');
              setMobileSheet(null);
            }}
            className={`flex flex-col items-center py-1 rounded-xl transition relative ${
              activeView === 'jimpitan' ? 'text-amber-400 font-bold' : 'text-amber-300/80 hover:text-amber-300'
            }`}
          >
            <Coins size={18} className="text-amber-400" />
            <span className="text-[10px] mt-0.5">jimpit</span>
          </button>

          {/* 3. keuangan (dropdown trigger) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'keuangan' ? null : 'keuangan')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              isKeuanganActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ReceiptText size={18} />
            <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
              keuangan
              <ChevronDown size={10} className={mobileSheet === 'keuangan' ? 'rotate-180' : ''} />
            </span>
          </button>

          {/* 4. info (dropdown trigger) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'info' ? null : 'info')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              isInfoActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={18} />
            <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
              info
              <ChevronDown size={10} className={mobileSheet === 'info' ? 'rotate-180' : ''} />
            </span>
          </button>

          {/* 5. lainnya (inventaris, forum, Grisspoin) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'lainnya' ? null : 'lainnya')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              ['inventaris', 'forum', 'poin'].includes(activeView)
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu size={18} />
            <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
              lainnya
              <ChevronDown size={10} className={mobileSheet === 'lainnya' ? 'rotate-180' : ''} />
            </span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE POPUP BOTTOM SHEETS FOR DROPDOWNS                                  */}
      {/* ========================================================================= */}
      {mobileSheet && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-3 animate-in fade-in duration-150"
          onClick={() => setMobileSheet(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl space-y-3 mb-14 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {mobileSheet === 'keuangan' && 'Menu Keuangan'}
                {mobileSheet === 'info' && 'Menu Informasi & Regulasi'}
                {mobileSheet === 'lainnya' && 'Menu Lainnya'}
              </span>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Keuangan submenu */}
            {mobileSheet === 'keuangan' && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('fasum');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'fasum'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Building2 size={20} className="text-blue-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">sewa fasum</div>
                    <div className="text-[11px] text-slate-400">Reservasi balai pertemuan, tenda & kursi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('keuangan');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'keuangan'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <ReceiptText size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">kas</div>
                    <div className="text-[11px] text-slate-400">Buku kas paguyuban, iuran & laporan keuangan</div>
                  </div>
                </button>
              </div>
            )}

            {/* Info submenu */}
            {mobileSheet === 'info' && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('warga');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'warga'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Users size={20} className="text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">data warga</div>
                    <div className="text-[11px] text-slate-400">Data 58 kepala keluarga & status rumah</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('ronda');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'ronda'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Shield size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">jadwal ronda</div>
                    <div className="text-[11px] text-slate-400">Jadwal ronda malam 7 hari seminggu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('notulen');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'notulen'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <FileText size={20} className="text-teal-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">notulen & absensi</div>
                    <div className="text-[11px] text-slate-400">Catatan musyawarah & presensi warga</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('tatib');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'tatib'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <BookOpen size={20} className="text-rose-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">tata tertib</div>
                    <div className="text-[11px] text-slate-400">Peraturan resmi lingkungan perumahan GSS 1</div>
                  </div>
                </button>
              </div>
            )}

            {/* Lainnya submenu */}
            {mobileSheet === 'lainnya' && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('inventaris');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'inventaris'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Package size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">inventaris</div>
                    <div className="text-[11px] text-slate-400">33 barang inventaris paguyuban</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('forum');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'forum'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <MessageSquare size={20} className="text-sky-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">forum</div>
                    <div className="text-[11px] text-slate-400">Ruang diskusi & musyawarah online warga</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('poin');
                    setMobileSheet(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    activeView === 'poin'
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Award size={20} className="text-yellow-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Grisspoin</div>
                    <div className="text-[11px] text-slate-400">Poin keaktifan & katalog reward warga</div>
                  </div>
                </button>

                {currentUser.role === 'superadmin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('infoblast');
                      setMobileSheet(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                      activeView === 'infoblast'
                        ? 'bg-rose-600/30 border-rose-500 text-white font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-rose-300'
                    }`}
                  >
                    <Megaphone size={20} className="text-rose-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Info Blast</div>
                      <div className="text-[11px] text-slate-400">Siaran pop-up pengumuman khusus superadmin</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
