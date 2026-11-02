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
import { LoginModal } from './components/LoginModal';
import { NotificationModal } from './components/NotificationModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { PengurusModal } from './components/PengurusModal';
import { IuranWarningModal } from './components/IuranWarningModal';

const MainApp: React.FC = () => {
  const { activeView, isPengurusOpen, setIsPengurusOpen, currentUser, residents } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isEmailAlertsOpen, setIsEmailAlertsOpen] = useState(false);
  const [isIuranWarningOpen, setIsIuranWarningOpen] = useState(false);

  // Trigger warning modal on login or user switch if resident has >= 2 months unpaid iuran
  React.useEffect(() => {
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
  }, [currentUser.id, currentUser.houseNumber, residents]);

  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'jimpitan':
        return <JimpitanView />;
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
      />

      {/* Navigation (Desktop horizontal bar & mobile drawer) */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mb-16 lg:mb-0 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-700">
            GRISSPO &bull; Griya Sedayu Selaras Portal Online 2026
          </p>
          <p className="text-[11px] text-slate-400">
            Paguyuban Warga Perumahan Griya Sedayu Selaras 1 - Argorejo, Sedayu, Bantul, D.I. Yogyakarta 55752
          </p>
          <p className="text-[10px] text-blue-600 font-mono pt-1">
            Real-Time Cloud Sync &bull; Enkripsi SHA-256 Integritas Kas &bull; Notifikasi Anomali Email
          </p>
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
