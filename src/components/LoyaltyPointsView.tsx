import React, { useState } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { LoyaltyReward } from '../types';
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
  ShoppingBag,
  Edit2,
  Plus,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoyaltyPointsView: React.FC = () => {
  const {
    currentUser: authUser,
    rewards,
    pointLogs,
    redeemReward,
    addReward,
    updateReward,
    deleteReward,
    residents,
    deletePointLog,
    resetFeatureData
  } = useApp();
  const currentUser = authUser || defaultGuestUser;
  const isSuperadmin = currentUser.role === 'superadmin';
  const [activeTab, setActiveTab] = useState<'catalog' | 'history' | 'leaderboard'>('catalog');
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [rewardForm, setRewardForm] = useState<Omit<LoyaltyReward, 'id'>>({
    title: '',
    description: '',
    pointsCost: 50,
    stock: 10,
    icon: 'Gift'
  });

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
              <span>Program Apresiasi Keaktifan Warga GSS</span>
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
              <span className="font-black text-amber-800 text-xl block">+15 Poin</span>
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
              <span className="font-black text-rose-800 text-xl block">+20 Poin</span>
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

        {currentUser.role === 'superadmin' && (
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh GRISS-Poin warga dan log riwayat perolehan poin?')) {
                await resetFeatureData('poin');
                alert('Data Poin Warga berhasil direset oleh Superadmin.');
              }
            }}
            className="ml-auto my-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5 whitespace-nowrap"
            title="Reset Poin Warga (Superadmin)"
          >
            <Trash2 size={13} className="text-red-600" />
            <span>Reset Poin Warga</span>
          </button>
        )}
      </div>

      {/* TAB 1: REWARDS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gift size={16} className="text-amber-600" />
                <span>Katalog Benefit Penukaran Poin ({rewards.length} Pilihan Benefit)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Poin yang sudah terkumpul dapat ditukarkan dengan potongan iuran paguyuban atau merchandise resmi.
              </p>
            </div>

            {isSuperadmin && (
              <button
                type="button"
                onClick={() => {
                  setRewardForm({
                    title: '',
                    description: '',
                    pointsCost: 50,
                    stock: 10,
                    icon: 'Gift'
                  });
                  setIsAddingReward(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 whitespace-nowrap self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Tambah Benefit Baru (Superadmin)</span>
              </button>
            )}
          </div>

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
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Icon size={24} />
                      </div>

                      {/* Superadmin Edit & Delete buttons */}
                      {isSuperadmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingReward(reward)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Benefit Ini (Superadmin)"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Hapus benefit "${reward.title}" dari katalog?`)) {
                                await deleteReward(reward.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Benefit Ini (Superadmin)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
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

      {/* ========================================================================= */}
      {/* MODAL: EDIT / TAMBAH BENEFIT REWARD (SUPERADMIN ONLY)                     */}
      {/* ========================================================================= */}
      {(editingReward || isAddingReward) && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    {editingReward ? 'Edit Benefit Reward' : 'Tambah Benefit Reward Baru'}
                  </h3>
                  <p className="text-[11px] text-amber-300">Hak Akses: Superadmin (Bpk. Beni B 24)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingReward(null);
                  setIsAddingReward(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editingReward) {
                  await updateReward(editingReward);
                  setEditingReward(null);
                  alert('Katalog benefit berhasil diperbarui dan disinkronkan ke Firebase!');
                } else if (isAddingReward) {
                  await addReward({
                    title: rewardForm.title || 'Benefit Baru',
                    description: rewardForm.description || '',
                    pointsCost: Number(rewardForm.pointsCost || 50),
                    stock: Number(rewardForm.stock || 10),
                    icon: rewardForm.icon || 'Gift'
                  });
                  setIsAddingReward(false);
                  alert('Benefit baru berhasil ditambahkan ke katalog!');
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Benefit</label>
                <input
                  type="text"
                  required
                  value={editingReward ? editingReward.title : rewardForm.title}
                  onChange={(e) => {
                    if (editingReward) {
                      setEditingReward({ ...editingReward, title: e.target.value });
                    } else {
                      setRewardForm({ ...rewardForm, title: e.target.value });
                    }
                  }}
                  placeholder="Contoh: Bebas Iuran Kebersihan 1 Bulan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Benefit</label>
                <textarea
                  rows={2}
                  required
                  value={editingReward ? editingReward.description : rewardForm.description}
                  onChange={(e) => {
                    if (editingReward) {
                      setEditingReward({ ...editingReward, description: e.target.value });
                    } else {
                      setRewardForm({ ...rewardForm, description: e.target.value });
                    }
                  }}
                  placeholder="Jelaskan ketentuan dan nilai benefit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Poin</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingReward ? editingReward.pointsCost : rewardForm.pointsCost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (editingReward) {
                        setEditingReward({ ...editingReward, pointsCost: val });
                      } else {
                        setRewardForm({ ...rewardForm, pointsCost: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Kuota</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingReward ? editingReward.stock : rewardForm.stock}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (editingReward) {
                        setEditingReward({ ...editingReward, stock: val });
                      } else {
                        setRewardForm({ ...rewardForm, stock: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ikon Tampilan</label>
                <select
                  value={editingReward ? editingReward.icon : rewardForm.icon}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingReward) {
                      setEditingReward({ ...editingReward, icon: val });
                    } else {
                      setRewardForm({ ...rewardForm, icon: val });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Gift">Gift (Hadiah Umum)</option>
                  <option value="Trash2">Trash2 (Sampah / Kebersihan)</option>
                  <option value="Car">Car (Parkir / Fasum Mobil)</option>
                  <option value="Shirt">Shirt (Kaos Paguyuban)</option>
                  <option value="ShoppingBag">ShoppingBag (Souvenir)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReward(null);
                    setIsAddingReward(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black rounded-xl transition shadow-md shadow-amber-600/20"
                >
                  {editingReward ? 'Simpan Perubahan Benefit' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
