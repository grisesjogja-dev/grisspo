import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Resident, StatusRumah, UserRole } from '../types';
import { permissions } from '../utils/security';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Home,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Lock,
  Coins
} from 'lucide-react';

export const DataWargaView: React.FC = () => {
  const { residents, updateResident, deleteResident, addResident, currentUser } = useApp();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states for Superadmin editing
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new/edit resident
  const [formName, setFormName] = useState('');
  const [formHouse, setFormHouse] = useState('');
  const [formBlock, setFormBlock] = useState<'A' | 'B' | 'C'>('A');
  const [formStatus, setFormStatus] = useState<StatusRumah>('DI HUNI PEMILIK');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('warga');
  const [formFamily, setFormFamily] = useState<number>(3);

  // Permission check: only Superadmin can edit or delete residents
  const canEditOrDelete = permissions.canManageResidents(currentUser.role);

  // Filtered residents list
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchBlock = selectedBlock === 'ALL' || r.block === selectedBlock;
      const matchStatus = selectedStatus === 'ALL' || r.statusRumah === selectedStatus;
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.houseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.phone && r.phone.includes(searchQuery));
      return matchBlock && matchStatus && matchSearch;
    });
  }, [residents, selectedBlock, selectedStatus, searchQuery]);

  // Statistics
  const totalCount = residents.length;
  const dihuniPemilik = residents.filter((r) => r.statusRumah === 'DI HUNI PEMILIK').length;
  const dihuniKontrak = residents.filter((r) => r.statusRumah === 'DI HUNI KONTRAK').length;
  const kosongBayar = residents.filter((r) => r.statusRumah === 'KOSONG (MEMBAYAR IURAN)').length;
  const kosongAdaPemilik = residents.filter((r) => r.statusRumah === 'KOSONG (ADA PEMILIK)').length;
  const belumAdaPemilik = residents.filter((r) => r.statusRumah === 'BELUM ADA PEMILIK').length;

  const getStatusBadge = (status: StatusRumah) => {
    switch (status) {
      case 'DI HUNI PEMILIK':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DI HUNI KONTRAK':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'KOSONG (MEMBAYAR IURAN)':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'KOSONG (ADA PEMILIK)':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'BELUM ADA PEMILIK':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleOpenEdit = (r: Resident) => {
    if (!canEditOrDelete) {
      alert('Akses Ditolak: Hak akses edit data warga hanya dimiliki oleh Superadmin.');
      return;
    }
    setEditingResident(r);
    setFormName(r.name);
    setFormHouse(r.houseNumber);
    setFormBlock(r.block);
    setFormStatus(r.statusRumah);
    setFormPhone(r.phone || '');
    setFormRole(r.role);
    setFormFamily(r.familyMembers || 3);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    updateResident({
      ...editingResident,
      name: formName.toUpperCase(),
      houseNumber: formHouse.toUpperCase(),
      block: formBlock,
      statusRumah: formStatus,
      phone: formPhone,
      role: formRole,
      familyMembers: formFamily
    });
    setEditingResident(null);
    alert('Data warga berhasil diperbarui oleh Superadmin!');
  };

  const handleAddResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formHouse) {
      alert('Nama dan nomor rumah wajib diisi!');
      return;
    }
    addResident({
      name: formName.toUpperCase(),
      houseNumber: formHouse.toUpperCase(),
      block: formBlock,
      statusRumah: formStatus,
      phone: formPhone,
      role: formRole,
      familyMembers: formFamily,
      points: 50,
      jimpitanPaidMonth: 0,
      monthlyIuranPaid: false
    });
    setShowAddModal(false);
    alert('Warga baru berhasil ditambahkan oleh Superadmin!');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Users size={14} className="text-blue-300" />
            <span>Database Kependudukan Perum GSS 1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Data 58 Warga Perumahan Griya Sedayu Selaras 1
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Data resmi checklist warga mencakup Blok A (16 rumah), Blok B (27 rumah), dan Blok C (15 rumah). Hanya Superadmin yang memiliki hak akses untuk mengubah atau menghapus data.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 items-center">
            {canEditOrDelete ? (
              <button
                onClick={() => {
                  setFormName('');
                  setFormHouse('');
                  setFormBlock('A');
                  setFormStatus('DI HUNI PEMILIK');
                  setFormPhone('');
                  setFormRole('warga');
                  setFormFamily(3);
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition"
              >
                <UserPlus size={15} />
                <span>Tambah Warga Baru (Superadmin)</span>
              </button>
            ) : (
              <div className="text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-slate-400 flex items-center gap-2">
                <Lock size={13} className="text-amber-400" />
                <span>Mode View-Only: Perubahan data warga hanya diizinkan untuk Superadmin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Unit</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount} Rumah</div>
          <div className="text-[10px] text-slate-500">Blok A, B, dan C</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Dihuni Pemilik</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{dihuniPemilik}</div>
          <div className="text-[10px] text-emerald-700">Warga tetap aktif</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
          <span className="text-[11px] font-bold text-sky-700 uppercase">Dihuni Kontrak</span>
          <div className="text-2xl font-black text-sky-600 mt-1">{dihuniKontrak}</div>
          <div className="text-[10px] text-sky-700">Wajib lapor berkas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Kosong (Bayar Iuran)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{kosongBayar}</div>
          <div className="text-[10px] text-amber-700">Tetap iuran kas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-orange-700 uppercase">Kosong / Belum Ada</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{kosongAdaPemilik + belumAdaPemilik}</div>
          <div className="text-[10px] text-orange-700">Rumah belum dihuni</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
              <Filter size={13} /> Blok:
            </span>
            {(['ALL', 'A', 'B', 'C'] as const).map((blk) => (
              <button
                key={blk}
                onClick={() => setSelectedBlock(blk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedBlock === blk
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {blk === 'ALL' ? 'Semua Blok (58)' : `Blok ${blk} (${residents.filter((r) => r.block === blk).length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold"
            >
              <option value="ALL">Semua Status Hunian</option>
              <option value="DI HUNI PEMILIK">DI HUNI PEMILIK</option>
              <option value="DI HUNI KONTRAK">DI HUNI KONTRAK</option>
              <option value="KOSONG (MEMBAYAR IURAN)">KOSONG (MEMBAYAR IURAN)</option>
              <option value="KOSONG (ADA PEMILIK)">KOSONG (ADA PEMILIK)</option>
              <option value="BELUM ADA PEMILIK">BELUM ADA PEMILIK</option>
            </select>

            <div className="relative flex-1 md:w-60">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / no rumah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Residents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Rumah</th>
                <th className="py-3 px-4">Nama Kepala Keluarga / Warga</th>
                <th className="py-3 px-4">Status Rumah</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4 text-center">GRISS-Poin</th>
                <th className="py-3 px-4">Kontak WhatsApp</th>
                {canEditOrDelete && <th className="py-3 px-4 text-center">Aksi Superadmin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                    {r.houseNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.familyMembers ? `${r.familyMembers} Anggota Keluarga` : 'Belum berpenghuni'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(
                        r.statusRumah
                      )}`}
                    >
                      {r.statusRumah}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {r.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-amber-600">
                    <span className="inline-flex items-center gap-1">
                      <Coins size={12} />
                      <span>{r.points || 0}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {r.phone && r.phone !== '-' ? (
                      <a
                        href={`https://wa.me/62${r.phone.replace(/[^0-9]/g, '').slice(1)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <Phone size={12} />
                        <span>{r.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Superadmin actions */}
                  {canEditOrDelete && (
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Data Warga (Superadmin)"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data warga ${r.name} (${r.houseNumber})? Tindakan ini permanen.`)) {
                              deleteResident(r.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Warga (Superadmin)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT / ADD WARGA (SUPERADMIN ONLY) */}
      {(editingResident || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-red-400" />
                <h3 className="text-sm font-bold">
                  {editingResident ? 'Edit Data Warga' : 'Tambah Warga Baru'} (Superadmin)
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingResident(null);
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form
              onSubmit={editingResident ? handleSaveEdit : handleAddResident}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kepala Keluarga / Warga</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama Warga..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Rumah</label>
                  <input
                    type="text"
                    value={formHouse}
                    onChange={(e) => setFormHouse(e.target.value)}
                    placeholder="Contoh: A 01, B 10, C 05"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blok</label>
                  <select
                    value={formBlock}
                    onChange={(e) => setFormBlock(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A">Blok A</option>
                    <option value="B">Blok B</option>
                    <option value="C">Blok C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Rumah</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="DI HUNI PEMILIK">DI HUNI PEMILIK</option>
                  <option value="DI HUNI KONTRAK">DI HUNI KONTRAK</option>
                  <option value="KOSONG (MEMBAYAR IURAN)">KOSONG (MEMBAYAR IURAN)</option>
                  <option value="KOSONG (ADA PEMILIK)">KOSONG (ADA PEMILIK)</option>
                  <option value="BELUM ADA PEMILIK">BELUM ADA PEMILIK</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Akses Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="warga">Warga</option>
                    <option value="bendahara1">Bendahara 1</option>
                    <option value="bendahara2">Bendahara 2</option>
                    <option value="admin_inventaris">Admin Inventaris</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingResident(null);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Data Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
