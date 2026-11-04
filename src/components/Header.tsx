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
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenNotifications: () => void;
  onOpenEmailAlerts: () => void;
  onOpenEditProfile: () => void;
  onOpenMasterReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenNotifications,
  onOpenEmailAlerts,
  onOpenEditProfile,
  onOpenMasterReset
}) => {
  const {
    currentUser,
    isCloudSynced,
    emailAlerts,
    announcements,
    logout,
    switchRoleWithPassword,
    setIsPengurusOpen
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Role password authorization modal state
  const [authTarget, setAuthTarget] = useState<{ roleName: string; residentName: string; houseNumber: string } | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return { label: 'SUPERADMIN', bg: 'bg-red-100 text-red-800 border-red-300' };
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

  const handlePromptRolePassword = (roleName: string, residentName: string, houseNumber: string) => {
    setShowRoleMenu(false);
    setAuthTarget({ roleName, residentName, houseNumber });
    setAuthPassword('Griss123'); // Preset default for user testing convenience
    setAuthError('');
  };

  const handleConfirmRoleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authTarget) return;

    const res = switchRoleWithPassword(authTarget.houseNumber, authPassword);
    if (res.success) {
      setAuthTarget(null);
      setAuthPassword('');
      alert(res.message);
    } else {
      setAuthError(res.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
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
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 flex items-center gap-1">
                          <Lock size={11} className="text-amber-400" />
                          <span>Ganti Role (Wajib Password):</span>
                        </div>

                        {/* 1. Superadmin (Beni B24) */}
                        <button
                          onClick={() => handlePromptRolePassword('Superadmin', 'BENI', 'B 24')}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-red-300 font-semibold flex items-center justify-between"
                        >
                          <span>Superadmin (BENI - B 24)</span>
                          <span className="text-[9px] bg-red-950 border border-red-700 px-1 rounded">Pass</span>
                        </button>

                        {/* 2. Bendahara 1 (Ahmad B02) */}
                        <button
                          onClick={() => handlePromptRolePassword('Bendahara 1', 'AHMAD', 'B 02')}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-emerald-300 font-semibold flex items-center justify-between"
                        >
                          <span>Bendahara 1 (AHMAD - B 02)</span>
                          <span className="text-[9px] bg-emerald-950 border border-emerald-700 px-1 rounded">Pass</span>
                        </button>

                        {/* 3. Bendahara 2 (Robi C15) */}
                        <button
                          onClick={() => handlePromptRolePassword('Bendahara 2', 'ROBI', 'C 15')}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-teal-300 font-semibold flex items-center justify-between"
                        >
                          <span>Bendahara 2 (ROBI - C 15)</span>
                          <span className="text-[9px] bg-teal-950 border border-teal-700 px-1 rounded">Pass</span>
                        </button>

                        {/* 4. Admin Inventaris (Sony B23) */}
                        <button
                          onClick={() => handlePromptRolePassword('Admin Inventaris', 'SONY', 'B 23')}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-amber-300 font-semibold flex items-center justify-between"
                        >
                          <span>Admin Inventaris (SONY - B 23)</span>
                          <span className="text-[9px] bg-amber-950 border border-amber-700 px-1 rounded">Pass</span>
                        </button>

                        {/* 5. Warga Biasa (Danang A03) */}
                        <button
                          onClick={() => handlePromptRolePassword('Warga', 'DANANG', 'A 03')}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-between"
                        >
                          <span>Warga (DANANG - A 03)</span>
                          <span className="text-[9px] bg-slate-800 border border-slate-700 px-1 rounded">Pass</span>
                        </button>
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
                          <span>Form Login Warga</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            logout();
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                          title="Keluar / Reset"
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

      {/* MANDATORY PASSWORD AUTHORIZATION MODAL FOR ROLE SWITCH */}
      {authTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold">Otorisasi Kata Sandi Role</h3>
              </div>
              <button
                onClick={() => setAuthTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRoleAuth} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Target Akses Role:
                </span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {authTarget.roleName} - Bpk. {authTarget.residentName}
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  Nomor Rumah: {authTarget.houseNumber}
                </span>
              </div>

              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Masukkan Password Akun Bpk. {authTarget.residentName}:
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Masukkan password..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default password: <span className="font-mono text-blue-600 font-bold">Griss123</span> atau password pribadi.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Verifikasi & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
