import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek, JimpitDailyReport } from '../types';
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
  CalendarDays
} from 'lucide-react';

export const JimpitanView: React.FC = () => {
  const {
    residents,
    rondaSchedule,
    jimpitReports,
    submitDailyJimpit,
    deleteJimpitReport,
    currentUser
  } = useApp();

  const isSuperadmin = currentUser.role === 'superadmin';

  // Active sub-tab: 'input' | 'laporan_harian' | 'laporan_bulanan' | 'riwayat'
  const [tab, setTab] = useState<'input' | 'laporan_harian' | 'laporan_bulanan' | 'riwayat'>('input');

  // Today string
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const getDayName = (dateStr: string): DayOfWeek => {
    const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()] || 'Senin';
  };

  // --- STATE FOR TAB 1: INPUT JIMPITAN ---
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayName(todayStr));
  const [collectorName, setCollectorName] = useState<string>(
    currentUser.name ? `${currentUser.name} (${currentUser.houseNumber})` : 'Petugas Ronda'
  );
  const [notes, setNotes] = useState<string>('Portal ditutup dan dikunci pukul 21.00 WIB. Pendopo disapu bersih.');

  // Block filter for resident checklist in input
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected residents for today's jimpit with their individual nominal
  const [selectedMap, setSelectedMap] = useState<Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }>>(() => {
    const init: Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }> = {};
    residents.forEach((r) => {
      const isOccupied = r.statusRumah.includes('HUNI') || r.statusRumah.includes('MEMBAYAR');
      init[r.houseNumber] = {
        selected: isOccupied,
        nominal: 500,
        method: 'cash'
      };
    });
    return init;
  });

  // Modal for submitted report
  const [submittedReport, setSubmittedReport] = useState<JimpitDailyReport | null>(null);

  // Synchronize selected day when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedDay(getDayName(newDate));
  };

  // Find ronda members on duty for selected day
  const dutyGroup = rondaSchedule.find((g) => g.day === selectedDay);

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

  // Filter residents for Input Tab
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
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

  // Form submit handler
  const handleSubmitJimpit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalSelectedCount === 0) {
      alert('Pilih minimal satu warga yang diambil jimpitannya!');
      return;
    }

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

  // --- STATE FOR TAB 3: LAPORAN BULANAN (REKAP 58 WARGA) ---
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober 2026');
  const [monthlyBlockFilter, setMonthlyBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState<'ALL' | 'LUNAS' | 'KURANG'>('ALL');
  const [monthlySearch, setMonthlySearch] = useState<string>('');

  const targetMonthly = 15000; // Rp 15.000 / KK / bulan
  const totalResidentsCount = residents.length;
  const lunasCount = residents.filter((r) => (r.jimpitanPaidMonth || 0) >= targetMonthly).length;
  const totalJimpitanBulanIni = residents.reduce((acc, r) => acc + (r.jimpitanPaidMonth || 0), 0);
  const totalTargetBulanan = totalResidentsCount * targetMonthly; // Rp 870.000
  const totalDefisitBulanIni = residents.reduce((acc, r) => {
    const paid = r.jimpitanPaidMonth || 0;
    return acc + Math.max(0, targetMonthly - paid);
  }, 0);
  const monthlyAchievementPercent = totalTargetBulanan > 0
    ? Math.min(100, Math.round((totalJimpitanBulanIni / totalTargetBulanan) * 100))
    : 0;

  // Filtered residents for Monthly Report
  const filteredMonthlyResidents = useMemo(() => {
    return residents.filter((r) => {
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
  }, [residents, monthlyBlockFilter, monthlyStatusFilter, monthlySearch]);

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
            Pencatatan jimpitan malam keliling real-time terhubung jadwal ronda. Standar jimpitan harian minimal Rp 500 (kelipatan 500), target 1 bulan Rp 15.000 per warga untuk kemaslahatan kas paguyuban.
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
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INPUT JIMPITAN ONLINE                                              */}
      {/* ========================================================================= */}
      {tab === 'input' && (
        <form onSubmit={handleSubmitJimpit} className="space-y-6">
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
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                placeholder="Nama Petugas Pengambil Jimpitan"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Quick Schedule Duty Reminder */}
          {dutyGroup && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  {dutyGroup.day.slice(0, 3)}
                </div>
                <div>
                  <span className="font-bold text-amber-900">
                    Jadwal Tim Ronda Hari {dutyGroup.day}:
                  </span>
                  <div className="text-slate-600 mt-0.5">
                    Anggota Petugas: <span className="font-semibold text-slate-900">{dutyGroup.members.join(', ')}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-amber-800 font-semibold bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200">
                Wajib kunci portal pkl 21.00 WIB & sapu pendopo
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
                {totalSelectedCount} dari {residents.length} rumah berpartisipasi (Kelipatan Rp 500)
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
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600">Filter Blok:</span>
              {(['ALL', 'A', 'B', 'C'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBlockFilter(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    blockFilter === b
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b === 'ALL' ? 'Semua Blok (58)' : `Blok ${b}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition border border-blue-200"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition"
              >
                Kosongkan
              </button>
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari warga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Resident Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredResidents.map((resident) => {
              const itemData = selectedMap[resident.houseNumber] || {
                selected: false,
                nominal: 500,
                method: 'cash'
              };

              return (
                <div
                  key={resident.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                    itemData.selected
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
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
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{resident.name}</span>
                          {dutyGroup?.members.some((m) => resident.name.toUpperCase().includes(m)) && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">
                              Ronda Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Rumah {resident.houseNumber} &bull; Blok {resident.block}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Status: {resident.statusRumah}
                        </div>
                      </div>
                    </label>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (resident.jimpitanPaidMonth || 0) >= targetMonthly
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Bulan ini: Rp {(resident.jimpitanPaidMonth || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {itemData.selected && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Nominal Jimpit (Min. 500, kelipatan 500):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="500"
                            step="500"
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
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                          Metode:
                        </label>
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
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="cash">Tunai (Koin)</option>
                          <option value="transfer">QRIS/Transfer</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes & Submit Button */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
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
                Menekan tombol <strong>Kirim Jimpit</strong> akan menyimpan data real-time ke Firebase Cloud, menambah kas paguyuban, serta memberikan +10 poin loyalitas kepada warga yang menjimpit.
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black rounded-xl text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition"
              >
                <Send size={16} />
                <span>Kirim Jimpit & Cetak Laporan (Rp {currentTotalRevenue.toLocaleString('id-ID')})</span>
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
                      <span className="text-[10px] text-slate-400">Kelipatan Rp 500</span>
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
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `HAPUS LAPORAN JIMPITAN TANGGAL ${activeDailyReport.date} (${activeDailyReport.day})?\n\nTindakan ini permanen. Total uang jimpitan (Rp ${activeDailyReport.totalNominal.toLocaleString('id-ID')}) akan disesuaikan kembali dari akumulasi warga.`
                          )
                        ) {
                          deleteJimpitReport(activeDailyReport.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-red-500"
                      title="Hapus Laporan Jimpitan (Hak Akses Khusus Superadmin)"
                    >
                      <Trash2 size={14} />
                      <span>Hapus Laporan Harian Ini (Superadmin)</span>
                    </button>
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
                          <td className="py-3 px-4 font-semibold text-slate-800">{entry.residentName}</td>
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
              <p className="text-[11px] text-slate-400 mt-0.5">58 KK &times; Rp 15.000 / bulan</p>
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

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
              <span className="text-xs font-semibold text-amber-700">Total Kekurangan Warga</span>
              <div className="text-xl font-black text-amber-600 mt-1">
                Rp {totalDefisitBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {totalResidentsCount - lunasCount} rumah belum melunasi Rp 15.000
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-xs font-semibold text-blue-700">Status Warga Lunas</span>
              <div className="text-xl font-black text-blue-600 mt-1">
                {lunasCount} <span className="text-xs font-normal text-slate-500">/ {totalResidentsCount} Rumah</span>
              </div>
              <p className="text-[11px] text-blue-700 mt-0.5">
                {Math.round((lunasCount / totalResidentsCount) * 100)}% Warga Tertib Jimpitan
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
                  {b === 'ALL' ? 'Semua (58)' : `Blok ${b}`}
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
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                Data Lengkap {filteredMonthlyResidents.length} Rumah (Periode: {selectedMonth})
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                Target: Rp 15.000 / KK
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">No Rumah</th>
                    <th className="py-3 px-4">Nama Kepala Keluarga</th>
                    <th className="py-3 px-4">Blok</th>
                    <th className="py-3 px-4">Status Hunian</th>
                    <th className="py-3 px-4 text-right">Target</th>
                    <th className="py-3 px-4 text-right">Sudah Masuk</th>
                    <th className="py-3 px-4 text-right">Kekurangan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMonthlyResidents.map((r, idx) => {
                    const paid = r.jimpitanPaidMonth || 0;
                    const deficit = Math.max(0, targetMonthly - paid);
                    const percent = Math.min(100, Math.round((paid / targetMonthly) * 100));
                    const isLunas = deficit === 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{r.houseNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">Blok {r.block}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{r.statusRumah}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          Rp {targetMonthly.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          Rp {paid.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {deficit > 0 ? (
                            <span className="text-amber-600">Rp {deficit.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-emerald-600">Rp 0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLunas ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                isLunas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isLunas ? 'LUNAS' : `Kurang Rp ${deficit.toLocaleString('id-ID')}`}
                            </span>
                          </div>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportJimpitanReportToExcel(residents, jimpitReports)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                <span>Unduh Rekap Excel</span>
              </button>
            </div>
          </div>

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
                      <span className="text-amber-600 font-bold">Kelipatan Rp 500</span>
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
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `HAPUS LAPORAN JIMPITAN TANGGAL ${report.date} (${report.day})?\n\nTindakan permanen ini hanya diizinkan untuk Superadmin (Bpk. Beni B24). Saldo kas dan catatan warga akan disesuaikan kembali.`
                          )
                        ) {
                          deleteJimpitReport(report.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Laporan Jimpitan (Hak Akses Superadmin)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {jimpitReports.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400">
                Belum ada laporan jimpitan yang dicatat.
              </div>
            )}
          </div>
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
                        {entry.houseNumber} - {entry.residentName}
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
                  Lihat Rekap Bulanan 58 Warga
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
    </div>
  );
};
