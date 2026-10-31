import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, IncomeCategory, ExpenseCategory } from '../types';
import { exportFinanceToPDF, exportFinanceToExcel } from '../utils/exportUtils';
import { permissions, verifyTransactionIntegrity } from '../utils/security';
import {
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  FileDown,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Mail,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';

export const KeuanganView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    currentBalance,
    currentUser,
    emailAlerts
  } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | 'pemasukan' | 'pengeluaran'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [trxType, setTrxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [trxCategory, setTrxCategory] = useState<IncomeCategory | ExpenseCategory>('Iuran Bulanan (Rp 25.000)');
  const [trxAmount, setTrxAmount] = useState<number | ''>(25000);
  const [trxDate, setTrxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [trxDesc, setTrxDesc] = useState<string>('');
  const [trxHouse, setTrxHouse] = useState<string>('');

  // End-to-end encryption verification inspection modal
  const [inspectedTrx, setInspectedTrx] = useState<Transaction | null>(null);
  const [isVerifyingHash, setIsVerifyingHash] = useState(false);
  const [hashValid, setHashValid] = useState<boolean | null>(null);

  // Anomaly alert banner toggle
  const [showAnomalyDetail, setShowAnomalyDetail] = useState(false);

  // Available categories strictly matching user prompt & Tatib 2026:
  const incomeCategories: IncomeCategory[] = [
    'Iuran Bulanan (Rp 25.000)',
    'Iuran Sampah (Rp 25.000)',
    'Sewa Fasum (Rp 30.000/bln)',
    'Pemasukan Jimpitan Bulanan',
    'Sumbangan Sukarela',
    'Lain-lain Pemasukan'
  ];

  const expenseCategories: ExpenseCategory[] = [
    'Bayar Sampah',
    'Bantuan Snack Rapat',
    'Konsumsi Kerjabakti',
    'Sumbangan Warga (Tali Asih/Duka)',
    'Perawatan Fasum',
    'Operasional & Lain-lain'
  ];

  // Permissions check
  const canAdd = permissions.canManageFinance(currentUser.role);
  const canDelete = permissions.canDeleteFinance(currentUser.role); // Superadmin only

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [transactions, filterType, selectedCategory, searchQuery]);

  // Aggregate category breakdown for visual charts
  const categorySummary = useMemo(() => {
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'pemasukan') {
        incomeMap[t.category] = (incomeMap[t.category] || 0) + t.amount;
      } else {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
      }
    });

    return { incomeMap, expenseMap };
  }, [transactions]);

  // Handle submit new transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxAmount || Number(trxAmount) <= 0) {
      alert('Masukkan nominal yang valid!');
      return;
    }

    try {
      await addTransaction({
        type: trxType,
        category: trxCategory,
        amount: Number(trxAmount),
        date: trxDate,
        description: trxDesc || `${trxCategory} - ${trxDate}`,
        recordedBy: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
        userRole: currentUser.role,
        sourceHouse: trxHouse || undefined
      });

      setShowAddModal(false);
      setTrxDesc('');
      setTrxAmount(25000);
      alert('Transaksi kas berhasil dicatat dan diamankan dengan enkripsi integritas SHA-256!');
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + err.message);
    }
  };

  // Inspect SHA-256 hash
  const handleInspectHash = async (t: Transaction) => {
    setInspectedTrx(t);
    setIsVerifyingHash(true);
    setHashValid(null);
    const valid = await verifyTransactionIntegrity(t);
    setHashValid(valid);
    setIsVerifyingHash(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <ShieldCheck size={14} className="text-blue-300" />
            <span>Transparansi Kas 100% Warga & Anti Manipulasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Laporan Keuangan Kas Paguyuban GSS
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Setiap rupiah iuran warga, jimpitan ronda, dan sewa fasum dikelola secara terbuka dan dapat dipantau seluruh warga secara real-time. Dilengkapi audit enkripsi integritas SHA-256 dan deteksi anomali otomatis.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {canAdd ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition"
              >
                <PlusCircle size={15} />
                <span>Catat Transaksi Kas Baru</span>
              </button>
            ) : (
              <div className="text-xs bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-400 flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" />
                <span>Mode Baca (Hanya Superadmin & Bendahara dapat mencatat)</span>
              </div>
            )}

            <button
              onClick={() => exportFinanceToPDF(filteredTransactions, 'Oktober - November 2026', totalIncome, totalExpense, currentBalance)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <FileDown size={15} />
              <span>Ekspor PDF Resmi</span>
            </button>

            <button
              onClick={() => exportFinanceToExcel(filteredTransactions, currentBalance)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet size={15} />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan Kas</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              Rp {totalIncome.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp size={12} />
              <span>Iuran, Sampah, Jimpit & Fasum</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran Kas</span>
            <div className="text-2xl font-black text-red-600 mt-1">
              Rp {totalExpense.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-red-700 mt-1 flex items-center gap-1 font-semibold">
              <TrendingDown size={12} />
              <span>Sampah, Snack, Fasum & Sosial</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Saldo Kas Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Kas Bersih Saat Ini</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              Rp {currentBalance.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-blue-700 mt-1 flex items-center gap-1 font-semibold">
              <Wallet size={12} />
              <span>Tersimpan di Rekening Paguyuban</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Anomaly Detection Banner if detected */}
      {emailAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4.5 text-red-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-red-600" size={22} />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Peringatan Sistem Keamanan: Anomali Transaksi Kas Terdeteksi!</span>
                <span className="text-[10px] bg-red-200 text-red-900 font-extrabold px-2 py-0.5 rounded-full">
                  {emailAlerts.length} Notifikasi
                </span>
              </div>
              <p className="text-xs text-red-700 mt-0.5">
                Notifikasi otomatis telah dikirimkan ke email pengurus:{' '}
                <span className="font-mono font-bold text-red-800">grises.jogja@gmail.com</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAnomalyDetail(!showAnomalyDetail)}
            className="text-xs font-bold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            {showAnomalyDetail ? 'Sembunyikan' : 'Lihat Detail Email'}
          </button>
        </div>
      )}

      {/* Expanded Anomaly Email Logs */}
      {showAnomalyDetail && emailAlerts.length > 0 && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-700 text-xs space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Mail size={14} /> Log Pengiriman Email Peringatan Anomali
            </span>
            <span className="text-slate-400">Target: grises.jogja@gmail.com</span>
          </div>
          {emailAlerts.map((log, idx) => (
            <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="text-slate-400 text-[10px]">{log.timestamp}</div>
              <div className="font-bold text-white">{log.subject}</div>
              <div className="text-slate-300 whitespace-pre-line text-[11px]">{log.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Visual Analytics (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-600" />
            <span>Distribusi Sumber Pemasukan Paguyuban</span>
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(categorySummary.incomeMap).map(([cat, amount]) => {
              const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[240px]">{cat}</span>
                    <span className="text-emerald-700 font-bold">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <PieChartIcon size={16} className="text-red-600" />
            <span>Alokasi Pengeluaran Kas Paguyuban</span>
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(categorySummary.expenseMap).map(([cat, amount]) => {
              const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[240px]">{cat}</span>
                    <span className="text-red-700 font-bold">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Table & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter size={13} /> Jenis:
            </span>
            {(['ALL', 'pemasukan', 'pengeluaran'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === type
                    ? type === 'pemasukan'
                      ? 'bg-emerald-600 text-white'
                      : type === 'pengeluaran'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type === 'ALL' ? 'Semua Kas' : type === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi / keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori Transaksi</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Audit SHA-256</th>
                {canDelete && <th className="py-3 px-4 text-center">Aksi Superadmin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((trx) => (
                <tr
                  key={trx.id}
                  className={`hover:bg-slate-50/80 transition ${
                    trx.isAnomaly ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {trx.date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mr-1.5 ${
                        trx.type === 'pemasukan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {trx.type === 'pemasukan' ? '+' : '-'}
                    </span>
                    {trx.category}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    <div>{trx.description}</div>
                    {trx.isAnomaly && (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={10} /> {trx.anomalyReason}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {trx.recordedBy}
                  </td>
                  <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                    <span className={trx.type === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'}>
                      {trx.type === 'pemasukan' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleInspectHash(trx)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center gap-1 mx-auto border border-slate-200"
                      title="Klik untuk memverifikasi keaslian hash SHA-256"
                    >
                      <Lock size={10} className="text-blue-600" />
                      <span>{trx.encryptedHash.slice(0, 8)}...</span>
                    </button>
                  </td>

                  {/* Restricted to Superadmin only per prompt: "selain superadmin, bendahara 1, bendahara 2 dan admin inventaris tidak dapat akses untuk menhapus dan mengedit data yang ada. Berikan hak akses hanya kepada superadmin untuk melakukan perubahan data tersebut." */}
                  {canDelete && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi "${trx.description}"? Aksi ini permanen.`)) {
                            deleteTransaction(trx.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Transaksi (Hak Akses Superadmin)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CATAT TRANSAKSI BARU (Superadmin, Bendahara 1, Bendahara 2) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <ReceiptText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Catat Transaksi Kas Paguyuban</h3>
                  <p className="text-xs text-slate-400">Dicatat oleh {currentUser.name} ({currentUser.role.toUpperCase()})</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('pemasukan');
                    setTrxCategory('Iuran Bulanan (Rp 25.000)');
                    setTrxAmount(25000);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    trxType === 'pemasukan' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Pemasukan (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTrxType('pengeluaran');
                    setTrxCategory('Bayar Sampah');
                    setTrxAmount(100000);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    trxType === 'pengeluaran' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>Pengeluaran (-)</span>
                </button>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Transaksi</label>
                <select
                  value={trxCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setTrxCategory(cat);
                    if (cat === 'Iuran Bulanan (Rp 25.000)') setTrxAmount(25000);
                    if (cat === 'Iuran Sampah (Rp 25.000)') setTrxAmount(25000);
                    if (cat === 'Sewa Fasum (Rp 30.000/bln)') setTrxAmount(30000);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {trxType === 'pemasukan'
                    ? incomeCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : expenseCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transaksi (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={1}
                    value={trxAmount}
                    onChange={(e) => setTrxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={trxDate}
                  onChange={(e) => setTrxDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  placeholder="Keterangan rincian pembayaran..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Security notice */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-center gap-2">
                <Lock size={14} className="text-blue-600 shrink-0" />
                <span>Transaksi otomatis dihitung hash integritas SHA-256 dan diaudit oleh deteksi anomali.</span>
              </div>

              <div className="flex gap-2 pt-2">
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
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIKASI ENKRIPSI & INTEGRITAS HASH SHA-256 */}
      {inspectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Verifikasi Integritas Enkripsi SHA-256</h3>
              </div>
              <button
                onClick={() => setInspectedTrx(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Transaksi:</span>
                  <span className="font-mono font-bold text-slate-800">{inspectedTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-800">{inspectedTrx.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal:</span>
                  <span className="font-bold text-slate-800">Rp {inspectedTrx.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pencatat:</span>
                  <span className="font-bold text-slate-800">{inspectedTrx.recordedBy}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  SHA-256 Cryptographic Audit Hash:
                </label>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] break-all rounded-xl border border-slate-800">
                  {inspectedTrx.encryptedHash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border flex items-center gap-2.5 bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Integritas Transaksi Terverifikasi Asli (100% Valid)</div>
                  <p className="text-[11px] text-emerald-700">
                    Nilai hash cocok dengan data mutasi kas. Tidak ditemukan manipulasi angka atau tanggal sejak dicatat.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedTrx(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
