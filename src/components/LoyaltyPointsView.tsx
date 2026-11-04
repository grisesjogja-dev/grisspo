import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Coins,
  Gift,
  History,
  TrendingUp,
  Sparkles,
  Trophy,
  CheckCircle2,
  Trash2,
  Car,
  Shirt,
  ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoyaltyPointsView: React.FC = () => {
  const { currentUser, rewards, pointLogs, redeemReward, residents, deletePointLog } = useApp();
  const [activeTab, setActiveTab] = useState<'catalog' | 'history' | 'leaderboard'>('catalog');

  const getRank = (pts: number) => {
    if (pts >= 350) return { title: 'Warga Teladan Utama', color: 'from-amber-400 to-yellow-600', badge: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (pts >= 200) return { title: 'Warga Sangat Aktif', color: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (pts >= 100) return { title: 'Warga Berpartisipasi', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    return { title: 'Warga GSS Rukun', color: 'from-slate-500 to-slate-700', badge: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  const rank = getRank(currentUser.points || 0);

  // Leaderboard of top 10 residents
  const leaderboard = [...residents].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);

  const handleRedeem = (rewardId: string) => {
    const res = redeemReward(rewardId);
    if (res.success) {
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {
        // ignore
      }
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trash2':
        return Trash2;
      case 'Car':
        return Car;
      case 'Shirt':
        return Shirt;
      default:
        return Gift;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Profile Poin Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
              <Trophy size={14} className="text-amber-200" />
              <span>Program Apresiasi Gotong Royong Warga GSS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Sistem Poin Loyalitas (GRISS-POIN)
            </h2>
            <p className="mt-2 text-amber-100 text-xs sm:text-sm leading-relaxed">
              Dapatkan poin apresiasi setiap kali ikut jimpitan online, hadir ronda malam, kerja bakti, maupun sumbangan sosial. Kumpulkan poin dan tukarkan dengan berbagai benefit nyata paguyuban.
            </p>
          </div>

          {/* User Points Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl min-w-[260px] text-center">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Poin Anda Saat Ini
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 flex items-center justify-center gap-2 mt-1">
              <Coins size={30} className="text-amber-400 animate-spin-slow" />
              <span>{currentUser.points || 0}</span>
            </div>
            <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-extrabold border bg-amber-400/20 text-amber-300 border-amber-400/30">
              {rank.title}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              {currentUser.name} &bull; Rumah {currentUser.houseNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Ways to Earn Points - Official 5 New Rules */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" />
            <span>Rincian Resmi GRISS-POIN Baru:</span>
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
            Poin Lama Telah Direset & Diperbarui
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-200 text-center flex flex-col justify-between">
            <div>
              <span className="font-black text-amber-800 text-xl block">+25 Poin</span>
              <span className="font-extrabold text-slate-900 block mt-1">Hadir Ronda / Jimpit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Kehadiran jadwal ronda & jimpit malam</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-center flex flex-col justify-between">
            <div>
              <span className="font-black text-emerald-800 text-xl block">+40 Poin</span>
              <span className="font-extrabold text-slate-900 block mt-1">Hadir Kerja Bakti</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Gotong royong lingkungan warga GSS</p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border-2 border-blue-200 text-center flex flex-col justify-between">
            <div>
              <span className="font-black text-blue-800 text-xl block">+25 Poin</span>
              <span className="font-extrabold text-slate-900 block mt-1">Hadir Rapat Bulanan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Pertemuan musyawarah rutin paguyuban</p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-200 text-center flex flex-col justify-between">
            <div>
              <span className="font-black text-purple-800 text-xl block">+50 Poin</span>
              <span className="font-extrabold text-slate-900 block mt-1">Partisipasi Sumbangan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Sumbangan sukarela minimal Rp 100.000</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-center flex flex-col justify-between">
            <div>
              <span className="font-black text-rose-800 text-xl block">+10 Poin</span>
              <span className="font-extrabold text-slate-900 block mt-1">Aktif Jimpitan 1 Bulan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Min Rp 500 tiap hari tanpa kosong 1 bulan</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            activeTab === 'catalog'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift size={16} />
          <span>Katalog Penukaran Benefit</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={16} />
          <span>Riwayat Poin Anda</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            activeTab === 'leaderboard'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy size={16} />
          <span>Peringkat Warga Teraktif (Top 10)</span>
        </button>
      </div>

      {/* TAB 1: REWARDS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rewards.map((reward) => {
            const Icon = getRewardIcon(reward.icon);
            const canAfford = currentUser.points >= reward.pointsCost;

            return (
              <div
                key={reward.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <Icon size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{reward.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-amber-600 flex items-center gap-1">
                      <Coins size={14} /> {reward.pointsCost} Poin
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sisa Stok: {reward.stock}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!canAfford || reward.stock <= 0}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      canAfford && reward.stock > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Gift size={13} />
                    <span>{canAfford ? 'Tukarkan Poin' : 'Poin Belum Cukup'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: POINT LOGS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">Riwayat Mutasi GRISS-Poin</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {pointLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{log.reason}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {log.userName} ({log.houseNumber}) &bull; {log.timestamp}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`font-black text-sm ${
                      log.pointsChange > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {log.pointsChange > 0 ? `+${log.pointsChange}` : log.pointsChange} Poin
                  </div>
                  {currentUser.role === 'superadmin' && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus catatan mutasi poin "${log.reason}"?`)) {
                          deletePointLog(log.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus Log Poin (Superadmin)"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TOP 10 LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">
              Peringkat 10 Warga Paling Aktif & Berdedikasi Perum GSS
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {leaderboard.map((res, index) => {
              const isCurrentUser = res.houseNumber === currentUser.houseNumber;
              const rnk = getRank(res.points || 0);

              return (
                <div
                  key={res.id}
                  className={`p-3.5 sm:px-6 flex items-center justify-between text-xs transition ${
                    isCurrentUser ? 'bg-amber-50/70 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-amber-950 shadow-md'
                          : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{res.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-extrabold">
                            Akun Anda
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Rumah {res.houseNumber} &bull; {rnk.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-amber-600">
                      {res.points || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">Poin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
