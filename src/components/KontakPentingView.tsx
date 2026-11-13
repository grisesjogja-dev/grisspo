import React, { useState, useMemo } from 'react';
import { useApp, defaultGuestUser } from '../context/AppContext';
import { ImportantContact, ContactCategory } from '../types';
import {
  PhoneCall,
  Phone,
  Shield,
  HeartPulse,
  Flame,
  Building,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  MessageCircle,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';

export const KontakPentingView: React.FC = () => {
  const {
    currentUser: authUser,
    importantContacts,
    addImportantContact,
    updateImportantContact,
    deleteImportantContact,
    confirmAction
  } = useApp();
  const currentUser = authUser || defaultGuestUser;
  const isSuperadmin = currentUser.role === 'superadmin';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ImportantContact | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ContactCategory>('Polisi & Keamanan');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsEmergency, setFormIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Options
  const categories: ContactCategory[] = [
    'Polisi & Keamanan',
    'Medis & Kesehatan',
    'Pemadam & Darurat',
    'Layanan Publik & RT'
  ];

  // Filtered List
  const filteredContacts = useMemo(() => {
    return importantContacts.filter((c) => {
      const matchCat = selectedCategory === 'ALL' || c.category === selectedCategory;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [importantContacts, selectedCategory, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormName('');
    setFormCategory('Polisi & Keamanan');
    setFormPhone('');
    setFormWhatsapp('');
    setFormAddress('');
    setFormDescription('');
    setFormIsEmergency(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (contact: ImportantContact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormCategory(contact.category);
    setFormPhone(contact.phoneNumber);
    setFormWhatsapp(contact.whatsappNumber || '');
    setFormAddress(contact.address || '');
    setFormDescription(contact.description || '');
    setFormIsEmergency(!!contact.isEmergency);
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('Nama instansi dan nomor telepon wajib diisi!');
      return;
    }

    if (editingContact) {
      const targetContact = editingContact;
      confirmAction({
        title: 'Konfirmasi Perubahan Kontak',
        message: `Simpan perubahan nomor kontak penting "${formName.trim()}"?`,
        confirmLabel: 'Setuju',
        cancelLabel: 'Batal',
        variant: 'primary',
        onConfirm: async () => {
          setIsSubmitting(true);
          try {
            await updateImportantContact({
              ...targetContact,
              name: formName.trim(),
              category: formCategory,
              phoneNumber: formPhone.trim(),
              whatsappNumber: formWhatsapp.trim() || undefined,
              address: formAddress.trim() || undefined,
              description: formDescription.trim() || undefined,
              isEmergency: formIsEmergency
            });
            alert('Nomor kontak penting berhasil diperbarui!');
            setIsModalOpen(false);
          } catch (err: any) {
            alert('Gagal menyimpan kontak: ' + err.message);
          } finally {
            setIsSubmitting(false);
          }
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addImportantContact({
        name: formName.trim(),
        category: formCategory,
        phoneNumber: formPhone.trim(),
        whatsappNumber: formWhatsapp.trim() || undefined,
        address: formAddress.trim() || undefined,
        description: formDescription.trim() || undefined,
        isEmergency: formIsEmergency,
        order: importantContacts.length + 1
      });
      alert('Nomor kontak penting berhasil ditambahkan dan disinkronkan ke cloud!');
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Gagal menyimpan kontak: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Contact
  const handleDelete = (contact: ImportantContact) => {
    if (!isSuperadmin) {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak menghapus kontak penting!');
      return;
    }
    confirmAction({
      title: 'Hapus Kontak Penting',
      message: `Apakah Anda yakin ingin menghapus "${contact.name}" dari direktori nomor penting?`,
      confirmLabel: 'Setuju',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteImportantContact(contact.id);
        } catch (err: any) {
          alert('Gagal menghapus kontak: ' + err.message);
        }
      }
    });
  };

  // Category Icon & Badge Colors
  const getCategoryDetails = (cat: ContactCategory) => {
    switch (cat) {
      case 'Polisi & Keamanan':
        return {
          icon: Shield,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          headerBg: 'from-blue-600 to-indigo-700',
          chipBg: 'bg-blue-500/10 text-blue-600'
        };
      case 'Medis & Kesehatan':
        return {
          icon: HeartPulse,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          headerBg: 'from-emerald-600 to-teal-700',
          chipBg: 'bg-emerald-500/10 text-emerald-600'
        };
      case 'Pemadam & Darurat':
        return {
          icon: Flame,
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          headerBg: 'from-rose-600 to-red-700',
          chipBg: 'bg-rose-500/10 text-rose-600'
        };
      case 'Layanan Publik & RT':
      default:
        return {
          icon: Building,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          headerBg: 'from-amber-600 to-orange-700',
          chipBg: 'bg-amber-500/10 text-amber-600'
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Eye-catching Emergency Top Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 text-amber-200 text-xs font-black uppercase tracking-wider mb-3 border border-amber-300/40">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
            <PhoneCall size={14} className="text-amber-300" />
            <span>Layanan Darurat & Siaga 24 Jam Kapanewon Sedayu</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Direktori Nomor Telepon Penting Sedayu & Bantul
          </h2>

          <p className="mt-2 text-rose-100 text-xs sm:text-sm leading-relaxed">
            Daftar kontak instansi darurat, kepolisian, koramil, puskesmas, damkar, dan layanan darurat perumahan Griya Sedayu Selaras 1. Terintegrasi langsung dengan panggilan cepat dan pesan WhatsApp.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="tel:112"
              className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg"
            >
              <LifeBuoy size={16} />
              <span>Panggilan Darurat: 112 (Bebas Pulsa)</span>
            </a>

            <a
              href="tel:0274798110"
              className="px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-white/20"
            >
              <Shield size={16} className="text-amber-300" />
              <span>Polsek Sedayu: (0274) 798110</span>
            </a>

            <a
              href="tel:0274798081"
              className="px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-white/20"
            >
              <HeartPulse size={16} className="text-emerald-300" />
              <span>Puskesmas Sedayu 1: (0274) 798081</span>
            </a>

            {isSuperadmin && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg ml-auto"
              >
                <PlusCircle size={15} />
                <span>+ Tambah Kontak Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({importantContacts.length})
          </button>
          {categories.map((cat) => {
            const count = importantContacts.filter((c) => c.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak, nomor, alamat..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-center text-slate-400">
            <Phone size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold">Tidak ada kontak yang sesuai filter</p>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const catDetails = getCategoryDetails(contact.category);
            const CatIcon = catDetails.icon;
            const cleanPhone = contact.phoneNumber.replace(/[^0-9+]/g, '');
            const cleanWA = contact.whatsappNumber ? contact.whatsappNumber.replace(/[^0-9]/g, '') : '';
            const waUrl = cleanWA
              ? `https://wa.me/${cleanWA.startsWith('0') ? '62' + cleanWA.slice(1) : cleanWA}?text=${encodeURIComponent(`Halo ${contact.name}, saya warga Griya Sedayu Selaras 1 ingin berkonsultasi/melapor.`)}`
              : null;

            return (
              <div
                key={contact.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${catDetails.chipBg}`}>
                        <CatIcon size={22} />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catDetails.color} inline-block mb-1`}>
                          {contact.category}
                        </span>
                        <h4 className="text-base font-black text-slate-900 group-hover:text-red-600 transition leading-snug">
                          {contact.name}
                        </h4>
                      </div>
                    </div>

                    {contact.isEmergency && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        <span>24 JAM</span>
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3 text-xs">
                    {/* Primary Phone */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nomor Telepon</span>
                        <span className="text-sm font-black text-slate-900 font-mono tracking-wide">
                          {contact.phoneNumber}
                        </span>
                      </div>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <PhoneCall size={13} />
                        <span>Panggil</span>
                      </a>
                    </div>

                    {/* WhatsApp if available */}
                    {contact.whatsappNumber && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-emerald-700 block font-semibold uppercase">WhatsApp Siaga</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {contact.whatsappNumber}
                          </span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    {contact.address && (
                      <div className="flex items-start gap-2 text-slate-600 text-xs">
                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{contact.address}</span>
                      </div>
                    )}

                    {/* Description */}
                    {contact.description && (
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        {contact.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Superadmin Controls Footer */}
                {isSuperadmin && (
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">Akses Superadmin</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(contact)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100/60 rounded-lg transition"
                        title="Edit Nomor Kontak"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100/60 rounded-lg transition"
                        title="Hapus Nomor Kontak"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal (Superadmin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingContact ? 'Edit Nomor Telepon Penting' : 'Tambah Nomor Kontak Baru'}
                  </h3>
                  <span className="text-[11px] text-slate-500">Khusus Superadmin (Bpk. Beni B 24)</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Instansi / Kontak *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Polsek Sedayu, Babinsa, Puskesmas..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Kontak *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ContactCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-red-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Telepon Utama *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: (0274) 798110 / 112"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsEmergency}
                      onChange={(e) => setFormIsEmergency(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="font-bold text-slate-800">Layanan Darurat 24 Jam</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Lokasi (Opsional)
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Contoh: Jl. Wates Km. 12, Sedayu, Bantul"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Jam Operasional (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contoh: Layanan laka lantas, kamtibmas warga, IGD 24 Jam..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingContact ? 'Simpan Perubahan' : 'Tambahkan Kontak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
