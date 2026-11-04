import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  X,
  Shield,
  Smartphone,
  Laptop,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Radio
} from 'lucide-react';
import { UserRole } from '../types';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeSessions, kickSession } = useApp();
  const [filterRole, setFilterRole] = useState<'all' | 'pengurus' | 'warga'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperadmin = currentUser?.role === 'superadmin';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'SUPERADMIN', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'bendahara1':
        return { label: 'BENDAHARA 1', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'bendahara2':
        return { label: 'BENDAHARA 2', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'admin_inventaris':
        return { label: 'ADMIN INVENTARIS', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'WARGA GSS', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Baru saja';
    try {
      const time = new Date(isoString).getTime();
      const diffSec = Math.floor((Date.now() - time) / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)} detik lalu`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} menit lalu`;
      const diffHour = Math.floor(diffMin / 60);
      return `${diffHour} jam lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  const formatClockTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '-';
    }
  };

  const handleKick = async (sessionUserId: string, residentName: string, houseNumber: string) => {
    if (!window.confirm(`Konfirmasi Putuskan Sesi:\nApakah Anda yakin ingin memutuskan akses login paksa untuk akun ${residentName} (Rumah ${houseNumber})?`)) {
      return;
    }

    setKickingId(sessionUserId);
    try {
      await kickSession(sessionUserId);
      setFeedback(`Sesi ${residentName} (${houseNumber}) berhasil diputuskan.`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (e) {
      alert('Gagal memutuskan sesi: ' + (e instanceof Error ? e.message : 'Terjadi kesalahan'));
    } finally {
      setKickingId(null);
    }
  };

  const filteredSessions = activeSessions.filter((s) => {
    // Role filter
    if (filterRole === 'pengurus') {
      if (s.role === 'warga') return false;
    } else if (filterRole === 'warga') {
      if (s.role !== 'warga') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchHouse = s.houseNumber.toLowerCase().includes(q);
      const matchRole = s.role.toLowerCase().includes(q);
      return matchName || matchHouse || matchRole;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Radio size={20} className="animate-pulse text-emerald-400" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Monitoring Pengguna Online</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {activeSessions.length} Sedang Login
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 pl-1">
              Khusus Superadmin: Memantau siapa saja warga & pengurus yang saat ini sedang mengakses portal GRISSPO.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Security Info Notice */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Keamanan Otomatis:</strong> Sesi pengguna yang tidak aktif selama <strong>30 menit</strong> otomatis di-logout dan dikeluarkan dari daftar ini demi keamanan portal.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded font-bold shrink-0">
            Real-Time Sync
          </span>
        </div>

        {/* Action feedback */}
        {feedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterRole === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({activeSessions.length})
            </button>
            <button
              onClick={() => setFilterRole('pengurus')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterRole === 'pengurus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pengurus ({activeSessions.filter((s) => s.role !== 'warga').length})
            </button>
            <button
              onClick={() => setFilterRole('warga')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                filterRole === 'warga'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Warga ({activeSessions.filter((s) => s.role === 'warga').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, rumah, role..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sessions Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Tidak ada sesi login yang sesuai filter</p>
              <p className="text-xs text-slate-400">
                Pengguna yang sedang aktif login di portal akan otomatis tampil di sini secara real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredSessions.map((session) => {
                const badge = getRoleBadge(session.role);
                const isCurrentSelf = currentUser?.id === session.userId;
                const isMobile = (session.deviceInfo || '').toLowerCase().includes('mobile') || (session.deviceInfo || '').toLowerCase().includes('smartphone');

                return (
                  <div
                    key={session.sessionId || session.userId}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrentSelf
                        ? 'bg-blue-50/70 border-blue-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* User Identity */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm">
                          {session.name ? session.name.slice(0, 2) : 'GS'}
                        </div>
                        {/* Green Active Dot */}
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            {session.name}
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            Rumah {session.houseNumber}
                          </span>
                          {isCurrentSelf && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                              Sesi Anda
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className={`px-2 py-0.2 rounded border text-[9px] font-bold uppercase ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="flex items-center gap-1">
                            {isMobile ? <Smartphone size={12} className="text-slate-400" /> : <Laptop size={12} className="text-slate-400" />}
                            <span>{session.deviceInfo || 'Web Browser'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamps & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right space-y-0.5">
                        <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1 sm:justify-end">
                          <Clock size={11} className="text-slate-400" />
                          <span>Login: {formatClockTime(session.loginTime)}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          Aktif: {formatRelativeTime(session.lastActive)}
                        </div>
                      </div>

                      {/* Superadmin Kick Session Action */}
                      {isSuperadmin && (
                        <div>
                          {isCurrentSelf ? (
                            <button
                              disabled
                              className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed"
                            >
                              Sesi Aktif
                            </button>
                          ) : (
                            <button
                              onClick={() => handleKick(session.userId, session.name, session.houseNumber)}
                              disabled={kickingId === session.userId}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                              title="Putuskan sesi login akun ini secara paksa"
                            >
                              <LogOut size={13} />
                              <span>{kickingId === session.userId ? 'Memproses...' : 'Putuskan'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Total sesi terhubung: <strong>{activeSessions.length} pengguna</strong></span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition"
          >
            Tutup Monitoring
          </button>
        </div>
      </div>
    </div>
  );
};
