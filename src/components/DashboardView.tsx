import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { DayOfWeek, PaymentReceipt, PaymentReceiptType, PaymentMethodType, Resident } from '../types';
import {
  Coins,
  ReceiptText,
  Users,
  Shield,
  Package,
  BookOpen,
  MessageSquare,
  Award,
  Clock,
  Key,
  TrendingUp,
  AlertOctagon,
  ChevronRight,
  Sparkles,
  Wallet,
  CheckCircle2,
  CalendarCheck,
  Building2,
  FileText,
  CreditCard,
  Printer,
  Send,
  Mail,
  RotateCcw,
  Edit2,
  Trash2,
  Search,
  Filter,
  PlusCircle,
  Copy,
  Check,
  XCircle,
  Home,
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DashboardView: React.FC = () => {
  const {
    currentUser: authUser,
    residents,
    totalIncome,
    totalExpense,
    currentBalance,
    rondaSchedule,
    announcements,
    setActiveView,
    paymentReceipts,
    recordCashierPayment,
    updatePaymentReceipt,
    deletePaymentReceipt,
    sendReceiptNotificationEmail,
    resetFeatureData
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  // Active dashboard tab: 'ringkasan' | 'loket' | 'riwayat'
  const [dashboardTab, setDashboardTab] = useState<'ringkasan' | 'loket' | 'riwayat'>('ringkasan');

  // Permission flags
  const isBendaharaOrAdmin = ['superadmin', 'bendahara1', 'bendahara2'].includes(currentUser.role);
  const isSuperadmin = currentUser.role === 'superadmin';

  // --- LOKET PAYMENT FORM STATES ---
  const [selectedResidentId, setSelectedResidentId] = useState<string>(() => residents[0]?.id || '');
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentReceiptType>('iuran_bulanan');
  const [formAmount, setFormAmount] = useState<number>(25000);
  const [formPeriod, setFormPeriod] = useState<string>(() => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date();
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethodType>('transfer_bank');
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Active Receipt Modal (for viewing, printing, WA & email dispatch)
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<PaymentReceipt | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);
  const [isResettingReceipts, setIsResettingReceipts] = useState(false);

  // Search & Filter for History
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [filterHistoryType, setFilterHistoryType] = useState<string>('ALL');

  // Current selected resident object in Loket
  const selectedResident = useMemo(() => {
    return residents.find((r) => r.id === selectedResidentId) || residents[0];
  }, [residents, selectedResidentId]);

  // Days for ronda
  const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDay: DayOfWeek = days[new Date().getDay()] || 'Sabtu';
  const dutyGroup = rondaSchedule.find((g) => g.day === todayDay);

  // Resident's own jimpitan status
  const currentResident = residents.find((r) => r.houseNumber === currentUser.houseNumber);
  const userJimpitanPaid = currentResident?.jimpitanPaidMonth || 0;
  const userJimpitanDeficit = Math.max(0, 15000 - userJimpitanPaid);

  // Handle type change in Loket: auto update default amount
  const handlePaymentTypeChange = (type: PaymentReceiptType) => {
    setSelectedPaymentType(type);
    if (type === 'iuran_bulanan') {
      setFormAmount(25000);
    } else if (type === 'iuran_bulanan_sampah') {
      setFormAmount(50000);
    } else if (type === 'sewa_fasum') {
      setFormAmount(50000);
    } else if (type === 'sumbangan_sukarela') {
      setFormAmount(100000);
    } else {
      setFormAmount(25000);
    }
  };

  // Submit Loket Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) {
      alert('Pilih warga yang melakukan pembayaran!');
      return;
    }
    if (formAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0!');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const typeLabels: Record<PaymentReceiptType, string> = {
        iuran_bulanan: 'Iuran Bulanan Rutin (Rp 25.000)',
        iuran_bulanan_sampah: 'Iuran Bulanan + Sampah (Rp 50.000)',
        sewa_fasum: 'Sewa Fasum Paguyuban GSS',
        sumbangan_sukarela: 'Sumbangan Sukarela Warga',
        pemasukan_lain: 'Pemasukan Kas Lain-lain'
      };

      const newReceipt = await recordCashierPayment({
        residentId: selectedResident.id,
        residentName: selectedResident.name,
        residentHouse: selectedResident.houseNumber,
        residentPhone: selectedResident.phone || '0812-3456-7800',
        paymentType: selectedPaymentType,
        paymentTypeName: typeLabels[selectedPaymentType],
        amount: Number(formAmount),
        periodMonth: formPeriod,
        paymentMethod: formPaymentMethod,
        notes: formNotes || undefined
      });

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Reset form notes
      setFormNotes('');
      // Open digital receipt modal immediately for sharing
      setActiveReceiptModal(newReceipt);
    } catch (err: any) {
      alert('Gagal memproses transaksi kas: ' + err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (receipt: PaymentReceipt) => {
    const phoneClean = (receipt.residentPhone || '081234567800').replace(/[^0-9]/g, '');
    const waNumber = phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean;
    const paymentMethodText = receipt.paymentMethod === 'transfer_bank'
      ? 'Transfer BANK BRI (Rek. 155801007310503 a/n Benisius Rahmat Basuki)'
      : 'Tunai ke Bendahara Paguyuban';

    const message = `*KWITANSI RESMI PEMBAYARAN KAS GSS 1*
No. Kwitansi: *#${receipt.receiptNumber}*
Tanggal: ${new Date(receipt.createdAt).toLocaleString('id-ID')}

Yth. Bpk/Ibu: *${receipt.residentName}*
No. Rumah: *${receipt.residentHouse}*

Rincian Pembayaran:
- Transaksi: *${receipt.paymentTypeName}*
- Periode: *${receipt.periodMonth || '-'}*
- Jumlah: *Rp ${receipt.amount.toLocaleString('id-ID')}*
- Metode: *${paymentMethodText}*
- Diterima Oleh: *${receipt.recordedBy}*
${receipt.notes ? `- Catatan: ${receipt.notes}` : ''}

Status: *LUNAS / DITERIMA KAS PAGUYUBAN*
Dokumen ini sah sebagai tanda terima resmi Paguyuban Griya Sedayu Selaras 1.
Email Resmi Pengurus: grises.jogja@gmail.com`;

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Email Notification via grises.jogja@gmail.com
  const handleSendEmailNotification = async (receipt: PaymentReceipt) => {
    setEmailSendingId(receipt.id);
    try {
      const res = await sendReceiptNotificationEmail(receipt.id);
      alert(res.message);
      // Update local modal view if open
      if (activeReceiptModal && activeReceiptModal.id === receipt.id) {
        setActiveReceiptModal({
          ...activeReceiptModal,
          emailSentAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      alert('Gagal mengirim email: ' + err.message);
    } finally {
      setEmailSendingId(null);
    }
  };

  // Filtered receipts for History Tab
  const visibleReceipts = useMemo(() => {
    let list = paymentReceipts;
    // Non-admin residents can only view their own house payments
    if (!isBendaharaOrAdmin) {
      list = list.filter((r) => r.residentHouse === currentUser.houseNumber);
    }

    return list.filter((r) => {
      const matchType = filterHistoryType === 'ALL' || r.paymentType === filterHistoryType;
      const q = searchHistoryQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.receiptNumber.toLowerCase().includes(q) ||
        r.residentName.toLowerCase().includes(q) ||
        r.residentHouse.toLowerCase().includes(q) ||
        (r.periodMonth && r.periodMonth.toLowerCase().includes(q));
      return matchType && matchQuery;
    });
  }, [paymentReceipts, isBendaharaOrAdmin, currentUser.houseNumber, filterHistoryType, searchHistoryQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles size={14} className="text-amber-300" />
            <span>Portal Resmi Paguyuban Griya Sedayu Selaras 1</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Sugeng Rawuh, Bpk/Ibu {currentUser.name}
          </h2>
          <p className="mt-1 text-slate-300 text-xs sm:text-sm">
            Rumah {currentUser.houseNumber} &bull; Role Akses:{' '}
            <span className="font-extrabold uppercase text-amber-300">{currentUser.role}</span> &bull;{' '}
            <span className="text-emerald-400 font-bold">{currentUser.points || 0} GRISS-Poin</span>
          </p>

          <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Sistem terintegrasi iuran kas bulanan (Rp 25.000), iuran sampah (Rp 50.000), sewa fasum, jimpitan ronda, dan otomatisasi kwitansi resmi WhatsApp & Email via <strong className="text-blue-300 font-mono">grises.jogja@gmail.com</strong>.
          </p>

          {/* Tab Selection */}
          <div className="mt-6 flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setDashboardTab('ringkasan')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                dashboardTab === 'ringkasan'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Sparkles size={14} />
              <span>Ringkasan Portal</span>
            </button>

            {isBendaharaOrAdmin && (
              <button
                type="button"
                onClick={() => setDashboardTab('loket')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  dashboardTab === 'loket'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                <Wallet size={14} />
                <span>Loket Pembayaran Kas & Iuran (Bendahara / Superadmin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDashboardTab('riwayat')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                dashboardTab === 'riwayat'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <ReceiptText size={14} />
              <span>
                Riwayat Pembayaran Kas {isBendaharaOrAdmin ? '(Semua Warga)' : `(Rumah ${currentUser.houseNumber})`}
              </span>
              {paymentReceipts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                  {isBendaharaOrAdmin ? paymentReceipts.length : paymentReceipts.filter((p) => p.residentHouse === currentUser.houseNumber).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 2: LOKET PEMBAYARAN KAS & IURAN (SUPERADMIN & BENDAHARA 1/2) */}
      {/* ============================================================== */}
      {dashboardTab === 'loket' && isBendaharaOrAdmin && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                <Wallet size={14} className="text-emerald-600" />
                <span>Loket Kas & Iuran Resmi Paguyuban GSS 1</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Penerimaan Pembayaran Kas, Iuran Bulanan, Sampah, Fasum & Sumbangan
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Setiap pembayaran otomatis menambah Saldo Kas Paguyuban, menerbitkan Kwitansi digital bernomor resmi, serta dapat langsung dikirimkan ke WhatsApp dan Email warga via <strong className="text-slate-800 font-mono">grises.jogja@gmail.com</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isSuperadmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh data riwayat pembayaran kas & kwitansi ke kondisi awal?')) {
                      setIsResettingReceipts(true);
                      try {
                        await resetFeatureData('pembayaran');
                        alert('Data kwitansi pembayaran berhasil di-reset oleh Superadmin!');
                      } catch (err: any) {
                        alert('Gagal mereset: ' + err.message);
                      } finally {
                        setIsResettingReceipts(false);
                      }
                    }
                  }}
                  disabled={isResettingReceipts}
                  className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  title="Reset seluruh data pembayaran & kwitansi kas (Superadmin)"
                >
                  <RotateCcw size={14} className={isResettingReceipts ? 'animate-spin' : ''} />
                  <span>{isResettingReceipts ? 'Mereset...' : 'Reset Data Pembayaran'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Loket Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Penerimaan Pembayaran */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <PlusCircle size={16} className="text-blue-600" />
                <span>Formulir Pembayaran Kas Baru</span>
              </h4>

              <form onSubmit={handleSubmitPayment} className="space-y-5 text-xs">
                {/* 1. Pilih Warga */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Pilih Nama / Rumah Warga yang Membayar (58 Warga)
                  </label>
                  <select
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.houseNumber} - {r.name} ({r.statusRumah})
                      </option>
                    ))}
                  </select>
                  {selectedResident && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span>WhatsApp: <strong className="text-slate-800">{selectedResident.phone || '0812-3456-7800'}</strong></span>
                      <span>&bull;</span>
                      <span>Status: <strong className="text-blue-700">{selectedResident.statusRumah}</strong></span>
                      <span>&bull;</span>
                      <span>Tunggakan Iuran: <strong className="text-red-600">{selectedResident.iuranUnpaidMonths || 0} Bulan</strong></span>
                    </div>
                  )}
                </div>

                {/* 2. Jenis Pembayaran */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Jenis Transaksi / Pos Pembayaran
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        type: 'iuran_bulanan' as PaymentReceiptType,
                        label: 'Iuran Bulanan Rutin',
                        nominal: 'Rp 25.000 / bln',
                        desc: 'Kas operasional paguyuban'
                      },
                      {
                        type: 'iuran_bulanan_sampah' as PaymentReceiptType,
                        label: 'Iuran Bulanan + Sampah',
                        nominal: 'Rp 50.000 / bln',
                        desc: 'Iuran kas + retribusi sampah'
                      },
                      {
                        type: 'sewa_fasum' as PaymentReceiptType,
                        label: 'Sewa Fasum Paguyuban',
                        nominal: 'Sesuai tarif sewa',
                        desc: 'Balai, Lapangan, Sound, dll'
                      },
                      {
                        type: 'sumbangan_sukarela' as PaymentReceiptType,
                        label: 'Sumbangan Sukarela Warga',
                        nominal: 'Sukarela / Donasi',
                        desc: 'Sedekah / donasi acara warga'
                      },
                      {
                        type: 'pemasukan_lain' as PaymentReceiptType,
                        label: 'Pemasukan Kas Lain-lain',
                        nominal: 'Kustom nominal',
                        desc: 'Penjualan rosok, bunga bank, dll'
                      }
                    ].map((item) => {
                      const isSelected = selectedPaymentType === item.type;
                      return (
                        <div
                          key={item.type}
                          onClick={() => handlePaymentTypeChange(item.type)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <span className={`font-bold text-xs block ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                              {item.label}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.desc}</span>
                          </div>
                          <span className={`text-[11px] font-black shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                            {item.nominal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Nominal & Periode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Jumlah Pembayaran (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      4. Bulan / Periode Pembayaran
                    </label>
                    <input
                      type="text"
                      required
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                      placeholder="Contoh: November 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 4. Metode Pembayaran (NO QRIS, ONLY BRI OR TUNAI) */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    5. Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setFormPaymentMethod('transfer_bank')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        formPaymentMethod === 'transfer_bank'
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={formPaymentMethod === 'transfer_bank'}
                        onChange={() => setFormPaymentMethod('transfer_bank')}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          Transfer BANK BRI (Kas Resmi)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Rek. 155801007310503 a/n Benisius Rahmat Basuki
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setFormPaymentMethod('tunai')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                        formPaymentMethod === 'tunai'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={formPaymentMethod === 'tunai'}
                        onChange={() => setFormPaymentMethod('tunai')}
                        className="text-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          Tunai ke Bendahara
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Bendahara 1 (Ahmad B 02) / Bendahara 2 (Robi C 15)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Catatan Tambahan */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6. Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Titipan lunas 2 bulan sekaligus, sewa acara syukuran keluarga..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>

                {/* Action button */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Total Diterima Kas:</span>
                    <span className="text-xl font-black text-emerald-600">
                      Rp {formAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSubmittingPayment ? 'Memproses...' : 'Proses Pembayaran & Terbitkan Kwitansi'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Info Box: Petunjuk Standar & Rekening Kas */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 border border-blue-800 shadow-md space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <CreditCard size={18} className="text-amber-400" />
                  <h5 className="font-bold text-xs uppercase tracking-wider text-blue-200">
                    Rekening Kas Resmi Paguyuban GSS 1
                  </h5>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl border border-white/15 space-y-2">
                  <span className="text-[10px] text-slate-300 uppercase block">Bank Tujuan Transfer</span>
                  <div className="text-base font-black text-amber-300">BANK BRI</div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/10">
                    <span className="font-mono font-bold text-white text-sm">155801007310503</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('155801007310503');
                        setCopiedAccount(true);
                        setTimeout(() => setCopiedAccount(false), 2000);
                      }}
                      className="px-2 py-1 bg-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-500 transition flex items-center gap-1"
                    >
                      {copiedAccount ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedAccount ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300">a/n <strong>Benisius Rahmat Basuki</strong></div>
                </div>

                <div className="text-xs text-slate-300 space-y-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Mail size={13} />
                    <span>Notifikasi Email Resmi:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Setiap kwitansi dapat dikirimkan ke email warga dari server resmi: <strong className="text-blue-300 font-mono">grises.jogja@gmail.com</strong>.
                  </p>
                </div>
              </div>

              {/* Rincian Tarif Resmi 2026 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Tarif Resmi Musyawarah Warga 2026</span>
                </h5>
                <ul className="text-xs text-slate-600 space-y-2 divide-y divide-slate-100">
                  <li className="pt-1.5 flex justify-between items-center">
                    <span>Iuran Rutin Paguyuban</span>
                    <strong className="text-blue-700">Rp 25.000 / KK / bln</strong>
                  </li>
                  <li className="pt-1.5 flex justify-between items-center">
                    <span>Iuran Rutin + Sampah</span>
                    <strong className="text-emerald-700">Rp 50.000 / KK / bln</strong>
                  </li>
                  <li className="pt-1.5 flex justify-between items-center">
                    <span>Jimpitan Ronda Malam</span>
                    <strong className="text-amber-700">Rp 500 / rumah / hari</strong>
                  </li>
                  <li className="pt-1.5 flex justify-between items-center">
                    <span>Denda Tidak Hadir Ronda</span>
                    <strong className="text-red-700">Rp 15.000 / regu</strong>
                  </li>
                  <li className="pt-1.5 flex justify-between items-center">
                    <span>Sewa Fasum Balai / Lapangan</span>
                    <strong className="text-blue-700">Rp 30.000 - Rp 50.000</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RIWAYAT PEMBAYARAN KAS (VIEW ONLY UNTUK WARGA, CRUD ADMIN) */}
      {/* ============================================================== */}
      {dashboardTab === 'riwayat' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200 mb-1.5">
                <ReceiptText size={14} className="text-blue-600" />
                <span>
                  {isBendaharaOrAdmin
                    ? 'Manajemen Riwayat Pembayaran (Superadmin & Bendahara)'
                    : `Riwayat Pembayaran Kas Rumah ${currentUser.houseNumber} (View Only)`}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isBendaharaOrAdmin
                  ? 'Seluruh Arsip Kwitansi & Transaksi Pembayaran Warga'
                  : `Riwayat Pembayaran Diterima untuk Rumah ${currentUser.houseNumber}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBendaharaOrAdmin
                  ? 'Superadmin dan Bendahara dapat melihat, mengedit nominal/catatan, menghapus transaksi, serta mengirimkan Kwitansi via WhatsApp & Email grises.jogja@gmail.com.'
                  : 'Warga memiliki hak akses untuk memeriksa seluruh riwayat pembayaran yang sah (view-only) dan mencetak bukti kwitansi digital.'}
              </p>
            </div>

            {isBendaharaOrAdmin && (
              <button
                type="button"
                onClick={() => setDashboardTab('loket')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle size={15} />
                <span>Buka Loket Pembayaran Baru</span>
              </button>
            )}
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
                <Filter size={13} /> Jenis:
              </span>
              <select
                value={filterHistoryType}
                onChange={(e) => setFilterHistoryType(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold"
              >
                <option value="ALL">Semua Jenis Pembayaran</option>
                <option value="iuran_bulanan">Iuran Bulanan (Rp 25.000)</option>
                <option value="iuran_bulanan_sampah">Iuran Bulanan + Sampah (Rp 50.000)</option>
                <option value="sewa_fasum">Sewa Fasum</option>
                <option value="sumbangan_sukarela">Sumbangan Sukarela</option>
                <option value="pemasukan_lain">Pemasukan Lain-lain</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kwitansi, warga, atau no rumah..."
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          {/* Table of Receipts */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">No. Kwitansi</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Rumah & Warga</th>
                    <th className="py-3 px-3">Jenis Pembayaran</th>
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3">Metode</th>
                    <th className="py-3 px-3 text-right">Jumlah</th>
                    <th className="py-3 px-3 text-center">Notifikasi</th>
                    <th className="py-3 px-3 text-center">Aksi Kwitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                        Belum ada riwayat pembayaran yang tercatat pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    visibleReceipts.map((rc, idx) => (
                      <tr key={rc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          #{rc.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(rc.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block">{rc.residentHouse}</span>
                          <span className="text-slate-600 text-[11px] block">{rc.residentName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{rc.paymentTypeName}</span>
                          {rc.notes && <span className="text-[10px] text-slate-400 italic block">{rc.notes}</span>}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                          {rc.periodMonth || '-'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rc.paymentMethod === 'transfer_bank'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {rc.paymentMethod === 'transfer_bank' ? 'Transfer BRI' : 'Tunai'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-600 whitespace-nowrap">
                          Rp {rc.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {rc.emailSentAt ? (
                              <span
                                className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold flex items-center gap-0.5"
                                title={`Terkirim ke email via grises.jogja@gmail.com pada ${new Date(rc.emailSentAt).toLocaleString('id-ID')}`}
                              >
                                <Mail size={10} />
                                <span>Email Terkirim</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendEmailNotification(rc)}
                                disabled={emailSendingId === rc.id}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                title="Kirim Notifikasi via Email grises.jogja@gmail.com"
                              >
                                <Mail size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* View / Print Kwitansi */}
                            <button
                              type="button"
                              onClick={() => setActiveReceiptModal(rc)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              title="Buka Kwitansi Resmi"
                            >
                              <Printer size={11} />
                              <span>Kwitansi</span>
                            </button>

                            {/* WhatsApp share */}
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(rc)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Kirim Kwitansi ke WhatsApp Warga"
                            >
                              <Send size={13} />
                            </button>

                            {/* Edit & Delete: ONLY Superadmin and Bendahara */}
                            {isBendaharaOrAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingReceipt(rc)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Transaksi Pembayaran (Superadmin / Bendahara)"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Hapus kwitansi pembayaran #${rc.receiptNumber} (${rc.residentName})? Saldo kas akan disesuaikan.`)) {
                                      deletePaymentReceipt(rc.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Pembayaran (Superadmin / Bendahara)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: RINGKASAN PORTAL (DEFAULT DASHBOARD VIEW) */}
      {/* ============================================================== */}
      {dashboardTab === 'ringkasan' && (
        <div className="space-y-6">
          {/* Priority Announcement Alert */}
          {announcements.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4.5 text-amber-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertOctagon className="text-amber-700" size={22} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-amber-800 tracking-wider">
                    Pengumuman Penting Pengurus:
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {announcements[0].title}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {announcements[0].message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('tatib')}
                className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
              >
                Baca Tatib 2026
              </button>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Kas */}
            <div
              onClick={() => setActiveView('keuangan')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Saldo Kas Paguyuban</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                Rp {currentBalance.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp size={12} />
                <span>Transparansi 100% Real-time</span>
              </div>
            </div>

            {/* Pemasukan Bulan Ini */}
            <div
              onClick={() => setActiveView('keuangan')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Pemasukan</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Coins size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                Rp {totalIncome.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Iuran Rp 25k, Sampah, Jimpit & Sewa Fasum
              </div>
            </div>

            {/* Jimpitan Rumah Anda */}
            <div
              onClick={() => setActiveView('jimpitan')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Jimpitan Rumah {currentUser.houseNumber}</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Coins size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                Rp {userJimpitanPaid.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-400">/ 15rb</span>
              </div>
              <div className="text-[11px] mt-1 font-bold">
                {userJimpitanDeficit === 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> LUNAS BULAN INI
                  </span>
                ) : (
                  <span className="text-amber-600">Kurang Rp {userJimpitanDeficit.toLocaleString('id-ID')}</span>
                )}
              </div>
            </div>

            {/* Poin Loyalitas Anda */}
            <div
              onClick={() => setActiveView('poin')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">GRISS-Poin Anda</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 mt-2">
                {currentUser.points || 0} <span className="text-xs font-normal text-slate-400">Poin</span>
              </div>
              <div className="text-[11px] text-blue-600 mt-1 font-semibold flex items-center gap-1">
                <span>Tukarkan Benefit Bebas Iuran</span>
                <ChevronRight size={11} />
              </div>
            </div>
          </div>

          {/* Ronda Malam Hari Ini Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Shield size={24} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Jadwal Ronda Malam Ini
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Hari {todayDay} ({dutyGroup?.members.length} Petugas)
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveView('jimpitan')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Coins size={14} />
                <span>Mulai Input Jimpitan Online</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Petugas Ronda Malam Ini:</span>
                <span className="text-xs font-bold text-amber-300 mt-1 block">
                  {dutyGroup?.members.join(', ') || 'Belum diatur'}
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Ketentuan Kunci Portal:</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  Tepat Pukul 21.00 WIB Dikunci
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Standar Jimpitan Harian:</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">
                  Rp 500 / Rumah / Hari
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-semibold">Denda Tidak Ronda:</span>
                <span className="text-xs font-bold text-red-400 mt-1 block">
                  Rp 15.000 / Regu
                </span>
              </div>
            </div>
          </div>

          {/* Informasi Pengurus Paguyuban Warga Perum GSS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Users size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Struktur Organisasi Resmi
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Informasi Pengurus Paguyuban Warga Perum GSS 1
                  </h3>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                Periode 2026
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Ketua: Beni */}
              <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                    Ketua Paguyuban
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. BENI
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah B 24</span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-md">
                  Superadmin
                </span>
              </div>

              {/* Wakil Ketua: Waluyo */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Wakil Ketua
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. WALUYO
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah A 13</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
                  Wakil
                </span>
              </div>

              {/* Bendahara 1: Ahmad */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Bendahara 1
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. AHMAD
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah B 02</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                  Kas Utama
                </span>
              </div>

              {/* Bendahara 2: Robi */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                    Bendahara 2
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. ROBI
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah C 15</span>
                </div>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-md">
                  Sampah/Fasum
                </span>
              </div>

              {/* Sekretaris: Asrofi */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Sekretaris
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. ASROFI
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah B 08</span>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-md">
                  Administrasi
                </span>
              </div>

              {/* Koordinator Kamtibmas: Joko Tri */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    Koord. Kamtibmas
                  </span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">
                    Bpk. JOKO TRI
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Rumah C 12</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md">
                  Keamanan
                </span>
              </div>
            </div>
          </div>

          {/* Feature Navigation Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              <span>Menu Layanan Aplikasi GRISSPO:</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <button
                onClick={() => setActiveView('jimpitan')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Coins size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Jimpit Online</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Input jimpitan harian, kelipatan 500, rekap pendapatan & kekurangan warga.
                </p>
              </button>

              <button
                onClick={() => setActiveView('keuangan')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <ReceiptText size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Kas Transparan</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pemasukan & pengeluaran kas paguyuban, grafik analitik, ekspor PDF & Excel.
                </p>
              </button>

              <button
                onClick={() => setActiveView('fasum')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Building2 size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Sewa Fasum</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pemesanan Balai, Lapangan, Tenda & Sound dengan integrasi pembayaran kas.
                </p>
              </button>

              <button
                onClick={() => setActiveView('warga')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Users size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Data 58 Warga</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Checklist kependudukan Blok A, B, C, status hunian pemilik/kontrak.
                </p>
              </button>

              <button
                onClick={() => setActiveView('ronda')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Shield size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Jadwal Ronda</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Grup ronda 7 hari, jam kunci portal 21.00 WIB, denda regu tidak ronda.
                </p>
              </button>

              <button
                onClick={() => setActiveView('inventaris')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Package size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Inventaris (33 Item)</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aset paguyuban: sound, piring, gelas, lampu sorot, terpal, pinjam barang.
                </p>
              </button>

              <button
                onClick={() => setActiveView('tatib')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <BookOpen size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Tata Tertib 2026</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aturan resmi iuran bulanan Rp 25k, sampah, jam malam, sewa fasum Rp 30k.
                </p>
              </button>

              <button
                onClick={() => setActiveView('forum')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <MessageSquare size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Forum Diskusi</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Rembug warga: Keamanan, Kebersihan, Kerja Bakti, Saran Umum (+5 Poin).
                </p>
              </button>

              <button
                onClick={() => setActiveView('poin')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Award size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">GRISS-Poin</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Poin loyalitas gotong royong, penukaran benefit gratis iuran sampah & sembako.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: KWITANSI RESMI DIGITAL (PRINT / WA / EMAIL) */}
      {/* ============================================================== */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={22} className="text-emerald-300" />
                <div>
                  <h3 className="text-base font-bold">Kwitansi Resmi Pembayaran Kas</h3>
                  <p className="text-xs text-emerald-200">No. Kwitansi: #{activeReceiptModal.receiptNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="text-white/70 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 relative">
                {/* Lunas Stamp */}
                <div className="absolute right-4 top-8 border-2 border-emerald-600 text-emerald-700 font-black text-xs px-3 py-1 rounded-lg rotate-[-12deg] tracking-widest opacity-85 pointer-events-none">
                  LUNAS / KAS MASUK
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-900">
                    PAGUYUBAN WARGA GRIYA SEDAYU SELARAS 1
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Argorejo, Sedayu, Bantul, D.I. Yogyakarta 55752 &bull; GRISSPO Portal
                  </p>
                  <p className="text-[10px] text-blue-600 font-mono mt-1 font-bold">
                    BUKTI KAS RESMI #{activeReceiptModal.receiptNumber}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telah Diterima Dari:</span>
                    <span className="font-bold text-slate-900">
                      {activeReceiptModal.residentName} (Rumah {activeReceiptModal.residentHouse})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Pos Transaksi:</span>
                    <span className="font-bold text-slate-900">{activeReceiptModal.paymentTypeName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Periode / Bulan:</span>
                    <span className="font-bold text-slate-900">{activeReceiptModal.periodMonth || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Pembayaran:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(activeReceiptModal.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Pembayaran:</span>
                    <span className="font-bold text-blue-700">
                      {activeReceiptModal.paymentMethod === 'transfer_bank'
                        ? 'Transfer BANK BRI (155801007310503)'
                        : 'Tunai ke Bendahara Paguyuban'}
                    </span>
                  </div>

                  {activeReceiptModal.notes && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Catatan:</span>
                      <span className="font-medium text-slate-800 italic">{activeReceiptModal.notes}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-500">Petugas Penerima:</span>
                    <span className="font-bold text-slate-900">{activeReceiptModal.recordedBy}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Total Nominal Pembayaran</span>
                  <span className="text-xl font-black text-emerald-700">
                    Rp {activeReceiptModal.amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100">
                  <span>Otorisasi: Bendahara Paguyuban GSS</span>
                  <span className="text-emerald-700 font-bold">TERCATAT DI BUKU KAS</span>
                </div>
              </div>

              {/* Status Notifikasi */}
              {activeReceiptModal.emailSentAt && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
                  <Mail size={14} className="text-blue-600 shrink-0" />
                  <span>
                    Notifikasi kwitansi resmi telah terkirim via server email <strong className="font-mono">grises.jogja@gmail.com</strong> pada {new Date(activeReceiptModal.emailSentAt).toLocaleString('id-ID')}.
                  </span>
                </div>
              )}

              {/* Action Buttons: WhatsApp, Email, Cetak */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(activeReceiptModal)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    title="Kirim ke WhatsApp Warga"
                  >
                    <Send size={13} />
                    <span>Kirim ke WhatsApp Warga</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendEmailNotification(activeReceiptModal)}
                    disabled={emailSendingId === activeReceiptModal.id}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    title="Kirim notifikasi email resmi dari grises.jogja@gmail.com"
                  >
                    <Mail size={13} />
                    <span>{emailSendingId === activeReceiptModal.id ? 'Mengirim...' : 'Kirim Notif Email'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Cetak PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReceiptModal(null)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT KWITANSI / TRANSAKSI (SUPERADMIN & BENDAHARA ONLY) */}
      {/* ============================================================== */}
      {editingReceipt && isBendaharaOrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold">Edit Kwitansi #{editingReceipt.receiptNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReceipt(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updatePaymentReceipt(editingReceipt);
                setEditingReceipt(null);
                alert('Data kwitansi berhasil diperbarui!');
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Warga / Rumah</label>
                <div className="p-2.5 bg-slate-100 rounded-xl font-bold text-slate-800">
                  {editingReceipt.residentHouse} - {editingReceipt.residentName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pos Transaksi</label>
                <div className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">
                  {editingReceipt.paymentTypeName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={editingReceipt.amount}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bulan / Periode</label>
                <input
                  type="text"
                  value={editingReceipt.periodMonth || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, periodMonth: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingReceipt.notes || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Perubahan Kwitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
