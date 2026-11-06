import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import {
  MeetingNote,
  MeetingNoteStatus,
  AttendanceType,
  AttendanceItem
} from '../types';
import confetti from 'canvas-confetti';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  UserCheck,
  CheckSquare,
  Square,
  Lock,
  Send,
  Building,
  RotateCcw
} from 'lucide-react';

export const NotulenDanAbsensiView: React.FC = () => {
  const {
    currentUser: authUser,
    meetingNotes,
    addMeetingNote,
    updateMeetingNoteStatus,
    updateMeetingNote,
    deleteMeetingNote,
    attendanceSessions,
    submitAttendanceSession,
    deleteAttendanceSession,
    residents,
    resetFeatureData
  } = useApp();
  const currentUser = authUser || defaultGuestUser;

  const isSuperadmin = currentUser.role === 'superadmin';
  const isPengurus = [
    'superadmin',
    'bendahara1',
    'bendahara2',
    'admin_inventaris'
  ].includes(currentUser.role);

  // Active Tab: 'notulen' | 'absensi_kerjabakti' | 'absensi_rapat' | 'log_absensi'
  const [activeTab, setActiveTab] = useState<'notulen' | 'absensi_kerjabakti' | 'absensi_rapat' | 'log_absensi'>('notulen');
  const [isResetting, setIsResetting] = useState(false);

  // State for Log Absensi Tab
  const [logTypeFilter, setLogTypeFilter] = useState<'ALL' | 'ronda' | 'kerjabakti' | 'rapat'>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // --- NOTULEN STATE ---
  const [statusFilter, setStatusFilter] = useState<'ALL' | MeetingNoteStatus>('ALL');
  const [searchNotulen, setSearchNotulen] = useState('');
  const [isAddNotulenOpen, setIsAddNotulenOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | null>(null);

  // Form State for Notulen
  const [noteFormDate, setNoteFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [noteFormTitle, setNoteFormTitle] = useState('');
  const [noteFormContent, setNoteFormContent] = useState('');
  const [noteFormStatus, setNoteFormStatus] = useState<MeetingNoteStatus>('belum_terlaksana');
  const [noteFormPic, setNoteFormPic] = useState('Bpk. BENI (Ketua Paguyuban)');

  // Filtered Notulen list
  const filteredNotes = useMemo(() => {
    return meetingNotes.filter((n) => {
      const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
      const matchSearch =
        n.title.toLowerCase().includes(searchNotulen.toLowerCase()) ||
        n.content.toLowerCase().includes(searchNotulen.toLowerCase()) ||
        n.personInCharge.toLowerCase().includes(searchNotulen.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [meetingNotes, statusFilter, searchNotulen]);

  const handleOpenAddNotulen = () => {
    setEditingNote(null);
    setNoteFormDate(new Date().toISOString().slice(0, 10));
    setNoteFormTitle('');
    setNoteFormContent('');
    setNoteFormStatus('belum_terlaksana');
    setNoteFormPic('Bpk. BENI (Ketua Paguyuban)');
    setIsAddNotulenOpen(true);
  };

  const handleOpenEditNotulen = (note: MeetingNote) => {
    setEditingNote(note);
    setNoteFormDate(note.meetingDate);
    setNoteFormTitle(note.title);
    setNoteFormContent(note.content);
    setNoteFormStatus(note.status);
    setNoteFormPic(note.personInCharge);
    setIsAddNotulenOpen(true);
  };

  const handleSaveNotulen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormTitle.trim() || !noteFormContent.trim()) {
      alert('Mohon isi judul dan isi notulen!');
      return;
    }

    if (editingNote) {
      await updateMeetingNote({
        ...editingNote,
        meetingDate: noteFormDate,
        title: noteFormTitle.trim(),
        content: noteFormContent.trim(),
        status: noteFormStatus,
        personInCharge: noteFormPic.trim()
      });
    } else {
      await addMeetingNote({
        meetingDate: noteFormDate,
        title: noteFormTitle.trim(),
        content: noteFormContent.trim(),
        status: noteFormStatus,
        personInCharge: noteFormPic.trim(),
        recordedBy: `${currentUser.name} (${currentUser.houseNumber})`
      });
    }

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    setIsAddNotulenOpen(false);
  };

  const handleDeleteNotulen = async (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus notulen "${title}"?`)) return;
    await deleteMeetingNote(id);
  };

  // --- ABSENSI STATE (KERJABAKTI & RAPAT BULANAN) ---
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionTitle, setSessionTitle] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [attendanceChecklist, setAttendanceChecklist] = useState<Record<string, boolean>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize checklist map
  const toggleAttendee = (residentId: string) => {
    setAttendanceChecklist((prev) => ({
      ...prev,
      [residentId]: !prev[residentId]
    }));
  };

  const handleSelectAll = (select: boolean) => {
    const next: Record<string, boolean> = {};
    residents.forEach((r) => {
      next[r.id] = select;
    });
    setAttendanceChecklist(next);
  };

  // Filtered residents for checklist
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchBlock = blockFilter === 'ALL' || r.block === blockFilter;
      const matchSearch =
        r.name.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.houseNumber.toLowerCase().includes(residentSearch.toLowerCase());
      return matchBlock && matchSearch;
    });
  }, [residents, blockFilter, residentSearch]);

  const presentCount = useMemo(() => {
    return Object.values(attendanceChecklist).filter(Boolean).length;
  }, [attendanceChecklist]);

  const handleSaveActivityAttendance = async (type: 'kerjabakti' | 'rapat') => {
    if (!isPengurus) {
      alert('Akses Ditolak: Hanya Pengurus (Superadmin, Bendahara 1, Bendahara 2, Admin Inventaris) yang berhak mencatat absensi ini.');
      return;
    }

    const attendees: AttendanceItem[] = residents.map((r) => ({
      residentId: r.id,
      residentName: r.name,
      residentHouse: r.houseNumber,
      isPresent: !!attendanceChecklist[r.id],
      checkedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }));

    const pts = type === 'kerjabakti' ? 40 : 25;
    const defaultTitle =
      type === 'kerjabakti'
        ? `Absensi Kerja Bakti Lingkungan (${sessionDate})`
        : `Absensi Rapat Rutin Bulanan Paguyuban (${sessionDate})`;

    setIsSavingAttendance(true);
    try {
      await submitAttendanceSession({
        type,
        title: sessionTitle.trim() || defaultTitle,
        date: sessionDate,
        attendees,
        recordedBy: `${currentUser.name} (${currentUser.houseNumber})`,
        userRole: currentUser.role,
        pointsAwarded: true
      });

      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch {}

      setSaveSuccessMsg(
        `Berhasil! Absensi ${type === 'kerjabakti' ? 'Kerja Bakti' : 'Rapat Bulanan'} telah tersimpan. ${presentCount} warga hadir dan mendapatkan masing-masing +${pts} GRISS-POIN.`
      );
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      alert('Gagal menyimpan absensi: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Past sessions of this type
  const pastSessions = useMemo(() => {
    if (activeTab === 'absensi_kerjabakti') {
      return attendanceSessions.filter((s) => s.type === 'kerjabakti');
    }
    if (activeTab === 'absensi_rapat') {
      return attendanceSessions.filter((s) => s.type === 'rapat');
    }
    return [];
  }, [attendanceSessions, activeTab]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
            <FileText size={14} className="text-blue-200" />
            <span>Tata Kelola Transparan Paguyuban GSS 1</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Notulen Rapat & Absensi Paguyuban
          </h2>
          <p className="mt-2 text-blue-100 text-xs sm:text-sm leading-relaxed">
            Pusat pencatatan hasil musyawarah warga (tanggal, isi, status proses, dan penanggung jawab) serta checklist kehadiran Kerja Bakti (+40 Poin) dan Rapat Bulanan (+25 Poin) dengan hak akses pengurus.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm font-semibold flex items-center gap-1.5">
              <Award size={13} className="text-amber-300" />
              <span>Hadir Ronda: +25 Poin</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold flex items-center gap-1.5">
              <Award size={13} className="text-emerald-300" />
              <span>Hadir Kerja Bakti: +40 Poin</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-200 font-bold flex items-center gap-1.5">
              <Award size={13} className="text-blue-300" />
              <span>Hadir Rapat Bulanan: +25 Poin</span>
            </span>
            {isPengurus ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 font-bold flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-amber-300" />
                <span>Hak Akses Pengurus: Aktif</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 font-medium flex items-center gap-1.5">
                <Lock size={13} />
                <span>Akses Warga (Lihat Notulen & Riwayat)</span>
              </span>
            )}

            {isSuperadmin && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('PERINGATAN SUPERADMIN: Apakah Anda yakin ingin mereset seluruh notulen rapat dan riwayat sesi absensi?')) {
                    setIsResetting(true);
                    try {
                      await resetFeatureData('notulen');
                      await resetFeatureData('absensi');
                      alert('Data notulen dan absensi berhasil direset oleh Superadmin.');
                    } catch (err: any) {
                      alert('Gagal mereset: ' + err.message);
                    } finally {
                      setIsResetting(false);
                    }
                  }
                }}
                disabled={isResetting}
                className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold flex items-center gap-1.5 transition border border-red-500 shadow-md"
                title="Reset Data Notulen & Absensi (Superadmin)"
              >
                <RotateCcw size={13} className={isResetting ? 'animate-spin' : ''} />
                <span>{isResetting ? 'Mereset...' : 'Reset Notulen & Absensi'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('notulen')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === 'notulen'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} />
          <span>Notulen Rapat Paguyuban ({meetingNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('absensi_kerjabakti')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === 'absensi_kerjabakti'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Absensi Kerja Bakti (+40 Poin)</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
            Pengurus
          </span>
        </button>

        <button
          onClick={() => setActiveTab('absensi_rapat')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === 'absensi_rapat'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={16} />
          <span>Absensi Rapat Bulanan (+25 Poin)</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
            Pengurus
          </span>
        </button>

        <button
          onClick={() => setActiveTab('log_absensi')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
            activeTab === 'log_absensi'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Log & Riwayat Semua Absensi ({attendanceSessions.length})</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
            {isSuperadmin ? 'Superadmin' : 'Pengurus'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NOTULEN RAPAT                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'notulen' && (
        <div className="space-y-6">
          {/* Action Bar: Filter & Add */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter size={14} /> Filter Status:
              </span>
              {(['ALL', 'terlaksana', 'on_proses', 'belum_terlaksana'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' && 'Semua Notulen'}
                  {st === 'terlaksana' && 'Terlaksana'}
                  {st === 'on_proses' && 'On Proses'}
                  {st === 'belum_terlaksana' && 'Belum Terlaksana'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari notulen / PIC..."
                  value={searchNotulen}
                  onChange={(e) => setSearchNotulen(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {isPengurus && (
                <button
                  onClick={handleOpenAddNotulen}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Tambah Notulen</span>
                </button>
              )}
            </div>
          </div>

          {/* Notulen List */}
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
              <FileText size={48} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">Belum ada notulen rapat pada filter ini</p>
              <p className="text-xs">Pengurus dapat menambahkan notulen hasil pertemuan dengan tombol di atas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const isDone = note.status === 'terlaksana';
                const isProcess = note.status === 'on_proses';

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Calendar size={13} className="text-blue-600" />
                          <span>{new Date(note.meetingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </span>

                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isProcess
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {note.status === 'terlaksana' && 'Terlaksana'}
                          {note.status === 'on_proses' && 'On Proses'}
                          {note.status === 'belum_terlaksana' && 'Belum Terlaksana'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {note.title}
                      </h3>

                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {note.content}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Penanggung Jawab:</span>
                        <span className="font-bold text-slate-900">{note.personInCharge}</span>
                      </div>

                      {/* Status Selector for Pengurus */}
                      {isPengurus && (
                        <div className="mt-1 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">Ubah Status:</span>
                            <select
                              value={note.status}
                              onChange={(e) => updateMeetingNoteStatus(note.id, e.target.value as MeetingNoteStatus)}
                              className="text-[11px] font-bold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="belum_terlaksana">Belum Terlaksana</option>
                              <option value="on_proses">On Proses</option>
                              <option value="terlaksana">Terlaksana</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditNotulen(note)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Notulen"
                            >
                              <Edit size={14} />
                            </button>
                            {isSuperadmin && (
                              <button
                                onClick={() => handleDeleteNotulen(note.id, note.title)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Notulen (Superadmin)"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Add / Edit Notulen */}
          {isAddNotulenOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    <span>{editingNote ? 'Edit Notulen Rapat' : 'Tambah Notulen Rapat Baru'}</span>
                  </h3>
                  <button
                    onClick={() => setIsAddNotulenOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSaveNotulen} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Rapat
                    </label>
                    <input
                      type="date"
                      value={noteFormDate}
                      onChange={(e) => setNoteFormDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul / Topik Pertemuan Rapat
                    </label>
                    <input
                      type="text"
                      value={noteFormTitle}
                      onChange={(e) => setNoteFormTitle(e.target.value)}
                      placeholder="Contoh: Rapat Evaluasi Portal & Kebersihan Selokan"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Isi Notulen (Keputusan & Poin Kesepakatan)
                    </label>
                    <textarea
                      value={noteFormContent}
                      onChange={(e) => setNoteFormContent(e.target.value)}
                      rows={4}
                      placeholder="Tuliskan hasil musyawarah warga secara rinci..."
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Pelaksanaan
                      </label>
                      <select
                        value={noteFormStatus}
                        onChange={(e) => setNoteFormStatus(e.target.value as MeetingNoteStatus)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="belum_terlaksana">Belum Terlaksana</option>
                        <option value="on_proses">On Proses</option>
                        <option value="terlaksana">Terlaksana</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Penanggung Jawab (PIC)
                      </label>
                      <input
                        type="text"
                        value={noteFormPic}
                        onChange={(e) => setNoteFormPic(e.target.value)}
                        placeholder="Nama & Jabatan PIC"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddNotulenOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      {editingNote ? 'Simpan Perubahan' : 'Simpan Notulen'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2 & 3: ABSENSI CHECKLIST KERJA BAKTI & RAPAT BULANAN                   */}
      {/* ========================================================================= */}
      {(activeTab === 'absensi_kerjabakti' || activeTab === 'absensi_rapat') && (
        <div className="space-y-6">
          {/* Permission Notice */}
          {!isPengurus && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800">
              <Lock size={18} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Mode Warga (Hanya Lihat Riwayat):</span> Pencatatan dan checklist kehadiran{' '}
                {activeTab === 'absensi_kerjabakti' ? 'Kerja Bakti' : 'Rapat Bulanan'} hanya dapat dilakukan oleh Pengurus
                (Superadmin, Bendahara 1, Bendahara 2, Admin Inventaris).
              </div>
            </div>
          )}

          {/* Form Checklist (Pengurus Only) */}
          {isPengurus && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    {activeTab === 'absensi_kerjabakti' ? (
                      <>
                        <Users size={18} className="text-emerald-600" />
                        <span>Form Checklist Kehadiran Kerja Bakti Lingkungan</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={18} className="text-indigo-600" />
                        <span>Form Checklist Kehadiran Rapat Rutin Bulanan Paguyuban</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tandai warga yang hadir. Setiap kehadiran akan otomatis dihadiahi{' '}
                    <span className="font-extrabold text-slate-800">
                      +{activeTab === 'absensi_kerjabakti' ? '40' : '25'} GRISS-POIN
                    </span>{' '}
                    ke akun warga dan disimpan ke Firebase Cloud.
                  </p>
                </div>

                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Hadir Terpilih</span>
                  <span className="text-lg font-black">{presentCount} / {residents.length} Warga</span>
                </div>
              </div>

              {/* Date & Agenda input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topik / Agenda Kegiatan</label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder={
                      activeTab === 'absensi_kerjabakti'
                        ? 'Contoh: Pembersihan Selokan Blok A & Fasum Timur'
                        : 'Contoh: Rapat Pertemuan Bulanan Rutin Paguyuban'
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Resident Checklist Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <CheckSquare size={13} />
                    <span>Pilih Semua Hadir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Square size={13} />
                    <span>Reset Checklist</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Block filter */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-bold">
                    {(['ALL', 'A', 'B', 'C'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBlockFilter(b)}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          blockFilter === b ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {b === 'ALL' ? 'Semua' : `Blok ${b}`}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-44">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari warga..."
                      value={residentSearch}
                      onChange={(e) => setResidentSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Residents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                {filteredResidents.map((r) => {
                  const isChecked = !!attendanceChecklist[r.id];
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleAttendee(r.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 select-none ${
                        isChecked
                          ? activeTab === 'absensi_kerjabakti'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                            : 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono font-bold">
                            {r.houseNumber}
                          </span>
                          <span className="truncate text-xs">{r.name}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isChecked ? (
                          <CheckCircle2
                            size={18}
                            className={activeTab === 'absensi_kerjabakti' ? 'text-emerald-600' : 'text-indigo-600'}
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {saveSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  disabled={isSavingAttendance || presentCount === 0}
                  onClick={() => handleSaveActivityAttendance(activeTab === 'absensi_kerjabakti' ? 'kerjabakti' : 'rapat')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white shadow-lg transition ${
                    presentCount === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : activeTab === 'absensi_kerjabakti'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  <Send size={15} />
                  <span>
                    Simpan Absensi & Berikan +{activeTab === 'absensi_kerjabakti' ? '40' : '25'} Poin ({presentCount} Hadir)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Past Sessions History */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <span>
                Riwayat Sesi Absensi {activeTab === 'absensi_kerjabakti' ? 'Kerja Bakti' : 'Rapat Bulanan'} ({pastSessions.length})
              </span>
            </h3>

            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada rekaman sesi absensi {activeTab === 'absensi_kerjabakti' ? 'kerja bakti' : 'rapat bulanan'} yang tersimpan.
              </p>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((session) => {
                  const presentList = session.attendees.filter((a) => a.isPresent);
                  const pts = session.type === 'kerjabakti' ? 40 : 25;

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{session.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                            +{pts} Poin/Warga
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tanggal: <span className="font-semibold text-slate-700">{session.date}</span> &bull; Dicatat oleh:{' '}
                          <span className="font-semibold text-slate-700">{session.recordedBy}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 pt-1">
                          Hadir ({presentList.length} warga):{' '}
                          <span className="font-semibold text-slate-800">
                            {presentList.map((a) => `${a.residentName} (${a.residentHouse})`).join(', ')}
                          </span>
                        </div>
                      </div>

                      {isSuperadmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus sesi absensi "${session.title}"?`)) {
                              deleteAttendanceSession(session.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold p-2 hover:bg-red-50 rounded-xl transition flex items-center gap-1 shrink-0"
                          title="Hapus Sesi Absensi (Superadmin)"
                        >
                          <Trash2 size={14} />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOG / RIWAYAT SEMUA ABSENSI (RONDA, KERJA BAKTI, RAPAT)            */}
      {/* ========================================================================= */}
      {activeTab === 'log_absensi' && (
        <div className="space-y-6">
          {/* Header & Stats */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-1.5">
                  <ShieldCheck size={14} className="text-amber-600" />
                  <span>Log Riwayat Kehadiran Terintegrasi (Akses Superadmin & Pengurus)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Riwayat Absensi Lengkap: Ronda Malam, Kerja Bakti & Rapat Bulanan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsip otomatis kehadiran warga dari fitur Checklist Ronda harian (maksimal 1x/hari), Kerja Bakti (+40 Poin), dan Rapat Bulanan (+25 Poin).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total: {attendanceSessions.length} Sesi Tercatat
                </span>
              </div>
            </div>

            {/* Quick KPI count by type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Ronda Malam</span>
                <span className="text-xl font-black text-amber-600 mt-1 block">
                  {attendanceSessions.filter((s) => s.type === 'ronda').length} <span className="text-xs font-normal text-slate-500">Sesi</span>
                </span>
                <span className="text-[10px] text-slate-400">Reward +25 Poin / hadir</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kerja Bakti</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">
                  {attendanceSessions.filter((s) => s.type === 'kerjabakti').length} <span className="text-xs font-normal text-slate-500">Sesi</span>
                </span>
                <span className="text-[10px] text-slate-400">Reward +40 Poin / hadir</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Rapat Bulanan</span>
                <span className="text-xl font-black text-indigo-600 mt-1 block">
                  {attendanceSessions.filter((s) => s.type === 'rapat').length} <span className="text-xs font-normal text-slate-500">Sesi</span>
                </span>
                <span className="text-[10px] text-slate-400">Reward +25 Poin / hadir</span>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Filter size={13} /> Jenis:
                </span>
                {(['ALL', 'ronda', 'kerjabakti', 'rapat'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLogTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      logTypeFilter === t
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'ALL' && 'Semua Kegiatan'}
                    {t === 'ronda' && 'Ronda Malam'}
                    {t === 'kerjabakti' && 'Kerja Bakti'}
                    {t === 'rapat' && 'Rapat Bulanan'}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sesi, warga, atau rumah..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Session Cards */}
          <div className="space-y-3">
            {attendanceSessions
              .filter((s) => {
                const matchType = logTypeFilter === 'ALL' || s.type === logTypeFilter;
                const q = logSearchQuery.toLowerCase().trim();
                const matchSearch =
                  !q ||
                  s.title.toLowerCase().includes(q) ||
                  s.date.includes(q) ||
                  s.recordedBy.toLowerCase().includes(q) ||
                  s.attendees.some((a) => a.isPresent && (a.residentName.toLowerCase().includes(q) || a.residentHouse.toLowerCase().includes(q)));
                return matchType && matchSearch;
              })
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((session) => {
                const presentList = session.attendees.filter((a) => a.isPresent);
                const pts = session.type === 'kerjabakti' ? 40 : 25;

                return (
                  <div
                    key={session.id}
                    className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            session.type === 'ronda'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : session.type === 'kerjabakti'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          {session.type === 'ronda' && 'Ronda Malam'}
                          {session.type === 'kerjabakti' && 'Kerja Bakti'}
                          {session.type === 'rapat' && 'Rapat Bulanan'}
                        </span>

                        <span className="font-extrabold text-slate-900 text-sm">{session.title}</span>

                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                          +{pts} Poin / Warga
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Calendar size={13} className="text-blue-600" />
                          <span>Tanggal: {session.date}</span>
                        </span>
                        <span>&bull;</span>
                        <span>Dicatat oleh: <strong className="text-slate-800">{session.recordedBy}</strong></span>
                        <span>&bull;</span>
                        <span className="text-emerald-700 font-bold">Total Hadir: {presentList.length} Warga</span>
                      </div>

                      {/* Attendee Badges */}
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Daftar Warga yang Hadir:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {presentList.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Tidak ada warga hadir</span>
                          ) : (
                            presentList.map((a) => (
                              <span
                                key={a.residentId}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              >
                                <span className="font-mono font-bold text-blue-700">{a.residentHouse}</span>
                                <span>{a.residentName}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Superadmin can delete log */}
                    {isSuperadmin && (
                      <div className="shrink-0 self-end md:self-start">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus sesi absensi "${session.title}" (${session.date})? Tindakan ini permanen.`)) {
                              deleteAttendanceSession(session.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-rose-200"
                          title="Hapus Sesi Absensi (Superadmin)"
                        >
                          <Trash2 size={13} />
                          <span>Hapus Log</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {attendanceSessions.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
                <Clock size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-700">Belum ada sesi absensi yang tercatat</p>
                <p className="text-xs text-slate-500 mt-1">
                  Absensi ronda diinput melalui tab Jimpitan, sedangkan kerja bakti dan rapat bulanan diinput melalui tab di atas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
