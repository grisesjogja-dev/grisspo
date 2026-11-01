import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryCondition } from '../types';
import { permissions } from '../utils/security';
import {
  Package,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Lock,
  ArrowRightLeft,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export const InventarisView: React.FC = () => {
  const {
    inventory,
    updateInventoryItem,
    deleteInventoryItem,
    addInventoryItem,
    borrowInventoryItem,
    returnInventoryItem,
    currentUser
  } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('ALL');

  // Edit / Add modal state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState<string | number>(1);
  const [formSatuan, setFormSatuan] = useState('buah');
  const [formYear, setFormYear] = useState<string | number>('2023');
  const [formCondition, setFormCondition] = useState<InventoryCondition>('BAIK');
  const [formNotes, setFormNotes] = useState('');

  // Borrow modal
  const [borrowingItem, setBorrowingItem] = useState<InventoryItem | null>(null);
  const [borrowerName, setBorrowerName] = useState(`${currentUser.name} (${currentUser.houseNumber})`);

  // Permission checks
  const canEdit = permissions.canManageInventory(currentUser.role);
  const canDelete = permissions.canDeleteInventory(currentUser.role); // Superadmin only

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchCond = filterCondition === 'ALL' || item.kondisi === filterCondition;
      const matchSearch =
        item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCond && matchSearch;
    });
  }, [inventory, filterCondition, searchQuery]);

  // Statistics
  const totalItems = inventory.length;
  const baikCount = inventory.filter((i) => i.kondisi === 'BAIK' || i.kondisi === 'LENGKAP').length;
  const rusakCount = inventory.filter((i) => i.kondisi === 'RUSAK').length;
  const habisCount = inventory.filter((i) => i.kondisi === 'HABIS').length;
  const hilangCount = inventory.filter((i) => i.kondisi === 'HILANG').length;

  const getConditionBadge = (cond: InventoryCondition) => {
    switch (cond) {
      case 'BAIK':
      case 'LENGKAP':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RUSAK':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'HABIS':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'HILANG':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    if (!canEdit) {
      alert('Akses Ditolak: Hak akses edit inventaris hanya dimiliki oleh Admin Inventaris dan Superadmin.');
      return;
    }
    setEditingItem(item);
    setFormName(item.namaBarang);
    setFormQty(item.jumlah);
    setFormSatuan(item.satuan || 'buah');
    setFormYear(item.tahunPerolehan || '2023');
    setFormCondition(item.kondisi);
    setFormNotes(item.catatan || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryItem({
      ...editingItem,
      namaBarang: formName.toUpperCase(),
      jumlah: formQty,
      satuan: formSatuan,
      tahunPerolehan: formYear,
      kondisi: formCondition,
      catatan: formNotes
    });
    setEditingItem(null);
    alert('Data barang inventaris berhasil diperbarui!');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;
    addInventoryItem({
      namaBarang: formName.toUpperCase(),
      jumlah: formQty,
      satuan: formSatuan,
      tahunPerolehan: formYear,
      kondisi: formCondition,
      catatan: formNotes,
      statusPinjam: 'Tersedia'
    });
    setShowAddModal(false);
    alert('Barang inventaris baru berhasil ditambahkan!');
  };

  const handleConfirmBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingItem) return;
    borrowInventoryItem(borrowingItem.id, borrowerName);
    setBorrowingItem(null);
    alert(`Barang ${borrowingItem.namaBarang} berhasil dipinjam oleh ${borrowerName}!`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
            <Package size={14} className="text-amber-300" />
            <span>Inventarisasi Perlengkapan Paguyuban GSS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Data Inventaris Paguyuban GSS (33 Barang Resmi)
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Pencatatan seluruh perlengkapan paguyuban (piring, gelas, lampu sorot, jumbo, sound, tikar, dll). Dikelola khusus oleh Admin Inventaris (Bpk. SONY B 23) dan Superadmin.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 items-center">
            {canEdit ? (
              <button
                onClick={() => {
                  setFormName('');
                  setFormQty(1);
                  setFormSatuan('buah');
                  setFormYear('2023');
                  setFormCondition('BAIK');
                  setFormNotes('');
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition"
              >
                <PlusCircle size={15} />
                <span>Tambah Barang Inventaris (Admin Inventaris)</span>
              </button>
            ) : (
              <div className="text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-slate-400 flex items-center gap-2">
                <Lock size={13} className="text-amber-400" />
                <span>Akses Khusus Admin Inventaris (Bpk. Sony) & Superadmin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Barang</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalItems} Item</div>
          <div className="text-[10px] text-slate-500">Tercatat di data aset</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Baik & Lengkap</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{baikCount}</div>
          <div className="text-[10px] text-emerald-700">Siap digunakan warga</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Rusak / Servis</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{rusakCount}</div>
          <div className="text-[10px] text-amber-700">Butuh perbaikan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs">
          <span className="text-[11px] font-bold text-orange-700 uppercase">Habis Pakai</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{habisCount}</div>
          <div className="text-[10px] text-orange-700">WD40, bendera, dll</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-red-700 uppercase">Hilang Tercatat</span>
          <div className="text-2xl font-black text-red-600 mt-1">{hilangCount}</div>
          <div className="text-[10px] text-red-700">Senter, termos es, MCB</div>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
              <Filter size={13} /> Kondisi:
            </span>
            {(['ALL', 'LENGKAP', 'BAIK', 'RUSAK', 'HABIS', 'HILANG'] as const).map((cond) => (
              <button
                key={cond}
                onClick={() => setFilterCondition(cond)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterCondition === cond
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cond === 'ALL' ? 'Semua Kondisi' : cond}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:w-64 w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari barang inventaris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4 text-center">Tahun</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4">Catatan / Keterangan</th>
                <th className="py-3 px-4 text-center">Status Pinjam</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.namaBarang}
                  </td>
                  <td className="py-3 px-4 text-center font-black text-slate-800">
                    {item.jumlah} {item.satuan ? <span className="font-normal text-slate-500 text-[11px]">{item.satuan}</span> : ''}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-mono">
                    {item.tahunPerolehan || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getConditionBadge(
                        item.kondisi
                      )}`}
                    >
                      {item.kondisi}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    {item.catatan || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.statusPinjam === 'Tersedia'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.statusPinjam === 'Dipinjam'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.statusPinjam}
                      {item.peminjamTerakhir && item.statusPinjam === 'Dipinjam' && (
                        <div className="text-[9px] font-normal text-blue-600">({item.peminjamTerakhir})</div>
                      )}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Borrow button for citizens */}
                      {item.statusPinjam === 'Tersedia' && item.kondisi !== 'RUSAK' && item.kondisi !== 'HILANG' && (
                        <button
                          onClick={() => setBorrowingItem(item)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold transition border border-blue-200"
                          title="Pinjam Barang Ini"
                        >
                          Pinjam
                        </button>
                      )}

                      {item.statusPinjam === 'Dipinjam' && (
                        <button
                          onClick={() => returnInventoryItem(item.id)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold transition border border-emerald-200"
                          title="Kembalikan Barang"
                        >
                          Kembalikan
                        </button>
                      )}

                      {/* Edit for Admin Inventaris & Superadmin */}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Barang (Admin Inventaris / Superadmin)"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      {/* Delete restricted to Superadmin only */}
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus barang inventaris ${item.namaBarang}?`)) {
                              deleteInventoryItem(item.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Barang (Superadmin)"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT / ADD BARANG (ADMIN INVENTARIS & SUPERADMIN) */}
      {(editingItem || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold">
                  {editingItem ? 'Edit Data Inventaris' : 'Tambah Barang Baru'} (Admin Inventaris)
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form
              onSubmit={editingItem ? handleSaveEdit : handleAddItem}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: GELAS, TERPAL, SENDOK..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="text"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    placeholder="Contoh: 53, 1 set, 2 gulung"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    placeholder="buah, set, lembar, roll"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Perolehan</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2023, 2024..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kondisi Barang</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="BAIK">BAIK</option>
                    <option value="LENGKAP">LENGKAP</option>
                    <option value="RUSAK">RUSAK</option>
                    <option value="HABIS">HABIS</option>
                    <option value="HILANG">HILANG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Keterangan kondisi atau asal barang..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Inventaris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PINJAM BARANG INVENTARIS */}
      {borrowingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} />
                <h3 className="text-sm font-bold">Peminjaman Inventaris</h3>
              </div>
              <button
                onClick={() => setBorrowingItem(null)}
                className="text-white/80 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBorrow} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-slate-500 block">Barang yang Dipinjam:</span>
                <span className="text-base font-black text-blue-900">{borrowingItem.namaBarang}</span>
                <span className="text-[11px] text-slate-600 block mt-0.5">Jumlah: {borrowingItem.jumlah} {borrowingItem.satuan}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Peminjam / Rumah</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Nama peminjam..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Harap menjaga kebersihan dan keutuhan barang paguyuban serta mengembalikannya tepat waktu.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBorrowingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Konfirmasi Pinjam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
