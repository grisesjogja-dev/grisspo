import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import {
  canAccessPinPortal,
  getResidentUnpaidMonthsCount,
  getResidentMonthlyFee,
  getBendahara1Contact,
  buildBendahara1WhatsAppUrl
} from '../utils/security';
import {
  Key,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  Send,
  ArrowLeft,
  Edit2,
  Save,
  History
} from 'lucide-react';

export const PinPortalView: React.FC = () => {
  const {
    currentUser: authUser,
    residents,
    portalPin,
    updatePortalPin,
    setActiveView,
    confirmAction
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  const [showPin, setShowPin] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);

  // Superadmin edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editPinCode, setEditPinCode] = useState(portalPin.pinCode);
  const [editPeriodLabel, setEditPeriodLabel] = useState(portalPin.periodLabel);
  const [editNotes, setEditNotes] = useState(portalPin.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const currentResident = useMemo(() => {
    const cleanHouse = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
    return residents.find(
      (r) =>
        (cleanHouse && r.houseNumber.replace(/\s+/g, '').toUpperCase() === cleanHouse) ||
        r.id === currentUser.id
    );
  }, [residents, currentUser]);

  const unpaidMonths = getResidentUnpaidMonthsCount(currentResident);
  const hasAccess = canAccessPinPortal(currentResident);
  const canManagePin = currentUser.role === 'superadmin' || currentUser.role === 'koordinator_kamtibmas';
  const ben1Contact = useMemo(() => getBendahara1Contact(residents), [residents]);

  const monthlyFee = currentResident ? getResidentMonthlyFee(currentResident) : 50000;
  const totalArrears = unpaidMonths * monthlyFee;

  const handleCopyPin = () => {
    if (!hasAccess) return;
    navigator.clipboard.writeText(portalPin.pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleOpenEdit = () => {
    setEditPinCode(portalPin.pinCode);
    setEditPeriodLabel(portalPin.periodLabel);
    setEditNotes(portalPin.notes || '');
    setIsEditing(true);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePin) return;
    const cleanPin = editPinCode.trim();
    if (!cleanPin) {
      alert('PIN Portal tidak boleh kosong!');
      return;
    }

    confirmAction({
      title: 'Perbarui PIN Portal Gerbang',
      message: `Simpan perubahan PIN Portal menjadi "${cleanPin}" untuk periode ${editPeriodLabel}? Perubahan akan langsung tersinkron ke seluruh warga yang memenuhi syarat (tunggakan < 2 bulan).`,
      confirmLabel: 'Simpan PIN',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await updatePortalPin(cleanPin, editPeriodLabel, editNotes);
          setIsEditing(false);
        } catch (err: any) {
          alert('Gagal memperbarui PIN Portal: ' + err.message);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  // Locked screen when unpaidMonths >= 2
  if (!hasAccess) {
    const monthListStr =
      currentResident?.unpaidMonthNames && currentResident.unpaidMonthNames.length > 0
        ? currentResident.unpaidMonthNames.join(', ')
        : `${unpaidMonths} bulan`;

    const waConfirmMsg =
      `*KONFIRMASI PELUNASAN IURAN & AKSES PIN PORTAL GSS 1*\n` +
      `Kepada Yth. Bendahara 1 (${ben1Contact.name} - Rumah ${ben1Contact.houseNumber})\n\n` +
      `Saya *${currentResident?.name || currentUser.name}* (Rumah *${currentResident?.houseNumber || currentUser.houseNumber}*) ingin mengonfirmasi pelunasan tunggakan iuran (${unpaidMonths} bulan: ${monthListStr}) sebesar *Rp ${totalArrears.toLocaleString('id-ID')}* agar akses menu PIN Portal dapat terbuka kembali.\n\n` +
      `Mohon verifikasi kas. Terima kasih.`;

    const waUrl = buildBendahara1WhatsAppUrl(residents, waConfirmMsg);

    return (
      <div className="max-w-2xl mx-auto py-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-rose-700 via-red-700 to-amber-700 text-white p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Lock size={30} className="text-amber-300" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/25 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-300/30">
                Akses Dibatasi Sistem
              </span>
              <h1 className="text-xl font-black tracking-tight mt-1">
                Menu PIN Portal Terkunci
              </h1>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 space-y-1">
                <p className="font-bold">
                  Menu PIN Portal hanya dapat diakses oleh user dengan tunggakan iuran kurang dari 2 bulan.
                </p>
                <p className="text-rose-800 leading-relaxed">
                  Saat ini rumah <strong>{currentResident?.houseNumber || currentUser.houseNumber}</strong> tercatat memiliki tunggakan{' '}
                  <strong>{unpaidMonths} bulan</strong> ({monthListStr}) dengan total kewajiban{' '}
                  <strong>Rp {totalArrears.toLocaleString('id-ID')}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Warga:</span>
                <strong className="text-slate-900">{currentResident?.name || currentUser.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Rumah:</span>
                <strong className="text-slate-900">{currentResident?.houseNumber || currentUser.houseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Tunggakan Iuran:</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px]">
                  {unpaidMonths} BULAN (MINIMAL &lt; 2 BULAN)
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Tagihan Iuran:</span>
                <strong className="text-rose-600 text-sm">Rp {totalArrears.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md"
              >
                <Send size={14} />
                <span>Konfirmasi Pelunasan ke WA Bendahara 1 ({ben1Contact.houseNumber})</span>
              </a>

              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>AKSES AKTIF &bull; TUNGGAKAN &lt; 2 BULAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Key className="text-amber-400" size={28} />
              <span>PIN Portal Gerbang GSS 1</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Kode akses resmi kunci portal gerbang utama Perumahan Griya Sedayu Selaras 1 setelah jam kunci malam pukul 21.00 WIB.
            </p>
          </div>

          {canManagePin && !isEditing && (
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition shrink-0"
            >
              <Edit2 size={15} />
              <span>Ubah PIN Portal (Superadmin & Kamtibmas)</span>
            </button>
          )}
        </div>
      </div>

      {/* Superadmin / Kamtibmas Edit Panel */}
      {canManagePin && isEditing && (
        <form
          onSubmit={handleSavePin}
          className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-md space-y-4 text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Edit2 size={16} className="text-amber-600" />
              <span>Perbarui PIN Portal Resmi (Superadmin & Koordinator Kamtibmas)</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-500 hover:text-slate-800 font-bold"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode PIN Portal Baru</label>
              <input
                type="text"
                required
                value={editPinCode}
                onChange={(e) => setEditPinCode(e.target.value)}
                placeholder="Contoh: 2105"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-lg tracking-widest text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Periode Berlaku</label>
              <input
                type="text"
                required
                value={editPeriodLabel}
                onChange={(e) => setEditPeriodLabel(e.target.value)}
                placeholder="Contoh: November 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Pengurus (Opsional)</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan & Publikasikan PIN'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main PIN Display Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Periode: {portalPin.periodLabel}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Rumah {currentResident?.houseNumber || currentUser.houseNumber} &bull; Terverifikasi
              </span>
            </div>

            <div className="mt-4 p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block">
                Kode PIN Gembok / Portal Utama
              </span>
              <div className="font-mono text-4xl sm:text-5xl font-black tracking-[0.35em] text-white select-all">
                {showPin ? portalPin.pinCode : '••••'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPin ? 'Sembunyikan' : 'Tampilkan PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  {copiedPin ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedPin ? 'PIN Tersalin!' : 'Salin PIN'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2.5">
              <Calendar size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Terakhir Diperbarui</span>
                <span className="font-bold text-slate-900">{portalPin.updatedAt}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Diperbarui Oleh</span>
                <span className="font-bold text-slate-900">{portalPin.updatedBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Rules Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <span>Ketentuan Penggunaan PIN Portal</span>
            </h3>
            <ul className="space-y-2 text-xs text-amber-900 leading-relaxed list-disc list-inside">
              <li>
                Portal gerbang perumahan <strong>WAJIB ditutup &amp; dikunci pukul 21.00 WIB</strong> oleh petugas ronda malam.
              </li>
              <li>
                Setiap warga wajib menutup dan mengunci kembali portal setelah keluar/masuk apabila portal sudah terkunci.
              </li>
              <li>
                PIN Portal diganti secara berkala maksimal <strong>tanggal 15 setiap bulan</strong> pada pertemuan rutin paguyuban.
              </li>
              <li>
                Demi keamanan lingkungan, mohon <strong>tidak menyebarluaskan PIN Portal</strong> kepada pihak luar perumahan.
              </li>
            </ul>
            {portalPin.notes && (
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-slate-700 italic">
                Catatan: {portalPin.notes}
              </div>
            )}
          </div>

          {canManagePin && portalPin.history && portalPin.history.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} className="text-emerald-600" />
                <span>Riwayat Perubahan PIN (Superadmin &amp; Kamtibmas)</span>
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                {portalPin.history.map((item, idx) => (
                  <div
                    key={`${item.updatedAt}-${idx}`}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{item.pinCode}</span>
                      <span className="text-[11px] text-slate-500 ml-2">({item.periodLabel})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{item.updatedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
