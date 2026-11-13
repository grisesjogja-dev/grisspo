import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Mail, XCircle, ShieldCheck, CheckCircle } from 'lucide-react';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({ isOpen, onClose }) => {
  const { emailAlerts, clearEmailAlerts, currentUser, confirmAction } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-red-950 text-white p-5 flex items-center justify-between border-b border-red-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/40 flex items-center justify-center border border-red-500/30">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-200">Log Email Peringatan Anomali Kas</h3>
              <p className="text-xs text-red-300">Terkirim otomatis ke: grises.jogja@gmail.com</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-white p-1">
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <Mail size={16} className="text-red-600 shrink-0" />
            <span>
              Sistem keamanan GRISSPO memantau mutasi kas secara terus menerus. Transaksi di atas Rp 1.500.000 atau nominal tidak lazim akan otomatis mengirimkan peringatan ke email pengurus.
            </span>
          </div>

          {emailAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <CheckCircle size={32} className="mx-auto text-emerald-500" />
              <div className="font-bold text-sm text-slate-700">Tidak Ada Anomali Keuangan</div>
              <p className="text-xs text-slate-500">
                Seluruh transaksi kas paguyuban tercatat wajar dan sesuai dengan batas standar RT.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {emailAlerts.map((log, idx) => (
                <div key={idx} className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <Mail size={12} /> STATUS: TERKIRIM
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="text-white font-bold text-xs">{log.subject}</div>
                  <div className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {log.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          {currentUser?.role === 'superadmin' && emailAlerts.length > 0 && (
            <button
              onClick={() => {
                confirmAction({
                  title: 'Hapus Log Anomali Email',
                  message: 'Bersihkan seluruh log anomali email ini?',
                  confirmLabel: 'Setuju',
                  cancelLabel: 'Batal',
                  variant: 'danger',
                  onConfirm: () => clearEmailAlerts()
                });
              }}
              className="py-2.5 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition"
            >
              Hapus Semua Log (Superadmin)
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Tutup Log Anomali
          </button>
        </div>
      </div>
    </div>
  );
};
