import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Shield, UserCheck, X, Home, Lock, AlertCircle, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithHouseNumber, switchRoleWithPassword } = useApp();
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('Griss123');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput.trim()) {
      setErrorMsg('Masukkan username nomor rumah (contoh: GrissB24, GrissB02, GrissC15)');
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

  const handleSelectPreset = (houseNumber: string, defaultUsername: string) => {
    setUsernameInput(defaultUsername);
    setErrorMsg('');
    setSuccessMsg(`Akun Rumah ${houseNumber} dipilih. Masukkan kata sandi (password) di bawah untuk memverifikasi.`);
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
                Username Warga (Format: <span className="text-blue-600 font-mono font-bold">Griss[NomorRumah]</span>)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Home size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: GrissB24, GrissB02, GrissC15, GrissB23"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Wajib (Setiap akun memiliki verifikasi sandi)
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
                Standar default password: <span className="font-mono text-blue-600 font-bold">Griss123</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              <span>Verifikasi Sandi & Masuk</span>
            </button>
          </form>

          {/* Quick preset selector for testing (requires password) */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield size={13} className="text-blue-600" />
              <span>Pilih Akun Pengurus / Warga (Wajib Masukkan Password):</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Superadmin Beni B24 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('B 24', 'GrissB24')}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/80 text-left transition"
              >
                <div className="font-bold text-red-800 flex items-center justify-between">
                  <span>Superadmin</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 text-red-900 font-mono">B 24</span>
                </div>
                <div className="text-[11px] text-red-600 mt-0.5 font-medium">Bpk. BENI</div>
              </button>

              {/* Bendahara 1 Ahmad B02 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('B 02', 'GrissB02')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition"
              >
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Bendahara 1</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono">B 02</span>
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Bpk. AHMAD</div>
              </button>

              {/* Bendahara 2 Robi C15 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('C 15', 'GrissC15')}
                className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-left transition"
              >
                <div className="font-bold text-teal-800 flex items-center justify-between">
                  <span>Bendahara 2</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 font-mono">C 15</span>
                </div>
                <div className="text-[11px] text-teal-600 mt-0.5 font-medium">Bpk. ROBY C</div>
              </button>

              {/* Admin Inventaris Sony B23 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('B 23', 'GrissB23')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-left transition"
              >
                <div className="font-bold text-amber-800 flex items-center justify-between">
                  <span>Admin Inventaris</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">B 23</span>
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Bpk. SONY</div>
              </button>

              {/* Warga Danang A03 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('A 03', 'GrissA03')}
                className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800">Warga: </span>
                  <span className="text-slate-600">Bpk. DANANG (Rumah A 03)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">Pilih</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
