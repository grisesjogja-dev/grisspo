import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser, getLocalDateString, LEGACY_FAKE_SEED_IDS } from '../context/AppContext';
import { DayOfWeek, PaymentReceipt, PaymentReceiptType, PaymentMethodType, Resident } from '../types';
import { DetailToggle } from './DetailToggle';
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
  ExternalLink,
  FileWarning,
  FileCheck,
  Phone,
  PhoneCall,
  BellRing,
  CheckSquare,
  Square,
  LifeBuoy,
  HeartPulse,
  Flame
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
    transactions,
    paymentReceipts,
    recordCashierPayment,
    updatePaymentReceipt,
    deletePaymentReceipt,
    sendReceiptNotificationEmail,
    resetFeatureData,
    getResidentNameByHouse,
    toggleBerkasKependudukan,
    deletedIds,
    confirmAction
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  // Active dashboard tab: 'ringkasan' | 'loket' | 'riwayat'
  const [dashboardTab, setDashboardTab] = useState<'ringkasan' | 'loket' | 'riwayat'>('ringkasan');

  // Permission flags
  const isBendaharaOrAdmin = ['superadmin', 'sekretaris', 'bendahara1', 'bendahara2', 'admin_inventaris'].includes(currentUser.role);
  const isSuperadmin = currentUser.role === 'superadmin';

  // --- LOKET PAYMENT FORM STATES ---
  const [selectedResidentId, setSelectedResidentId] = useState<string>(() => residents[0]?.id || '');
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentReceiptType>('iuran_bulanan');
  const [formDate, setFormDate] = useState<string>(() => getLocalDateString());
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

  // Current logged in resident record and berkas kependudukan status
  const currentResidentRecord = useMemo(() => {
    return residents.find(
      (r) =>
        r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase() ||
        r.id === currentUser.id
    );
  }, [residents, currentUser]);

  const hasPendingBerkas = currentResidentRecord ? !currentResidentRecord.berkasKependudukan : false;

  // Days for ronda
  const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDay: DayOfWeek = days[new Date().getDay()] || 'Sabtu';
  const dutyGroup = rondaSchedule.find((g) => g.day === todayDay);

  // Resident's own personal arrears calculations
  const userJimpitanPaid = currentResidentRecord?.jimpitanPaidMonth || 0;
  const userCurrentMonthJimpitanDeficit = Math.max(0, 15000 - userJimpitanPaid);
  const userPrevMonthJimpitanDeficit = currentResidentRecord?.previousMonthsJimpitanDeficit || 0;
  const userTotalJimpitanDeficit = userCurrentMonthJimpitanDeficit + userPrevMonthJimpitanDeficit;

  // Total kekurangan iuran bulanan + sampah: Rp 50.000 / month (Iuran Bulanan 25.000 + Sampah 25.000)
  const userUnpaidMonthsCount = currentResidentRecord?.iuranUnpaidMonths ?? (currentResidentRecord?.monthlyIuranPaid ? 0 : 1);
  const userTotalIuranSampahDeficit = userUnpaidMonthsCount * 50000;
  const userUnpaidMonthNames = currentResidentRecord?.unpaidMonthNames || [];

  // Paguyuban overall totals (for Bendahara & Superadmin view)
  const totalPaguyubanJimpitanDeficit = useMemo(() => {
    return residents.reduce((acc, r) => {
      const cur = Math.max(0, 15000 - (r.jimpitanPaidMonth || 0));
      const prev = r.previousMonthsJimpitanDeficit || 0;
      return acc + cur + prev;
    }, 0);
  }, [residents]);

  const totalPaguyubanIuranSampahDeficit = useMemo(() => {
    return residents.reduce((acc, r) => {
      const count = r.iuranUnpaidMonths ?? (r.monthlyIuranPaid ? 0 : 1);
      return acc + (count * 50000);
    }, 0);
  }, [residents]);

  // Current & Previous Month calculation
  const now = new Date();
  const currentMonthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  // Due Date (28th of each month for Iuran Bulanan, Sewa Lahan Parkir, and Iuran Sampah)
  const todayDayNum = now.getDate();
  const dueDateNum = 28;
  const daysUntilDue = dueDateNum - todayDayNum;
  const isPastDue = todayDayNum > dueDateNum;
  const isDueToday = todayDayNum === dueDateNum;

  // Push notification reminder simulated state
  const [pushReminderEnabled, setPushReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('grisspo_due_push_enabled') !== 'false';
  });

  const handleTogglePushReminder = () => {
    const next = !pushReminderEnabled;
    setPushReminderEnabled(next);
    localStorage.setItem('grisspo_due_push_enabled', String(next));
    if (next) {
      alert('Notifikasi Pengingat Jatuh Tempo Diaktifkan! Sistem akan mengingatkan pembayaran iuran bulanan, sewa lahan parkir, dan iuran sampah sebelum tanggal 28 setiap bulan.');
    }
  };

  // Superadmin / Sekretaris Panel Berkas Kependudukan State
  const [berkasBlockFilter, setBerkasBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [berkasStatusFilter, setBerkasStatusFilter] = useState<'ALL' | 'BELUM' | 'SUDAH'>('BELUM');
  const [berkasSearch, setBerkasSearch] = useState('');
  const [isUpdatingBerkasId, setIsUpdatingBerkasId] = useState<string | null>(null);

  const berkasSummary = useMemo(() => {
    const total = residents.length;
    const sudah = residents.filter((r) => r.berkasKependudukan).length;
    const belum = total - sudah;
    const percent = total > 0 ? Math.round((sudah / total) * 100) : 0;
    return { total, sudah, belum, percent };
  }, [residents]);

  const filteredBerkasResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchBlock = berkasBlockFilter === 'ALL' || r.block === berkasBlockFilter;
      const matchStatus =
        berkasStatusFilter === 'ALL' ||
        (berkasStatusFilter === 'SUDAH' && r.berkasKependudukan) ||
        (berkasStatusFilter === 'BELUM' && !r.berkasKependudukan);
      const matchSearch =
        r.name.toLowerCase().includes(berkasSearch.toLowerCase()) ||
        r.houseNumber.toLowerCase().includes(berkasSearch.toLowerCase());
      return matchBlock && matchStatus && matchSearch;
    });
  }, [residents, berkasBlockFilter, berkasStatusFilter, berkasSearch]);

  const handleToggleBerkasStatus = async (residentId: string, currentStatus?: boolean) => {
    const resItem = residents.find((r) => r.id === residentId);
    const nextStatusText = !currentStatus ? 'Lengkap (Sudah Serah)' : 'Belum Diserahkan';
    confirmAction({
      title: 'Ubah Status Berkas Kependudukan',
      message: `Ubah status berkas kependudukan untuk ${resItem?.name || 'warga'} (${resItem?.houseNumber || ''}) menjadi "${nextStatusText}"?`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: async () => {
        setIsUpdatingBerkasId(residentId);
        try {
          const res = await toggleBerkasKependudukan(residentId, !currentStatus);
          if (res.success && !currentStatus) {
            confetti({ particleCount: 50, spread: 60 });
          }
        } catch (err: any) {
          alert('Gagal mengubah status berkas: ' + err.message);
        } finally {
          setIsUpdatingBerkasId(null);
        }
      }
    });
  };

  const handleSendBerkasReminderWA = (r: Resident) => {
    const cleanPhone = (r.phone || '081234567800').replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const message = `*PENGINGAT KELENGKAPAN BERKAS KEPENDUDUKAN (KTP & KK)*
Paguyuban Griya Sedayu Selaras 1

Yth. Bpk/Ibu *${r.name}* (Rumah ${r.houseNumber})
Kapanewon Sedayu, Bantul

Berdasarkan pencatatan administrasi kependudukan paguyuban, berkas kependudukan (fotocopy/scan KTP & KK) untuk rumah *${r.houseNumber}* saat ini berstatus *BELUM DISERAHKAN*.

Mohon kesediaan Bpk/Ibu untuk segera menyerahkan berkas kependudukan ke:
- Bpk. Asrofi (Sekretaris - Rumah B 08)
- Bpk. Beni (Superadmin / Ketua - Rumah B 24)

Kelengkapan berkas sangat penting untuk akurasi data warga, laporan RT/Dukuh, serta pelayanan warga paguyuban.
Terima kasih atas kerja samanya.
_Pengurus Paguyuban Griya Sedayu Selaras 1_`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Handle type change in Loket: auto update default amount
  const handlePaymentTypeChange = (type: PaymentReceiptType) => {
    setSelectedPaymentType(type);
    if (type === 'iuran_bulanan') {
      setFormAmount(25000);
    } else if (type === 'iuran_sampah') {
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

    const typeLabels: Record<PaymentReceiptType, string> = {
      iuran_bulanan: 'Iuran Bulanan Rutin (Rp 25.000)',
      iuran_sampah: 'Iuran Sampah (Rp 25.000)',
      iuran_bulanan_sampah: 'Iuran Bulanan + Sampah (Rp 50.000)',
      sewa_fasum: 'Sewa Fasum Paguyuban GSS',
      sumbangan_sukarela: 'Sumbangan Sukarela Warga',
      pemasukan_lain: 'Pemasukan Kas Lain-lain'
    };

    confirmAction({
      title: 'Konfirmasi Pembayaran Kas',
      message: `Catat transaksi pembayaran kas ${typeLabels[selectedPaymentType]} sebesar Rp ${Number(formAmount).toLocaleString('id-ID')} untuk ${selectedResident.name} (${selectedResident.houseNumber}) tanggal ${formDate}?`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: async () => {
        setIsSubmittingPayment(true);
        try {
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
            date: formDate,
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
      }
    });
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (receipt: PaymentReceipt) => {
    const phoneClean = (receipt.residentPhone || '081234567800').replace(/[^0-9]/g, '');
    const waNumber = phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean;
    const paymentMethodText = receipt.paymentMethod === 'transfer_bank'
      ? 'Transfer BANK BRI (Rek. 155801007310503 a/n Benisius Rahmat Basuki)'
      : 'Tunai ke Bendahara Paguyuban';

    const receiptDateFormatted = receipt.date
      ? new Date(`${receipt.date}T12:00:00`).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : new Date(receipt.createdAt).toLocaleDateString('id-ID');

    const message = `*KWITANSI RESMI PEMBAYARAN KAS GSS 1*
No. Kwitansi: *#${receipt.receiptNumber}*
Tanggal: ${receiptDateFormatted}

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

  // Filtered receipts for History Tab (Real-Time across all devices and input methods)
  // NOTE: Excludes any daily or monthly jimpitan (jimpitan directly increments saldo/total pemasukan, not riwayat pembayaran kas),
  // and strictly eliminates duplicate records.
  const allReceipts = useMemo(() => {
    const deletedSet = new Set(deletedIds || []);
    // 1. Exclude deleted receipts, orphan receipts whose trx was deleted, and any jimpitan receipts
    const list: PaymentReceipt[] = paymentReceipts.filter((r) => {
      const strippedId = (r.id || '').replace(/^receipt-/, '');
      if (
        deletedSet.has(r.id) ||
        deletedSet.has(strippedId) ||
        LEGACY_FAKE_SEED_IDS.has(strippedId) ||
        (r.transactionId && (deletedSet.has(r.transactionId) || LEGACY_FAKE_SEED_IDS.has(r.transactionId)))
      ) {
        return false;
      }
      const pType = (r.paymentType || '').toLowerCase();
      const pName = (r.paymentTypeName || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      return pType !== 'jimpitan' && !pName.includes('jimpit') && !notes.includes('jimpit');
    });

    const existingTrxIds = new Set<string>();
    const existingReceiptIds = new Set<string>();
    const existingCompositeKeys = new Set<string>();

    for (const r of list) {
      if (r.transactionId) existingTrxIds.add(r.transactionId);
      if (r.id) existingReceiptIds.add(r.id);
      if (r.receiptNumber) existingReceiptIds.add(r.receiptNumber);
      const houseClean = (r.residentHouse || '').replace(/\s+/g, '').toUpperCase();
      const compKey = `${r.date || ''}_${houseClean}_${r.amount}_${r.paymentType}`;
      existingCompositeKeys.add(compKey);
    }

    // Combine incoming transactions that don't yet have an explicit receipt
    for (const trx of transactions) {
      const typeClean = String(trx.type || '').trim().toLowerCase();
      if (typeClean !== 'pemasukan' && typeClean !== 'income') continue;

      const catL = (trx.category || '').toLowerCase();
      const descL = (trx.description || '').toLowerCase();

      // Exclude ANY daily or monthly jimpitan transactions from receipts history!
      if (catL.includes('jimpit') || descL.includes('jimpit')) {
        continue;
      }

      if (
        existingTrxIds.has(trx.id) ||
        existingReceiptIds.has(`receipt-${trx.id}`) ||
        existingReceiptIds.has(trx.id)
      ) {
        continue;
      }

      const house = trx.sourceHouse || '';
      const houseClean = house.replace(/\s+/g, '').toUpperCase();
      const dateStr = trx.date || getLocalDateString(new Date(trx.timestamp || Date.now()));

      let pType: PaymentReceiptType = 'pemasukan_lain';
      if (catL.includes('sampah') && catL.includes('bulanan')) pType = 'iuran_bulanan_sampah';
      else if (catL.includes('sampah')) pType = 'iuran_sampah';
      else if (catL.includes('bulanan') || catL.includes('iuran')) pType = 'iuran_bulanan';
      else if (catL.includes('fasum')) pType = 'sewa_fasum';
      else if (catL.includes('sumbangan')) pType = 'sumbangan_sukarela';

      const compKey = `${dateStr}_${houseClean}_${Number(trx.amount) || 0}_${pType}`;
      if (existingCompositeKeys.has(compKey)) {
        continue;
      }
      existingCompositeKeys.add(compKey);

      const matchedRes = residents.find(
        (r) => house && r.houseNumber.replace(/\s+/g, '').toUpperCase() === houseClean
      );

      list.push({
        id: `receipt-${trx.id}`,
        receiptNumber: `KWT-GSS-${dateStr.replace(/-/g, '')}-${trx.id.slice(-4).toUpperCase()}`,
        date: dateStr,
        residentId: matchedRes ? matchedRes.id : (house ? `w-${house.replace(/\s+/g, '').toLowerCase()}` : 'gss-paguyuban'),
        residentName: matchedRes ? matchedRes.name : (house ? `Warga ${house}` : trx.recordedBy || 'Warga GSS'),
        residentHouse: house || 'Paguyuban GSS',
        residentPhone: matchedRes?.phone || '0812-3456-7800',
        paymentType: pType,
        paymentTypeName: trx.category,
        amount: Number(trx.amount) || 0,
        periodMonth: dateStr.slice(0, 7),
        paymentMethod: (trx.description || '').toLowerCase().includes('transfer') ? 'transfer_bank' : 'tunai',
        notes: trx.description,
        recordedBy: trx.recordedBy || 'Bendahara Kas',
        recorderRole: trx.userRole || 'bendahara1',
        transactionId: trx.id,
        createdAt: new Date(trx.timestamp || `${dateStr}T12:00:00`).toISOString()
      });
    }

    // Final deduplication pass to guarantee NO duplicate transactions in Riwayat Pembayaran Kas
    const uniqueList: PaymentReceipt[] = [];
    const seenIds = new Set<string>();
    const seenReceiptNums = new Set<string>();
    const seenTrxIds = new Set<string>();
    const seenComposites = new Set<string>();

    for (const item of list) {
      if (seenIds.has(item.id)) continue;
      if (item.receiptNumber && seenReceiptNums.has(item.receiptNumber)) continue;
      if (item.transactionId && seenTrxIds.has(item.transactionId)) continue;

      const comp = `${item.date || ''}_${(item.residentHouse || '').replace(/\s+/g, '').toUpperCase()}_${item.amount}_${item.paymentType}`;
      if (seenComposites.has(comp)) continue;

      seenIds.add(item.id);
      if (item.receiptNumber) seenReceiptNums.add(item.receiptNumber);
      if (item.transactionId) seenTrxIds.add(item.transactionId);
      seenComposites.add(comp);
      uniqueList.push(item);
    }

    return uniqueList.sort((a, b) => {
      const dateA = a.date || a.createdAt?.slice(0, 10) || '';
      const dateB = b.date || b.createdAt?.slice(0, 10) || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [paymentReceipts, transactions, residents, deletedIds]);

  const visibleReceipts = useMemo(() => {
    let list = allReceipts;
    // Non-admin residents can only view their own house payments
    if (!isBendaharaOrAdmin) {
      const userHouseClean = currentUser.houseNumber.replace(/\s+/g, '').toUpperCase();
      list = list.filter((r) => r.residentHouse.replace(/\s+/g, '').toUpperCase() === userHouseClean);
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
  }, [allReceipts, isBendaharaOrAdmin, currentUser.houseNumber, filterHistoryType, searchHistoryQuery]);

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
          <p className="mt-1 text-slate-300 text-xs sm:text-sm flex flex-wrap items-center gap-1.5">
            <span>Rumah {currentUser.houseNumber} &bull; Role Akses:</span>
            <span className="font-extrabold uppercase text-amber-300">{currentUser.role}</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-bold">{currentUser.points || 0} GRISS-Poin</span>
            <span>&bull;</span>
            {currentResidentRecord?.berkasKependudukan ? (
              <span className="text-emerald-300 font-bold inline-flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Berkas Kependudukan: Lengkap (Sudah Serah)</span>
              </span>
            ) : (
              <span className="text-amber-300 font-bold inline-flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                <FileWarning size={12} className="text-amber-400" />
                <span>Berkas Kependudukan: Belum Diserahkan</span>
              </span>
            )}
          </p>

          <DetailToggle variant="dark" label="Detail Keterangan Sistem">
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl bg-white/5 p-3 rounded-xl border border-white/10">
              Sistem terintegrasi iuran kas bulanan (Rp 25.000), iuran sampah (Rp 50.000), sewa fasum, jimpitan ronda, dan otomatisasi kwitansi resmi WhatsApp &amp; Email via <strong className="text-blue-300 font-mono">grises.jogja@gmail.com</strong>.
            </p>
          </DetailToggle>

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
              {(() => {
                const userHouseClean = currentUser.houseNumber.replace(/\s+/g, '').toUpperCase();
                const badgeCount = isBendaharaOrAdmin
                  ? allReceipts.length
                  : allReceipts.filter((p) => (p.residentHouse || '').replace(/\s+/g, '').toUpperCase() === userHouseClean).length;
                return badgeCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {badgeCount}
                  </span>
                ) : null;
              })()}
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFIKASI PERINGATAN: BERKAS KEPENDUDUKAN BELUM DISERAHKAN (Muncul di akun warga yang belum menyerahkan berkas) */}
      {hasPendingBerkas && currentResidentRecord && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-lg shadow-amber-500/5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md shrink-0">
                <FileWarning size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                    Pemberitahuan Wajib Administrasi Kependudukan
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Rumah {currentResidentRecord.houseNumber} &bull; {currentResidentRecord.name}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
                  Anda Belum Menyerahkan Berkas Kependudukan (Fotokopi KTP / Kartu Keluarga)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-3xl leading-relaxed">
                  Berdasarkan catatan administrasi paguyuban, rumah Anda tercatat <strong>belum menyerahkan fotokopi berkas kependudukan (KTP &amp; KK)</strong>. Mohon segera menyerahkan berkas fisik atau file digital kepada <strong>Sekretaris Paguyuban (Bpk. Asrofi - Rumah B 08)</strong> atau Superadmin (Bpk. Beni - Rumah B 24) untuk melengkapi verifikasi data warga resmi.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
              {(() => {
                const sekRes = residents.find((r) => r.houseNumber.replace(/\s+/g, '').toUpperCase() === 'B08');
                const rawPhone = (sekRes?.phone || '0812-3456-7824').replace(/[^0-9]/g, '');
                const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone.startsWith('62') ? rawPhone : '62' + rawPhone;
                return (
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                      `Halo Bpk. ${sekRes?.name || 'Asrofi'} (Sekretaris Paguyuban GSS 1 - Rumah B 08), saya ${currentResidentRecord.name} dari Rumah ${currentResidentRecord.houseNumber} ingin mengonfirmasi dan menyerahkan berkas kependudukan (KTP/KK) keluarga kami.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition"
                  >
                    <Phone size={14} />
                    <span>Hubungi Sekretaris ({sekRes?.name || 'B 08'})</span>
                  </a>
                );
              })()}
              <span className="text-[10px] text-center text-slate-500">
                Verifikasi hanya oleh Superadmin &amp; Sekretaris
              </span>
            </div>
          </div>
        </div>
      )}

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
              <DetailToggle variant="light" label="Detail Loket Kas">
                <p className="text-xs text-slate-600 max-w-2xl bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Setiap pembayaran otomatis menambah Saldo Kas Paguyuban, menerbitkan Kwitansi digital bernomor resmi, serta dapat langsung dikirimkan ke WhatsApp dan Email warga via <strong className="text-slate-800 font-mono">grises.jogja@gmail.com</strong>.
                </p>
              </DetailToggle>
            </div>

            <div className="flex items-center gap-2">
              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => {
                    confirmAction({
                      title: 'Reset Seluruh Data Pembayaran Kas',
                      message: 'PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh data riwayat pembayaran kas & kwitansi ke kondisi awal? Tindakan ini tidak dapat dibatalkan.',
                      confirmLabel: 'Setuju',
                      cancelLabel: 'Batal',
                      variant: 'danger',
                      onConfirm: async () => {
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
                    });
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
                        desc: 'Kas operasional paguyuban (Jatuh tempo tgl 28)'
                      },
                      {
                        type: 'iuran_sampah' as PaymentReceiptType,
                        label: 'Iuran Sampah Saja',
                        nominal: 'Rp 25.000 / bln',
                        desc: 'Retribusi sampah lingkungan (Jatuh tempo tgl 28)'
                      },
                      {
                        type: 'iuran_bulanan_sampah' as PaymentReceiptType,
                        label: 'Iuran Bulanan + Sampah',
                        nominal: 'Rp 50.000 / bln',
                        desc: 'Iuran kas + retribusi sampah (Jatuh tempo tgl 28)'
                      },
                      {
                        type: 'sewa_fasum' as PaymentReceiptType,
                        label: 'Sewa Fasum / Lahan Parkir',
                        nominal: 'Sesuai tarif sewa',
                        desc: 'Carport fasum timur Blok C, Balai, Sound (Jatuh tempo tgl 28)'
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

                {/* 3. Tanggal, Nominal & Periode Transaksi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Tanggal Transaksi
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      4. Jumlah Pembayaran (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      5. Bulan / Periode
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

                {/* 6. Metode Pembayaran (NO QRIS, ONLY BRI OR TUNAI) */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6. Metode Pembayaran
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

                {/* 7. Catatan Tambahan */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    7. Catatan Tambahan (Opsional)
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
              <DetailToggle variant="light" label="Detail Riwayat">
                <p className="text-xs text-slate-600 max-w-2xl bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {isBendaharaOrAdmin
                    ? 'Superadmin dan Bendahara dapat melihat, mengedit nominal/catatan, menghapus transaksi, serta mengirimkan Kwitansi via WhatsApp & Email grises.jogja@gmail.com.'
                    : 'Warga memiliki hak akses untuk memeriksa seluruh riwayat pembayaran yang sah (view-only) dan mencetak bukti kwitansi digital.'}
                </p>
              </DetailToggle>
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
                <option value="iuran_sampah">Iuran Sampah (Rp 25.000)</option>
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
                          <span className="text-slate-600 text-[11px] block">{getResidentNameByHouse(rc.residentHouse, rc.residentName)}</span>
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

                            {/* Edit: Bendahara & Superadmin */}
                            {isBendaharaOrAdmin && (
                              <button
                                type="button"
                                onClick={() => setEditingReceipt(rc)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit Transaksi Pembayaran (Bendahara / Superadmin)"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}

                            {/* Delete: Strictly ONLY Superadmin */}
                            {isSuperadmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  confirmAction({
                                    title: 'Hapus Kwitansi Pembayaran',
                                    message: `Apakah Anda yakin ingin menghapus permanen kwitansi #${rc.receiptNumber} (${rc.residentName})? Saldo kas paguyuban otomatis akan disesuaikan.`,
                                    confirmLabel: 'Setuju',
                                    cancelLabel: 'Batal',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      deletePaymentReceipt(rc.id);
                                    }
                                  });
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Pembayaran (Khusus Superadmin)"
                              >
                                <Trash2 size={13} />
                              </button>
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

          {/* ============================================================== */}
          {/* INDIKATOR VISUAL & NOTIFIKASI PUSH: JATUH TEMPO PEMBAYARAN      */}
          {/* ============================================================== */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : isPastDue
              ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-400/30'
              : 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20'
          }`}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : isPastDue
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0 ? (
                  <CheckCircle2 size={24} />
                ) : isPastDue ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Clock size={24} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : isPastDue
                      ? 'bg-rose-200 text-rose-900 font-extrabold'
                      : isDueToday
                      ? 'bg-amber-300 text-amber-950 font-black'
                      : 'bg-amber-200 text-amber-900 font-extrabold'
                  }`}>
                    {userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0
                      ? 'Kewajiban Lunas (Iuran & Sampah)'
                      : isPastDue
                      ? `Melewati Jatuh Tempo (Tanggal 28 ${currentMonthName})`
                      : isDueToday
                      ? `Hari Ini Jatuh Tempo (28 ${currentMonthName})`
                      : `Jatuh Tempo: 28 ${currentMonthName}`}
                  </span>

                  <span className="text-[10px] text-slate-500 font-medium">
                    Jatuh tempo setiap tgl 28 (Iuran Bulanan, Sewa Lahan Parkir, Sampah)
                  </span>
                </div>

                <div className="text-sm font-black text-slate-900 mt-1">
                  {userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0 ? (
                    'Terima kasih! Seluruh iuran bulanan, sewa lahan parkir, dan iuran sampah bulan ini sudah lunas.'
                  ) : isPastDue ? (
                    `Perhatian: Pembayaran iuran bulanan, sewa lahan parkir, atau iuran sampah telah melewati tanggal jatuh tempo (28 ${currentMonthName})!`
                  ) : isDueToday ? (
                    `Hari ini tanggal jatuh tempo pembayaran iuran bulanan, sewa lahan parkir, dan iuran sampah bulan ${currentMonthName} (Tanggal 28)!`
                  ) : (
                    `Sisa ${daysUntilDue} hari lagi menuju tanggal jatuh tempo pembayaran (28 ${currentMonthName}).`
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-0.5">
                  {userTotalIuranSampahDeficit === 0 && userCurrentMonthJimpitanDeficit === 0
                    ? 'Partisipasi Anda sangat berarti demi kelancaran operasional, kebersihan, dan keamanan lingkungan GSS 1.'
                    : 'Batas akhir pembayaran iuran bulanan (Rp 25.000), iuran sampah, dan sewa lahan parkir adalah tanggal 28 setiap bulannya melalui Loket Kas atau transfer Bank BRI.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleTogglePushReminder}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  pushReminderEnabled
                    ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Aktifkan notifikasi pengingat jatuh tempo di perangkat ini"
              >
                <BellRing size={13} className={pushReminderEnabled ? 'text-blue-600' : 'text-slate-400'} />
                <span>{pushReminderEnabled ? 'Pengingat Aktif' : 'Aktifkan Pengingat'}</span>
              </button>

              {(userTotalIuranSampahDeficit > 0 || userCurrentMonthJimpitanDeficit > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setDashboardTab('loket');
                    setSelectedResidentId(currentUser.id);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm"
                >
                  <Wallet size={13} />
                  <span>Bayar Sekarang</span>
                </button>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* INFORMASI KEKURANGAN JIMPITAN & IURAN + SAMPAH WARGA           */}
          {/* ============================================================== */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Kewajiban Pembayaran Warga
                  </span>
                  <h3 className="text-base font-black text-white">
                    Status Tagihan Rumah {currentUser.houseNumber} ({getResidentNameByHouse(currentUser.houseNumber, currentUser.name)})
                  </h3>
                </div>
              </div>

              {/* Badges for Pengurus */}
              {isBendaharaOrAdmin && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                    Akses Pengurus: Rekap Paguyuban Tersedia
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Kekurangan Jimpitan s/d Akhir Bulan Sebelumnya */}
              <div className="bg-slate-800/90 rounded-2xl p-4.5 border border-slate-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Coins size={14} className="text-amber-400" />
                      <span>Kekurangan Jimpitan s/d Akhir Bulan Sebelumnya</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      userPrevMonthJimpitanDeficit === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {userPrevMonthJimpitanDeficit === 0 ? 'LUNAS (RP 0)' : 'KURANG RP ' + userPrevMonthJimpitanDeficit.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black ${
                      userPrevMonthJimpitanDeficit === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      Rp {userPrevMonthJimpitanDeficit.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">s/d akhir bulan {prevMonthName}</span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Jimpitan Bulan Ini ({currentMonthName}):</span>
                      <span className="font-semibold text-white">Rp 15.000 (Rp 500/hari)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tercatat Jimpitan Bulan Berjalan:</span>
                      <span className="font-semibold text-emerald-400">Rp {userJimpitanPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kekurangan Jimpitan Bulan Berjalan:</span>
                      <span className="font-semibold text-amber-300">Rp {userCurrentMonthJimpitanDeficit.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-rose-300 pt-1 border-t border-slate-800">
                      <span>Kekurangan s/d Akhir Bulan Sebelumnya ({prevMonthName}):</span>
                      <span className="font-bold">Rp {userPrevMonthJimpitanDeficit.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                      <span className="text-slate-400">Total Akumulasi Seluruhnya:</span>
                      <span className="font-black text-amber-400">Rp {userTotalJimpitanDeficit.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Kelipatan Rp 500 / Rumah</span>
                  <button
                    onClick={() => setActiveView('jimpitan')}
                    className="text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition flex items-center gap-1"
                  >
                    <span>Cek Rincian Jimpitan</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Card 2: Total Kekurangan Iuran Bulanan + Sampah */}
              <div className="bg-slate-800/90 rounded-2xl p-4.5 border border-slate-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Wallet size={14} className="text-blue-400" />
                      <span>Total Kekurangan Iuran + Sampah</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      userTotalIuranSampahDeficit === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {userTotalIuranSampahDeficit === 0 ? 'LUNAS BULAN INI' : `${userUnpaidMonthsCount} BULAN TERTUNGGAK`}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-black ${
                      userTotalIuranSampahDeficit === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      Rp {userTotalIuranSampahDeficit.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">total kewajiban</span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paket Iuran Bulanan:</span>
                      <span className="font-semibold text-white">Rp 50.000 / Bulan</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pl-2">
                      <span>• Iuran Rutin Paguyuban:</span>
                      <span className="text-slate-300">Rp 25.000</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pl-2">
                      <span>• Retribusi Kebersihan Sampah:</span>
                      <span className="text-slate-300">Rp 25.000</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Status Periode:</span>
                      <span className="font-bold text-amber-300">
                        {userUnpaidMonthsCount === 0
                          ? 'Semua Lunas'
                          : userUnpaidMonthNames.length > 0
                          ? userUnpaidMonthNames.join(', ')
                          : `${userUnpaidMonthsCount} Bulan Belum Lunas`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    Rek. BRI <span className="font-mono text-white font-bold">1558-01-007310-50-3</span>
                  </div>
                  <button
                    onClick={() => {
                      setDashboardTab('loket');
                      setSelectedResidentId(currentUser.id);
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-1"
                  >
                    <span>Bayar di Loket</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Total Paguyuban Summary for Pengurus */}
            {isBendaharaOrAdmin && (
              <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield size={14} className="text-amber-400" />
                  <span className="font-bold text-slate-300">Rekap Kekurangan Seluruh Paguyuban (Semua Rumah):</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  <span className="text-amber-400">
                    Tunggakan Jimpitan: <span className="text-white">Rp {totalPaguyubanJimpitanDeficit.toLocaleString('id-ID')}</span>
                  </span>
                  <span className="text-rose-400">
                    Tunggakan Iuran + Sampah: <span className="text-white">Rp {totalPaguyubanIuranSampahDeficit.toLocaleString('id-ID')}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

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
              <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <TrendingUp size={12} />
                  Masuk: Rp {totalIncome.toLocaleString('id-ID')}
                </span>
                {totalExpense > 0 && (
                  <span className="text-rose-600">
                    &bull; Keluar: Rp {totalExpense.toLocaleString('id-ID')}
                  </span>
                )}
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
                Iuran, Sampah, Jimpitan, Fasum, Sumbangan & Saldo Awal
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
                {userCurrentMonthJimpitanDeficit === 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> LUNAS BULAN INI
                  </span>
                ) : (
                  <span className="text-amber-600">Kurang Rp {userCurrentMonthJimpitanDeficit.toLocaleString('id-ID')}</span>
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

          {/* ============================================================== */}
          {/* PANEL RINGKASAN SUPERADMIN: PROGRES BERKAS KEPENDUDUKAN WARGA  */}
          {/* ============================================================== */}
          {(currentUser.role === 'superadmin' || currentUser.role === 'sekretaris') && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Akses Khusus Superadmin & Sekretaris
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      Progres Pengumpulan Berkas Kependudukan (KTP & KK Warga)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pantau kelengkapan berkas warga, beri checklist verifikasi, atau kirim pengingat WhatsApp langsung.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveView('warga')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <span>Buka Data Warga Lengkap</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Kepala Keluarga</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{berkasSummary.total} Rumah</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Blok A, B, dan C</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Sudah Menyerahkan Berkas</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {berkasSummary.sudah} <span className="text-xs font-semibold text-emerald-600">KK ({berkasSummary.percent}%)</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 mt-0.5 block font-medium">Lengkap Fotocopy KTP/KK</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Belum Menyerahkan Berkas</span>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    {berkasSummary.belum} <span className="text-xs font-semibold text-rose-600">KK ({100 - berkasSummary.percent}%)</span>
                  </div>
                  <span className="text-[11px] text-rose-800 mt-0.5 block font-medium">Membutuhkan Tindak Lanjut</span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
                  <span>Persentase Kelengkapan Berkas Paguyuban:</span>
                  <span className="text-indigo-600">{berkasSummary.percent}% Terkumpul ({berkasSummary.sudah}/{berkasSummary.total})</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${berkasSummary.percent}%` }}
                  />
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setBerkasStatusFilter('BELUM')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      berkasStatusFilter === 'BELUM'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Belum Menyerahkan ({berkasSummary.belum})
                  </button>

                  <button
                    onClick={() => setBerkasStatusFilter('SUDAH')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      berkasStatusFilter === 'SUDAH'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sudah Menyerahkan ({berkasSummary.sudah})
                  </button>

                  <button
                    onClick={() => setBerkasStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      berkasStatusFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({berkasSummary.total})
                  </button>

                  <select
                    value={berkasBlockFilter}
                    onChange={(e) => setBerkasBlockFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">Semua Blok</option>
                    <option value="A">Blok A</option>
                    <option value="B">Blok B</option>
                    <option value="C">Blok C</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={berkasSearch}
                    onChange={(e) => setBerkasSearch(e.target.value)}
                    placeholder="Cari nama atau nomor rumah..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Table / List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 text-center">No</th>
                      <th className="py-2.5 px-3">Rumah</th>
                      <th className="py-2.5 px-3">Nama Warga</th>
                      <th className="py-2.5 px-3">Status Rumah</th>
                      <th className="py-2.5 px-3 text-center">Status Berkas</th>
                      <th className="py-2.5 px-3 text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBerkasResidents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Tidak ada data warga yang sesuai dengan filter berkas ini.
                        </td>
                      </tr>
                    ) : (
                      filteredBerkasResidents.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {r.houseNumber}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {r.statusRumah}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleBerkasStatus(r.id, r.berkasKependudukan)}
                              disabled={isUpdatingBerkasId === r.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                                r.berkasKependudukan
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                              }`}
                              title="Klik untuk mengubah status berkas (Superadmin & Sekretaris)"
                            >
                              {r.berkasKependudukan ? (
                                <>
                                  <CheckSquare size={13} className="text-emerald-700" />
                                  <span>Sudah Diserahkan</span>
                                </>
                              ) : (
                                <>
                                  <Square size={13} className="text-rose-600" />
                                  <span>Belum Menyerahkan</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {!r.berkasKependudukan && (
                                <button
                                  type="button"
                                  onClick={() => handleSendBerkasReminderWA(r)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition"
                                  title="Kirim pengingat WhatsApp untuk serahkan berkas"
                                >
                                  <Send size={11} />
                                  <span>Ingatkan WA</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleBerkasStatus(r.id, r.berkasKependudukan)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition"
                              >
                                {r.berkasKependudukan ? 'Batal Centang' : 'Tandai Diserahkan'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                      {getResidentNameByHouse(activeReceiptModal.residentHouse, activeReceiptModal.residentName)} (Rumah {activeReceiptModal.residentHouse})
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
                    <span className="text-slate-500">Tanggal Transaksi:</span>
                    <span className="font-bold text-slate-900">
                      {activeReceiptModal.date
                        ? new Date(`${activeReceiptModal.date}T12:00:00`).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : new Date(activeReceiptModal.createdAt).toLocaleDateString('id-ID')}
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
                <div>
                  <h3 className="text-sm font-bold">Edit Pembayaran #{editingReceipt.receiptNumber}</h3>
                  <p className="text-[11px] text-slate-400">Hak Akses: Bendahara 1, Bendahara 2, & Superadmin</p>
                </div>
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
              onSubmit={(e) => {
                e.preventDefault();
                confirmAction({
                  title: 'Konfirmasi Perubahan Kwitansi',
                  message: `Simpan perubahan data kwitansi #${editingReceipt.receiptNumber} (${editingReceipt.residentName})? Saldo dan transaksi kas terkait otomatis akan disesuaikan.`,
                  confirmLabel: 'Setuju',
                  cancelLabel: 'Batal',
                  variant: 'primary',
                  onConfirm: async () => {
                    await updatePaymentReceipt(editingReceipt);
                    setEditingReceipt(null);
                  }
                });
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
                <select
                  value={editingReceipt.paymentType}
                  onChange={(e) => {
                    const newType = e.target.value as PaymentReceiptType;
                    const typeLabels: Record<PaymentReceiptType, string> = {
                      iuran_bulanan: 'Iuran Bulanan Rutin (Rp 25.000)',
                      iuran_sampah: 'Iuran Sampah (Rp 25.000)',
                      iuran_bulanan_sampah: 'Iuran Bulanan + Sampah (Rp 50.000)',
                      sewa_fasum: 'Sewa Fasum Paguyuban GSS',
                      sumbangan_sukarela: 'Sumbangan Sukarela Warga',
                      pemasukan_lain: 'Pemasukan Kas Lain-lain'
                    };
                    let newAmount = editingReceipt.amount;
                    if (newType === 'iuran_bulanan') newAmount = 25000;
                    else if (newType === 'iuran_sampah') newAmount = 25000;
                    else if (newType === 'iuran_bulanan_sampah') newAmount = 50000;
                    else if (newType === 'sewa_fasum' && newAmount === 25000) newAmount = 30000;
                    setEditingReceipt({
                      ...editingReceipt,
                      paymentType: newType,
                      paymentTypeName: typeLabels[newType],
                      amount: newAmount
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="iuran_bulanan">Iuran Bulanan Rutin (Rp 25.000)</option>
                  <option value="iuran_sampah">Iuran Sampah (Rp 25.000)</option>
                  <option value="iuran_bulanan_sampah">Iuran Bulanan + Sampah (Rp 50.000)</option>
                  <option value="sewa_fasum">Sewa Fasum Paguyuban GSS</option>
                  <option value="sumbangan_sukarela">Sumbangan Sukarela Warga</option>
                  <option value="pemasukan_lain">Pemasukan Kas Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={editingReceipt.paymentMethod}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="transfer_bank">Transfer Bank BRI (Rek. 155801007310503 a/n Benisius Rahmat Basuki)</option>
                  <option value="tunai">Tunai ke Bendahara Paguyuban</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={editingReceipt.amount}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bulan / Periode</label>
                <input
                  type="text"
                  value={editingReceipt.periodMonth || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, periodMonth: e.target.value })}
                  placeholder="Contoh: November 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingReceipt.notes || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, notes: e.target.value })}
                  placeholder="Keterangan tambahan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                {isSuperadmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      confirmAction({
                        title: 'Hapus Kwitansi Pembayaran',
                        message: `Hapus permanen kwitansi #${editingReceipt.receiptNumber} (${editingReceipt.residentName})? Saldo kas paguyuban otomatis akan disesuaikan. (Khusus Superadmin)`,
                        confirmLabel: 'Setuju',
                        cancelLabel: 'Batal',
                        variant: 'danger',
                        onConfirm: async () => {
                          await deletePaymentReceipt(editingReceipt.id);
                          setEditingReceipt(null);
                        }
                      });
                    }}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1.5 transition text-xs"
                    title="Hapus Pembayaran Ini (Hanya Superadmin)"
                  >
                    <Trash2 size={14} />
                    <span>Hapus (Superadmin)</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">
                    Hapus data hanya dapat dilakukan oleh Superadmin
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingReceipt(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
