import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Database,
  Coins,
  Receipt,
  FileText,
  CalendarCheck2,
  Building2,
  MessageSquare,
  Bell,
  Send
} from 'lucide-react';

interface MasterResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterResetModal: React.FC<MasterResetModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, resetFeatureData, masterResetAllFeatures } = useApp();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [actionType, setActionType] = useState<'single' | 'all' | null>(null);

  if (!isOpen) return null;

  const isSuperadmin = currentUser?.role === 'superadmin';

  const featureList = [
    { id: 'jimpitan', label: 'Laporan Jimpitan Online', icon: Coins, desc: 'Hapus seluruh arsip laporan jimpitan harian.', color: 'text-amber-500' },
    { id: 'keuangan', label: 'Transaksi Kas Keuangan', icon: Receipt, desc: 'Hapus seluruh catatan pemasukan & pengeluaran kas.', color: 'text-emerald-500' },
    { id: 'absensi', label: 'Data Absensi Warga', icon: CalendarCheck2, desc: 'Hapus checklist kehadiran ronda, kerjabakti & rapat.', color: 'text-indigo-500' },
    { id: 'notulen', label: 'Notulen Rapat Paguyuban', icon: FileText, desc: 'Hapus seluruh arsip hasil dan notulen rapat warga.', color: 'text-blue-500' },
    { id: 'fasum', label: 'Booking Fasum / Pendopo', icon: Building2, desc: 'Hapus seluruh data reservasi fasilitas umum.', color: 'text-cyan-500' },
    { id: 'forum', label: 'Postingan Forum Diskusi', icon: MessageSquare, desc: 'Hapus seluruh thread forum warga dan komentar.', color: 'text-purple-500' },
    { id: 'pengumuman', label: 'Pengumuman Portal', icon: Bell, desc: 'Hapus arsip pengumuman dan edaran pengurus.', color: 'text-pink-500' },
    { id: 'wa_logs', label: 'Log WhatsApp Iuran', icon: Send, desc: 'Hapus riwayat notifikasi WhatsApp peringatan iuran.', color: 'text-green-500' },
    { id: 'poin', label: 'Poin Loyalitas & Reward Log', icon: Coins, desc: 'Reset poin seluruh warga ke 0 dan hapus riwayat log.', color: 'text-yellow-500' }
  ];

  const handleExecuteSingleReset = async (featureId: string) => {
    if (!isSuperadmin) {
      alert('Akses Ditolak: Fitur ini khusus hak akses Superadmin (Bpk. BENI - B 24)!');
      return;
    }
    setIsProcessing(true);
    setFeedbackMsg(null);
    try {
      await resetFeatureData(featureId);
      setFeedbackMsg({
        type: 'success',
        text: `Data fitur "${featureList.find(f => f.id === featureId)?.label}" berhasil di-reset bersih secara permanen dan disinkronkan ke Firebase Cloud!`
      });
      setSelectedFeature(null);
      setActionType(null);
      setConfirmationCode('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal mereset: ${err?.message || 'Terjadi kesalahan sistem'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteMasterResetAll = async () => {
    if (!isSuperadmin) {
      alert('Akses Ditolak: Fitur ini khusus hak akses Superadmin (Bpk. BENI - B 24)!');
      return;
    }
    if (confirmationCode.trim().toUpperCase() !== 'RESET') {
      alert('Ketik "RESET" pada kotak konfirmasi untuk melanjutkan!');
      return;
    }
    setIsProcessing(true);
    setFeedbackMsg(null);
    try {
      await masterResetAllFeatures();
      setFeedbackMsg({
        type: 'success',
        text: 'MASTER RESET SELESAI! Seluruh data dummy/transaksi di semua fitur telah dihapus bersih dan tidak akan muncul kembali di perangkat manapun. Data 58 warga tetap terjaga.'
      });
      setActionType(null);
      setConfirmationCode('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal master reset: ${err?.message || 'Terjadi kesalahan sistem'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Manajemen Hapus / Reset Master Data</span>
                <span className="text-[10px] font-mono bg-red-900/60 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                  SUPERADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pembersihan data per-fitur atau master reset cloud lintas perangkat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Superadmin credential badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                {currentUser?.name?.slice(0, 2) || 'SA'}
              </div>
              <div>
                <p className="text-xs text-slate-500">Otoritas Akses:</p>
                <p className="text-sm font-black text-slate-900">
                  {currentUser?.name || 'Superadmin'} ({currentUser?.houseNumber || 'B 24'})
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${isSuperadmin ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                {isSuperadmin ? 'Superadmin Terverifikasi' : 'Bukan Superadmin'}
              </span>
            </div>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${feedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold">{feedbackMsg.text}</div>
            </div>
          )}

          {/* Master Reset All Banner */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 rounded-2xl p-5 text-white border border-red-800/80 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-red-400" />
                  <h4 className="text-sm font-black tracking-wide text-red-200">
                    MASTER WIPE / RESET SEMUA DATA DUMMY
                  </h4>
                </div>
                <p className="text-xs text-slate-300 max-w-md">
                  Mengosongkan seluruh data transaksi, jimpitan, absensi, notulen, booking fasum, postingan forum, dan log. Data 58 warga resmi tetap dipertahankan.
                </p>
              </div>
              <button
                disabled={!isSuperadmin || isProcessing}
                onClick={() => {
                  setActionType('all');
                  setSelectedFeature(null);
                  setFeedbackMsg(null);
                }}
                className="shrink-0 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
              >
                <Trash2 size={15} />
                <span>Reset Semua Data Master</span>
              </button>
            </div>

            {/* Confirmation Box for Master Reset All */}
            {actionType === 'all' && (
              <div className="mt-4 pt-4 border-t border-red-800/60 bg-red-900/30 -mx-5 -mb-5 p-5 space-y-3">
                <div className="flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Konfirmasi Wajib: Tindakan ini permanen dan akan langsung tersinkron ke Firebase Cloud di semua perangkat. Ketik kata <strong>RESET</strong> di bawah:
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder='Ketik "RESET"'
                    className="flex-1 px-3 py-2 bg-slate-900 border border-red-500/60 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionType(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      disabled={confirmationCode.trim().toUpperCase() !== 'RESET' || isProcessing}
                      onClick={handleExecuteMasterResetAll}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      <span>Lakukan Master Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Reset per-Fitur */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>Hapus / Reset Data Spesifik Per-Fitur:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featureList.map((f) => {
                const Icon = f.icon;
                const isSelected = selectedFeature === f.id && actionType === 'single';
                return (
                  <div
                    key={f.id}
                    className={`p-3.5 rounded-2xl border transition ${isSelected ? 'border-red-500 bg-red-50/40 ring-2 ring-red-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-slate-100 ${f.color}`}>
                          <Icon size={17} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{f.label}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {f.id}</span>
                      <button
                        disabled={!isSuperadmin || isProcessing}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFeature(null);
                            setActionType(null);
                          } else {
                            setSelectedFeature(f.id);
                            setActionType('single');
                            setFeedbackMsg(null);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${isSelected ? 'bg-slate-200 text-slate-700' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'}`}
                      >
                        <Trash2 size={12} />
                        <span>{isSelected ? 'Tutup' : 'Reset Fitur'}</span>
                      </button>
                    </div>

                    {/* Single Feature Confirmation Prompt */}
                    {isSelected && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-in fade-in duration-100">
                        <p className="text-[11px] text-red-800 font-medium">
                          Yakin ingin mengosongkan seluruh data <strong>{f.label}</strong>? Data yang dihapus tidak akan muncul kembali di perangkat manapun.
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedFeature(null);
                              setActionType(null);
                            }}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-[11px] font-bold border border-slate-300"
                          >
                            Batal
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleExecuteSingleReset(f.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm"
                          >
                            {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            <span>Ya, Hapus Data Ini</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Ketentuan Perlindungan Data:</strong> Data resmi 58 warga (Nama, Blok/Nomor Rumah, Status Rumah) dan 33 item inventaris standar paguyuban dilindungi dan tidak akan terhapus secara tidak sengaja melalui tombol reset ini.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Kewenangan Superadmin GRISSPO 2026 &bull; Cloud Persistence
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
