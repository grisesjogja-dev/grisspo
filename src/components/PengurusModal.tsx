import React from 'react';
import { dataPengurusGSS } from '../data/seedData';
import { Users, Phone, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PengurusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PengurusModal: React.FC<PengurusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getPositionBadge = (pos: string) => {
    if (pos.includes('Ketua Paguyuban') && !pos.includes('Wakil')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (pos.includes('Wakil')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (pos.includes('Bendahara 1')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (pos.includes('Bendahara 2')) {
      return 'bg-teal-100 text-teal-800 border-teal-300';
    }
    if (pos.includes('Sekretaris')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <Users size={26} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                SK Pengurus Paguyuban 2026
              </span>
              <h2 className="text-xl font-black tracking-tight text-white">
                Struktur Pengurus Paguyuban Warga Perum GSS
              </h2>
              <p className="text-xs text-blue-200">
                Griya Sedayu Selaras 1 - Guyub Rukun & Amanah
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataPengurusGSS.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getPositionBadge(
                        p.position
                      )}`}
                    >
                      {p.position}
                    </span>
                    <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                      Rumah {p.houseNumber}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Bpk. {p.name}
                  </h3>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tugas & Tanggung Jawab:
                    </span>
                    {p.tasks.map((task, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 size={12} className="text-blue-500 mt-0.5 shrink-0" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Kontak WhatsApp:
                  </span>
                  <a
                    href={`https://wa.me/62${p.phone.replace(/[^0-9]/g, '').slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                  >
                    <Phone size={12} />
                    <span>{p.phone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-600 shrink-0" />
            <div>
              <div className="font-bold">Keamanan & Integritas Pengelolaan</div>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Setiap pergantian peran atau otorisasi hak akses wajib diverifikasi menggunakan kata sandi (password) masing-masing demi menjaga integritas data paguyuban.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
