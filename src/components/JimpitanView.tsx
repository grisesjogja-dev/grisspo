import React, { useState, useMemo } from 'react';
import { useApp, findResidentByMemberName, normalizeCleanName } from '../context/AppContext';
import { DayOfWeek, JimpitDailyReport, Resident } from '../types';
import {
  exportJimpitanReportToExcel,
  exportDailyJimpitanToPDF,
  exportMonthlyJimpitanToPDF
} from '../utils/exportUtils';
import confetti from 'canvas-confetti';
import {
  Coins,
  Calendar,
  CheckSquare,
  Square,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Award,
  Trash2,
  Printer,
  ChevronRight,
  FileText,
  Building2,
  Check,
  X,
  CalendarDays,
  CreditCard,
  QrCode,
  Receipt,
  ArrowRight,
  Wallet,
  Lock,
  LogIn,
  AlertTriangle,
  Key,
  Edit2
} from 'lucide-react';
import { DetailToggle } from './DetailToggle';

export const isStatusEligibleForJimpitan = (status?: string): boolean => {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return (
    s === 'DI HUNI PEMILIK' ||
    s === 'DI HUNI KONTRAK' ||
    s === 'KOSONG (DIJIMPIT)' ||
    s === 'KOSONG (DI JIMPIT)'
  );
};

interface JimpitanViewProps {
  onOpenLogin?: () => void;
}

export const JimpitanView: React.FC<JimpitanViewProps> = ({ onOpenLogin }) => {
  const {
    residents,
    rondaSchedule,
    jimpitReports,
    submitDailyJimpit,
    updateJimpitReport,
    deleteJimpitReport,
    payJimpitanDeficit,
    currentUser,
    attendanceSessions,
    submitAttendanceSession,
    updateAttendanceSession,
    deleteAttendanceSession,
    resetFeatureData,
    loginWithHouseNumber,
    getResidentNameByHouse,
    confirmAction
  } = useApp();

  const isSuperadmin = currentUser?.role === 'superadmin';

  // Inline login state for landing page
  const [inlineHouse, setInlineHouse] = useState('');
  const [inlinePass, setInlinePass] = useState('');
  const [inlineLoginError, setInlineLoginError] = useState('');

  const handleInlineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineLoginError('');
    const res = loginWithHouseNumber(inlineHouse, inlinePass);
    if (!res.success) {
      setInlineLoginError(res.message);
    }
  };

  // Active sub-tab: 'input' | 'laporan_harian' | 'laporan_bulanan' | 'riwayat'
  const [tab, setTab] = useState<'input' | 'laporan_harian' | 'laporan_bulanan' | 'riwayat'>('input');

  // Today string (local timezone YYYY-MM-DD so WIB 00:00-06:59 does not shift to yesterday)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getDayName = (dateStr: string): DayOfWeek => {
    const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(`${dateStr}T12:00:00`);
    return days[d.getDay()] || 'Senin';
  };

  // --- STATE FOR TAB 1: INPUT JIMPITAN ---
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayName(todayStr));
  const [collectorName, setCollectorName] = useState<string>(
    currentUser?.name ? `${currentUser.name} (${currentUser.houseNumber})` : 'Petugas Ronda'
  );
  const [notes, setNotes] = useState<string>('Portal ditutup dan dikunci pukul 21.00 WIB. Pendopo disapu bersih.');

  // Block filter for resident checklist in input
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected residents for today's jimpit with their individual nominal
  // Aturan: Rumah dengan status "DI HUNI PEMILIK", "DI HUNI KONTRAK", dan "KOSONG (DIJIMPIT)" muncul dalam kartu jimpit online
  const [selectedMap, setSelectedMap] = useState<Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }>>(() => {
    const init: Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }> = {};
    residents.forEach((r) => {
      const isEligible = isStatusEligibleForJimpitan(r.statusRumah);
      if (isEligible) {
        init[r.houseNumber] = {
          selected: true,
          nominal: 500,
          method: 'cash'
        };
      }
    });
    return init;
  });

  // Sinkronisasi otomatis secara realtime: ketika status rumah diubah ke "DI HUNI PEMILIK", "DI HUNI KONTRAK", atau "KOSONG (DIJIMPIT)", otomatis muncul di kartu jimpit online
  React.useEffect(() => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      let changed = false;
      residents.forEach((r) => {
        const isEligible = isStatusEligibleForJimpitan(r.statusRumah);
        if (isEligible) {
          if (!next[r.houseNumber]) {
            next[r.houseNumber] = {
              selected: true,
              nominal: 500,
              method: 'cash'
            };
            changed = true;
          }
        } else {
          if (next[r.houseNumber]) {
            delete next[r.houseNumber];
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [residents]);

  // Modal for submitted report
  const [submittedReport, setSubmittedReport] = useState<JimpitDailyReport | null>(null);
  // Modal for Superadmin edit daily report
  const [editingDailyReport, setEditingDailyReport] = useState<JimpitDailyReport | null>(null);

  // Synchronize selected day when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedDay(getDayName(newDate));
  };

  // Find ronda members on duty for selected day
  const dutyGroup = rondaSchedule.find((g) => g.day === selectedDay);

  // --- STATE & OTORISASI ABSENSI PETUGAS RONDA HARI INI ---
  // Khusus hanya petugas ronda di hari tersebut dan admin yang bisa melakukan absensi ronda
  const isAdminRole = useMemo(() => {
    if (!currentUser) return false;
    return ['superadmin', 'sekretaris', 'bendahara1', 'bendahara2', 'admin_inventaris'].includes(currentUser.role);
  }, [currentUser]);

  const isDutyOfficerToday = useMemo(() => {
    if (!currentUser || !dutyGroup) return false;
    const currentHouseClean = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
    const currentNameClean = normalizeCleanName(currentUser.name || '');

    return dutyGroup.members.some((memberName) => {
      const memClean = normalizeCleanName(memberName);
      // 1. Direct name match
      if (currentNameClean && (memClean.includes(currentNameClean) || currentNameClean.includes(memClean))) {
        return true;
      }
      // 2. Check resident record matching memberName (with nickname alias support)
      const res = findResidentByMemberName(memberName, residents);
      if (res && res.houseNumber.replace(/\s+/g, '').toUpperCase() === currentHouseClean) {
        return true;
      }
      return false;
    });
  }, [currentUser, dutyGroup, residents]);

  const canDoRondaAttendance = isAdminRole || isDutyOfficerToday;
  // Tombol kirim jimpit hanya bisa aktif di akun petugas ronda hari tersebut dan super admin
  const canSubmitJimpit = isSuperadmin || isDutyOfficerToday;

  const [rondaAttendanceMap, setRondaAttendanceMap] = useState<Record<string, boolean>>({});
  const [isSavingRondaAttendance, setIsSavingRondaAttendance] = useState(false);
  const [rondaAttendanceSavedMsg, setRondaAttendanceSavedMsg] = useState<string | null>(null);

  const todayRondaSession = useMemo(() => {
    return attendanceSessions.find((s) => s.type === 'ronda' && s.date === selectedDate);
  }, [attendanceSessions, selectedDate]);

  // Sinkronkan checklist absensi ronda dengan data sesi tersimpan di Firestore/AppContext secara real-time
  React.useEffect(() => {
    if (!dutyGroup) return;
    const nextMap: Record<string, boolean> = {};
    dutyGroup.members.forEach((m) => {
      if (todayRondaSession && todayRondaSession.attendees.length > 0) {
        const res = findResidentByMemberName(m, residents);
        const mClean = normalizeCleanName(m);
        const savedAtt = todayRondaSession.attendees.find((a) => {
          if (res && (a.residentId === res.id || a.residentHouse.replace(/\s+/g, '').toUpperCase() === res.houseNumber.replace(/\s+/g, '').toUpperCase())) {
            return true;
          }
          const attClean = normalizeCleanName(a.residentName);
          return attClean === mClean || attClean.includes(mClean) || mClean.includes(attClean);
        });
        nextMap[m] = savedAtt ? savedAtt.isPresent : true;
      } else {
        nextMap[m] = true;
      }
    });
    setRondaAttendanceMap(nextMap);
  }, [dutyGroup?.day, selectedDate, todayRondaSession, residents]);

  const handleSaveRondaAttendance = async () => {
    if (!dutyGroup) return;
    if (!canDoRondaAttendance) {
      alert(
        `Akses Dibatasi: Khusus hanya petugas ronda hari ${selectedDay} (${dutyGroup.members.join(
          ', '
        )}) dan Pengurus/Admin yang memiliki wewenang mencatat dan memperbarui absensi ronda.`
      );
      return;
    }

    const attendees = dutyGroup.members.map((memberName) => {
      const res = findResidentByMemberName(memberName, residents);
      return {
        residentId: res ? res.id : `ronda-${memberName}`,
        residentName: res ? res.name : memberName,
        residentHouse: res ? res.houseNumber : 'Petugas Ronda',
        isPresent: rondaAttendanceMap[memberName] ?? true,
        checkedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
    });

    const presentCount = attendees.filter((a) => a.isPresent).length;
    const isUpdating = Boolean(todayRondaSession);

    confirmAction({
      title: isUpdating ? 'Perbarui Absensi Petugas Ronda' : 'Kirim Absensi Petugas Ronda',
      message: isUpdating
        ? `Perbarui data absensi ronda ${selectedDay} (${selectedDate}) menjadi ${presentCount} petugas hadir? Poin petugas akan otomatis disesuaikan secara real-time.`
        : `Simpan absensi kehadiran ${presentCount} petugas untuk jadwal ronda ${selectedDay} (${selectedDate})? Petugas hadir akan memperoleh masing-masing +25 GRISS-POIN.`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: async () => {
        setIsSavingRondaAttendance(true);
        try {
          if (todayRondaSession) {
            await updateAttendanceSession({
              ...todayRondaSession,
              day: selectedDay,
              attendees,
              recordedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : todayRondaSession.recordedBy
            });
          } else {
            await submitAttendanceSession({
              type: 'ronda',
              title: `Absensi Petugas Ronda Hari ${selectedDay} (${selectedDate})`,
              date: selectedDate,
              day: selectedDay,
              attendees,
              recordedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Petugas Ronda',
              userRole: currentUser?.role || 'warga',
              pointsAwarded: true
            });
          }

          try {
            confetti({ particleCount: 60, spread: 60 });
          } catch {}

          setRondaAttendanceSavedMsg(
            isUpdating
              ? `Absensi ronda berhasil diperbarui! (${presentCount} dari ${dutyGroup.members.length} petugas hadir).`
              : `Absensi ronda berhasil disimpan! ${presentCount} petugas hadir dan memperoleh masing-masing +25 GRISS-POIN.`
          );
          setTimeout(() => setRondaAttendanceSavedMsg(null), 6000);
        } catch (err: any) {
          alert('Gagal menyimpan absensi ronda: ' + err.message);
        } finally {
          setIsSavingRondaAttendance(false);
        }
      }
    });
  };

  // Quick preset nominal options (multiples of 500)
  const quickNominals = [500, 1000, 1500, 2000, 2500, 5000];

  // Batch set nominal for all checked
  const handleBatchSetNominal = (val: number) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key]?.selected) {
          next[key].nominal = val;
        }
      });
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredResidents.forEach((r) => {
        if (next[r.houseNumber]) {
          next[r.houseNumber].selected = select;
        }
      });
      return next;
    });
  };

  // Filter residents for Input Tab: Rumah dengan status "DI HUNI PEMILIK", "DI HUNI KONTRAK", dan "KOSONG (DIJIMPIT)" muncul dalam kartu
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const isEligible = isStatusEligibleForJimpitan(r.statusRumah);
      if (!isEligible) return false;
      const matchBlock = blockFilter === 'ALL' || r.block === blockFilter;
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.houseNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBlock && matchSearch;
    });
  }, [residents, blockFilter, searchQuery]);

  // Calculations for current input
  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedMap).filter((item) => item.selected).length;
  }, [selectedMap]);

  const currentTotalRevenue = useMemo(() => {
    return Object.entries(selectedMap).reduce((acc, [, val]) => {
      if (val.selected) {
        return acc + (Number(val.nominal) || 0);
      }
      return acc;
    }, 0);
  }, [selectedMap]);

  // Check if daily jimpitan for selectedDate has already been processed (enforcing 1x per day rule for ronda collection)
  const isAlreadySubmittedToday = useMemo(() => {
    return jimpitReports.some(
      (r) => r.date === selectedDate && r.reportType !== 'pelunasan' && !r.id.startsWith('jimpit-pay-')
    );
  }, [jimpitReports, selectedDate]);

  // Form submit handler
  const handleSubmitJimpit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Akses Ditolak: Input jimpitan hanya bisa dilakukan ketika warga sudah login!');
      return;
    }

    // Tombol kirim jimpit hanya bisa aktif di akun petugas ronda hari tersebut dan super admin
    if (!canSubmitJimpit) {
      alert('Akses Dibatasi: Tombol kirim jimpit hanya aktif di akun petugas ronda hari tersebut dan Superadmin.');
      return;
    }

    if (isAlreadySubmittedToday) {
      alert('jimpitan hari ini sudah di input');
      return;
    }

    if (totalSelectedCount === 0) {
      alert('Pilih minimal satu warga yang diambil jimpitannya!');
      return;
    }

    const invalidEntry = wajibJimpitResidents.find((r) => {
      const data = selectedMap[r.houseNumber];
      return data && data.selected && (Number(data.nominal) || 0) < 500;
    });
    if (invalidEntry) {
      alert(`Nominal jimpitan minimal Rp 500 untuk setiap rumah yang dipilih (${invalidEntry.houseNumber} kurang dari Rp 500)!`);
      return;
    }

    confirmAction({
      title: 'Konfirmasi Pengiriman Jimpit',
      message: `Kirim pencatatan uang jimpitan tanggal ${selectedDate} (${selectedDay}) sebesar Rp ${currentTotalRevenue.toLocaleString('id-ID')} (${totalSelectedCount} rumah)? Dana otomatis masuk langsung ke total pemasukan dan saldo kas paguyuban.`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: () => {
        const entries: JimpitDailyReport['entries'] = [];
        residents.forEach((r) => {
          const data = selectedMap[r.houseNumber];
          if (data && data.selected && data.nominal > 0) {
            entries.push({
              houseNumber: r.houseNumber,
              residentName: r.name,
              nominal: data.nominal,
              paymentMethod: data.method,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
              collectedBy: collectorName
            });
          }
        });

        const reportData = {
          date: selectedDate,
          day: selectedDay,
          collectedBy: collectorName,
          entries,
          totalNominal: currentTotalRevenue,
          notes
        };

        submitDailyJimpit(reportData);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }

        const simulatedSavedReport: JimpitDailyReport = {
          ...reportData,
          id: `rep-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        setSubmittedReport(simulatedSavedReport);
      }
    });
  };

  // --- STATE FOR TAB 2: LAPORAN HARIAN ---
  const [selectedDailyReportDate, setSelectedDailyReportDate] = useState<string>(() => {
    if (jimpitReports.length > 0) {
      return jimpitReports[0].date;
    }
    return todayStr;
  });

  const activeDailyReport = useMemo(() => {
    return jimpitReports.find((r) => r.date === selectedDailyReportDate) || null;
  }, [jimpitReports, selectedDailyReportDate]);

  // --- STATE FOR TAB 3: LAPORAN BULANAN ---
  // Rumah status "kosong (ada pemilik)" dan "belum ada pemilik" TIDAK dimasukkan dalam daftar wajib jimpitan
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober 2026');
  const [monthlyBlockFilter, setMonthlyBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState<'ALL' | 'LUNAS' | 'KURANG'>('ALL');
  const [monthlySearch, setMonthlySearch] = useState<string>('');

  const targetMonthly = 15000; // Rp 15.000 / KK / bulan

  // Daftar warga WAJIB jimpitan (mengecualikan rumah kosong ada pemilik & belum ada pemilik)
  const wajibJimpitResidents = useMemo(() => {
    return residents.filter((r) => isStatusEligibleForJimpitan(r.statusRumah));
  }, [residents]);

  const totalResidentsCount = wajibJimpitResidents.length;
  const lunasCount = wajibJimpitResidents.filter((r) => (r.jimpitanPaidMonth || 0) >= targetMonthly).length;
  const totalJimpitanBulanIni = wajibJimpitResidents.reduce((acc, r) => acc + (r.jimpitanPaidMonth || 0), 0);
  const totalTargetBulanan = totalResidentsCount * targetMonthly;
  const totalDefisitBulanIni = wajibJimpitResidents.reduce((acc, r) => {
    const paid = r.jimpitanPaidMonth || 0;
    return acc + Math.max(0, targetMonthly - paid);
  }, 0);
  const monthlyAchievementPercent = totalTargetBulanan > 0
    ? Math.min(100, Math.round((totalJimpitanBulanIni / totalTargetBulanan) * 100))
    : 0;

  // Filtered residents for Monthly Report (khusus rumah wajib jimpitan)
  const filteredMonthlyResidents = useMemo(() => {
    return wajibJimpitResidents.filter((r) => {
      const matchBlock = monthlyBlockFilter === 'ALL' || r.block === monthlyBlockFilter;
      const isLunas = (r.jimpitanPaidMonth || 0) >= targetMonthly;
      const matchStatus =
        monthlyStatusFilter === 'ALL' ||
        (monthlyStatusFilter === 'LUNAS' && isLunas) ||
        (monthlyStatusFilter === 'KURANG' && !isLunas);
      const matchSearch =
        r.name.toLowerCase().includes(monthlySearch.toLowerCase()) ||
        r.houseNumber.toLowerCase().includes(monthlySearch.toLowerCase());
      return matchBlock && matchStatus && matchSearch;
    });
  }, [wajibJimpitResidents, monthlyBlockFilter, monthlyStatusFilter, monthlySearch]);

  // --- STATE FOR BAYAR KEKURANGAN JIMPITAN MODAL ---
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedResidentForPay, setSelectedResidentForPay] = useState<Resident | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number | ''>(15000);
  const [payMethod, setPayMethod] = useState<'transfer' | 'cash'>('transfer');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paySuccessReceipt, setPaySuccessReceipt] = useState<{
    residentName: string;
    residentHouse: string;
    amount: number;
    method: string;
    date: string;
    trxId?: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalAkumulasiDefisit = useMemo(() => {
    return wajibJimpitResidents.reduce((acc, r) => {
      const curDef = Math.max(0, targetMonthly - (r.jimpitanPaidMonth || 0));
      const prevDef = r.previousMonthsJimpitanDeficit || 0;
      return acc + curDef + prevDef;
    }, 0);
  }, [wajibJimpitResidents]);

  const handleOpenPayModal = (resident?: Resident) => {
    const target = resident || (currentUser ? residents.find((r) => r.houseNumber === currentUser.houseNumber) : undefined) || residents[0];
    setSelectedResidentForPay(target);
    const curDef = Math.max(0, targetMonthly - (target.jimpitanPaidMonth || 0));
    const prevDef = target.previousMonthsJimpitanDeficit || 0;
    const totalDef = curDef + prevDef;
    setPayAmountInput(totalDef > 0 ? totalDef : 15000);
    setPayNotes(`Pelunasan kekurangan jimpitan ${selectedMonth}`);
    setPaySuccessReceipt(null);
    setIsPayModalOpen(true);
  };

  const handleSelectResidentForPay = (resId: string) => {
    const target = residents.find((r) => r.id === resId);
    if (!target) return;
    setSelectedResidentForPay(target);
    const curDef = Math.max(0, targetMonthly - (target.jimpitanPaidMonth || 0));
    const prevDef = target.previousMonthsJimpitanDeficit || 0;
    const totalDef = curDef + prevDef;
    setPayAmountInput(totalDef > 0 ? totalDef : 15000);
  };

  const handleExecutePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentForPay) return;
    const amt = Number(payAmountInput);
    if (!amt || amt < 500) {
      alert('Nominal pembayaran jimpitan minimal Rp 500!');
      return;
    }

    confirmAction({
      title: 'Konfirmasi Pembayaran Jimpitan',
      message: `Proses pelunasan defisit jimpitan sebesar Rp ${amt.toLocaleString('id-ID')} untuk ${selectedResidentForPay.name} (${selectedResidentForPay.houseNumber})? Dana langsung disetorkan ke saldo kas paguyuban.`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'primary',
      onConfirm: async () => {
        setIsProcessingPayment(true);
        try {
          const result = await payJimpitanDeficit(
            selectedResidentForPay.id,
            amt,
            payMethod,
            payNotes
          );

          if (result.success) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });

            setPaySuccessReceipt({
              residentName: selectedResidentForPay.name,
              residentHouse: selectedResidentForPay.houseNumber,
              amount: amt,
              method: payMethod.toUpperCase(),
              date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
              trxId: result.transactionId
            });
          } else {
            alert('Gagal: ' + result.message);
          }
        } catch (err: any) {
          alert('Terjadi kesalahan pembayaran: ' + err.message);
        } finally {
          setIsProcessingPayment(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Coins size={260} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
            <Sparkles size={14} className="text-amber-200" />
            <span>Kearifan Lokal Griya Sedayu Selaras 1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Jimpitan Ronda Online Perum GSS
          </h2>
          <p className="mt-2 text-amber-100 text-xs sm:text-sm leading-relaxed">
            Pencatatan jimpitan malam keliling real-time terhubung jadwal ronda. Standar jimpitan harian minimal Rp 500 (bebas nominal), target 1 bulan Rp 15.000 per warga wajib jimpit untuk kemaslahatan kas paguyuban.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-sm font-semibold flex items-center gap-1.5">
              <Clock size={13} />
              <span>Jam Ambil: 20.00 - 22.00 WIB</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>Portal Dikunci: 21.00 WIB</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-900/40 border border-amber-300/30 text-amber-200 font-bold flex items-center gap-1.5">
              <Award size={13} className="text-amber-300" />
              <span>Target: Rp 15.000 / Bulan / Warga</span>
            </span>
            {isSuperadmin && (
              <span className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-400/40 text-red-200 font-bold flex items-center gap-1.5">
                <Trash2 size={13} className="text-red-300" />
                <span>Hak Hapus Data: Aktif (Superadmin Bpk. Beni B24)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* INLINE LOGIN FORM CARD: Shown on landing page when user is NOT logged in */}
      {!currentUser && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Lock size={13} className="text-amber-400" />
                <span>Portal Jimpit Online & Absensi Terbuka untuk Umum</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Selamat Datang di Portal Warga Griya Sedayu Selaras 1
              </h3>
              <DetailToggle variant="dark" label="Panduan & Detail Portal">
                <div className="space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                    Anda dapat langsung menggunakan <strong>Input Jimpitan</strong> dan <strong>Absensi Petugas Ronda Hari Ini</strong> di bawah. Untuk membuka seluruh menu portal (Buku Kas Keuangan, Notulen Rapat, Data Warga, Inventaris, Booking Fasum, Forum, dan Poin Loyalitas), silakan login akun warga Anda:
                  </p>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-white">Panduan Login Warga:</p>
                    <p className="text-[11px] text-slate-300">
                      Masukkan nomor rumah (misal: <span className="font-mono text-amber-300 font-bold">GrissB24</span> atau <span className="font-mono text-amber-300 font-bold">B 24</span>) dan password akun pribadi Anda pada form di samping.
                    </p>
                  </div>
                </div>
              </DetailToggle>
            </div>

            {/* Inline Login Form */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Key size={14} />
                  <span>Form Login Warga GSS</span>
                </h4>
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="text-[11px] text-blue-300 hover:text-white underline font-medium"
                  >
                    Buka Popup Modal
                  </button>
                )}
              </div>

              {inlineLoginError && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-red-400 mt-0.5" />
                  <span>{inlineLoginError}</span>
                </div>
              )}

              <form onSubmit={handleInlineLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nomor Rumah / Username:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: GrissB24 atau B 24"
                    value={inlineHouse}
                    onChange={(e) => setInlineHouse(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-400 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Password Akun:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Password (default: Griss123)"
                    value={inlinePass}
                    onChange={(e) => setInlinePass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-400 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                >
                  <LogIn size={15} />
                  <span>Masuk ke Portal Lengkap</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('input')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            tab === 'input'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins size={16} />
          <span>Input Jimpitan Hari Ini</span>
        </button>

        <button
          onClick={() => setTab('laporan_harian')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            tab === 'laporan_harian'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays size={16} />
          <span>Laporan Jimpitan Harian</span>
        </button>

        <button
          onClick={() => setTab('laporan_bulanan')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            tab === 'laporan_bulanan'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={16} />
          <span>Laporan Jimpitan Bulanan (58 Warga)</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
            {58 - lunasCount} Kurang
          </span>
        </button>

        <button
          onClick={() => setTab('riwayat')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            tab === 'riwayat'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={16} />
          <span>Riwayat Semua Jimpitan ({jimpitReports.length})</span>
        </button>

        {isSuperadmin && (
          <button
            type="button"
            onClick={() => {
              confirmAction({
                title: 'Reset Laporan Jimpitan Ronda',
                message: 'PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh data Laporan Jimpitan Ronda? Tindakan ini akan menghapus semua catatan riwayat jimpitan permanen.',
                confirmLabel: 'Setuju',
                cancelLabel: 'Batal',
                variant: 'danger',
                onConfirm: async () => {
                  await resetFeatureData('jimpitan');
                  alert('Data Laporan Jimpitan berhasil direset oleh Superadmin.');
                }
              });
            }}
            className="ml-auto my-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5 whitespace-nowrap"
            title="Reset Data Jimpitan (Akses Khusus Superadmin)"
          >
            <Trash2 size={13} className="text-red-600" />
            <span>Reset Data Jimpitan</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INPUT JIMPITAN ONLINE                                              */}
      {/* ========================================================================= */}
      {tab === 'input' && !currentUser && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl text-center max-w-2xl mx-auto my-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
            <AlertTriangle size={13} />
            <span>Hak Akses Terkunci</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Input Jimpitan Hanya Bisa Dilakukan Setelah Login
          </h3>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Sesuai ketentuan Paguyuban Griya Sedayu Selaras 1, penginputan uang jimpitan ronda malam wajib dilakukan oleh warga atau petugas ronda resmi yang sudah terautentikasi (login dengan nomor rumah & password).
          </p>

          {/* Inline Login Form */}
          <form onSubmit={handleInlineLogin} className="mt-6 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-left max-w-md mx-auto space-y-4">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={13} />
              <span>Login Langsung untuk Input Jimpitan</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Nomor Rumah Warga
              </label>
              <select
                value={inlineHouse}
                onChange={(e) => setInlineHouse(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Pilih No. Rumah (Contoh: B 24) --</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.houseNumber}>
                    {r.houseNumber} - {r.name} ({r.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password Warga
              </label>
              <input
                type="password"
                required
                value={inlinePass}
                onChange={(e) => setInlinePass(e.target.value)}
                placeholder="Masukkan Password (default: Griss123)"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {inlineLoginError && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{inlineLoginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <LogIn size={15} />
              <span>Masuk & Buka Form Input Jimpitan</span>
            </button>
          </form>

          {onOpenLogin && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline transition"
              >
                Buka Modal Login Lengkap
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'input' && currentUser && (
        <form onSubmit={handleSubmitJimpit} className="space-y-6">
          {/* Notification if today is already submitted */}
          {isAlreadySubmittedToday && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3 text-amber-950 shadow-sm animate-in fade-in duration-150">
              <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-amber-950">
                  Pemberitahuan: Jimpitan hari ini sudah di input!
                </p>
                <p className="text-amber-800 leading-relaxed font-medium">
                  Laporan jimpitan untuk tanggal <strong>{selectedDate} ({selectedDay})</strong> telah selesai diproses dan tercatat di kas paguyuban. Dalam satu hari hanya bisa memproses <strong>1 kali proses input jimpitan</strong> untuk menghindari penginputan jimpitan double (yang sama).
                </p>
                <div className="pt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDailyReportDate(selectedDate);
                      setTab('laporan_harian');
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Lihat Laporan Jimpitan Tanggal Ini</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule & Collector Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-600" />
                <span>Pilih Tanggal Jimpit</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" />
                <span>Pilih Hari Jimpit</span>
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
                  <option key={d} value={d}>
                    Hari {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-amber-600" />
                <span>Petugas Ronda Hari Ini</span>
              </label>
              <select
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Pilih Petugas Ronda Hari Ini --</option>
                {dutyGroup && dutyGroup.members.length > 0 && (
                  <optgroup label={`Jadwal Resmi Ronda Hari ${selectedDay}`}>
                    {dutyGroup.members.map((m) => (
                      <option key={m} value={m}>
                        {m} (Jadwal {selectedDay})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Seluruh Warga (Pengganti / Anggota Ronda)">
                  {residents.map((r) => {
                    const residentLabel = `${getResidentNameByHouse(r.houseNumber, r.name)} (${r.houseNumber})`;
                    return (
                      <option key={r.id} value={residentLabel}>
                        {residentLabel}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>
          </div>

          {/* ABSENSI PETUGAS RONDA HARI INI (KHUSUS PETUGAS RONDA HARI TERSEBUT & ADMIN) */}
          {dutyGroup && (
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
                    {dutyGroup.day.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Absensi Petugas Ronda Hari {dutyGroup.day}
                      </h3>
                      {isAdminRole ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                          <ShieldCheck size={11} className="text-blue-600" />
                          <span>Akses Pengurus / Admin (Bisa Absen)</span>
                        </span>
                      ) : isDutyOfficerToday ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>Petugas Ronda Hari Ini (Bisa Absen)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                          <Lock size={11} className="text-rose-600" />
                          <span>Khusus Petugas Hari Ini &amp; Admin</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Checklist kehadiran petugas jaga ronda & jimpit hari {dutyGroup.day} ({selectedDate}). Hadir mendapatkan{' '}
                      <span className="font-black text-amber-700">+25 GRISS-POIN</span> per petugas.
                    </p>
                  </div>
                </div>

                {todayRondaSession ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Sudah Diabsen ({todayRondaSession.attendees.filter(a => a.isPresent).length} Hadir)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    <Clock size={14} className="text-amber-600" />
                    <span>Belum Diabsen Hari Ini</span>
                  </div>
                )}
              </div>

              {/* Informational banner when user is not authorized */}
              {!canDoRondaAttendance && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-start sm:items-center gap-2.5">
                  <Lock size={16} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <strong>Akses Khusus:</strong> Absensi ronda hanya dapat dicentang dan dikirimkan oleh{' '}
                    <strong>Petugas Ronda Hari {dutyGroup.day}</strong> ({dutyGroup.members.join(', ')}) atau{' '}
                    <strong>Pengurus/Admin Paguyuban</strong>. Anda dapat melihat jadwal dan status absensi ini.
                  </div>
                </div>
              )}

              {/* Duty Officers Checklist Grid (ONLY Duty Officers for this Day) */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Daftar Petugas Ronda Hari {dutyGroup.day} ({dutyGroup.members.length} Orang):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {dutyGroup.members.map((memberName) => {
                    const isChecked = rondaAttendanceMap[memberName] ?? true;
                    const res = findResidentByMemberName(memberName, residents);
                    const isCaptain = dutyGroup.captain === memberName;
                    const isEditable = canDoRondaAttendance;

                    return (
                      <div
                        key={memberName}
                        onClick={() => {
                          if (!canDoRondaAttendance) {
                            alert(
                              `Akses Dibatasi: Anda tidak bertugas pada jadwal ronda hari ${dutyGroup.day}. Khusus petugas jaga hari ini (${dutyGroup.members.join(
                                ', '
                              )}) dan Admin/Pengurus yang dapat mencentang absensi.`
                            );
                            return;
                          }
                          setRondaAttendanceMap((prev) => ({
                            ...prev,
                            [memberName]: !isChecked
                          }));
                        }}
                        className={`p-3 rounded-xl border-2 transition select-none flex flex-col justify-between ${
                          !isEditable ? 'cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isChecked
                            ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-mono font-bold">
                            {res?.houseNumber || 'GSS'}
                          </span>
                          {isCaptain && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-black">
                              KAPTEN
                            </span>
                          )}
                        </div>

                        <div className="font-extrabold text-xs sm:text-sm truncate">
                          {memberName}
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-200/50">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isChecked
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isChecked ? 'Hadir (+25 Poin)' : 'Tidak Hadir'}
                          </span>

                          {isChecked ? (
                            <CheckCircle2 size={18} className="text-amber-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attendance Saved Notification */}
              {rondaAttendanceSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{rondaAttendanceSavedMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-amber-600" />
                  <span>
                    Petugas hadir:{' '}
                    <strong className="text-slate-800">
                      {Object.values(rondaAttendanceMap).filter(Boolean).length} dari {dutyGroup.members.length} orang
                    </strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  {todayRondaSession && (
                    <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>Tercatat ({todayRondaSession.attendees.filter((a) => a.isPresent).length} Hadir) &bull; Klik kartu untuk update</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSavingRondaAttendance || !canDoRondaAttendance}
                    onClick={handleSaveRondaAttendance}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl shadow-md transition ${
                      !canDoRondaAttendance
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                        : todayRondaSession
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20'
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/20'
                    }`}
                  >
                    {!canDoRondaAttendance ? (
                      <Lock size={14} />
                    ) : (
                      <CheckSquare size={14} />
                    )}
                    <span>
                      {isSavingRondaAttendance
                        ? 'Menyimpan...'
                        : !canDoRondaAttendance
                        ? 'Terkunci (Khusus Petugas Hari Ini & Admin)'
                        : todayRondaSession
                        ? 'Perbarui Absensi Ronda'
                        : 'Simpan Absensi Ronda (+25 Poin / Petugas)'}
                    </span>
                  </button>

                  {todayRondaSession && isSuperadmin && (
                    <button
                      type="button"
                      onClick={() => {
                        confirmAction({
                          title: 'Hapus Sesi Absensi Ronda',
                          message: `Apakah Anda yakin ingin menghapus sesi absensi ronda tanggal ${selectedDate}? Poin partisipasi petugas akan disesuaikan kembali.`,
                          confirmLabel: 'Setuju',
                          cancelLabel: 'Batal',
                          variant: 'danger',
                          onConfirm: () => {
                            deleteAttendanceSession(todayRondaSession.id);
                          }
                        });
                      }}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                      title="Hapus Absensi Ronda Hari Ini (Superadmin)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Summary Card & Batch Controls */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                Estimasi Pendapatan Jimpitan Hari Ini
              </span>
              <div className="text-3xl font-black text-white mt-1">
                Rp {currentTotalRevenue.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {totalSelectedCount} dari {wajibJimpitResidents.length} rumah wajib jimpit (Pemilik, Kontrak &amp; Kosong Dijimpit) &bull; Min. Rp 500 (Bebas Nominal)
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-300 font-bold mr-1">Terapkan Nominal Cepat:</span>
              {quickNominals.map((nom) => (
                <button
                  key={nom}
                  type="button"
                  onClick={() => handleBatchSetNominal(nom)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-amber-600 text-white text-xs font-bold transition border border-slate-600"
                >
                  Rp {nom.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Filter & Selection Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-600 shrink-0">Blok:</span>
              {(['ALL', 'A', 'B', 'C'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBlockFilter(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                    blockFilter === b
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b === 'ALL' ? `Semua (${wajibJimpitResidents.length})` : `Blok ${b}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition border border-blue-200"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition"
              >
                Kosongkan
              </button>
              <div className="relative flex-1 sm:w-44">
                <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari warga/rumah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Resident Checklist Grid - Compact card sizes (4-6 columns on large screens) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5">
            {filteredResidents.map((resident) => {
              const itemData = selectedMap[resident.houseNumber] || {
                selected: false,
                nominal: 500,
                method: 'cash'
              };

              return (
                <div
                  key={resident.id}
                  className={`p-2 sm:p-2.5 rounded-xl border transition flex flex-col justify-between ${
                    itemData.selected
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    <label className="flex items-start gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={itemData.selected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedMap((prev) => ({
                            ...prev,
                            [resident.houseNumber]: {
                              ...itemData,
                              selected: checked,
                              nominal: checked && itemData.nominal === 0 ? 500 : itemData.nominal
                            }
                          }));
                        }}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono font-black text-slate-900 bg-slate-100 px-1 rounded">
                            {resident.houseNumber}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 py-0.2 rounded truncate ${
                              (resident.jimpitanPaidMonth || 0) >= targetMonthly
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Rp {(resident.jimpitanPaidMonth || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 truncate leading-snug mt-0.5" title={resident.name}>
                          {getResidentNameByHouse(resident.houseNumber, resident.name)}
                        </div>
                        {dutyGroup?.members.some((m) => findResidentByMemberName(m, [resident])) && (
                          <div className="mt-0.5">
                            <span className="text-[8px] bg-amber-200 text-amber-950 font-black px-1 py-0.2 rounded inline-block">
                              Ronda Hari Ini
                            </span>
                          </div>
                        )}
                        <div className="mt-0.5">
                          <span
                            className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border inline-block ${
                              resident.statusRumah === 'DI HUNI PEMILIK'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : resident.statusRumah === 'DI HUNI KONTRAK'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : 'bg-purple-50 text-purple-800 border-purple-300'
                            }`}
                          >
                            {resident.statusRumah}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>

                  {itemData.selected && (
                    <div className="mt-2 pt-1.5 border-t border-amber-200/70 space-y-1">
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mb-0.5">
                          <span>Nominal (Min 500):</span>
                        </div>
                        <input
                          type="number"
                          min="500"
                          step="1"
                          value={itemData.nominal}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setSelectedMap((prev) => ({
                              ...prev,
                              [resident.houseNumber]: {
                                ...itemData,
                                nominal: val
                              }
                            }));
                          }}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded-md text-[11px] font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="Min 500"
                        />
                      </div>

                      <div>
                        <select
                          value={itemData.method}
                          onChange={(e) => {
                            const method = e.target.value as 'cash' | 'transfer';
                            setSelectedMap((prev) => ({
                              ...prev,
                              [resident.houseNumber]: {
                                ...itemData,
                                method
                              }
                            }));
                          }}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded-md text-[9px] font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value="cash">Tunai (Koin)</option>
                          <option value="transfer">Transfer BRI</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes & Submit Button */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Petugas Ronda Malam (Kondisi Lingkungan, Kebersihan Pendopo, dll.):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Tuliskan catatan kondisi patroli malam ini..."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Tombol <strong>Kirim Jimpit</strong> hanya aktif untuk <strong>Petugas Ronda Hari Ini</strong> dan <strong>Superadmin</strong>. Hasil jimpitan langsung masuk ke Saldo Kas Paguyuban.
              </div>

              <button
                type="submit"
                disabled={!canSubmitJimpit || isAlreadySubmittedToday}
                className={`w-full sm:w-auto px-6 py-3 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                  !canSubmitJimpit || isAlreadySubmittedToday
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/30 active:scale-95'
                }`}
                title={
                  !canSubmitJimpit
                    ? 'Tombol kirim jimpit hanya aktif di akun petugas ronda hari ini dan Superadmin'
                    : isAlreadySubmittedToday
                    ? 'Jimpitan hari ini sudah di-input'
                    : 'Kirim Jimpit'
                }
              >
                {!canSubmitJimpit ? (
                  <>
                    <Lock size={15} />
                    <span>Akses Terkunci (Khusus Petugas Ronda Hari Ini &amp; Superadmin)</span>
                  </>
                ) : isAlreadySubmittedToday ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Jimpitan Hari Ini Sudah Di-input (Maks. 1x / Hari)</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Kirim Jimpit &amp; Cetak Laporan (Rp {currentTotalRevenue.toLocaleString('id-ID')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LAPORAN JIMPITAN HARIAN                                            */}
      {/* ========================================================================= */}
      {tab === 'laporan_harian' && (
        <div className="space-y-6">
          {/* Date Selector Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pilih Tanggal Laporan Harian</h3>
                <p className="text-xs text-slate-500">Tampilkan rincian jimpitan per hari lengkap dengan nominal per rumah</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                value={selectedDailyReportDate}
                onChange={(e) => setSelectedDailyReportDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {jimpitReports.length > 0 && (
                <select
                  value={selectedDailyReportDate}
                  onChange={(e) => setSelectedDailyReportDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  {jimpitReports.map((r) => (
                    <option key={r.id} value={r.date}>
                      {r.day}, {r.date} (Rp {r.totalNominal.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {activeDailyReport ? (
            <div className="space-y-4">
              {/* Daily Report Summary Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-400/30">
                      <CheckCircle2 size={13} />
                      <span>Laporan Harian Resmi Ronda Malam GSS</span>
                    </div>
                    <h3 className="text-2xl font-black">
                      Hari {activeDailyReport.day}, {activeDailyReport.date}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Petugas Ronda: <strong className="text-white">{activeDailyReport.collectedBy}</strong> &bull; Waktu Catat: {new Date(activeDailyReport.createdAt).toLocaleTimeString('id-ID')} WIB
                    </p>
                    {activeDailyReport.notes && (
                      <p className="text-xs text-amber-200/90 italic mt-2 bg-white/5 p-2.5 rounded-xl border border-white/10 max-w-xl">
                        &ldquo;{activeDailyReport.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center min-w-[170px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pendapatan</span>
                      <div className="text-2xl font-black text-emerald-400 mt-0.5">
                        Rp {activeDailyReport.totalNominal.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-slate-400">Masuk Kas Paguyuban</span>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center min-w-[140px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Partisipasi</span>
                      <div className="text-2xl font-black text-blue-400 mt-0.5">
                        {activeDailyReport.entries.length} <span className="text-xs text-slate-400">Rumah</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Minimal Rp 500 (Bebas)</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Export PDF, Excel, and Superadmin Delete */}
                <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => exportDailyJimpitanToPDF(activeDailyReport)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer size={14} />
                      <span>Cetak PDF Laporan Harian</span>
                    </button>
                    <button
                      onClick={() => exportJimpitanReportToExcel(residents, [activeDailyReport])}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Unduh Excel</span>
                    </button>
                  </div>

                  {isSuperadmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDailyReport(activeDailyReport)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                        title="Edit Laporan Jimpitan (Hak Akses Khusus Superadmin)"
                      >
                        <Edit2 size={14} />
                        <span>Edit Laporan Jimpitan (Superadmin)</span>
                      </button>
                      <button
                        onClick={() => {
                          confirmAction({
                            title: 'Hapus Laporan Jimpitan Harian',
                            message: `Hapus laporan jimpitan tanggal ${activeDailyReport.date} (${activeDailyReport.day})? Tindakan ini permanen. Total uang jimpitan (Rp ${activeDailyReport.totalNominal.toLocaleString('id-ID')}) akan disesuaikan kembali dari kas paguyuban.`,
                            confirmLabel: 'Setuju',
                            cancelLabel: 'Batal',
                            variant: 'danger',
                            onConfirm: () => {
                              deleteJimpitReport(activeDailyReport.id);
                            }
                          });
                        }}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-red-500"
                        title="Hapus Laporan Jimpitan (Hak Akses Khusus Superadmin)"
                      >
                        <Trash2 size={14} />
                        <span>Hapus Laporan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Breakdown Table for the Day */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users size={15} className="text-amber-600" />
                    <span>Daftar {activeDailyReport.entries.length} Warga yang Menjimpit pada {activeDailyReport.day}, {activeDailyReport.date}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Standar Kelipatan Rp 500
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">No Rumah</th>
                        <th className="py-3 px-4">Nama Warga</th>
                        <th className="py-3 px-4 text-center">Metode</th>
                        <th className="py-3 px-4 text-center">Waktu Pengambilan</th>
                        <th className="py-3 px-4">Petugas Pengambil</th>
                        <th className="py-3 px-4 text-right">Nominal Jimpitan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDailyReport.entries.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">{entry.houseNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{getResidentNameByHouse(entry.houseNumber, entry.residentName)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {entry.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                            {entry.timestamp || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{entry.collectedBy || activeDailyReport.collectedBy}</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 whitespace-nowrap">
                            Rp {entry.nominal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
                        <td colSpan={6} className="py-3 px-4 text-right uppercase text-xs">
                          Total Perolehan Jimpitan:
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                          Rp {activeDailyReport.totalNominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Calendar size={32} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Belum Ada Laporan Jimpitan untuk Tanggal {selectedDailyReportDate}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Petugas ronda belum memasukkan data jimpitan untuk tanggal tersebut. Anda dapat membuat laporan jimpitan baru sekarang.
                </p>
              </div>
              <button
                onClick={() => {
                  handleDateChange(selectedDailyReportDate);
                  setTab('input');
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Coins size={14} />
                <span>Input Jimpitan untuk Tanggal {selectedDailyReportDate}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LAPORAN BULANAN & REKAP 58 WARGA                                    */}
      {/* ========================================================================= */}
      {tab === 'laporan_bulanan' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-600" />
                <span>Rekapitulasi Jimpitan Bulanan (Target Rp 15.000 / KK)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total 58 unit rumah mencakup Blok A (16 rumah), Blok B (27 rumah), dan Blok C (15 rumah).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="Oktober 2026">Periode: Oktober 2026</option>
                <option value="November 2026">Periode: November 2026</option>
                <option value="Desember 2026">Periode: Desember 2026</option>
              </select>

              <button
                onClick={() => handleOpenPayModal()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <CreditCard size={14} />
                <span>Bayar Kekurangan Jimpitan</span>
              </button>

              <button
                onClick={() => exportMonthlyJimpitanToPDF(residents, jimpitReports, selectedMonth)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} />
                <span>Cetak PDF Bulanan</span>
              </button>

              <button
                onClick={() => exportJimpitanReportToExcel(residents, jimpitReports)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet size={14} />
                <span>Unduh Excel</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Target Bulanan Kas</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                Rp {totalTargetBulanan.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{totalResidentsCount} Rumah Wajib Jimpit &times; Rp 15.000 / bulan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700">Total Terkumpul Bulan Ini</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                Rp {totalJimpitanBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Capaian Kas: <strong>{monthlyAchievementPercent}%</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                <Coins size={13} className="text-amber-600" /> Total Akumulasi Tunggakan
              </span>
              <div className="text-xl font-black text-amber-600 mt-1">
                Rp {totalAkumulasiDefisit.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Bulan Ini: Rp {totalDefisitBulanIni.toLocaleString('id-ID')} &bull; Otomatis Terakumulasi
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-xs font-semibold text-blue-700">Status Warga Lunas</span>
              <div className="text-xl font-black text-blue-600 mt-1">
                {lunasCount} <span className="text-xs font-normal text-slate-500">/ {totalResidentsCount} Rumah</span>
              </div>
              <p className="text-[11px] text-blue-700 mt-0.5">
                {totalResidentsCount > 0 ? Math.round((lunasCount / totalResidentsCount) * 100) : 0}% Warga Tertib Jimpitan
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-600">Blok:</span>
              {(['ALL', 'A', 'B', 'C'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMonthlyBlockFilter(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyBlockFilter === b
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b === 'ALL' ? `Semua (${totalResidentsCount})` : `Blok ${b}`}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-600 ml-2">Status:</span>
              {(['ALL', 'LUNAS', 'KURANG'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMonthlyStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    monthlyStatusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'ALL' ? 'Semua' : s === 'LUNAS' ? 'Lunas Saja' : 'Belum Lunas'}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau no rumah..."
                value={monthlySearch}
                onChange={(e) => setMonthlySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Table of all 58 residents and their deficit */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Data Lengkap {filteredMonthlyResidents.length} Rumah (Periode: {selectedMonth})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kekurangan jimpitan otomatis terakumulasi ke bulan berikutnya sesuai Tata Tertib 2026.
                </p>
              </div>
              <span className="text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-bold">
                Kewajiban: Rp 15.000 / KK / bulan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Rumah</th>
                    <th className="py-3 px-3">Kepala Keluarga</th>
                    <th className="py-3 px-3">Blok</th>
                    <th className="py-3 px-3 text-right">Target</th>
                    <th className="py-3 px-3 text-right">Bulan Ini</th>
                    <th className="py-3 px-3 text-right">Kurang Bulan Ini</th>
                    <th className="py-3 px-3 text-right">Akumulasi Lalu</th>
                    <th className="py-3 px-3 text-right">Total Tunggakan</th>
                    <th className="py-3 px-3 text-center">Aksi / Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMonthlyResidents.map((r, idx) => {
                    const paid = r.jimpitanPaidMonth || 0;
                    const curDeficit = Math.max(0, targetMonthly - paid);
                    const prevDeficit = r.previousMonthsJimpitanDeficit || 0;
                    const totalDeficit = curDeficit + prevDeficit;
                    const isLunas = totalDeficit === 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{r.houseNumber}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{getResidentNameByHouse(r.houseNumber, r.name)}</td>
                        <td className="py-3 px-3 font-bold text-slate-600">Blok {r.block}</td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          Rp {targetMonthly.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          Rp {paid.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          {curDeficit > 0 ? (
                            <span className="text-amber-600">Rp {curDeficit.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-emerald-600">Rp 0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          {prevDeficit > 0 ? (
                            <span className="text-rose-600 font-bold">+Rp {prevDeficit.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-slate-400">Rp 0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black">
                          {totalDeficit > 0 ? (
                            <span className="text-red-600 font-black">Rp {totalDeficit.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">LUNAS</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {totalDeficit > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(r)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10px] font-black transition flex items-center gap-1 mx-auto shadow-xs"
                              title="Bayar kekurangan jimpitan warga ini dan catat otomatis ke Kas Paguyuban"
                            >
                              <CreditCard size={11} />
                              <span>Bayar (Rp {totalDeficit.toLocaleString('id-ID')})</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} />
                              <span>LUNAS</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RIWAYAT SEMUA LAPORAN JIMPITAN                                     */}
      {/* ========================================================================= */}
      {tab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <span>Daftar Seluruh Laporan Pendapatan Jimpitan ({jimpitReports.length} Laporan)</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => {
                    confirmAction({
                      title: 'Reset Seluruh Arsip Laporan Jimpitan',
                      message: 'PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset dan mengosongkan seluruh arsip laporan jimpitan? Seluruh data jimpitan akan dihapus permanen di cloud Firebase & semua perangkat.',
                      confirmLabel: 'Setuju',
                      cancelLabel: 'Batal',
                      variant: 'danger',
                      onConfirm: async () => {
                        await resetFeatureData('jimpitan');
                        alert('Seluruh arsip laporan jimpitan berhasil di-reset bersih!');
                      }
                    });
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 size={14} />
                  <span>Reset Laporan Jimpitan</span>
                </button>
              )}
              <button
                onClick={() => exportJimpitanReportToExcel(residents, jimpitReports)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                <span>Unduh Rekap Excel</span>
              </button>
            </div>
          </div>

          {jimpitReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Belum Ada Arsip Laporan Jimpitan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Seluruh arsip jimpitan telah di-reset bersih. Petugas ronda yang bertugas malam ini dapat mencatat perolehan jimpitan pada tab <strong>"Input Jimpitan Hari Ini"</strong>.
              </p>
              <button
                type="button"
                onClick={() => setTab('input')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm transition"
              >
                <Coins size={15} />
                <span>Input Jimpitan Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jimpitReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition flex flex-col justify-between"
                >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        {report.day.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {report.day}, {report.date}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Dicatat oleh: <span className="font-semibold text-slate-700">{report.collectedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Pendapatan</span>
                      <div className="text-lg font-black text-emerald-600">
                        Rp {report.totalNominal.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="py-3">
                    <p className="text-xs text-slate-600 line-clamp-2 italic mb-2">
                      &ldquo;{report.notes || 'Ronda malam berjalan tertib.'}&rdquo;
                    </p>

                    <div className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Partisipasi Warga ({report.entries.length} Rumah):</span>
                      <span className="text-amber-600 font-bold">Min. Rp 500</span>
                    </div>

                    {/* Badges of houses */}
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {report.entries.map((entry, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                          title={`${entry.residentName} (Rp ${entry.nominal.toLocaleString('id-ID')})`}
                        >
                          {entry.houseNumber}: Rp {entry.nominal.toLocaleString('id-ID')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Print PDF, View Detail, and Superadmin Delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportDailyJimpitanToPDF(report)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Cetak PDF Laporan Ini"
                    >
                      <Printer size={12} />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDailyReportDate(report.date);
                        setTab('laporan_harian');
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>Lihat Rincian</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  {isSuperadmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingDailyReport(report)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Laporan Jimpitan (Hak Akses Superadmin)"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          confirmAction({
                            title: 'Hapus Laporan Jimpitan',
                            message: `Hapus permanen laporan jimpitan tanggal ${report.date} (${report.day})? Tindakan ini hanya diizinkan untuk Superadmin (Bpk. Beni B24). Saldo kas dan catatan warga akan disesuaikan kembali.`,
                            confirmLabel: 'Setuju',
                            cancelLabel: 'Batal',
                            variant: 'danger',
                            onConfirm: () => {
                              deleteJimpitReport(report.id);
                            }
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Laporan Jimpitan (Hak Akses Superadmin)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REAL-TIME LAPORAN PENDAPATAN SETELAH KIRIM JIMPIT                  */}
      {/* ========================================================================= */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 text-center relative">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black">Laporan Pendapatan Jimpitan Berhasil Dikirim!</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Data real-time tersimpan ke kas paguyuban & terakumulasi pada laporan bulanan.
              </p>
            </div>

            {/* Content summary */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Total Perolehan Hari Ini</span>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    Rp {submittedReport.totalNominal.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-800 uppercase">Warga Menjimpit</span>
                  <div className="text-2xl font-black text-blue-700 mt-0.5">
                    {submittedReport.entries.length} <span className="text-sm font-semibold text-slate-500">Rumah</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hari & Tanggal:</span>
                  <span className="font-bold text-slate-800">{submittedReport.day}, {submittedReport.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Ronda:</span>
                  <span className="font-bold text-slate-800">{submittedReport.collectedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bonus Poin Warga:</span>
                  <span className="font-bold text-amber-600">+10 Poin Loyalitas / Warga</span>
                </div>
              </div>

              {/* Contributor preview */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Rincian Warga Berpartisipasi:</p>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {submittedReport.entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-bold text-slate-800">
                        {entry.houseNumber} - {getResidentNameByHouse(entry.houseNumber, entry.residentName)}
                      </span>
                      <span className="font-extrabold text-emerald-600">
                        Rp {entry.nominal.toLocaleString('id-ID')} ({entry.paymentMethod})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReport(null);
                    setTab('laporan_bulanan');
                  }}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Lihat Rekap Bulanan ({totalResidentsCount} Rumah)
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedReport(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: BAYAR KEKURANGAN JIMPITAN (TERINTEGRASI KE KAS PAGUYUBAN)          */}
      {/* ========================================================================= */}
      {isPayModalOpen && selectedResidentForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pembayaran Kekurangan Jimpitan</h3>
                  <p className="text-[11px] text-emerald-200">Terintegrasi otomatis ke Laporan Keuangan Kas GSS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPayModalOpen(false);
                  setPaySuccessReceipt(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {paySuccessReceipt ? (
                /* Digital Receipt */
                <div className="space-y-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">Pembayaran Jimpitan Berhasil!</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dana otomatis masuk Buku Kas Paguyuban dan kekurangan warga telah disesuaikan.
                    </p>
                  </div>

                  {/* Receipt Paper Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 text-xs text-left space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-mono">No. Transaksi:</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{paySuccessReceipt.trxId || `TRX-${Date.now()}`}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-slate-500">Warga / Rumah:</span>
                      <strong className="text-slate-900">{getResidentNameByHouse(paySuccessReceipt.residentHouse, paySuccessReceipt.residentName)} ({paySuccessReceipt.residentHouse})</strong>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-slate-500">Metode:</span>
                      <span className="font-bold text-blue-700">{paySuccessReceipt.method}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-slate-500">Tanggal:</span>
                      <span className="text-slate-700">{paySuccessReceipt.date}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Total Nominal:</span>
                      <span className="text-base font-black text-emerald-600">
                        Rp {paySuccessReceipt.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic text-center pt-1">
                      +15 GRISS-Poin Loyalitas telah ditambahkan ke akun warga.
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Printer size={13} />
                      <span>Cetak Kuitansi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPayModalOpen(false);
                        setPaySuccessReceipt(null);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Form */
                <form onSubmit={handleExecutePay} className="space-y-4 text-xs">
                  {/* Select Resident */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pilih Warga / Nomor Rumah:
                    </label>
                    <select
                      value={selectedResidentForPay.id}
                      onChange={(e) => handleSelectResidentForPay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {wajibJimpitResidents.map((r) => {
                        const cur = Math.max(0, targetMonthly - (r.jimpitanPaidMonth || 0));
                        const prev = r.previousMonthsJimpitanDeficit || 0;
                        const tot = cur + prev;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.houseNumber} - {r.name} {tot > 0 ? `(Tunggakan: Rp ${tot.toLocaleString('id-ID')})` : '(Lunas)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Arrears Breakdown Card */}
                  {(() => {
                    const paid = selectedResidentForPay.jimpitanPaidMonth || 0;
                    const curDef = Math.max(0, targetMonthly - paid);
                    const prevDef = selectedResidentForPay.previousMonthsJimpitanDeficit || 0;
                    const totDef = curDef + prevDef;

                    return (
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Target Bulanan ({totalResidentsCount} Rumah Wajib Jimpit):</span>
                          <span className="font-semibold text-slate-700">Rp 15.000 / bulan</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Jimpitan Masuk Bulan Ini:</span>
                          <span className="font-bold text-emerald-600">Rp {paid.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Kurang Bulan Berjalan:</span>
                          <span className="font-bold text-amber-600">Rp {curDef.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Akumulasi Bulan Sebelumnya:</span>
                          <span className="font-bold text-rose-600">Rp {prevDef.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-900">Total Akumulasi Tunggakan:</span>
                          <span className="text-base font-black text-red-600">
                            Rp {totDef.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Nominal Input & Preset buttons */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nominal Pembayaran (Min. Rp 500, Bebas Nominal):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min={500}
                        step={1}
                        value={payAmountInput}
                        onChange={(e) => setPayAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Contoh: 15000"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[5000, 10000, 15000, 20000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPayAmountInput(preset)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                        >
                          Rp {preset.toLocaleString('id-ID')}
                        </button>
                      ))}
                      {(() => {
                        const cur = Math.max(0, targetMonthly - (selectedResidentForPay.jimpitanPaidMonth || 0));
                        const prev = selectedResidentForPay.previousMonthsJimpitanDeficit || 0;
                        const tot = cur + prev;
                        if (tot > 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPayAmountInput(tot)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-extrabold"
                            >
                              Lunasi Penuh (Rp {tot.toLocaleString('id-ID')})
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Metode Pembayaran:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayMethod('transfer')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                          payMethod === 'transfer'
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard size={16} className="text-blue-600" />
                        <span className="text-[11px]">Transfer Bank BRI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayMethod('cash')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                          payMethod === 'cash'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Coins size={16} className="text-emerald-600" />
                        <span className="text-[11px]">Tunai Bendahara 1/2</span>
                      </button>
                    </div>

                    {payMethod === 'transfer' && (
                      <div className="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
                        <span className="font-extrabold text-blue-900 block text-[10px] uppercase">
                          Rekening Transfer Bank BRI:
                        </span>
                        <p className="font-mono font-black text-slate-900 text-sm tracking-wider">
                          155801007310503
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          a/n <strong>Benisius Rahmat Basuki</strong>
                        </p>
                      </div>
                    )}

                    {payMethod === 'cash' && (
                      <div className="mt-2.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                        <span className="font-extrabold text-emerald-900 block text-[10px] uppercase">
                          Tunai Langsung:
                        </span>
                        <p className="text-slate-700 text-[11px]">
                          Diserahkan kepada Petugas Ronda keliling atau Bendahara 1 (Bpk. Ahmad B 02) / Bendahara 2 (Bpk. Robi C 15).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="Contoh: Pelunasan kekurangan jimpitan Oktober 2026..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <CreditCard size={14} />
                      <span>{isProcessingPayment ? 'Memproses...' : `Proses Pembayaran (Rp ${Number(payAmountInput || 0).toLocaleString('id-ID')})`}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT LAPORAN JIMPITAN (HAK AKSES HANYA SUPERADMIN)                */}
      {/* ========================================================================= */}
      {editingDailyReport && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Laporan Jimpitan</h3>
                  <p className="text-[11px] text-amber-300">Hak Akses: Superadmin (Bpk. Beni B 24)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDailyReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmAction({
                  title: 'Konfirmasi Perubahan Laporan Jimpitan',
                  message: `Simpan pembaruan laporan jimpitan tanggal ${editingDailyReport.date} (${editingDailyReport.day}) dengan total Rp ${editingDailyReport.totalNominal.toLocaleString('id-ID')}? Data kas paguyuban dan catatan warga otomatis akan disinkronkan.`,
                  confirmLabel: 'Setuju',
                  cancelLabel: 'Batal',
                  variant: 'primary',
                  onConfirm: async () => {
                    await updateJimpitReport(editingDailyReport);
                    setEditingDailyReport(null);
                  }
                });
              }}
              className="p-6 space-y-4 text-xs overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari & Tanggal</label>
                  <div className="p-2.5 bg-slate-100 rounded-xl font-bold text-slate-800">
                    {editingDailyReport.day}, {editingDailyReport.date}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Nominal</label>
                  <input
                    type="number"
                    value={editingDailyReport.totalNominal}
                    onChange={(e) =>
                      setEditingDailyReport({
                        ...editingDailyReport,
                        totalNominal: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Petugas Ronda / Pengambil</label>
                <select
                  value={editingDailyReport.collectedBy}
                  onChange={(e) =>
                    setEditingDailyReport({
                      ...editingDailyReport,
                      collectedBy: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={editingDailyReport.collectedBy}>{editingDailyReport.collectedBy} (Saat Ini)</option>
                  {residents.map((r) => {
                    const label = `${getResidentNameByHouse(r.houseNumber, r.name)} (${r.houseNumber})`;
                    return (
                      <option key={r.id} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Ronda / Kondisi Lingkungan</label>
                <textarea
                  value={editingDailyReport.notes || ''}
                  onChange={(e) =>
                    setEditingDailyReport({
                      ...editingDailyReport,
                      notes: e.target.value
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Warga Terdata Menjimpit ({editingDailyReport.entries.length} Rumah)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {editingDailyReport.entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded border border-slate-100">
                      <span className="font-bold text-slate-800">
                        {entry.houseNumber} - {getResidentNameByHouse(entry.houseNumber, entry.residentName)}
                      </span>
                      <span className="font-semibold text-emerald-600">Rp {entry.nominal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDailyReport(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition shadow-md"
                >
                  Simpan Perubahan Laporan (Superadmin)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

