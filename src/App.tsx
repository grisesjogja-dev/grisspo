import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { JimpitanView } from './components/JimpitanView';
import { KeuanganView } from './components/KeuanganView';
import { DataWargaView } from './components/DataWargaView';
import { JadwalRondaView } from './components/JadwalRondaView';
import { InventarisView } from './components/InventarisView';
import { TataTertibView } from './components/TataTertibView';
import { ForumView } from './components/ForumView';
import { LoyaltyPointsView } from './components/LoyaltyPointsView';
import { FasumBookingView } from './components/FasumBookingView';
import { NotulenDanAbsensiView } from './components/NotulenDanAbsensiView';
import { KontakPentingView } from './components/KontakPentingView';
import { LandingLoginView } from './components/LandingLoginView';
import { LoginModal } from './components/LoginModal';
import { NotificationModal } from './components/NotificationModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { PengurusModal } from './components/PengurusModal';
import { IuranWarningModal } from './components/IuranWarningModal';
import { EditProfileModal } from './components/EditProfileModal';
import { MasterResetModal } from './components/MasterResetModal';
import { ActiveSessionsModal } from './components/ActiveSessionsModal';
import { VersionChangelogModal } from './components/VersionChangelogModal';
import { InfoBlastManagementView } from './components/InfoBlastManagementView';
import { InfoBlastModal } from './components/InfoBlastModal';
import { APP_VERSION, APP_BUILD_DATE } from './data/versionInfo';
import { Clock } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    activeView,
    isPengurusOpen,
    setIsPengurusOpen,
    currentUser,
    residents,
    inactivityNotice,
    clearInactivityNotice
  } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isEmailAlertsOpen, setIsEmailAlertsOpen] = useState(false);
  const [isIuranWarningOpen, setIsIuranWarningOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMasterResetOpen, setIsMasterResetOpen] = useState(false);
  const [isActiveSessionsOpen, setIsActiveSessionsOpen] = useState(false);
  const [isVersionChangelogOpen, setIsVersionChangelogOpen] = useState(false);

  // Trigger warning modal on login or user switch if resident has >= 2 months unpaid iuran
  React.useEffect(() => {
    if (!currentUser) {
      setIsIuranWarningOpen(false);
      return;
    }
    const resident = residents.find(
      (r) =>
        r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase() ||
        r.id === currentUser.id
    );
    if (resident && (resident.iuranUnpaidMonths || 0) >= 2) {
      setIsIuranWarningOpen(true);
    } else {
      setIsIuranWarningOpen(false);
    }
  }, [currentUser, residents]);

  // When user is NOT logged in: simple, flexible landing page with login form & biometrics
  const renderCurrentView = () => {
    if (!currentUser) {
      return <LandingLoginView onOpenLogin={() => setIsLoginOpen(true)} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'jimpitan':
        return <JimpitanView onOpenLogin={() => setIsLoginOpen(true)} />;
      case 'fasum':
        return <FasumBookingView />;
      case 'keuangan':
        return <KeuanganView />;
      case 'warga':
        return <DataWargaView />;
      case 'ronda':
        return <JadwalRondaView />;
      case 'inventaris':
        return <InventarisView />;
      case 'tatib':
        return <TataTertibView />;
      case 'forum':
        return <ForumView />;
      case 'poin':
        return <LoyaltyPointsView />;
      case 'notulen':
        return <NotulenDanAbsensiView />;
      case 'kontak_penting':
        return <KontakPentingView />;
      case 'infoblast':
        return <InfoBlastManagementView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenEmailAlerts={() => setIsEmailAlertsOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenMasterReset={() => setIsMasterResetOpen(true)}
        onOpenActiveSessions={() => setIsActiveSessionsOpen(true)}
      />

      {/* Navigation Menu: Only visible when user is logged in! */}
      {currentUser && <Navbar />}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>

      {/* Footer dengan Penomoran Versi Aplikasi & Changelog Update Sistem */}
      <footer className="bg-white border-t border-slate-200 py-6 mb-16 md:mb-0 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          {/* Penomoran Versi Aplikasi Berdasarkan Update-Update Sistem */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Versi Aplikasi: {APP_VERSION}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono">
              Build {APP_BUILD_DATE}
            </span>
            <button
              type="button"
              onClick={() => setIsVersionChangelogOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full transition cursor-pointer"
              title="Lihat riwayat catatan pembaruan sistem dari awal peluncuran hingga versi terbaru"
            >
              <span>Riwayat Pembaruan Sistem (Changelog) &raquo;</span>
            </button>
          </div>

          <p className="font-bold text-slate-700">
            GRISSPO &bull; Griya Sedayu Selaras Portal Online 2026
          </p>
          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto">
            Paguyuban Warga Perumahan Griya Sedayu Selaras 1 - Argorejo, Sedayu, Bantul, D.I. Yogyakarta 55752
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
            <span>Firebase Cloud Real-Time</span>
            <span>&bull;</span>
            <span>Enkripsi SHA-256 Integritas Kas</span>
            <span>&bull;</span>
            <span>FIDO2 / WebAuthn Biometrik</span>
            <span>&bull;</span>
            <span>RBAC Security Enforced</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
      <EmailAlertsModal
        isOpen={isEmailAlertsOpen}
        onClose={() => setIsEmailAlertsOpen(false)}
      />
      <PengurusModal
        isOpen={isPengurusOpen}
        onClose={() => setIsPengurusOpen(false)}
      />
      <IuranWarningModal
        isOpen={isIuranWarningOpen}
        onClose={() => setIsIuranWarningOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
      <MasterResetModal
        isOpen={isMasterResetOpen}
        onClose={() => setIsMasterResetOpen(false)}
      />
      <ActiveSessionsModal
        isOpen={isActiveSessionsOpen}
        onClose={() => setIsActiveSessionsOpen(false)}
      />
      <VersionChangelogModal
        isOpen={isVersionChangelogOpen}
        onClose={() => setIsVersionChangelogOpen(false)}
      />

      {/* Info Blast Popup Modal for Residents */}
      <InfoBlastModal />

      {/* 30-min Inactivity Auto-logout Alert Modal */}
      {inactivityNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <Clock size={30} className="animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Sesi Berakhir Demi Keamanan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {inactivityNotice}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={clearInactivityNotice}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Mengerti & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
