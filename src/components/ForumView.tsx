import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ForumPost } from '../types';
import { permissions } from '../utils/security';
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Pin,
  Trash2,
  PlusCircle,
  Filter,
  Send,
  Shield,
  XCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const ForumView: React.FC = () => {
  const {
    forumPosts,
    createForumPost,
    addForumComment,
    deleteForumComment,
    togglePostLike,
    deleteForumPost,
    togglePinPost,
    currentUser
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // New Post Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumPost['category']>('Keamanan');

  // Active expanded comment box
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const canModerate = permissions.canModerateForum(currentUser.role);

  const categories = ['ALL', 'Keamanan', 'Kebersihan', 'Acara Komunitas', 'Saran Umum'] as const;

  const filteredPosts = useMemo(() => {
    return forumPosts
      .filter((p) => selectedCategory === 'ALL' || p.category === selectedCategory)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [forumPosts, selectedCategory]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Judul dan isi postingan tidak boleh kosong!');
      return;
    }
    createForumPost(newTitle, newContent, newCategory);
    setNewTitle('');
    setNewContent('');
    setShowNewPostModal(false);
    alert('Topik diskusi berhasil diterbitkan! Anda memperoleh +5 GRISS-Poin.');
  };

  const handleSendComment = (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    addForumComment(postId, text);
    setCommentInput((prev) => ({ ...prev, [postId]: '' }));
  };

  const getCategoryColor = (cat: ForumPost['category']) => {
    switch (cat) {
      case 'Keamanan':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Kebersihan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Acara Komunitas':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Saran Umum':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <MessageSquare size={14} className="text-blue-300" />
            <span>Ruang Musyawarah Online Warga GSS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Forum Diskusi & Aspirasi Warga Perum GSS
          </h2>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Wadah rembug online antar warga. Diskusikan keamanan perumahan, jadwal kerja bakti, usulan fasilitas, maupun saran umum dengan tertib dan santun.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-1.5 transition"
            >
              <PlusCircle size={15} />
              <span>Buat Topik Diskusi Baru (+5 Poin)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
          <Filter size={13} /> Kategori:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat === 'ALL' ? 'Semua Topik' : cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const hasLiked = post.likes.includes(currentUser.id);
          const isCommentsOpen = expandedComments[post.id] ?? true;

          return (
            <div
              key={post.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition ${
                post.isPinned ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {post.authorName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{post.authorName}</span>
                      <span className="text-[11px] font-mono text-slate-500">Rumah {post.authorHouse}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                        {post.authorRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryColor(
                      post.category
                    )}`}
                  >
                    {post.category}
                  </span>

                  {post.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                      <Pin size={11} className="text-amber-700" /> Disematkan
                    </span>
                  )}

                  {/* Moderation Controls (Superadmin only) */}
                  {canModerate && (
                    <div className="flex items-center gap-1 ml-2 border-l pl-2 border-slate-200">
                      <button
                        onClick={() => togglePinPost(post.id)}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          post.isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600'
                        }`}
                        title="Sematkan / Lepas Pin (Moderasi)"
                      >
                        <Pin size={13} />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus topik "${post.title}"?`)) {
                            deleteForumPost(post.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus Topik (Moderasi)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                {post.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Action Bar (Like & Comment Toggle) */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                <button
                  onClick={() => togglePostLike(post.id)}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition ${
                    hasLiked ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp size={14} className={hasLiked ? 'fill-blue-600 text-blue-600' : ''} />
                  <span>{post.likes.length} Suka</span>
                </button>

                <button
                  onClick={() =>
                    setExpandedComments((prev) => ({
                      ...prev,
                      [post.id]: !isCommentsOpen
                    }))
                  }
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <MessageCircle size={14} />
                  <span>{post.comments.length} Komentar</span>
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsOpen && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {post.comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">
                          {comm.authorName} <span className="font-mono text-slate-500 font-normal">({comm.authorHouse})</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {currentUser.role === 'superadmin' && (
                            <button
                              onClick={() => {
                                if (confirm('Hapus komentar ini?')) {
                                  deleteForumComment(post.id, comm.id);
                                }
                              }}
                              className="p-0.5 text-slate-400 hover:text-red-600 rounded transition"
                              title="Hapus Komentar (Superadmin)"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{comm.content}</p>
                    </div>
                  ))}

                  {/* Comment Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Balas sebagai ${currentUser.name} (${currentUser.houseNumber})...`}
                      value={commentInput[post.id] || ''}
                      onChange={(e) =>
                        setCommentInput((prev) => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendComment(post.id);
                      }}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSendComment(post.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Send size={12} />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: BUAT TOPIK BARU */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold">Buat Topik Diskusi Warga Baru</h3>
              </div>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Diskusi</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Keamanan">Keamanan & Ronda</option>
                  <option value="Kebersihan">Kebersihan & Sampah</option>
                  <option value="Acara Komunitas">Acara Komunitas & Kerja Bakti</option>
                  <option value="Saran Umum">Saran Umum & Aspirasi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Topik Diskusi</label>
                <input
                  type="text"
                  placeholder="Contoh: Usulan Peremajaan Lampu Jalan Blok B..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan / Diskusi</label>
                <textarea
                  placeholder="Tuliskan aspirasi, pertanyaan, atau usulan Anda secara santun..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-600 shrink-0" />
                <span>Membuat topik baru memberikan Anda <strong>+5 GRISS-Poin</strong> loyalitas warga!</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Terbitkan Topik Diskusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
