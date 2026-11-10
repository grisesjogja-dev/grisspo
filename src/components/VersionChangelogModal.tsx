import React from 'react';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  APP_BUILD_CODE,
  APP_RELEASE_NAME,
  SYSTEM_UPDATE_HISTORY
} from '../data/versionInfo';
import { Sparkles, X, CheckCircle2, Calendar, Tag, ShieldCheck, Layers } from 'lucide-react';

interface VersionChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionChangelogModal: React.FC<VersionChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 relative border-b border-indigo-900/50">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Layers size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-amber-300 uppercase">
                  Riwayat Versi &amp; Pembaruan Sistem
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  {APP_VERSION} Stable
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                Portal GRISSPO &bull; {APP_RELEASE_NAME}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-blue-400" />
                  <span>Build: {APP_BUILD_DATE}</span>
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                  Code: {APP_BUILD_CODE}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Timeline of updates */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-4">
            {SYSTEM_UPDATE_HISTORY.map((rel, idx) => (
              <div
                key={rel.version}
                className={`p-4 rounded-2xl border transition ${
                  idx === 0
                    ? 'bg-blue-50/70 border-blue-200 ring-1 ring-blue-500/20'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                        idx === 0
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      {rel.version}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      {rel.releaseTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {rel.badge && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-300">
                        {rel.badge}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <Tag size={11} className="text-slate-400" />
                      <span>{rel.releaseDate}</span>
                    </span>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {rel.highlights.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2
                        size={13}
                        className={`mt-0.5 shrink-0 ${
                          idx === 0 ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* System Specs Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck size={16} />
              <span>Arsitektur Sistem &amp; Kepatuhan Keamanan</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Aplikasi GRISSPO berjalan di atas infrastruktur <strong>Firebase Cloud Real-Time</strong> dengan enkripsi transaksi finansial <strong>SHA-256</strong>, otentikasi biometrik standar <strong>FIDO2 / WebAuthn</strong>, serta proteksi hak akses terenkripsi multi-peran (Superadmin, Bendahara, Sekretaris, Kamtibmas, &amp; Warga).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
