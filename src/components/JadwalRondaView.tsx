import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek } from '../types';
import {
  Shield,
  Clock,
  Key,
  AlertOctagon,
  Sparkles,
  Coins,
  ChevronRight,
  CalendarCheck,
  CheckCircle2,
  Users,
  Trash2,
  UserPlus,
  Lock
} from 'lucide-react';

export const JadwalRondaView: React.FC = () => {
  const { rondaSchedule, setActiveView, currentUser, removeRondaMember, addRondaMember, residents } = useApp();
  const isSuperadmin = currentUser.role === 'superadmin';

  // State to add a member to a day
  const [selectedDayToAdd, setSelectedDayToAdd] = useState<DayOfWeek | null>(null);
  const [selectedResidentName, setSelectedResidentName] = useState<string>('');

  // Determine current day of week
  const todayDay: DayOfWeek = useMemo(() => {
    const days: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date();
    return days[d.getDay()] || 'Sabtu';
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Shield size={14} className="text-blue-300" />
            <span>Sistem Keamanan & Ketertiban Lingkungan GSS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Jadwal Ronda Malam & Pengambilan Jimpitan
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Kegiatan ronda malam dilaksanakan 7 hari seminggu. Tim ronda bertugas menjaga ketertiban, menutup & mengunci portal gerbang perumahan pukul 21.00 WIB, mengambil jimpitan warga, serta membersihkan pendopo.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setActiveView('jimpitan')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition"
            >
              <Coins size={15} />
              <span>Input Jimpitan Hari Ini ({todayDay})</span>
              <ChevronRight size={14} />
            </button>

            <span className="text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-amber-300 font-semibold flex items-center gap-1.5">
              <CalendarCheck size={14} />
              <span>Hari Ini: {todayDay}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rules Notice Box from Tatib 2026 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-950 shadow-xs">
        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-900 mb-2">
          <AlertOctagon size={16} className="text-amber-600" />
          <span>Aturan Resmi Ronda Sesuai Tata Tertib 2026 (Pasal 4 Poin 6-14):</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mt-3">
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Jam Ronda & Jimpitan</span>
            <p className="text-slate-600 text-[11px]">
              Maksimal mulai <strong>pukul 20.00 WIB</strong> dan minimal selesai <strong>pukul 22.00 WIB</strong>.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Kunci Portal 21.00 WIB</span>
            <p className="text-slate-600 text-[11px]">
              Portal gerbang <strong>WAJIB ditutup & dikunci pada pukul 21.00 WIB</strong> oleh tim jimpit hari tersebut.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Denda Regu Tidak Ronda</span>
            <p className="text-slate-600 text-[11px]">
              Grup yang tidak mengambil jimpitan <strong>wajib membayar denda Rp 15.000 / grup / jimpit</strong>.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Kebersihan Pendopo & PIN</span>
            <p className="text-slate-600 text-[11px]">
              Wajib sapu & pel pendopo sebelum selesai. PIN portal diganti tiap pertemuan bulanan (maks tgl 15).
            </p>
          </div>
        </div>
      </div>

      {/* 7 Days Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rondaSchedule.map((group) => {
          const isToday = group.day === todayDay;
          const isUserInGroup = group.members.some((m) =>
            currentUser.name.toUpperCase().includes(m)
          );

          return (
            <div
              key={group.day}
              className={`rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                isToday
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900">{group.day}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {group.members.length} Petugas
                  </span>
                </div>

                {/* Member list */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Anggota Petugas Ronda:
                  </span>
                  {group.members.map((member, idx) => {
                    const isCurrentUser = currentUser.name.toUpperCase().includes(member);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-50 text-slate-800 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                              isCurrentUser ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span>Bpk. {member}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isCurrentUser && (
                            <span className="text-[10px] bg-white text-blue-900 px-1.5 py-0.2 rounded font-extrabold">
                              Anda
                            </span>
                          )}

                          {isSuperadmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus Bpk. ${member} dari jadwal ronda hari ${group.day}?`)) {
                                  removeRondaMember(group.day, member);
                                }
                              }}
                              className="p-1 hover:bg-red-500 hover:text-white rounded-md text-slate-400 transition"
                              title="Hapus Petugas Ronda (Superadmin)"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Superadmin Add Member to Schedule */}
                  {isSuperadmin && (
                    <button
                      onClick={() => {
                        setSelectedDayToAdd(group.day);
                        setSelectedResidentName(residents[0]?.name || '');
                      }}
                      className="w-full mt-2 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold transition border border-blue-200 flex items-center justify-center gap-1"
                    >
                      <UserPlus size={12} />
                      <span>Tambah Petugas (Superadmin)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveView('jimpitan')}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isToday
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Coins size={14} />
                  <span>{isToday ? 'Buka Jimpitan Hari Ini' : `Input Jimpitan ${group.day}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Petugas Ronda (Superadmin Only) */}
      {selectedDayToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 shadow-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <span>Tambah Petugas Ronda: {selectedDayToAdd}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih nama warga yang akan ditugaskan ronda malam pada hari {selectedDayToAdd}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Warga</label>
                <select
                  value={selectedResidentName}
                  onChange={(e) => setSelectedResidentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  {residents.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name} ({r.houseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayToAdd(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedResidentName && selectedDayToAdd) {
                      addRondaMember(selectedDayToAdd, selectedResidentName);
                      setSelectedDayToAdd(null);
                    }
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
