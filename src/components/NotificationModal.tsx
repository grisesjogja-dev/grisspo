import React, { useState } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { Bell, XCircle, PlusCircle, AlertTriangle, ShieldCheck, Sparkles, Send, Trash2 } from 'lucide-react';
import { Announcement } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { announcements, addAnnouncement, deleteAnnouncement, currentUser: authUser, confirmAction } = useApp();
  const currentUser = authUser || defaultGuestUser;
  const isSuperadmin = currentUser.role === 'superadmin';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<Announcement['category']>('Umum');
  const [isImportant, setIsImportant] = useState(false);

  if (!isOpen) return null;

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    addAnnouncement(newTitle, newMessage, newCategory, isImportant);
    setNewTitle('');
    setNewMessage('');
    setShowAddForm(false);
    alert('Pengumuman penting warga berhasil disiarkan ke seluruh aplikasi!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Pusat Notifikasi & Pengumuman Warga</h3>
              <p className="text-xs text-slate-400">Paguyuban Perum Griya Sedayu Selaras 1</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Admin broadcast trigger */}
          {(currentUser.role === 'superadmin' || currentUser.role.includes('bendahara')) && (
            <div>
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={15} />
                  <span>Siarkan Pengumuman Baru (Pengurus)</span>
                </button>
              ) : (
                <form
                  onSubmit={handleSendAnnouncement}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs mb-4"
                >
                  <div className="font-bold text-slate-800">Form Siaran Pengumuman Warga:</div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Judul Pengumuman</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jadwal Kerja Bakti Minggu Ini..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Isi Pesan Pengumuman</label>
                    <textarea
                      placeholder="Rincian informasi untuk seluruh warga..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={2}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={isImportant}
                        onChange={(e) => setIsImportant(e.target.checked)}
                        className="rounded text-red-600"
                      />
                      <span>Tandai Sangat Penting / Darurat</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 bg-slate-200 rounded-lg text-slate-700 font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Send size={12} />
                        <span>Kirim Siaran</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Announcements list */}
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border transition ${
                  ann.isImportant
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      ann.isImportant
                        ? 'bg-red-200 text-red-900'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ann.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{ann.date}</span>
                    {isSuperadmin && (
                      <button
                        onClick={() => {
                          confirmAction({
                            title: 'Hapus Pengumuman Warga',
                            message: `Apakah Anda yakin ingin menghapus pengumuman "${ann.title}"?`,
                            confirmLabel: 'Setuju',
                            cancelLabel: 'Batal',
                            variant: 'danger',
                            onConfirm: () => deleteAnnouncement(ann.id)
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Hapus Pengumuman (Superadmin)"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
