import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek, JimpitDailyReport } from '../types';
import { exportJimpitanReportToExcel } from '../utils/exportUtils';
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
  Award
} from 'lucide-react';

export const JimpitanView: React.FC = () => {
  const {
    residents,
    rondaSchedule,
    jimpitReports,
    submitDailyJimpit,
    currentUser
  } = useApp();

  // Active sub-tab
  const [tab, setTab] = useState<'input' | 'kekurangan' | 'riwayat'>('input');

  // Input form states
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const getDayName = (dateStr: string): DayOfWeek => {
    const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(dateStr);
    return days[d.getDay()] || 'Senin';
  };

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayName(todayStr));
  const [collectorName, setCollectorName] = useState<string>(
    currentUser.name ? `${currentUser.name} (${currentUser.houseNumber})` : 'Petugas Ronda'
  );
  const [notes, setNotes] = useState<string>('Portal ditutup dan dikunci pukul 21.00 WIB. Pendopo disapu bersih.');

  // Block filter for resident checklist
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected residents for today's jimpit with their individual nominal
  // Map of resident houseNumber -> { selected: boolean, nominal: number, method: 'cash' | 'transfer' }
  const [selectedMap, setSelectedMap] = useState<Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }>>(() => {
    const init: Record<string, { selected: boolean; nominal: number; method: 'cash' | 'transfer' }> = {};
    residents.forEach((r) => {
      // By default select occupied houses with standard Rp 500
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

  // Filter residents
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

    // Build entry details
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

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    // Show instant real-time report dialog
    const simulatedSavedReport: JimpitDailyReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSubmittedReport(simulatedSavedReport);
  };

  // Deficit target calculation
  const targetMonthly = 15000; // Rp 15.000 / month standard
  const totalResidentsCount = residents.length;
  const lunasCount = residents.filter((r) => (r.jimpitanPaidMonth || 0) >= targetMonthly).length;
  const totalJimpitanBulanIni = residents.reduce((acc, r) => acc + (r.jimpitanPaidMonth || 0), 0);
  const totalDefisitBulanIni = residents.reduce((acc, r) => {
    const paid = r.jimpitanPaidMonth || 0;
    return acc + Math.max(0, targetMonthly - paid);
  }, 0);

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
            Pencatatan uang jimpitan malam keliling real-time terhubung jadwal ronda. Standar jimpitan harian Rp 500, target 1 bulan Rp 15.000 per warga untuk kemaslahatan kas paguyuban.
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
              <span>Dapat +10 Poin Tiap Menjimpit</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setTab('input')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            tab === 'input'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins size={17} />
          <span>Input Jimpitan Hari Ini</span>
        </button>

        <button
          onClick={() => setTab('kekurangan')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            tab === 'kekurangan'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={17} />
          <span>Laporan Kekurangan Warga (Target Rp 15.000)</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
            {58 - lunasCount} Belum Lunas
          </span>
        </button>

        <button
          onClick={() => setTab('riwayat')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition ${
            tab === 'riwayat'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={17} />
          <span>Riwayat Jimpitan Harian ({jimpitReports.length})</span>
        </button>
      </div>

      {/* TAB 1: INPUT JIMPITAN ONLINE */}
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
                <span>Petugas Pencatat / Ronda</span>
              </label>
              <input
                type="text"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                placeholder="Nama Petugas Ronda..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Display Duty Group for Selected Day */}
            <div className="md:col-span-3 bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-950">
                  Jadwal Anggota Ronda Hari {selectedDay}:
                </span>
                <span className="text-xs text-amber-900 font-medium">
                  {dutyGroup?.members.join(', ') || 'Belum diatur'}
                </span>
              </div>
              <div className="text-[11px] text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg font-semibold shrink-0">
                Denda Jika Tidak Ronda: Rp 15.000 / Grup
              </div>
            </div>
          </div>

          {/* Quick Bulk Setting Toolbar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 mr-1">Nominal Cepat (Kelipatan 500):</span>
              {quickNominals.map((nom) => (
                <button
                  key={nom}
                  type="button"
                  onClick={() => handleBatchSetNominal(nom)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white border border-slate-700 text-xs font-bold transition"
                >
                  Rp {nom.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Total Warga Ikut Jimpit:</div>
                <div className="text-lg font-black text-amber-400">
                  {totalSelectedCount} <span className="text-xs text-white">/ {residents.length} Rumah</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden sm:block" />

              <div className="text-right">
                <div className="text-[11px] text-slate-400">Perolehan Hari Tersebut:</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  Rp {currentTotalRevenue.toLocaleString('id-ID')}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 text-sm transition transform active:scale-95"
              >
                <Send size={16} />
                <span>Kirim Jimpit</span>
              </button>
            </div>
          </div>

          {/* Resident Checklist Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Filters & Bulk Select */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Filter size={13} /> Blok:
                </span>
                {(['ALL', 'A', 'B', 'C'] as const).map((blk) => (
                  <button
                    key={blk}
                    type="button"
                    onClick={() => setBlockFilter(blk)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      blockFilter === blk
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {blk === 'ALL' ? 'Semua Blok' : `Blok ${blk}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="relative flex-1 sm:w-56">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari warga / no rumah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                  >
                    <CheckSquare size={13} />
                    <span>Pilih Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                  >
                    <Square size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredResidents.map((resident) => {
                const itemData = selectedMap[resident.houseNumber] || {
                  selected: false,
                  nominal: 500,
                  method: 'cash'
                };
                const isSelected = itemData.selected;

                return (
                  <div
                    key={resident.id}
                    className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isSelected ? 'bg-amber-50/40' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Left: Checkbox + Resident info */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedMap((prev) => ({
                            ...prev,
                            [resident.houseNumber]: {
                              ...itemData,
                              selected: checked
                            }
                          }));
                        }}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />

                      <div className="w-12 text-center py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-black text-slate-800">
                        {resident.houseNumber}
                      </div>

                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{resident.houseNumber}</span>
                          {dutyGroup?.members.some((m) => resident.name.toUpperCase().includes(m)) && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">
                              Ronda Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {resident.statusRumah} &bull; Akumulasi Bulan Ini: Rp {(resident.jimpitanPaidMonth || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {/* Right: Nominal picker + manual input + payment method */}
                    <div className="flex items-center gap-2 ml-7 sm:ml-0 flex-wrap sm:flex-nowrap">
                      {/* Preset Nominal Multiples of 500 */}
                      <div className="flex items-center gap-1">
                        {[500, 1000, 1500, 2000].map((quick) => (
                          <button
                            key={quick}
                            type="button"
                            disabled={!isSelected}
                            onClick={() => {
                              setSelectedMap((prev) => ({
                                ...prev,
                                [resident.houseNumber]: {
                                  ...itemData,
                                  nominal: quick,
                                  selected: true
                                }
                              }));
                            }}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition border ${
                              itemData.nominal === quick && isSelected
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 disabled:opacity-40'
                            }`}
                          >
                            {quick >= 1000 ? `${quick / 1000}k` : quick}
                          </button>
                        ))}
                      </div>

                      {/* Manual Numeric input */}
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          step={500}
                          min={500}
                          disabled={!isSelected}
                          value={itemData.nominal || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setSelectedMap((prev) => ({
                              ...prev,
                              [resident.houseNumber]: {
                                ...itemData,
                                nominal: val
                              }
                            }));
                          }}
                          className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
                          placeholder="Manual"
                        />
                      </div>

                      {/* Payment method */}
                      <select
                        disabled={!isSelected}
                        value={itemData.method}
                        onChange={(e) => {
                          const m = e.target.value as 'cash' | 'transfer';
                          setSelectedMap((prev) => ({
                            ...prev,
                            [resident.houseNumber]: {
                              ...itemData,
                              method: m
                            }
                          }));
                        }}
                        className="text-[11px] py-1 px-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-40"
                      >
                        <option value="cash">Kotak Jimpit</option>
                        <option value="transfer">Transfer</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note & footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan ronda (misal: portal dikunci jam 21.00, pendopo bersih)..."
                className="w-full sm:w-2/3 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>Kirim Jimpitan Hari Ini (Rp {currentTotalRevenue.toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: KEKURANGAN JIMPITAN WARGA (TARGET RP 15.000 / BULAN) */}
      {tab === 'kekurangan' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Standar Target Bulanan</span>
              <div className="text-xl font-black text-slate-900 mt-1">Rp 15.000 / Warga</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sesuai kesepakatan Paguyuban GSS</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Terkumpul Bulan Ini</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                Rp {totalJimpitanBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Otomatis masuk kas paguyuban</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Kekurangan Semua Warga</span>
              <div className="text-xl font-black text-amber-600 mt-1">
                Rp {totalDefisitBulanIni.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">{totalResidentsCount - lunasCount} warga belum genap</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Status Warga Lunas</span>
                <div className="text-xl font-black text-blue-600 mt-1">
                  {lunasCount} <span className="text-xs font-normal text-slate-500">/ {totalResidentsCount} Rumah</span>
                </div>
              </div>
              <button
                onClick={() => exportJimpitanReportToExcel(residents, jimpitReports)}
                className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                <span>Ekspor Excel Jimpitan</span>
              </button>
            </div>
          </div>

          {/* Table of all 58 residents and their deficit */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-amber-600" />
                <span>Rincian Kekurangan Jimpitan 58 Rumah Perum GSS</span>
              </h3>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter nama / no rumah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">No Rumah</th>
                    <th className="py-3 px-4">Nama Warga</th>
                    <th className="py-3 px-4">Status Hunian</th>
                    <th className="py-3 px-4 text-right">Target Bulanan</th>
                    <th className="py-3 px-4 text-right">Sudah Masuk</th>
                    <th className="py-3 px-4 text-right">Kekurangan</th>
                    <th className="py-3 px-4 text-center">Progress & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResidents.map((r) => {
                    const paid = r.jimpitanPaidMonth || 0;
                    const deficit = Math.max(0, targetMonthly - paid);
                    const percent = Math.min(100, Math.round((paid / targetMonthly) * 100));
                    const isLunas = deficit === 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.houseNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
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
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
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
                              {isLunas ? 'LUNAS' : `${percent}%`}
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

      {/* TAB 3: RIWAYAT LAPORAN JIMPITAN HARIAN */}
      {tab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <span>Daftar Laporan Pendapatan Jimpitan Harian</span>
            </h3>
            <button
              onClick={() => exportJimpitanReportToExcel(residents, jimpitReports)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} />
              <span>Unduh Rekap Excel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jimpitReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition"
              >
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

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Waktu catat: {new Date(report.createdAt).toLocaleTimeString('id-ID')}</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Tersimpan Cloud Real-time
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REAL-TIME LAPORAN PENDAPATAN HARI TERSEBUT SETELAH KIRIM JIMPIT */}
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
                    setTab('kekurangan');
                  }}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Lihat Kekurangan Warga
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
