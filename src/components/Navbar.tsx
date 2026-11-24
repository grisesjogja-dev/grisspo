import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { canAccessPinPortal } from '../utils/security';
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
  Megaphone,
  Key,
  Lock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, currentUser: authUser, residents } = useApp();
  const currentUser = authUser || { id: '', houseNumber: '', role: 'warga' as const };

  const currentResident = useMemo(() => {
    const cleanHouse = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
    return residents.find(
      (r) =>
        (cleanHouse && r.houseNumber.replace(/\s+/g, '').toUpperCase() === cleanHouse) ||
        (currentUser.id && r.id === currentUser.id)
    );
  }, [residents, currentUser]);

  const hasPinPortalAccess = canAccessPinPortal(currentResident);

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
  const isInfoActive = ['warga', 'ronda', 'notulen', 'tatib', 'poin'].includes(activeView);

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
                  ? 'bg-blue-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>

            {/* 1b. PIN Portal (sebelah dashboard, selalu berkedip, akses khusus tunggakan < 2 bulan) */}
            <button
              type="button"
              onClick={() => {
                setActiveView('pin_portal');
                setOpenDropdown(null);
              }}
              title={
                hasPinPortalAccess
                  ? 'PIN Portal Gerbang Utama GSS 1 (Tersedia untuk tunggakan < 2 bulan)'
                  : 'Terkunci: Menu PIN Portal hanya dapat diakses oleh user dengan tunggakan iuran kurang dari 2 bulan'
              }
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap border ${
                activeView === 'pin_portal'
                  ? hasPinPortalAccess
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
                    : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : hasPinPortalAccess
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
              }`}
            >
              <Key size={14} className="animate-pulse shrink-0" />
              <span className="animate-pulse">PIN Portal</span>
              {!hasPinPortalAccess && <Lock size={12} className="shrink-0 opacity-85" />}
              <span
                className={`w-2 h-2 rounded-full animate-ping shrink-0 ${
                  activeView === 'pin_portal'
                    ? 'bg-amber-300'
                    : hasPinPortalAccess
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
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
              <span>Jimpit</span>
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
                <span>Info Blast</span>
              </button>
            )}

            {/* 3. keuangan (dropdown: sewa fasum dan kas) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'keuangan' ? null : 'keuangan')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isKeuanganActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-emerald-600/20'
                    : openDropdown === 'keuangan'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ReceiptText size={15} />
                <span>Keuangan</span>
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

                  {/* Sewa Fasum */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('fasum');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'fasum'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <Building2 size={16} className={activeView === 'fasum' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Sewa Fasum</span>
                      <span className="text-[10px] font-normal text-slate-400">Balai pertemuan, tenda & kursi</span>
                    </div>
                  </button>

                  {/* Kas */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('keuangan');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'keuangan'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <ReceiptText size={16} className={activeView === 'keuangan' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Kas</span>
                      <span className="text-[10px] font-normal text-slate-400">Buku kas & laporan transaksi</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Info (dropdown: Data Warga, Jadwal Ronda, Notulen & Absensi, Tata Tertib, Grisspoin) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'info' ? null : 'info')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isInfoActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-emerald-600/20'
                    : openDropdown === 'info'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users size={15} />
                <span>Info</span>
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
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <Users size={16} className={activeView === 'warga' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Data Warga</span>
                      <span className="text-[10px] font-normal text-slate-400">Data 58 warga & status hunian</span>
                    </div>
                  </button>

                  {/* Jadwal Ronda */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('ronda');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'ronda'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <Shield size={16} className={activeView === 'ronda' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Jadwal Ronda</span>
                      <span className="text-[10px] font-normal text-slate-400">Jadwal ronda malam & petugas</span>
                    </div>
                  </button>

                  {/* Notulen & Absensi */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('notulen');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'notulen'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <FileText size={16} className={activeView === 'notulen' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Notulen &amp; Absensi</span>
                      <span className="text-[10px] font-normal text-slate-400">Hasil rapat & presensi warga</span>
                    </div>
                  </button>

                  {/* Tata Tertib */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('tatib');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'tatib'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <BookOpen size={16} className={activeView === 'tatib' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div className="flex flex-col">
                      <span>Tata Tertib</span>
                      <span className="text-[10px] font-normal text-slate-400">Aturan resmi paguyuban 2026</span>
                    </div>
                  </button>

                  {/* Grisspoin */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('poin');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition ${
                      activeView === 'poin'
                        ? 'bg-blue-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                    }`}
                  >
                    <Award size={16} className={activeView === 'poin' ? 'text-emerald-700' : 'text-amber-500'} />
                    <div className="flex flex-col">
                      <span>Grisspoin</span>
                      <span className="text-[10px] font-normal text-slate-400">Poin keaktifan &amp; katalog reward</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Inventaris */}
            <button
              type="button"
              onClick={() => {
                setActiveView('inventaris');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'inventaris'
                  ? 'bg-blue-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package size={15} />
              <span>Inventaris</span>
            </button>

            {/* 6. Forum */}
            <button
              type="button"
              onClick={() => {
                setActiveView('forum');
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeView === 'forum'
                  ? 'bg-blue-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={15} />
              <span>Forum</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE RESPONSIVE BOTTOM NAVIGATION BAR                                   */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white z-40 px-1.5 py-1.5 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-6 gap-0.5 max-w-lg mx-auto">
          {/* 1. dashboard */}
          <button
            type="button"
            onClick={() => {
              setActiveView('dashboard');
              setMobileSheet(null);
            }}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              activeView === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={17} />
            <span className="text-[9.5px] mt-0.5">Dashboard</span>
          </button>

          {/* 1b. PIN Portal (sebelah dashboard, selalu berkedip) */}
          <button
            type="button"
            onClick={() => {
              setActiveView('pin_portal');
              setMobileSheet(null);
            }}
            className={`flex flex-col items-center py-1 rounded-xl transition relative ${
              activeView === 'pin_portal'
                ? hasPinPortalAccess
                  ? 'text-emerald-300 font-black'
                  : 'text-rose-400 font-black'
                : hasPinPortalAccess
                ? 'text-emerald-400/90 hover:text-emerald-300'
                : 'text-rose-400/90 hover:text-rose-300'
            }`}
          >
            <div className="relative">
              <Key size={17} className="animate-pulse" />
              <span
                className={`absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full animate-ping ${
                  hasPinPortalAccess ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </div>
            <span className="text-[9px] mt-0.5 whitespace-nowrap animate-pulse font-bold">PIN Portal</span>
          </button>

          {/* 2. Jimpit */}
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
            <Coins size={17} className="text-amber-400" />
            <span className="text-[9.5px] mt-0.5">Jimpit</span>
          </button>

          {/* 3. Keuangan (dropdown trigger) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'keuangan' ? null : 'keuangan')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              isKeuanganActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ReceiptText size={17} />
            <span className="text-[9.5px] mt-0.5 flex items-center gap-0.5">
              Keuangan
              <ChevronDown size={9} className={mobileSheet === 'keuangan' ? 'rotate-180' : ''} />
            </span>
          </button>

          {/* 4. Info (dropdown trigger) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'info' ? null : 'info')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              isInfoActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={17} />
            <span className="text-[9.5px] mt-0.5 flex items-center gap-0.5">
              Info
              <ChevronDown size={9} className={mobileSheet === 'info' ? 'rotate-180' : ''} />
            </span>
          </button>

          {/* 5. Lainnya (Inventaris, Forum) */}
          <button
            type="button"
            onClick={() => setMobileSheet(mobileSheet === 'lainnya' ? null : 'lainnya')}
            className={`flex flex-col items-center py-1 rounded-xl transition ${
              ['inventaris', 'forum'].includes(activeView)
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu size={17} />
            <span className="text-[9.5px] mt-0.5 flex items-center gap-0.5">
              Lainnya
              <ChevronDown size={9} className={mobileSheet === 'lainnya' ? 'rotate-180' : ''} />
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Building2 size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Sewa Fasum</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <ReceiptText size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Kas</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Users size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Data Warga</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Shield size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Jadwal Ronda</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <FileText size={20} className="text-teal-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Notulen &amp; Absensi</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <BookOpen size={20} className="text-rose-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Tata Tertib</div>
                    <div className="text-[11px] text-slate-400">Peraturan resmi lingkungan perumahan GSS 1</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Award size={20} className="text-yellow-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Grisspoin</div>
                    <div className="text-[11px] text-slate-400">Poin keaktifan &amp; katalog reward warga</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <Package size={20} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Inventaris</div>
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
                      ? 'bg-blue-600/30 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <MessageSquare size={20} className="text-sky-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Forum</div>
                    <div className="text-[11px] text-slate-400">Ruang diskusi & musyawarah online warga</div>
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
