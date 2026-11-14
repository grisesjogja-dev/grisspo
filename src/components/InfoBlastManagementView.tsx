import React, { useState } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { InfoBlast } from '../types';
import { Megaphone, PlusCircle, Edit2, Trash2, XCircle, CheckCircle2, Users, Home, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export const InfoBlastManagementView: React.FC = () => {
  const {
    infoBlasts,
    addInfoBlast,
    updateInfoBlast,
    deleteInfoBlast,
    residents,
    currentUser: authUser,
    confirmAction
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlast, setEditingBlast] = useState<InfoBlast | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<InfoBlast['category']>('Pengumuman');
  const [formContent, setFormContent] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormCategory('Pengumuman');
    setFormContent('');
    setTargetType('ALL');
    setSelectedHouses([]);
    setEditingBlast(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (blast: InfoBlast) => {
    setFormTitle(blast.title);
    setFormCategory(blast.category);
    setFormContent(blast.content);
    if (!blast.targetHouses || blast.targetHouses.includes('ALL')) {
      setTargetType('ALL');
      setSelectedHouses([]);
    } else {
      setTargetType('CUSTOM');
      setSelectedHouses(blast.targetHouses);
    }
    setEditingBlast(blast);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Judul dan isi info blast wajib diisi!');
      return;
    }

    const targets = targetType === 'ALL' ? ['ALL'] : selectedHouses;
    if (targetType === 'CUSTOM' && targets.length === 0) {
      alert('Pilih minimal satu rumah atau warga target!');
      return;
    }

    const creatorName = currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Superadmin';

    if (editingBlast) {
      confirmAction({
        title: 'Perbarui Info Blast',
        message: `Simpan perubahan pada info blast "${formTitle}"?`,
        confirmLabel: 'Setuju',
        cancelLabel: 'Batal',
        variant: 'primary',
        onConfirm: async () => {
          await updateInfoBlast({
            ...editingBlast,
            title: formTitle,
            category: formCategory,
            content: formContent,
            targetHouses: targets
          });
          setShowAddModal(false);
          setEditingBlast(null);
          confetti({ particleCount: 50, spread: 60 });
        }
      });
    } else {
      confirmAction({
        title: 'Kirim Info Blast Baru',
        message: `Kirim info blast "${formTitle}" kepada ${targetType === 'ALL' ? 'Seluruh Warga (58 Rumah)' : `${targets.length} Rumah Terpilih`}?`,
        confirmLabel: 'Kirim Sekarang',
        cancelLabel: 'Batal',
        variant: 'primary',
        onConfirm: async () => {
          await addInfoBlast({
            title: formTitle,
            category: formCategory,
            content: formContent,
            targetHouses: targets,
            createdBy: creatorName
          });
          setShowAddModal(false);
          confetti({ particleCount: 80, spread: 70 });
        }
      });
    }
  };

  const handleToggleHouseSelection = (houseNum: string) => {
    setSelectedHouses((prev) =>
      prev.includes(houseNum) ? prev.filter((h) => h !== houseNum) : [...prev, houseNum]
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Shield size={14} className="text-amber-300" />
            <span>Fitur Khusus Superadmin • Siaran Informasi Warga</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Manajemen Info Blast Warga
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kirimkan informasi, pengumuman penting, atau pemberitahuan mendesak yang akan muncul sebagai jendela pop-up interaktif setiap kali warga login di dashboard portal.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition"
            >
              <PlusCircle size={16} />
              <span>Buat Info Blast Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Blasts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Megaphone size={16} className="text-blue-600" />
            <span>Daftar Info Blast Aktif ({infoBlasts.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Tampil otomatis saat warga login</span>
        </div>

        <div className="divide-y divide-slate-100">
          {infoBlasts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Belum ada info blast yang dikirimkan. Klik tombol "Buat Info Blast Baru" di atas.
            </div>
          ) : (
            infoBlasts.map((blast) => {
              const isAll = !blast.targetHouses || blast.targetHouses.includes('ALL');
              return (
                <div key={blast.id} className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        blast.category === 'Darurat' ? 'bg-rose-100 text-rose-800' :
                        blast.category === 'Penting' ? 'bg-amber-100 text-amber-800' :
                        blast.category === 'Keuangan' ? 'bg-emerald-100 text-emerald-800' :
                        blast.category === 'Kegiatan' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {blast.category}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        Target: {isAll ? 'Seluruh Warga (ALL)' : `${blast.targetHouses.length} Rumah Terpilih`}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(blast.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{blast.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{blast.content}</p>
                    <div className="text-[11px] text-slate-400">Pengirim: {blast.createdBy}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(blast)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmAction({
                          title: 'Hapus Info Blast',
                          message: `Hapus permanen info blast "${blast.title}"? Informasi ini juga akan hilang dari dashboard warga.`,
                          confirmLabel: 'Hapus',
                          cancelLabel: 'Batal',
                          variant: 'danger',
                          onConfirm: async () => {
                            await deleteInfoBlast(blast.id);
                          }
                        });
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: CREATE / EDIT INFO BLAST */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{editingBlast ? 'Edit Info Blast Warga' : 'Buat Info Blast Baru'}</h3>
                  <p className="text-xs text-slate-400">Siaran pop-up interaktif ke dashboard warga</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Info Blast</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Pemberitahuan Gotong Royong & Kerja Bakti Minggu Ini..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Pesan</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Pengumuman">Pengumuman Umum</option>
                    <option value="Penting">Penting & Perhatian</option>
                    <option value="Keuangan">Keuangan & Iuran</option>
                    <option value="Kegiatan">Acara & Kegiatan</option>
                    <option value="Darurat">🚨 Darurat / Siaga</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Penerima</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="ALL">Seluruh Warga (Semua Rumah)</option>
                    <option value="CUSTOM">Pilih Rumah / Warga Tertentu</option>
                  </select>
                </div>
              </div>

              {targetType === 'CUSTOM' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Pilih Rumah Target ({selectedHouses.length} Dipilih):</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedHouses(residents.map((r) => r.houseNumber))}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedHouses([])}
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Batal Pilih
                      </button>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
                    {residents.map((r) => {
                      const isSel = selectedHouses.includes(r.houseNumber);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleToggleHouseSelection(r.houseNumber)}
                          className={`p-2 rounded-xl text-left border transition text-[11px] ${
                            isSel
                              ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-bold">{r.houseNumber}</div>
                          <div className="truncate opacity-80 text-[10px]">{r.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan / Informasi Lengkap</label>
                <textarea
                  rows={5}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan detail informasi yang ingin disampaikan kepada warga..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  {editingBlast ? 'Simpan Perubahan Info Blast' : 'Kirim Info Blast Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
