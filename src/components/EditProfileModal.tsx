import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Home, Users, Lock, Shield, CheckCircle2, X, Sparkles, Fingerprint } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerResidentBiometrics } from '../utils/webauthn';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateResidentProfile, residents } = useApp();

  if (!isOpen || !currentUser) return null;

  const currentResident = residents.find(
    (r) =>
      r.id === currentUser.id ||
      r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase()
  );

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentResident?.phone || currentUser.phone || '');
  const [familyMembers, setFamilyMembers] = useState(currentResident?.familyMembers || 1);
  const [password, setPassword] = useState(currentResident?.password || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [bioNotice, setBioNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama warga tidak boleh kosong!');
      return;
    }

    setIsSaving(true);
    try {
      await updateResidentProfile({
        name: name.trim().toUpperCase(),
        phone: phone.trim(),
        familyMembers: Number(familyMembers) || 1,
        password: password.trim()
      });

      try {
        confetti({ particleCount: 60, spread: 60 });
      } catch {}

      setSuccessMsg('Profil berhasil diperbarui dan tersimpan ke Firebase Cloud!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Gagal memperbarui profil: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            {currentUser.name.slice(0, 2)}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Edit Profil Saya</span>
              <Sparkles size={15} className="text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500">
              Perum Griya Sedayu Selaras 1 &bull; Rumah{' '}
              <span className="font-mono font-bold text-slate-800">{currentUser.houseNumber}</span>
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
            <p className="text-sm font-extrabold text-slate-800">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* House Number (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Home size={14} className="text-blue-600" />
                <span>Nomor Rumah (Terkunci)</span>
              </label>
              <input
                type="text"
                disabled
                value={`Rumah ${currentUser.houseNumber} (Blok ${currentUser.houseNumber.split(' ')[0]})`}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Role Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                <Shield size={14} className="text-blue-600" />
                <span>Hak Akses Role</span>
              </label>
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase text-indigo-700">
                {currentUser.role}
              </div>
            </div>

            {/* Resident Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User size={14} className="text-blue-600" />
                <span>Nama Lengkap Warga</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nama Bpk/Ibu Warga"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WhatsApp / Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-600" />
                <span>Nomor HP / WhatsApp</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Digunakan untuk notifikasi penting paguyuban</p>
            </div>

            {/* Family Members */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                <span>Jumlah Anggota Keluarga (Jiwa)</span>
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={familyMembers}
                onChange={(e) => setFamilyMembers(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password Portal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock size={14} className="text-amber-600" />
                <span>Password Akun Portal Baru</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kosongkan jika tetap gunakan Griss123"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Password khusus untuk login akun rumah ini</p>
            </div>

            {/* Daftarkan Biometrik Sidik Jari / Wajah */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Fingerprint size={15} className="text-emerald-600" />
                    <span>Autentikasi Biometrik Perangkat</span>
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    Aktifkan login instan dengan sidik jari atau Face ID di HP / laptop ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!currentResident) return;
                    setBioNotice('Membuka sensor biometrik...');
                    const res = await registerResidentBiometrics(currentResident);
                    setBioNotice(res.message);
                    setTimeout(() => setBioNotice(''), 4000);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                >
                  Daftarkan Biometrik
                </button>
              </div>
              {bioNotice && (
                <p className="text-[11px] font-bold text-emerald-800 mt-2 bg-emerald-100/80 p-2 rounded-lg">
                  {bioNotice}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
