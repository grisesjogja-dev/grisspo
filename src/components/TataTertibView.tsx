import React, { useState } from 'react';
import { officialTataTertib } from '../data/seedData';
import {
  BookOpen,
  Search,
  ShieldAlert,
  Wallet,
  Home,
  Clock,
  Car,
  HeartHandshake,
  Download,
  CheckCircle2
} from 'lucide-react';

export const TataTertibView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const getSectionIcon = (num: number) => {
    switch (num) {
      case 1:
        return Home;
      case 2:
        return Wallet;
      case 3:
        return CheckCircle2;
      case 4:
        return Clock;
      case 5:
        return Car;
      case 6:
        return HeartHandshake;
      default:
        return BookOpen;
    }
  };

  const filteredSections = officialTataTertib.sections.map((sec) => {
    const matchesTitle = sec.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchedItems = sec.items.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...sec,
      isVisible: matchesTitle || matchedItems.length > 0,
      highlightedItems: matchesTitle ? sec.items : matchedItems
    };
  }).filter((s) => s.isVisible);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <BookOpen size={14} className="text-blue-300" />
            <span>Anggaran Dasar & Pedoman Warga</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tata Tertib Warga Paguyuban Perum Griya Sedayu Selaras 1
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            {officialTataTertib.period}. Disusun demi mewujudkan kerukunan, ketertiban, keamanan, kebersihan, dan kenyamanan seluruh warga di Perumahan GSS 1 Bantul.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 font-semibold border border-blue-400/20">
              Iuran, Sampah &amp; Sewa Parkir: Jatuh Tempo Tgl 28
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-200 font-semibold border border-amber-400/20">
              Kunci Portal: 21.00 WIB Tepat
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-400/20">
              Jimpitan: Rp 500 / hari
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-200 font-semibold border border-red-400/20">
              Tamu 1x24 Jam Wajib Lapor
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <Search size={18} className="text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Cari pasal / aturan (contoh: iuran, portal, denda, hewan, carport, tamu)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs sm:text-sm focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Sections Cards */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const Icon = getSectionIcon(section.number);
          return (
            <div
              key={section.number}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 transition"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Icon size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                    Pasal {section.number}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {section.highlightedItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Sign-off */}
      <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 text-center text-xs text-slate-600">
        <p className="font-semibold italic">
          &ldquo;Peraturan ini dibuat bersama dengan semangat mengutamakan kepentingan umum, maka seluruh warga wajib bertanggung jawab atas tegaknya peraturan ini demi terciptanya kehidupan warga Perumahan Griya Sedayu Selaras 1 yang tertib, aman, tentram, bersih dan nyaman.&rdquo;
        </p>
        <p className="mt-2 font-bold text-slate-800">
          Bantul, 1 Nopember 2023 - Pengurus Paguyuban GSS 1
        </p>
      </div>
    </div>
  );
};
