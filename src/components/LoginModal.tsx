import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, X, Home, Lock, AlertCircle, UserCheck, Fingerprint } from 'lucide-react';
import { authenticateResidentBiometrics } from '../utils/webauthn';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithHouseNumber, residents, loginAsResident } = useApp();
  // Form login otomatis kosong, semua user wajib input username dan password
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim()) {
      setErrorMsg('Masukkan username nomor rumah (contoh: GrissB24, GrissB02, GrissC15, atau B 24)');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Password wajib diisi!');
      return;
    }

    const res = loginWithHouseNumber(usernameInput, passwordInput);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 900);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/30 flex items-center justify-center border border-white/20">
              <Home className="text-amber-300" size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Login Portal GRISSPO</h2>
              <p className="text-xs text-blue-200">Griya Sedayu Selaras 1 - Bantul, D.I. Yogyakarta</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <UserCheck size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Warga (Format: <span className="text-blue-600 font-mono font-bold">Griss[NomorRumah]</span> atau <span className="text-blue-600 font-mono font-bold">Nomor Rumah</span>)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Home size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: GrissB24, GrissB02, atau B 24"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Akun (Wajib Diinput)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Masukkan password akun..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Gunakan password pribadi Anda atau default <span className="font-mono text-blue-600 font-bold">Griss123</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              <span>Verifikasi Sandi & Masuk</span>
            </button>

            {/* Tombol Login dengan Biometrik (Web Authentication API: Fingerprint / Face ID) */}
            <div className="relative py-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                atau autentikasi cepat
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                setErrorMsg('');
                setSuccessMsg('');
                setIsBiometricLoading(true);
                try {
                  const bioRes = await authenticateResidentBiometrics();
                  if (bioRes.success && (bioRes.residentHouse || bioRes.residentId)) {
                    // Find resident
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
                      setTimeout(() => {
                        onClose();
                        setSuccessMsg('');
                      }, 900);
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
              }}
              disabled={isBiometricLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 border border-emerald-400/30"
            >
              <Fingerprint size={16} className={isBiometricLoading ? 'animate-spin' : 'animate-pulse text-emerald-200'} />
              <span>{isBiometricLoading ? 'Menghubungkan Sensor...' : 'Login dengan Biometrik (Fingerprint / Face ID)'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
