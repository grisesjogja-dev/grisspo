import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { fasumFacilities } from '../data/seedData';
import {
  FasumBooking,
  FasumFacilityConfig,
  FasumFacilityType,
  FasumTimeSlot,
  FasumPaymentMethod
} from '../types';
import {
  Building2,
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  QrCode,
  DollarSign,
  User,
  Home,
  CheckCircle2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  CalendarCheck,
  Filter,
  Trash2,
  FileText,
  BadgePercent
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FasumBookingView: React.FC = () => {
  const {
    fasumBookings,
    addFasumBooking,
    confirmFasumPayment,
    updateFasumBookingStatus,
    deleteFasumBooking,
    currentUser: authUser,
    residents,
    totalIncome
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  // Tab state: 'katalog' | 'jadwal' | 'pemesanan_saya' | 'semua_pemesanan'
  const [activeTab, setActiveTab] = useState<'katalog' | 'jadwal' | 'pemesanan_saya' | 'semua_pemesanan'>('katalog');

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FasumFacilityConfig | null>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<FasumBooking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<FasumBooking | null>(null);

  // Form states
  const [formFacilityId, setFormFacilityId] = useState<FasumFacilityType>('balai_warga');
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [formTimeSlot, setFormTimeSlot] = useState<FasumTimeSlot>('pagi');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formPurpose, setFormPurpose] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<FasumPaymentMethod>('qris');
  const [formNotes, setFormNotes] = useState('');
  const [targetResidentHouse, setTargetResidentHouse] = useState(currentUser.houseNumber);

  // Filter states for lists
  const [filterFacility, setFilterFacility] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Privileges
  const isBendaharaOrAdmin = ['superadmin', 'bendahara1', 'bendahara2'].includes(currentUser.role);
  const isSuperadmin = currentUser.role === 'superadmin';

  // Compute facility configuration map
  const facilityConfigMap = useMemo(() => {
    const map = new Map<string, FasumFacilityConfig>();
    fasumFacilities.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  // Calculate quick stats
  const stats = useMemo(() => {
    const approved = fasumBookings.filter((b) => b.status === 'disetujui' || b.paymentStatus === 'lunas');
    const totalRevenue = approved.reduce((sum, b) => sum + b.rentalFee, 0);
    const myBookingsCount = fasumBookings.filter((b) => b.residentHouse === currentUser.houseNumber).length;
    const pendingCount = fasumBookings.filter((b) => b.status === 'menunggu_konfirmasi').length;
    return {
      totalBookings: fasumBookings.length,
      approvedCount: approved.length,
      pendingCount,
      totalRevenue,
      myBookingsCount
    };
  }, [fasumBookings, currentUser.houseNumber]);

  // Check collision for the selected date & facility
  const collisionWarning = useMemo(() => {
    if (!formDate || !formFacilityId) return null;
    const existing = fasumBookings.find(
      (b) =>
        b.facilityType === formFacilityId &&
        b.date === formDate &&
        (b.status === 'disetujui' || b.status === 'menunggu_konfirmasi') &&
        (b.timeSlot === formTimeSlot || b.timeSlot === 'seharian' || formTimeSlot === 'seharian')
    );
    if (existing) {
      return `Perhatian: Fasilitas ini sudah memiliki reservasi pada tanggal ${existing.date} (${existing.startTime} - ${existing.endTime}) oleh ${existing.residentName} (${existing.residentHouse}). Silakan pilih jam atau tanggal lain.`;
    }
    return null;
  }, [fasumBookings, formDate, formFacilityId, formTimeSlot]);

  // Get active facility fee
  const currentSelectedFacilityConfig = facilityConfigMap.get(formFacilityId) || fasumFacilities[0];
  const calculatedRentalFee = currentSelectedFacilityConfig.defaultFee;

  // Handle open booking modal with specific facility
  const handleOpenBooking = (facility?: FasumFacilityConfig) => {
    if (facility) {
      setFormFacilityId(facility.id);
      setSelectedFacility(facility);
    } else {
      setSelectedFacility(fasumFacilities[0]);
    }
    setFormPurpose('');
    setFormNotes('');
    setFormPaymentMethod('qris');
    setShowBookingModal(true);
  };

  // Submit new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPurpose.trim()) {
      alert('Mohon isi keperluan acara pemakaian fasilitas umum.');
      return;
    }

    const resident = residents.find((r) => r.houseNumber === targetResidentHouse) || {
      id: currentUser.id,
      name: currentUser.name,
      houseNumber: currentUser.houseNumber,
      phone: '0812-3456-7800'
    };

    const newBooking = await addFasumBooking({
      facilityType: formFacilityId,
      facilityName: currentSelectedFacilityConfig.name,
      date: formDate,
      timeSlot: formTimeSlot,
      startTime: formStartTime,
      endTime: formEndTime,
      purpose: formPurpose,
      residentId: resident.id,
      residentName: resident.name,
      residentHouse: resident.houseNumber,
      residentPhone: resident.phone || '0812-3456-7800',
      rentalFee: calculatedRentalFee,
      paymentMethod: formPaymentMethod,
      paymentStatus: 'menunggu_pembayaran',
      status: 'menunggu_konfirmasi',
      notes: formNotes
    });

    setShowBookingModal(false);

    // Open Payment Modal immediately for easy resident payment!
    setPaymentModalBooking(newBooking);
  };

  // Simulate Instant Payment (QRIS / Bank)
  const handleInstantPay = async (booking: FasumBooking) => {
    try {
      await confirmFasumPayment(booking.id, `${currentUser.name} (Verifikasi Otomatis)`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setPaymentModalBooking(null);
      // Auto open receipt
      const updated = {
        ...booking,
        paymentStatus: 'lunas' as const,
        status: 'disetujui' as const,
        paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        approvedBy: `${currentUser.name} (Kas Masuk)`
      };
      setReceiptModalBooking(updated);
    } catch (err) {
      alert('Gagal memproses pembayaran fasum: ' + err);
    }
  };

  // Filtered bookings for management / list
  const filteredBookings = useMemo(() => {
    return fasumBookings.filter((b) => {
      const matchFacility = filterFacility === 'ALL' || b.facilityType === filterFacility;
      const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
      return matchFacility && matchStatus;
    });
  }, [fasumBookings, filterFacility, filterStatus]);

  // My bookings
  const myBookings = useMemo(() => {
    return fasumBookings.filter(
      (b) => b.residentHouse === currentUser.houseNumber || b.residentName.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [fasumBookings, currentUser]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-xs font-semibold">
              <Building2 size={14} className="text-blue-300" />
              <span>Sewa Fasum & Terintegrasi Kas Otomatis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pemesanan Fasilitas Umum (Fasum) GSS
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Warga Perumahan Griya Sedayu Selaras dapat menyewa Balai Pertemuan, Lapangan Badminton, Gazebo, Tenda & Kursi Paguyuban. Pembayaran sewa secara otomatis masuk ke Buku Kas Paguyuban Warga.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleOpenBooking()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transition active:scale-95 text-sm"
            >
              <PlusCircle size={18} />
              <span>Pesan Fasum Sekarang</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Total Pemasukan Kas</p>
            <p className="text-lg sm:text-2xl font-black text-amber-300 mt-1">
              Rp {stats.totalRevenue.toLocaleString('id-ID')}
            </p>
            <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={11} /> Masuk kas bendahara
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Reservasi Disetujui</p>
            <p className="text-lg sm:text-2xl font-black text-white mt-1">{stats.approvedCount} Acara</p>
            <span className="text-[10px] text-slate-300">Dari {stats.totalBookings} total reservasi</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Menunggu Konfirmasi</p>
            <p className="text-lg sm:text-2xl font-black text-amber-300 mt-1">{stats.pendingCount} Reservasi</p>
            <span className="text-[10px] text-amber-200">Perlu verifikasi bendahara</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/10">
            <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Pemesanan Rumah Anda</p>
            <p className="text-lg sm:text-2xl font-black text-blue-200 mt-1">{stats.myBookingsCount} Acara</p>
            <span className="text-[10px] text-slate-300">Rumah {currentUser.houseNumber}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('katalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'katalog'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 size={16} />
          <span>Fasilitas & Tarif Sewa</span>
        </button>

        <button
          onClick={() => setActiveTab('jadwal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'jadwal'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CalendarCheck size={16} />
          <span>Jadwal & Ketersediaan</span>
        </button>

        <button
          onClick={() => setActiveTab('pemesanan_saya')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition relative ${
            activeTab === 'pemesanan_saya'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Home size={16} />
          <span>Pemesanan Saya</span>
          {myBookings.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
              {myBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('semua_pemesanan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'semua_pemesanan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle size={16} />
          <span>Kelola Semua Reservasi</span>
          {stats.pendingCount > 0 && (
            <span className="bg-red-500 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
              {stats.pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: KATALOG FASILITAS & TARIF */}
      {activeTab === 'katalog' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800">Katalog Fasilitas Paguyuban GSS</h2>
              <p className="text-xs text-slate-500">Tarif sewa resmi yang disepakati musyawarah warga Griya Sedayu Selaras 2026.</p>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
              <BadgePercent size={15} />
              <span>Pendapatan sewa fasum 100% dialokasikan ke Kas Perawatan Fasum</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fasumFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Facility Card Top */}
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${facility.badgeColor}`}>
                        {facility.category}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Biaya Sewa</span>
                        <span className="text-xl font-black text-blue-700">
                          Rp {facility.defaultFee.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ {facility.unit}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-3 leading-snug">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {facility.description}
                    </p>

                    <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <User size={13} className="text-slate-500" />
                        <span>Kapasitas: {facility.capacity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Included Items */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Fasilitas & Perlengkapan</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {facility.facilitiesIncluded.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Info size={14} className="text-amber-600" />
                        <span>Aturan Pemakaian</span>
                      </h4>
                      <ul className="space-y-1">
                        {facility.rules.slice(0, 2).map((rule, idx) => (
                          <li key={idx} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                            <span className="text-slate-400">-</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleOpenBooking(facility)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm shadow-blue-500/20 transition active:scale-95 text-xs sm:text-sm"
                  >
                    <CalendarCheck size={16} />
                    <span>Pilih Tanggal & Pesan Sekarang</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL & KETERSEDIAAN KALENDER */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Jadwal Pemakaian Fasum Terjadwal</h3>
                <p className="text-xs text-slate-500">
                  Pantau reservasi fasilitas umum yang sudah disetujui atau sedang dalam proses verifikasi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenBooking()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <PlusCircle size={14} />
                  <span>Buat Reservasi Baru</span>
                </button>
              </div>
            </div>

            {/* List of active bookings ordered chronologically */}
            <div className="space-y-3 pt-2">
              {fasumBookings
                .filter((b) => b.status === 'disetujui' || b.status === 'menunggu_konfirmasi')
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((booking) => {
                  const facility = facilityConfigMap.get(booking.facilityType);
                  const isApproved = booking.status === 'disetujui';
                  return (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isApproved
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-2xl ${
                            isApproved ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          <Calendar size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{booking.facilityName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isApproved ? 'Telah Dikonfirmasi (Disetujui)' : 'Menunggu Konfirmasi Bayar'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">
                            Acara: <span className="font-bold">{booking.purpose}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-blue-600" />
                              <strong className="text-slate-800">{booking.date}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{booking.startTime} - {booking.endTime} WIB</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Home size={12} className="text-slate-400" />
                              <span>Pemesan: {booking.residentName} ({booking.residentHouse})</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Biaya Sewa</span>
                          <span className="text-sm font-bold text-blue-700">
                            Rp {booking.rentalFee.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {booking.paymentStatus === 'lunas' ? (
                          <button
                            onClick={() => setReceiptModalBooking(booking)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <Printer size={13} />
                            <span>Kuitansi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPaymentModalBooking(booking)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
                          >
                            Bayar Sekarang
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {fasumBookings.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <CalendarCheck size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada pemesanan fasum yang terjadwal.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PEMESANAN SAYA */}
      {activeTab === 'pemesanan_saya' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Pemesanan Fasum Saya (Rumah {currentUser.houseNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar reservasi fasilitas umum yang Anda ajukan, status pembayaran kas, dan kuitansi digital resmi.
                </p>
              </div>

              <button
                onClick={() => handleOpenBooking()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <PlusCircle size={15} />
                <span>Pesan Fasum Baru</span>
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Home size={42} className="mx-auto opacity-40 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700">
                  Rumah Anda ({currentUser.houseNumber}) belum memiliki pemesanan fasilitas umum aktif.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gunakan fasilitas paguyuban untuk arisan warga, syukuran, kegiatan olahraga, atau rapat komunitas dengan tarif terjangkau.
                </p>
                <button
                  onClick={() => handleOpenBooking()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2"
                >
                  <PlusCircle size={15} />
                  <span>Ajukan Pemesanan Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => {
                  const isPaid = booking.paymentStatus === 'lunas';
                  return (
                    <div
                      key={booking.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-base">{booking.facilityName}</span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isPaid ? 'LUNAS (Otomatis Masuk Kas)' : 'MENUNGGU PEMBAYARAN'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700">
                          Keperluan: <strong className="text-slate-900">{booking.purpose}</strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar size={13} className="text-blue-600" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            {booking.startTime} - {booking.endTime} WIB ({booking.timeSlot})
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={13} className="text-slate-400" />
                            Metode: <strong className="capitalize">{booking.paymentMethod.replace('_', ' ')}</strong>
                          </span>
                        </div>

                        {booking.e2eHash && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1">
                            <ShieldCheck size={12} className="text-emerald-600" />
                            <span>Integrity Hash: {booking.e2eHash.substring(0, 16)}...</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Biaya Sewa</span>
                          <span className="text-lg font-black text-blue-700">
                            Rp {booking.rentalFee.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <button
                              onClick={() => setReceiptModalBooking(booking)}
                              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Printer size={14} />
                              <span>Cetak Kuitansi</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setPaymentModalBooking(booking)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                            >
                              <QrCode size={15} />
                              <span>Bayar Kas Sekarang</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA SEMUA RESERVASI (PENGURUS & WARGA) */}
      {activeTab === 'semua_pemesanan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kelola Seluruh Reservasi Fasum</h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh pemesanan fasilitas umum oleh warga. Bendahara dan Superadmin dapat memverifikasi pembayaran dan mengelola status.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterFacility}
                  onChange={(e) => setFilterFacility(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">Semua Fasilitas</option>
                  {fasumFacilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>
            </div>

            {/* Bookings Table / Cards */}
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const isPaid = booking.paymentStatus === 'lunas';
                return (
                  <div
                    key={booking.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{booking.facilityName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPaid ? 'LUNAS (Kas Masuk)' : 'BELUM DIBAYAR'}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                          Status: {booking.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700">
                        Warga: <strong className="text-slate-900">{booking.residentName}</strong> (Rumah {booking.residentHouse}) &bull; Acara: <em>{booking.purpose}</em>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Tanggal: <strong>{booking.date}</strong></span>
                        <span>Waktu: {booking.startTime} - {booking.endTime} WIB</span>
                        <span>Metode: {booking.paymentMethod}</span>
                        {booking.approvedBy && (
                          <span className="text-blue-600 font-medium">Verifikator: {booking.approvedBy}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <span className="text-sm font-black text-blue-700">
                          Rp {booking.rentalFee.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {isPaid ? (
                          <button
                            onClick={() => setReceiptModalBooking(booking)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                            title="Cetak Kuitansi Resmi"
                          >
                            <Printer size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPaymentModalBooking(booking)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            Bayar / Verifikasi
                          </button>
                        )}

                        {isBendaharaOrAdmin && !isPaid && (
                          <button
                            onClick={() => confirmFasumPayment(booking.id, `${currentUser.name} (${currentUser.role})`)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            title="Konfirmasi Pembayaran dan Masukkan ke Kas Paguyuban"
                          >
                            Setujui & Masuk Kas
                          </button>
                        )}

                        {isSuperadmin && (
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus reservasi fasum ini?')) {
                                deleteFasumBooking(booking.id);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition"
                            title="Hapus Pemesanan (Superadmin)"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBookings.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">Tidak ada data pemesanan yang sesuai filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORMULIR PEMESANAN FASUM BARU */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
              <button
                onClick={() => setShowBookingModal(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <XCircle size={22} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/30 rounded-2xl border border-blue-400/30">
                  <CalendarCheck size={24} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Formulir Pemesanan Fasum GSS</h3>
                  <p className="text-xs text-blue-200">
                    Pilih fasilitas, tanggal, waktu, dan metode pembayaran otomatis kas.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Collision warning banner */}
              {collisionWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-medium">{collisionWarning}</p>
                </div>
              )}

              {/* 1. Pilih Fasilitas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Jenis Fasilitas Umum yang Disewa
                </label>
                <select
                  value={formFacilityId}
                  onChange={(e) => setFormFacilityId(e.target.value as FasumFacilityType)}
                  className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {fasumFacilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} &bull; Rp {f.defaultFee.toLocaleString('id-ID')} ({f.unit})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kapasitas: {currentSelectedFacilityConfig.capacity} &bull; {currentSelectedFacilityConfig.description}
                </p>
              </div>

              {/* 2. Tanggal Pemakaian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Tanggal Sewa
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Sesi Waktu
                  </label>
                  <select
                    value={formTimeSlot}
                    onChange={(e) => {
                      const slot = e.target.value as FasumTimeSlot;
                      setFormTimeSlot(slot);
                      if (slot === 'pagi') {
                        setFormStartTime('08:00');
                        setFormEndTime('12:00');
                      } else if (slot === 'siang') {
                        setFormStartTime('13:00');
                        setFormEndTime('17:00');
                      } else if (slot === 'malam') {
                        setFormStartTime('18:30');
                        setFormEndTime('22:00');
                      } else if (slot === 'seharian') {
                        setFormStartTime('08:00');
                        setFormEndTime('22:00');
                      }
                    }}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="pagi">Pagi (08:00 - 12:00 WIB)</option>
                    <option value="siang">Siang (13:00 - 17:00 WIB)</option>
                    <option value="malam">Malam (18:30 - 22:00 WIB)</option>
                    <option value="seharian">Seharian Penuh (08:00 - 22:00 WIB)</option>
                    <option value="custom">Kustom Jam Khusus</option>
                  </select>
                </div>
              </div>

              {/* Custom Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              {/* 3. Keperluan Acara */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  4. Keperluan / Jenis Acara
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Arisan Ibu-Ibu RT Blok A, Syukuran Keluarga, Turnamen Badminton"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4. Pemesan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    5. Rumah Pemesan
                  </label>
                  <select
                    value={targetResidentHouse}
                    onChange={(e) => setTargetResidentHouse(e.target.value)}
                    className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {residents.map((r) => (
                      <option key={r.id} value={r.houseNumber}>
                        {r.houseNumber} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6. Metode Pembayaran
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as FasumPaymentMethod)}
                    className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="qris">QRIS Paguyuban GSS (Instan)</option>
                    <option value="transfer_bank">Transfer Bank BPD DIY Paguyuban</option>
                    <option value="tunai_bendahara">Tunai ke Bendahara 2 (Bpk. Robi C15)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Kebutuhan meja tambahan, sound system, atau koordinasi kunci fasum..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Total Biaya Sewa Fasum</span>
                  <span className="text-2xl font-black text-blue-700">
                    Rp {calculatedRentalFee.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">
                    +25 GRISS-Poin untuk Warga
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Lanjut ke Pembayaran</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PEMBAYARAN INTERAKTIF & SIMULASI INSTAN */}
      {paymentModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 relative">
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <XCircle size={20} />
              </button>
              <div className="flex items-center gap-2.5">
                <QrCode size={22} className="text-amber-400" />
                <div>
                  <h3 className="text-base font-bold">Pembayaran Sewa Fasum GSS</h3>
                  <p className="text-xs text-blue-200">Integrasi otomatis dengan Kas Paguyuban</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Booking Brief */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Fasilitas</span>
                  <span className="font-bold text-slate-800">{paymentModalBooking.facilityName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tanggal & Jam</span>
                  <span className="font-bold text-slate-800">
                    {paymentModalBooking.date} ({paymentModalBooking.startTime} - {paymentModalBooking.endTime} WIB)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Pemesan</span>
                  <span className="font-bold text-slate-800">
                    {paymentModalBooking.residentName} ({paymentModalBooking.residentHouse})
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Total Biaya Sewa</span>
                  <span className="text-xl font-black text-blue-700">
                    Rp {paymentModalBooking.rentalFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* QRIS / Transfer Card */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl border border-blue-200 space-y-3">
                <div className="inline-block bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  {/* Visual QR Code Representation */}
                  <div className="w-40 h-40 mx-auto bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="w-full h-full bg-white rounded-lg p-2 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-black rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-black" />
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-black rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-black" />
                          </div>
                        </div>
                      </div>
                      <div className="text-center my-1">
                        <span className="text-[9px] font-black tracking-widest text-slate-900 block">QRIS</span>
                        <span className="text-[7px] text-blue-700 font-bold block">PAGUYUBAN GSS</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-8 h-8 bg-black rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-black" />
                          </div>
                        </div>
                        <div className="w-8 h-8 grid grid-cols-2 gap-0.5 p-1 bg-slate-100">
                          <div className="bg-black" />
                          <div className="bg-white" />
                          <div className="bg-black" />
                          <div className="bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900">QRIS Kas Paguyuban Griya Sedayu Selaras</p>
                  <p className="text-[11px] text-slate-500">
                    NMID: ID102435678891 &bull; Bank BPD DIY No. Rek: <strong>006-211-098877</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleInstantPay(paymentModalBooking)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} className="text-amber-300" />
                  <span>Simulasi Bayar Sekarang (Auto-Masuk Kas)</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Mengklik tombol di atas akan mensimulasikan pelunasan sewa, otomatis mencatat pemasukan kas Rp {paymentModalBooking.rentalFee.toLocaleString('id-ID')} dan menerbitkan kuitansi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KUITANSI DIGITAL RESMI SEWA FASUM */}
      {receiptModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-300" />
                <h3 className="text-base font-bold">Kuitansi Resmi Pembayaran Sewa Fasum</h3>
              </div>
              <button
                onClick={() => setReceiptModalBooking(null)}
                className="text-white/70 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 space-y-4 bg-slate-50 text-slate-800">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 relative">
                {/* Stamp */}
                <div className="absolute right-4 top-8 border-2 border-emerald-600 text-emerald-700 font-black text-xs px-3 py-1 rounded-lg rotate-[-12deg] tracking-widest opacity-85 pointer-events-none">
                  LUNAS / VERIFIED
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-black tracking-widest uppercase text-slate-900">
                    PAGUYUBAN WARGA GRIYA SEDAYU SELARAS 1
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Argorejo, Sedayu, Bantul, D.I. Yogyakarta 55752 &bull; GRISSPO Portal
                  </p>
                  <p className="text-[10px] text-blue-600 font-mono mt-1">
                    No. Bukti Kas: BKK-FSM/{receiptModalBooking.id.toUpperCase()}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telah Terima Dari:</span>
                    <span className="font-bold text-slate-900">
                      {receiptModalBooking.residentName} (Rumah {receiptModalBooking.residentHouse})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Untuk Sewa Fasum:</span>
                    <span className="font-bold text-slate-900">{receiptModalBooking.facilityName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Pelaksanaan:</span>
                    <span className="font-bold text-slate-900">{receiptModalBooking.date}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu & Sesi:</span>
                    <span className="font-bold text-slate-900">
                      {receiptModalBooking.startTime} - {receiptModalBooking.endTime} WIB
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Keperluan:</span>
                    <span className="font-bold text-slate-900">{receiptModalBooking.purpose}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Pembayaran:</span>
                    <span className="font-bold text-slate-900">
                      {receiptModalBooking.paymentDate || 'Hari ini'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-bold capitalize">{receiptModalBooking.paymentMethod}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Jumlah Pembayaran</span>
                  <span className="text-xl font-black text-emerald-700">
                    Rp {receiptModalBooking.rentalFee.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100">
                  <span>SHA-256: {receiptModalBooking.e2eHash || 'a90f12c84...'}</span>
                  <span>Otorisasi: Bendahara Paguyuban GSS</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setReceiptModalBooking(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
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
