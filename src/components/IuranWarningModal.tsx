import React, { useState } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import {
  AlertTriangle,
  X,
  Phone,
  CreditCard,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IuranWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IuranWarningModal: React.FC<IuranWarningModalProps> = ({ isOpen, onClose }) => {
  const { currentUser: authUser, residents, updateResident, addTransaction, awardPoints, addAnnouncement } = useApp();
  const currentUser = authUser || defaultGuestUser;
  const [isPayingNow, setIsPayingNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | 'cash'>('qris');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !authUser) return null;

  // Find full resident record for current user
  const resident = residents.find(
    (r) =>
      r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase() ||
      r.id === currentUser.id
  );

  const unpaidMonths = resident?.iuranUnpaidMonths || 0;
  const isOverdue = unpaidMonths >= 2;

  if (!isOpen || !resident || !isOverdue) return null;

  const totalDue = unpaidMonths * 25000;
  const monthListStr =
    resident.unpaidMonthNames && resident.unpaidMonthNames.length > 0
      ? resident.unpaidMonthNames.join(', ')
      : `${unpaidMonths} bulan terakhir`;

  // Pre-generate WhatsApp message for Bendahara
  const waMessage = encodeURIComponent(
    `Halo Bendahara Paguyuban GSS, saya ${resident.name} (Rumah ${resident.houseNumber}) ingin mengonfirmasi/melunasi tunggakan iuran bulanan saya sebesar Rp ${totalDue.toLocaleString('id-ID')} (${unpaidMonths} bulan: ${monthListStr}). Mohon nomor rekening/QRIS kas paguyuban.`
  );

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);

      // Record transaction into kas paguyuban
      await addTransaction({
        type: 'pemasukan',
        category: 'Iuran Bulanan (Rp 25.000)',
        amount: totalDue,
        date: dateStr,
        description: `Pelunasan Tunggakan Iuran Bulanan (${unpaidMonths} Bulan: ${monthListStr}) oleh ${resident.name} (${resident.houseNumber}) via ${paymentMethod.toUpperCase()}`,
        recordedBy: `${currentUser.name} (Mandiri via Portal)`,
        userRole: currentUser.role,
        sourceHouse: resident.houseNumber
      });

      // Update resident record to clear arrears
      await updateResident({
        ...resident,
        iuranUnpaidMonths: 0,
        unpaidMonthNames: [],
        monthlyIuranPaid: true
      });

      // Award loyalty points
      awardPoints(resident.id, 25, `Pelunasan tunggakan iuran ${unpaidMonths} bulan via ${paymentMethod.toUpperCase()}`);

      addAnnouncement(
        `Pelunasan Iuran Paguyuban: ${resident.name} (${resident.houseNumber})`,
        `Warga ${resident.name} (${resident.houseNumber}) telah melunasi kewajiban iuran bulanan sebesar Rp ${totalDue.toLocaleString('id-ID')} (${unpaidMonths} bulan). Status warga kini TERTIB & LUNAS.`,
        'Keuangan',
        false
      );

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setPaymentSuccess(true);
    } catch (err: any) {
      alert('Terjadi kesalahan saat memproses pembayaran: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500 animate-in zoom-in-95 duration-200">
        {/* Warning Banner Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            title="Tutup Peringatan"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert size={28} className="text-amber-300" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-black/30 text-amber-200 text-[10px] font-extrabold uppercase tracking-wide border border-amber-300/30">
                Peringatan Resmi Sistem GRISSPO
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Pemberitahuan Tunggakan Iuran Warga
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Alhamdulillah! Pembayaran Berhasil</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                  Tunggakan iuran {unpaidMonths} bulan Anda (Rp {totalDue.toLocaleString('id-ID')}) telah lunas dan tercatat otomatis di Buku Kas Paguyuban.
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  Status Akun: Tertib & Bebas Sanksi Tata Tertib
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup Peringatan & Lanjutkan ke Portal
              </button>
            </div>
          ) : isPayingNow ? (
            /* Inline Quick Payment Flow */
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-500">Konfirmasi Pelunasan Iuran:</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  Rp {totalDue.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Untuk {unpaidMonths} Bulan: <strong>{monthListStr}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'qris'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode size={18} className="text-blue-600" />
                    <span>QRIS Kas GSS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={18} className="text-emerald-600" />
                    <span>Transfer BCA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign size={18} className="text-amber-600" />
                    <span>Tunai Bendahara</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'qris' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-center space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 block">QRIS Paguyuban Perum GSS 1</span>
                  <div className="w-28 h-28 bg-white p-2 rounded-xl border border-blue-300 mx-auto shadow-xs flex items-center justify-center">
                    <QrCode size={92} className="text-slate-800" />
                  </div>
                  <p className="text-[11px] text-blue-700">NMID: ID1026008129 &bull; Terhubung ke Buku Kas</p>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-emerald-900 block">Rekening Kas Paguyuban:</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">BCA: 824-001-9988</p>
                  <p className="text-slate-600">a.n. KAS PAGUYUBAN GRIYA SEDAYU SELARAS</p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1 text-amber-900">
                  <span className="font-bold block">Pembayaran Tunai Langsung:</span>
                  <p className="text-slate-600">
                    Dapat diserahkan langsung ke <strong>Bpk. Ahmad (Rumah B 02)</strong> atau <strong>Bpk. Robi (Rumah C 15)</strong> saat patroli atau pertemuan warga.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayingNow(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Memproses...' : `Konfirmasi Pelunasan (Rp ${totalDue.toLocaleString('id-ID')})`}
                </button>
              </div>
            </div>
          ) : (
            /* Warning Message View */
            <>
              {/* Resident Arrears Box */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-red-200">
                  <span className="text-slate-600">Nama Warga / Kepala Keluarga:</span>
                  <strong className="text-slate-900">{resident.name}</strong>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-red-200">
                  <span className="text-slate-600">Nomor Rumah:</span>
                  <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {resident.houseNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-red-200">
                  <span className="text-slate-600">Lama Tunggakan:</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px]">
                    {unpaidMonths} BULAN BERTURUT-TURUT
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-red-200">
                  <span className="text-slate-600">Rincian Periode Menunggak:</span>
                  <span className="font-semibold text-red-700">{monthListStr}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-bold text-slate-800">Total Tagihan Iuran:</span>
                  <span className="font-black text-red-600 text-base">
                    Rp {totalDue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tata Tertib 2026 Warning Clause */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle size={15} className="text-amber-600" />
                  <span>Ketentuan Tata Tertib Warga Perum GSS 2026:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Berdasarkan Tata Tertib 2026, warga dengan tunggakan iuran bulanan &ge; 2 bulan berturut-turut akan menerima notifikasi otomatis ke nomor WhatsApp dan dikenakan pembatasan sementara peminjaman aset inventaris serta fasilitas umum hingga seluruh tunggakan diselesaikan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayingNow(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  <CreditCard size={15} />
                  <span>Lunasi Iuran Sekarang (Rp {totalDue.toLocaleString('id-ID')})</span>
                  <ArrowRight size={14} />
                </button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href={`https://api.whatsapp.com/send?phone=6281234567802&text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <Phone size={13} className="text-emerald-600" />
                    <span>WA Bendahara 1 (B02)</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?phone=6281234567815&text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <Phone size={13} className="text-emerald-600" />
                    <span>WA Bendahara 2 (C15)</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
                >
                  Saya Mengerti & Akan Segera Membayar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
