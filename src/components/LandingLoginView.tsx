import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KeyRound,
  Home,
  Lock,
  AlertCircle,
  UserCheck,
  Fingerprint,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { authenticateResidentBiometrics } from '../utils/webauthn';

interface LandingLoginViewProps {
  onOpenLogin?: () => void;
}

export const LandingLoginView: React.FC<LandingLoginViewProps> = () => {
  const { loginWithHouseNumber, residents, loginAsResident, setIsPengurusOpen, setActiveView } = useApp();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim()) {
      setErrorMsg('Pilih nomor rumah atau masukkan username Anda!');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Password wajib diisi!');
      return;
    }

    const res = loginWithHouseNumber(usernameInput, passwordInput);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsBiometricLoading(true);
    try {
      const bioRes = await authenticateResidentBiometrics();
      if (bioRes.success && (bioRes.residentHouse || bioRes.residentId)) {
        const foundRes = residents.find(
          (r) =>
            (bioRes.residentId && r.id === bioRes.residentId) ||
            (bioRes.residentHouse &&
              r.houseNumber.replace(/\s+/g, '').toUpperCase() ===
                bioRes.residentHouse.replace(/\s+/g, '').toUpperCase())
        );
        if (foundRes) {
          loginAsResident(foundRes);
          setSuccessMsg(`Autentikasi biometrik berhasil! Selamat datang, ${foundRes.name}.`);
        } else {
          setErrorMsg('Data warga terdaftar biometrik tidak ditemukan.');
        }
      } else {
        setErrorMsg(bioRes.message || 'Autentikasi biometrik gagal.');
      }
    } catch (err: any) {
      setErrorMsg('Gagal memproses biometrik: ' + (err.message || 'Perangkat tidak merespons'));
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-4 sm:py-8 md:py-12 px-2 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-400 p-0.5 shadow-xl shadow-blue-500/30 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-amber-300">
                GS
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Portal Warga GRISSPO
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">
            Griya Sedayu Selaras 1 &bull; Argorejo, Sedayu, Bantul
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold border border-white/15">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Sistem Akses Resmi &amp; Terverifikasi Cloud</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <UserCheck size={18} className="shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Quick House Selector / Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nomor Rumah / Username
                </label>
                <span className="text-[11px] text-blue-600 font-semibold">58 Rumah Terdaftar</span>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Home size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Ketik B 24, B 02, C 15, atau pilih di bawah..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Cepat:</span>
                {['B 24', 'B 08', 'B 02', 'C 15', 'A 01'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setUsernameInput(h)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-mono font-bold border border-slate-200 transition"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password Akun
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  placeholder="Masukkan password akun..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Password bawaan default: <span className="font-mono text-blue-600 font-bold">Griss123</span> (dapat diubah setelah login)
              </p>
            </div>

            {/* Submit Password Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold rounded-2xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transform active:scale-98"
            >
              <KeyRound size={17} />
              <span>Verifikasi Sandi &amp; Masuk Portal</span>
            </button>

            {/* Divider */}
            <div className="relative py-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                atau
              </span>
            </div>

            {/* Web Authentication API: Login dengan Biometrik */}
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={isBiometricLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black rounded-2xl text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 border border-emerald-400/40"
            >
              <Fingerprint size={18} className={isBiometricLoading ? 'animate-spin' : 'animate-pulse text-emerald-200'} />
              <span>
                {isBiometricLoading
                  ? 'Menghubungkan Sensor Biometrik...'
                  : 'Login dengan Biometrik (Fingerprint / Face ID)'}
              </span>
            </button>
          </form>

          {/* Quick Info & Pengurus Paguyuban link */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setIsPengurusOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
            >
              <Users size={14} />
              <span>Struktur Pengurus Paguyuban</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('kontak_penting')}
              className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 transition"
            >
              <PhoneCall size={14} />
              <span>Nomor Kontak Darurat Sedayu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
