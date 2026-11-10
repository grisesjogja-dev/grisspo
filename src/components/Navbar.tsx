import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Coins,
  ReceiptText,
  Users,
  Shield,
  Package,
  BookOpen,
  MessageSquare,
  Award,
  Building2,
  FileText
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jimpitan', label: 'Jimpit Online', icon: Coins, highlight: true },
    { id: 'notulen', label: 'Notulen & Absensi', icon: FileText },
    { id: 'fasum', label: 'Sewa Fasum', icon: Building2 },
    { id: 'keuangan', label: 'Keuangan Kas', icon: ReceiptText },
    { id: 'warga', label: 'Data Warga', icon: Users },
    { id: 'ronda', label: 'Jadwal Ronda', icon: Shield },
    { id: 'inventaris', label: 'Inventaris', icon: Package },
    { id: 'tatib', label: 'Tata Tertib', icon: BookOpen },
    { id: 'forum', label: 'Forum Diskusi', icon: MessageSquare },
    { id: 'poin', label: 'GRISS-Poin', icon: Award }
  ];

  return (
    <>
      {/* Desktop Horizontal Navigation Bar */}
      <nav className="hidden lg:block bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : item.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }
                  />
                  <span>{item.label}</span>
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white z-40 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-6 gap-0.5 max-w-lg mx-auto">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[9px] mt-0.5">Beranda</span>
          </button>

          <button
            onClick={() => setActiveView('jimpitan')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition relative ${
              activeView === 'jimpitan' ? 'text-amber-400 font-bold' : 'text-amber-300/80 hover:text-amber-300'
            }`}
          >
            <Coins size={18} className="text-amber-400" />
            <span className="text-[9px] mt-0.5">Jimpitan</span>
          </button>

          <button
            onClick={() => setActiveView('fasum')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeView === 'fasum' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 size={18} />
            <span className="text-[9px] mt-0.5">Fasum</span>
          </button>

          <button
            onClick={() => setActiveView('keuangan')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeView === 'keuangan' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ReceiptText size={18} />
            <span className="text-[9px] mt-0.5">Kas</span>
          </button>

          <button
            onClick={() => setActiveView('warga')}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              activeView === 'warga' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={18} />
            <span className="text-[9px] mt-0.5">Warga</span>
          </button>

          {/* More menu drawer trigger: toggles view to notulen, forum, inventaris, or tatib */}
          <button
            onClick={() => {
              if (['notulen', 'inventaris', 'ronda', 'tatib', 'forum', 'poin'].includes(activeView)) {
                setActiveView('dashboard');
              } else {
                setActiveView('notulen');
              }
            }}
            className={`flex flex-col items-center py-1.5 rounded-xl transition ${
              ['notulen', 'inventaris', 'ronda', 'tatib', 'forum', 'poin'].includes(activeView)
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[9px] mt-0.5">Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
};
