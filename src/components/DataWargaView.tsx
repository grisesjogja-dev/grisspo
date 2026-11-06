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
  Coins,
  AlertTriangle,
  Send,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  X,
  FileCheck,
  FileWarning,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';

export const DataWargaView: React.FC = () => {
  const {
    residents,
    updateResident,
    toggleBerkasKependudukan,
    deleteResident,
    addResident,
    currentUser,
    sendWhatsAppIuranWarning,
    resetFeatureData
  } = useApp();

  // Active Tab: 'semua' | 'tunggakan'
  const [wargaTab, setWargaTab] = useState<'semua' | 'tunggakan'>('semua');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterBerkas, setFilterBerkas] = useState<'ALL' | 'LENGKAP' | 'BELUM'>('ALL');
  const [isResetting, setIsResetting] = useState(false);
  const [isTogglingBerkas, setIsTogglingBerkas] = useState<string | null>(null);

  // Modal states for Superadmin editing
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for new/edit resident
  const [formName, setFormName] = useState('');
  const [formHouse, setFormHouse] = useState('');
  const [formBlock, setFormBlock] = useState<'A' | 'B' | 'C'>('A');
  const [formStatus, setFormStatus] = useState<StatusRumah>('DI HUNI PEMILIK');
  const [formBerkasKependudukan, setFormBerkasKependudukan] = useState<boolean>(false);
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('warga');
  const [formFamily, setFormFamily] = useState<number>(3);
  const [formUnpaidMonths, setFormUnpaidMonths] = useState<number>(0);
  const [formUnpaidMonthNames, setFormUnpaidMonthNames] = useState<string>('');
  const [formPrevJimpitanDeficit, setFormPrevJimpitanDeficit] = useState<number>(0);
  const [formJimpitanPaid, setFormJimpitanPaid] = useState<number>(0);
  const [formPoints, setFormPoints] = useState<number>(50);
  const [formPassword, setFormPassword] = useState<string>('Griss123');

  // Permission checks
  const canEditOrDelete = currentUser ? permissions.canManageResidents(currentUser.role) : false;
  // Hak akses checklist berkas kependudukan hanya dimiliki oleh superadmin dan sekretaris
  const canManageBerkas = currentUser ? (currentUser.role === 'superadmin' || currentUser.role === 'sekretaris') : false;

  // Filtered residents list with enhanced quick search (name, house number e.g. "B 24" or "B24", block, phone, berkas)
  const filteredResidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/[\s\-_]/g, '');

    return residents.filter((r) => {
      const matchBlock = selectedBlock === 'ALL' || r.block === selectedBlock;
      const matchStatus = selectedStatus === 'ALL' || r.statusRumah === selectedStatus;
      const matchBerkas =
        filterBerkas === 'ALL' ||
        (filterBerkas === 'LENGKAP' ? !!r.berkasKependudukan : !r.berkasKependudukan);

      if (!q) return matchBlock && matchStatus && matchBerkas;

      const cleanHouse = r.houseNumber.toLowerCase().replace(/[\s\-_]/g, '');
      const matchName = r.name.toLowerCase().includes(q);
      const matchHouse = r.houseNumber.toLowerCase().includes(q) || cleanHouse.includes(cleanQ);
      const matchBlk =
        r.block.toLowerCase() === q ||
        `blok ${r.block.toLowerCase()}`.includes(q) ||
        cleanQ === r.block.toLowerCase() ||
        cleanQ === `blok${r.block.toLowerCase()}`;
      const matchPhone = r.phone && r.phone.replace(/[\s\-]/g, '').includes(cleanQ);

      return matchBlock && matchStatus && matchBerkas && (matchName || matchHouse || matchBlk || matchPhone);
    });
  }, [residents, selectedBlock, selectedStatus, filterBerkas, searchQuery]);

  // Statistics
  const totalCount = residents.length;
  const dihuniPemilik = residents.filter((r) => r.statusRumah === 'DI HUNI PEMILIK').length;
  const dihuniKontrak = residents.filter((r) => r.statusRumah === 'DI HUNI KONTRAK').length;
  const kosongBayar = residents.filter((r) => r.statusRumah === 'KOSONG (MEMBAYAR IURAN)').length;
  const kosongAdaPemilik = residents.filter((r) => r.statusRumah === 'KOSONG (ADA PEMILIK)').length;
  const belumAdaPemilik = residents.filter((r) => r.statusRumah === 'BELUM ADA PEMILIK').length;
  const berkasLengkapCount = residents.filter((r) => !!r.berkasKependudukan).length;
  const berkasBelumCount = residents.filter((r) => !r.berkasKependudukan).length;

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

  // Delinquent residents (>= 2 consecutive months of unpaid dues)
  const delinquentResidents = useMemo(() => {
    return residents.filter((r) => (r.iuranUnpaidMonths || 0) >= 2);
  }, [residents]);

  const handleSendWhatsAppWarning = async (res: Resident) => {
    try {
      const result = await sendWhatsAppIuranWarning(res.id);
      window.open(result.url, '_blank');
      alert(`Notifikasi WhatsApp untuk Bpk/Ibu ${res.name} (${res.houseNumber}) berhasil disiapkan dan dicatat di sistem!`);
    } catch (err: any) {
      alert('Gagal mengirim WhatsApp: ' + err.message);
    }
  };

  // Quick toggle checklist berkas kependudukan (Khusus Superadmin & Sekretaris)
  const handleToggleBerkas = async (r: Resident) => {
    if (!canManageBerkas) {
      alert('Akses Ditolak: Hak akses checklist berkas kependudukan hanya dimiliki oleh Superadmin dan Sekretaris.');
      return;
    }
    setIsTogglingBerkas(r.id);
    const newStatus = !r.berkasKependudukan;
    const res = await toggleBerkasKependudukan(r.id, newStatus);
    setIsTogglingBerkas(null);
    if (!res.success) {
      alert(res.message);
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
    setFormBerkasKependudukan(!!r.berkasKependudukan);
    setFormPhone(r.phone || '');
    setFormRole(r.role);
    setFormFamily(r.familyMembers || 3);
    setFormUnpaidMonths(r.iuranUnpaidMonths || 0);
    setFormUnpaidMonthNames((r.unpaidMonthNames || []).join(', '));
    setFormPrevJimpitanDeficit(r.previousMonthsJimpitanDeficit || 0);
    setFormJimpitanPaid(r.jimpitanPaidMonth || 0);
    setFormPoints(r.points || 50);
    setFormPassword(r.password || 'Griss123');
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
      berkasKependudukan: formBerkasKependudukan,
      phone: formPhone,
      role: formRole,
      familyMembers: Number(formFamily),
      iuranUnpaidMonths: Number(formUnpaidMonths),
      unpaidMonthNames: formUnpaidMonthNames.split(',').map((s) => s.trim()).filter(Boolean),
      previousMonthsJimpitanDeficit: Number(formPrevJimpitanDeficit),
      jimpitanPaidMonth: Number(formJimpitanPaid),
      points: Number(formPoints),
      password: formPassword || undefined
    });
    setEditingResident(null);
    alert('Master data warga berhasil diperbarui oleh Superadmin!');
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
      berkasKependudukan: formBerkasKependudukan,
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
              <>
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

                <button
                  onClick={async () => {
                    if (confirm('PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh Data Warga ke data standar awal (58 warga asli Griya Sedayu Selaras 1)? Seluruh riwayat dan perubahan akan dikembalikan.')) {
                      setIsResetting(true);
                      try {
                        await resetFeatureData('warga');
                        alert('Data 58 warga berhasil di-reset ke kondisi awal oleh Superadmin!');
                      } catch (err: any) {
                        alert('Gagal mereset: ' + err.message);
                      } finally {
                        setIsResetting(false);
                      }
                    }
                  }}
                  disabled={isResetting}
                  className="px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition border border-rose-500/50"
                  title="Reset seluruh master data warga ke seed data awal 58 warga (Khusus Superadmin)"
                >
                  <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                  <span>{isResetting ? 'Mereset Data...' : 'Reset Data Warga (Superadmin)'}</span>
                </button>
              </>
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

      {/* Berkas Kependudukan Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <FileCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Status Penyerahan Berkas Kependudukan (KTP & KK)</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Khusus Superadmin &amp; Sekretaris
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Checklist berkas kependudukan menandakan warga telah melengkapi fotokopi KTP &amp; Kartu Keluarga ke pengurus paguyuban.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Berkas Lengkap</span>
            <span className="text-base font-black text-emerald-900">{berkasLengkapCount} Rumah</span>
          </div>
          <div className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-100/90 border border-amber-300 rounded-xl text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Belum Menyerahkan</span>
            <span className="text-base font-black text-amber-900">{berkasBelumCount} Rumah</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Semua Warga vs Tunggakan Iuran (>= 2 Bulan) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setWargaTab('semua')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
            wargaTab === 'semua'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={15} />
          <span>Daftar 58 Warga Perum GSS</span>
        </button>

        <button
          type="button"
          onClick={() => setWargaTab('tunggakan')}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-2 ${
            wargaTab === 'tunggakan'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle size={15} className="text-red-500" />
          <span>Tunggakan Iuran (&ge; 2 Bulan Berturut-turut)</span>
          {delinquentResidents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold animate-pulse">
              {delinquentResidents.length} Rumah
            </span>
          )}
        </button>
      </div>

      {/* VIEW 2: DAFTAR WARGA MENUNGGAK IURAN (>= 2 BULAN) */}
      {wargaTab === 'tunggakan' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 text-white rounded-2xl p-5 border border-red-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/40 text-red-300 text-[11px] font-bold border border-red-500/30">
                <AlertTriangle size={12} />
                <span>Monitoring Tunggakan Iuran Rutin Kas Paguyuban</span>
              </div>
              <h3 className="text-lg font-black tracking-tight">
                Daftar Warga dengan Tunggakan Iuran &ge; 2 Bulan Berturut-turut
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Sesuai instruksi dan Tata Tertib 2026, warga yang terlambat membayar iuran bulanan (Rp 25.000/bln) selama 2 bulan berturut-turut memperoleh warning saat login dan notifikasi otomatis ke nomor WhatsApp.
              </p>
            </div>

            <div className="bg-red-900/60 p-4 rounded-xl border border-red-700/60 text-center min-w-[150px]">
              <span className="text-[10px] uppercase font-bold text-red-300 block">Total Menunggak</span>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {delinquentResidents.length} <span className="text-xs text-slate-300">Rumah</span>
              </div>
              <span className="text-[10px] text-red-200">
                Rp {(delinquentResidents.reduce((acc, r) => acc + (r.iuranUnpaidMonths || 0) * 25000, 0)).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-600" />
                <span>Rincian Warga Menunggak & Kirim Notifikasi WhatsApp</span>
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                Tarif Iuran: Rp 25.000 / KK / bulan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Rumah</th>
                    <th className="py-3 px-3">Nama Warga</th>
                    <th className="py-3 px-3">Status Hunian</th>
                    <th className="py-3 px-3 text-center">Berkas Kependudukan</th>
                    <th className="py-3 px-3">No. WhatsApp</th>
                    <th className="py-3 px-3 text-center">Lama Tunggakan</th>
                    <th className="py-3 px-3">Bulan Menunggak</th>
                    <th className="py-3 px-3 text-right">Total Tagihan</th>
                    <th className="py-3 px-3 text-center">Aksi Superadmin / Bendahara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {delinquentResidents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                        Tidak ada warga dengan tunggakan iuran &ge; 2 bulan. Semua warga tertib!
                      </td>
                    </tr>
                  ) : (
                    delinquentResidents.map((r, idx) => {
                      const unpaidCount = r.iuranUnpaidMonths || 2;
                      const arrears = unpaidCount * 25000;
                      const monthList = r.unpaidMonthNames && r.unpaidMonthNames.length > 0
                        ? r.unpaidMonthNames.join(', ')
                        : `${unpaidCount} bulan`;

                      return (
                        <tr key={r.id} className="hover:bg-red-50/40 transition">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{r.houseNumber}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{r.name}</td>
                          <td className="py-3 px-3 text-slate-600 text-[11px]">{r.statusRumah}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                r.berkasKependudukan
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {r.berkasKependudukan ? 'Lengkap' : 'Belum Serah'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">{r.phone || '-'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-black text-[10px]">
                              {unpaidCount} BULAN BERTURUT-TURUT
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{monthList}</td>
                          <td className="py-3 px-3 text-right font-black text-red-600 whitespace-nowrap">
                            Rp {arrears.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppWarning(r)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition flex items-center gap-1 shadow-xs"
                                title="Kirim Notifikasi Peringatan Otomatis ke WhatsApp Warga"
                              >
                                <Send size={11} />
                                <span>Kirim Notif WhatsApp</span>
                              </button>

                              {canEditOrDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(r)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Master Data Warga (Superadmin)"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: SEMUA 58 DATA WARGA */}
      {wargaTab === 'semua' && (
        <div className="space-y-4">
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

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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

                <select
                  value={filterBerkas}
                  onChange={(e) => setFilterBerkas(e.target.value as any)}
                  className="text-xs py-1.5 px-2.5 bg-white border border-blue-200 rounded-lg text-slate-700 font-semibold"
                >
                  <option value="ALL">Semua Berkas (58)</option>
                  <option value="LENGKAP">✅ Sudah Serah Berkas ({berkasLengkapCount})</option>
                  <option value="BELUM">⚠️ Belum Serah Berkas ({berkasBelumCount})</option>
                </select>

                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-blue-500" />
                  <input
                    type="text"
                    placeholder="Cari nama, no rumah, blok..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-blue-200 focus:border-blue-500 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      title="Hapus pencarian"
                    >
                      <X size={14} />
                    </button>
                  )}
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
                <th className="py-3 px-4 text-center">Berkas Kependudukan</th>
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
                  <td className="py-3 px-4 text-center">
                    {canManageBerkas ? (
                      <button
                        type="button"
                        onClick={() => handleToggleBerkas(r)}
                        disabled={isTogglingBerkas === r.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition border cursor-pointer hover:shadow-xs ${
                          r.berkasKependudukan
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        } ${isTogglingBerkas === r.id ? 'opacity-50 cursor-wait' : ''}`}
                        title={
                          r.berkasKependudukan
                            ? 'Berkas sudah lengkap. Klik untuk batalkan checklist (Superadmin & Sekretaris)'
                            : 'Belum menyerahkan berkas. Klik untuk centang sudah serahkan (Superadmin & Sekretaris)'
                        }
                      >
                        <input
                          type="checkbox"
                          checked={!!r.berkasKependudukan}
                          readOnly
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 pointer-events-none accent-emerald-600"
                        />
                        <span>{r.berkasKependudukan ? 'Sudah Serah' : 'Belum Serah'}</span>
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          r.berkasKependudukan
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!r.berkasKependudukan}
                          disabled
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 opacity-70 accent-emerald-600"
                        />
                        <span>{r.berkasKependudukan ? 'Sudah Serah' : 'Belum Serah'}</span>
                      </span>
                    )}
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
    </div>
  )}

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

              {/* Checklist Berkas Kependudukan (Di sebelah / bawah Status Rumah) */}
              <div className={`p-3.5 rounded-2xl border transition ${
                formBerkasKependudukan
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formBerkasKependudukan}
                    onChange={(e) => {
                      if (!canManageBerkas) {
                        alert('Akses Ditolak: Hak akses checklist berkas kependudukan hanya dimiliki oleh Superadmin dan Sekretaris.');
                        return;
                      }
                      setFormBerkasKependudukan(e.target.checked);
                    }}
                    disabled={!canManageBerkas}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      {formBerkasKependudukan ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="text-emerald-800">Berkas Kependudukan: SUDAH DISERAHKAN (Lengkap)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="text-amber-600" />
                          <span className="text-amber-800">Berkas Kependudukan: BELUM DISERAHKAN</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Tanda check berarti warga sudah menyerahkan berkas kependudukan (fotokopi KTP &amp; KK). Apabila belum di-check berarti belum menyerahkan (notif pengingat otomatis muncul di akun warga).
                    </p>
                    {!canManageBerkas && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        * Hak akses mengubah checklist ini hanya dimiliki oleh Superadmin dan Sekretaris.
                      </p>
                    )}
                  </div>
                </label>
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
                    <option value="sekretaris">Sekretaris (Bpk. Asrofi - B 08)</option>
                    <option value="bendahara1">Bendahara 1 (Bpk. Ahmad - B 02)</option>
                    <option value="bendahara2">Bendahara 2 (Bpk. Robi - C 15)</option>
                    <option value="admin_inventaris">Admin Inventaris (Bpk. Sony - B 23)</option>
                    <option value="superadmin">Superadmin (Bpk. Beni - B 24)</option>
                  </select>
                </div>
              </div>

              {editingResident && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Master Pengaturan Iuran & Jimpitan (Hak Akses Superadmin)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tunggakan Iuran (Bulan)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formUnpaidMonths}
                        onChange={(e) => setFormUnpaidMonths(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-[10px] text-slate-400">&ge; 2 memicu warning portal & WA</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Akumulasi Defisit Jimpitan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formPrevJimpitanDeficit}
                        onChange={(e) => setFormPrevJimpitanDeficit(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">Tunggakan bulan lalu</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rincian Bulan Menunggak (Pisahkan Koma)
                    </label>
                    <input
                      type="text"
                      value={formUnpaidMonthNames}
                      onChange={(e) => setFormUnpaidMonthNames(e.target.value)}
                      placeholder="Contoh: September 2026, Oktober 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jimpitan Bulan Ini Terbayar (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formJimpitanPaid}
                        onChange={(e) => setFormJimpitanPaid(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Poin Loyalitas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formPoints}
                        onChange={(e) => setFormPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password Login Warga (Default: Griss123)
                    </label>
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Kata sandi warga..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              )}

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
