import React, { useState, useEffect } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { InfoBlast } from '../types';
import { Megaphone, X, CheckCircle2, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';

export const InfoBlastModal: React.FC = () => {
  const { infoBlasts, currentUser: authUser } = useApp();
  const currentUser = authUser || defaultGuestUser;

  const [currentBlastIndex, setCurrentBlastIndex] = useState<number>(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Filter info blasts targeting current user (either 'ALL' or matching houseNumber)
  const relevantBlasts = infoBlasts.filter((blast) => {
    if (dismissedIds.includes(blast.id)) return false;
    if (!blast.targetHouses || blast.targetHouses.length === 0 || blast.targetHouses.includes('ALL')) {
      return true;
    }
    const userHouseClean = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
    return blast.targetHouses.some((h) => h.replace(/\s+/g, '').toUpperCase() === userHouseClean);
  });

  const activeBlast = relevantBlasts[currentBlastIndex] || null;

  const handleDismiss = () => {
    if (!activeBlast) return;
    setDismissedIds((prev) => [...prev, activeBlast.id]);
  };

  if (!activeBlast || !currentUser.id) return null;

  const categoryBg =
    activeBlast.category === 'Darurat'
      ? 'bg-rose-600 text-white'
      : activeBlast.category === 'Penting'
      ? 'bg-amber-500 text-slate-950'
      : activeBlast.category === 'Keuangan'
      ? 'bg-emerald-600 text-white'
      : activeBlast.category === 'Kegiatan'
      ? 'bg-indigo-600 text-white'
      : 'bg-blue-600 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-blue-500 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 relative">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            title="Tutup Pengumuman"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 animate-pulse text-amber-300">
              <Megaphone size={26} />
            </div>
            <div>
              <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${categoryBg}`}>
                Info Blast • {activeBlast.category}
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
                {activeBlast.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
            {activeBlast.content}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Dikirim oleh: <strong className="text-slate-700">{activeBlast.createdBy}</strong></span>
            <span>{new Date(activeBlast.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Mengerti / Tutup Pengumuman</span>
            </button>
            {relevantBlasts.length > 1 && (
              <div className="text-center text-[11px] text-slate-400 mt-2">
                Pesan {currentBlastIndex + 1} dari {relevantBlasts.length} info blast
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
