import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Cloud,
  Coins,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  AlertTriangle,
  ChevronDown,
  Lock,
  Users,
  CheckCircle2,
  X,
  Edit3,
  ShieldAlert,
  PhoneCall
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenNotifications: () => void;
  onOpenEmailAlerts: () => void;
  onOpenEditProfile: () => void;
  onOpenMasterReset: () => void;
  onOpenActiveSessions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenNotifications,
  onOpenEmailAlerts,
  onOpenEditProfile,
  onOpenMasterReset,
  onOpenActiveSessions
}) => {
  const {
    currentUser,
    isCloudSynced,
    emailAlerts,
    announcements,
    activeSessions,
    logout,
    setIsPengurusOpen,
    setActiveView
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return { label: 'SUPERADMIN', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'sekretaris':
        return { label: 'SEKRETARIS', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'bendahara1':
        return { label: 'BENDAHARA 1', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'bendahara2':
        return { label: 'BENDAHARA 2', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'admin_inventaris':
        return { label: 'ADMIN INVENTARIS', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'WARGA GSS', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  const badge = currentUser ? getRoleBadge(currentUser.role) : null;
  const unreadCount = announcements.length;

  return (
    <>
      {/* BILAH ATAS PORTAL: NOMOR TELEPON PENTING & DARURAT SEDAYU */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-[11px] font-bold py-1 px-3 sm:px-6 shadow-xs flex flex-wrap items-center justify-between gap-2 border-b border-red-500/30">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <span className="inline-flex items-center gap-1 bg-white text-red-700 px-2 py-0.2 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
            <PhoneCall size={10} className="text-red-600 animate-pulse" />
            <span>Hotline Darurat Sedayu</span>
          </span>
          <a href="tel:112" className="hover:underline flex items-center gap-1 shrink-0 bg-red-800/40 px-2 py-0.5 rounded-lg border border-red-300/30">
            <span className="text-amber-200">Darurat:</span> <span className="font-mono font-black text-white">112</span>
          </a>
          <a href="tel:0274798110" className="hover:underline hidden sm:flex items-center gap-1 shrink-0 bg-red-800/40 px-2 py-0.5 rounded-lg border border-red-300/30">
            <span className="text-amber-200">Polsek:</span> <span className="font-mono font-bold text-white">(0274) 6498549</span>
          </a>
          <a href="tel:0274798081" className="hover:underline hidden md:flex items-center gap-1 shrink-0 bg-red-800/40 px-2 py-0.5 rounded-lg border border-red-300/30">
            <span className="text-emerald-200">Puskesmas 1 (24 Jam):</span> <span className="font-mono font-bold text-white">(0274) 6498280</span>
          </a>
          <a href="tel:0274367406" className="hover:underline hidden lg:flex items-center gap-1 shrink-0 bg-red-800/40 px-2 py-0.5 rounded-lg border border-red-300/30">
            <span className="text-amber-200">Damkar:</span> <span className="font-mono font-bold text-white">(0274) 6462100</span>
          </a>
        </div>

        <button
          onClick={() => setActiveView('kontak_penting')}
          className="text-[10px] font-black text-amber-100 hover:text-white flex items-center gap-1 underline underline-offset-2 shrink-0 ml-auto"
        >
          <span>Daftar Kontak Lengkap &raquo;</span>
        </button>
      </div>

      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => currentUser && setActiveView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-amber-300 text-lg">
                  GS
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white">GRISSPO</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Cloud size={10} className="text-emerald-400 animate-pulse" />
                  Firebase Cloud Real-Time
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
                Griya Sedayu Selaras Portal Online
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nomor Telepon Penting Sedayu (Mencolok - Emergency Red) */}
            <button
              onClick={() => setActiveView('kontak_penting')}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black transition flex items-center gap-1.5 text-xs shadow-md shadow-red-600/30 border border-red-400/40 animate-pulse shrink-0"
              title="Nomor Telepon Penting & Darurat Sedayu (Polsek, Koramil, Puskesmas, Damkar)"
            >
              <PhoneCall size={14} className="text-amber-200" />
              <span className="hidden sm:inline">Kontak Darurat Sedayu</span>
              <span className="sm:hidden font-bold">Darurat</span>
            </button>

            {/* Struktur Pengurus Paguyuban Button (Always visible) */}
            <button
              onClick={() => setIsPengurusOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-700/50 transition flex items-center gap-1.5 text-xs font-bold"
              title="Informasi Pengurus Paguyuban Warga Perum GSS"
            >
              <Users size={15} className="text-indigo-400" />
              <span className="hidden md:inline">Pengurus Paguyuban</span>
            </button>

            {!currentUser ? (
              /* Unauthenticated / Guest state: Only show Login Warga button */
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-blue-400/30 transition transform active:scale-95"
              >
                <LogIn size={15} />
                <span>Login Warga</span>
              </button>
            ) : (
              /* Authenticated state: Show points, notifications, and user profile menu */
              <>
                {/* Anomaly email notification indicator */}
                {emailAlerts.length > 0 && (
                  <button
                    onClick={onOpenEmailAlerts}
                    className="relative p-2 rounded-xl bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-800/50 transition flex items-center gap-1.5 text-xs font-semibold"
                    title="Notifikasi Anomali Transaksi Kas (Terkirim ke Email)"
                  >
                    <AlertTriangle size={16} className="text-red-400 animate-bounce" />
                    <span className="hidden md:inline">Anomali Kas ({emailAlerts.length})</span>
                  </button>
                )}

                {/* Superadmin Active Sessions Monitor */}
                {currentUser.role === 'superadmin' && onOpenActiveSessions && (
                  <button
                    onClick={onOpenActiveSessions}
                    className="relative px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 transition flex items-center gap-1.5 text-xs font-bold shadow-xs"
                    title="Monitoring Pengguna Sedang Login Portal (Superadmin)"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Users size={14} className="text-emerald-400" />
                    <span className="hidden lg:inline">Online:</span>
                    <span className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-[11px] text-emerald-200">
                      {activeSessions.length}
                    </span>
                  </button>
                )}

                {/* Points Badge */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Coins size={14} className="text-amber-400" />
                  <span>{currentUser.points || 0} Poin</span>
                </div>

                {/* Announcements Notification */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                  title="Pengumuman Warga"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User profile / Role Switcher Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {currentUser.name.slice(0, 2)}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({currentUser.houseNumber})</span>
                      </div>
                      <div className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.2 rounded border ${badge?.bg || 'bg-slate-800 text-slate-300'} inline-block`}>
                        {badge?.label || 'WARGA GSS'}
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 ml-0.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-800 mb-2">
                        <p className="text-xs text-slate-400">Sedang aktif sebagai:</p>
                        <p className="text-sm font-bold text-white">{currentUser.name}</p>
                        <p className="text-xs text-blue-400 font-mono">Rumah {currentUser.houseNumber} ({currentUser.role.toUpperCase()})</p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                          <Coins size={12} />
                          <span>{currentUser.points || 0} Poin Loyalitas</span>
                        </div>
                      </div>

                      {/* Profile & Superadmin Tools */}
                      <div className="space-y-1 mb-2 pb-2 border-b border-slate-800">
                        {/* Edit Profile Button for ALL roles */}
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            onOpenEditProfile();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-blue-300 font-bold flex items-center gap-2 transition"
                        >
                          <Edit3 size={13} className="text-blue-400" />
                          <span>Edit Profil Saya</span>
                        </button>

                        {/* Master Reset Button for Superadmin */}
                        {currentUser.role === 'superadmin' && (
                          <>
                            {onOpenActiveSessions && (
                              <button
                                onClick={() => {
                                  setShowRoleMenu(false);
                                  onOpenActiveSessions();
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-emerald-950/40 text-emerald-300 font-bold flex items-center justify-between transition"
                              >
                                <span className="flex items-center gap-2">
                                  <Users size={13} className="text-emerald-400" />
                                  <span>Pantau Pengguna Online</span>
                                </span>
                                <span className="text-[9px] bg-emerald-900 text-emerald-200 border border-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">
                                  {activeSessions.length} Online
                                </span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setShowRoleMenu(false);
                                onOpenMasterReset();
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-red-950/40 text-red-300 font-bold flex items-center justify-between transition"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldAlert size={13} className="text-red-400" />
                                <span>Hapus / Reset Master Data</span>
                              </span>
                              <span className="text-[9px] bg-red-900/60 text-red-200 border border-red-700 px-1 rounded font-mono">SA</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800 flex items-center gap-1">
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            onOpenLogin();
                          }}
                          className="flex-1 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <LogIn size={13} />
                          <span>Ganti Akun / Login Warga</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            logout();
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                          title="Keluar / Logout"
                        >
                          <LogOut size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
