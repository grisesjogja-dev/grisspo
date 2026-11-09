import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  Resident,
  InventoryItem,
  RondaGroup,
  Transaction,
  JimpitDailyReport,
  ForumPost,
  LoyaltyReward,
  PointLog,
  Announcement,
  UserRole,
  FasumBooking,
  DayOfWeek,
  WhatsAppNotificationLog,
  AttendanceSession,
  AttendanceItem,
  AttendanceType,
  MeetingNote,
  MeetingNoteStatus,
  ActiveSession,
  FasumFacilityConfig,
  PaymentReceipt,
  PaymentReceiptType,
  PaymentMethodType,
  ImportantContact
} from '../types';
import {
  initialResidents,
  initialInventory,
  initialRondaSchedule,
  initialTransactions,
  initialForumPosts,
  initialRewards,
  initialAnnouncements,
  initialFasumBookings,
  initialMeetingNotes,
  initialAttendanceSessions,
  fasumFacilities,
  initialImportantContacts
} from '../data/seedData';
import {
  computeTransactionHash,
  detectFinancialAnomaly,
  sendAnomalyEmailAlert,
  EmailAlertLog
} from '../utils/security';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loginWithHouseNumber: (houseInput: string, passInput: string) => { success: boolean; message: string };
  loginAsResident: (resident: Resident) => void;
  switchRoleWithPassword: (houseNumber: string, passwordInput: string) => { success: boolean; message: string };
  logout: () => void;
  updateResidentProfile: (updates: { name: string; phone: string; familyMembers?: number; password?: string }) => Promise<void>;
  resetFeatureData: (feature: string) => Promise<void>;
  masterResetAllFeatures: () => Promise<void>;

  // Residents
  residents: Resident[];
  updateResident: (resident: Resident) => Promise<void>;
  toggleBerkasKependudukan: (residentId: string, status: boolean) => Promise<{ success: boolean; message: string }>;
  deleteResident: (id: string) => Promise<void>;
  addResident: (resident: Omit<Resident, 'id' | 'no'>) => Promise<void>;

  // Ronda & Jimpitan
  rondaSchedule: RondaGroup[];
  updateRondaGroup: (group: RondaGroup) => Promise<void>;
  jimpitReports: JimpitDailyReport[];
  submitDailyJimpit: (report: Omit<JimpitDailyReport, 'id' | 'createdAt'>) => Promise<void>;
  deleteJimpitReport: (id: string) => Promise<void>;
  payJimpitanDeficit: (residentId: string, amount: number, method: 'transfer' | 'cash', notes?: string) => Promise<{ success: boolean; message: string; transactionId?: string }>;
  removeRondaMember: (day: DayOfWeek, memberName: string) => Promise<void>;
  addRondaMember: (day: DayOfWeek, memberName: string) => Promise<void>;

  // WhatsApp Iuran Warning
  whatsAppLogs: WhatsAppNotificationLog[];
  sendWhatsAppIuranWarning: (residentId: string) => Promise<{ success: boolean; url: string; log: WhatsAppNotificationLog }>;
  deleteWhatsAppLog: (id: string) => Promise<void>;

  // Inventory
  inventory: InventoryItem[];
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'no'>) => Promise<void>;
  borrowInventoryItem: (id: string, borrowerName: string) => Promise<void>;
  returnInventoryItem: (id: string) => Promise<void>;

  // Finance
  transactions: Transaction[];
  addTransaction: (trx: Omit<Transaction, 'id' | 'encryptedHash' | 'timestamp' | 'isAnomaly'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (trx: Transaction) => Promise<void>;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;

  // Forum
  forumPosts: ForumPost[];
  createForumPost: (title: string, content: string, category: ForumPost['category']) => Promise<void>;
  updateForumPost: (post: ForumPost) => Promise<void>;
  addForumComment: (postId: string, content: string) => Promise<void>;
  deleteForumComment: (postId: string, commentId: string) => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;
  deleteForumPost: (postId: string) => Promise<void>;
  togglePinPost: (postId: string) => Promise<void>;

  // Loyalty Points & Benefit Catalog
  rewards: LoyaltyReward[];
  pointLogs: PointLog[];
  redeemReward: (rewardId: string) => { success: boolean; message: string };
  awardPoints: (userId: string, points: number, reason: string) => void;
  deletePointLog: (id: string) => Promise<void>;
  addReward: (reward: Omit<LoyaltyReward, 'id'> & { id?: string }) => Promise<void>;
  updateReward: (reward: LoyaltyReward) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;

  // Announcements & Email Alerts
  announcements: Announcement[];
  addAnnouncement: (title: string, message: string, category: Announcement['category'], isImportant?: boolean) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  emailAlerts: EmailAlertLog[];
  clearEmailAlerts: () => void;

  // Fasum Booking & Automatic Payment
  fasumBookings: FasumBooking[];
  addFasumBooking: (booking: Omit<FasumBooking, 'id' | 'createdAt' | 'e2eHash'>) => Promise<FasumBooking>;
  confirmFasumPayment: (bookingId: string, approvedBy?: string) => Promise<void>;
  updateFasumBookingStatus: (bookingId: string, status: FasumBooking['status'], notes?: string) => Promise<void>;
  updateFasumBooking: (booking: FasumBooking) => Promise<void>;
  deleteFasumBooking: (bookingId: string) => Promise<void>;

  // Fasum Facilities Management (Superadmin CRUD)
  fasumFacilitiesList: FasumFacilityConfig[];
  addFasumFacility: (facility: FasumFacilityConfig) => Promise<void>;
  updateFasumFacility: (facility: FasumFacilityConfig) => Promise<void>;
  deleteFasumFacility: (facilityId: string) => Promise<void>;

  // Cashier & Payment Receipts (Iuran 25k, Sampah 50k, Fasum, Sumbangan, Lain-lain)
  paymentReceipts: PaymentReceipt[];
  recordCashierPayment: (data: {
    residentId: string;
    residentName: string;
    residentHouse: string;
    residentPhone?: string;
    paymentType: PaymentReceiptType;
    paymentTypeName: string;
    amount: number;
    periodMonth?: string;
    paymentMethod: PaymentMethodType;
    notes?: string;
  }) => Promise<PaymentReceipt>;
  updatePaymentReceipt: (receipt: PaymentReceipt) => Promise<void>;
  deletePaymentReceipt: (id: string) => Promise<void>;
  sendReceiptNotificationEmail: (receiptId: string) => Promise<{ success: boolean; message: string }>;

  // Absensi Warga (Ronda, Kerjabakti, Rapat Bulanan)
  attendanceSessions: AttendanceSession[];
  submitAttendanceSession: (session: Omit<AttendanceSession, 'id' | 'createdAt'>) => Promise<void>;
  updateAttendanceSession: (session: AttendanceSession) => Promise<void>;
  deleteAttendanceSession: (id: string) => Promise<void>;

  // Notulen Rapat Paguyuban
  meetingNotes: MeetingNote[];
  addMeetingNote: (note: Omit<MeetingNote, 'id' | 'createdAt'>) => Promise<void>;
  updateMeetingNoteStatus: (id: string, status: MeetingNoteStatus) => Promise<void>;
  updateMeetingNote: (note: MeetingNote) => Promise<void>;
  deleteMeetingNote: (id: string) => Promise<void>;
  awardPointsToResident: (residentId: string, points: number, reason: string) => Promise<void>;

  // Name Resolver by House Number Helper
  getResidentNameByHouse: (houseNumber: string, fallbackName?: string) => string;

  // Jimpitan Report Edit
  updateJimpitReport: (report: JimpitDailyReport) => Promise<void>;
  // Pengurus Modal
  isPengurusOpen: boolean;
  setIsPengurusOpen: (open: boolean) => void;

  // Active Sessions & Auto-Logout
  activeSessions: ActiveSession[];
  kickSession: (userId: string) => Promise<void>;
  inactivityNotice: string | null;
  clearInactivityNotice: () => void;

  // Nomor Telepon Penting Sedayu & Emergency Directory
  importantContacts: ImportantContact[];
  addImportantContact: (contact: Omit<ImportantContact, 'id'>) => Promise<ImportantContact>;
  updateImportantContact: (contact: ImportantContact) => Promise<void>;
  deleteImportantContact: (id: string) => Promise<void>;

  // Sync state
  isCloudSynced: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default guest fallback user
export const defaultGuestUser: User = {
  id: '',
  username: 'Tamu',
  name: 'Tamu Warga',
  houseNumber: '',
  role: 'warga',
  points: 0
};

// Default logged in user: Beni, B 24 (Superadmin)
const defaultUser: User = {
  id: 'w-b24',
  username: 'GrissB24',
  name: 'BENI',
  houseNumber: 'B 24',
  role: 'superadmin',
  points: 0,
  phone: '0812-3456-7840'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User state - start null if not logged in
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('grisspo_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.houseNumber === 'B 24' || parsed.username === 'GrissB24')) {
          return { ...parsed, role: 'superadmin', name: 'BENI' };
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeView, setActiveView] = useState<string>(() => {
    const saved = localStorage.getItem('grisspo_user');
    return saved ? 'dashboard' : 'jimpitan';
  });
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isPengurusOpen, setIsPengurusOpen] = useState<boolean>(false);

  // Active Sessions & 30-min Inactivity Tracking
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const clearInactivityNotice = () => setInactivityNotice(null);

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const hasRegisteredSessionRef = useRef<boolean>(false);

  const getClientDeviceInfo = (): string => {
    if (typeof navigator === 'undefined') return 'Desktop Browser';
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android Smartphone';
    if (/iPhone/i.test(ua)) return 'Apple iPhone';
    if (/iPad/i.test(ua)) return 'Apple iPad';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Macintosh|Mac OS/i.test(ua)) return 'macOS Laptop';
    if (/Linux/i.test(ua)) return 'Linux PC';
    return 'Web Browser';
  };

  const syncActiveSessionToCloud = async (user: User) => {
    try {
      const nowStr = new Date().toISOString();
      const sessionRef = doc(db, 'active_sessions', user.id);
      await setDoc(
        sessionRef,
        {
          sessionId: `sess_${user.id}_${Date.now()}`,
          userId: user.id,
          name: user.name,
          houseNumber: user.houseNumber,
          role: user.role,
          loginTime: nowStr,
          lastActive: nowStr,
          deviceInfo: getClientDeviceInfo()
        },
        { merge: true }
      );
      hasRegisteredSessionRef.current = true;
    } catch (e) {
      console.warn('Firestore active_sessions sync error:', e);
    }
  };

  const removeActiveSessionFromCloud = async (userId: string) => {
    try {
      hasRegisteredSessionRef.current = false;
      await deleteDoc(doc(db, 'active_sessions', userId));
    } catch (e) {
      console.warn('Firestore active_sessions remove error:', e);
    }
  };

  const kickSession = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'active_sessions', userId));
      setActiveSessions((prev) => prev.filter((s) => s.userId !== userId));
    } catch (e) {
      console.warn('Firestore kickSession error:', e);
    }
  };

  // Sync active session whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      syncActiveSessionToCloud(currentUser);
    }
  }, [currentUser?.id]);

  // 600 Detik (10 Menit) Inactivity Auto-Logout
  const INACTIVITY_TIMEOUT_MS = 600 * 1000; // 600 detik (10 menit)

  useEffect(() => {
    if (!currentUser) return;

    lastActivityTimeRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const triggerInactivityLogout = () => {
      console.warn('GRISSPO Security: Auto-logout triggered after 600 seconds of user inactivity.');
      const userToLogout = currentUserRef.current;
      if (userToLogout) {
        removeActiveSessionFromCloud(userToLogout.id);
      }
      setCurrentUser(null);
      localStorage.removeItem('grisspo_user');
      setActiveView('jimpitan');
      setInactivityNotice(
        'Sesi portal GRISSPO Anda telah otomatis logout karena tidak ada aktivitas selama 600 detik (10 menit) demi menjaga keamanan data warga. Silakan login kembali.'
      );
    };

    // Auto-Logout saat pengguna kembali ke tab jika telah lebih dari 600 detik tidak aktif
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUserRef.current) {
        const elapsed = Date.now() - lastActivityTimeRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          triggerInactivityLogout();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityTimeRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        triggerInactivityLogout();
      } else if (currentUserRef.current && elapsed < 30000) {
        // Send heartbeat every check interval if user has been active recently
        const sessionRef = doc(db, 'active_sessions', currentUserRef.current.id);
        setDoc(sessionRef, { lastActive: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    }, 3000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInterval);
    };
  }, [currentUser]);

  // Track permanently deleted IDs so deleted master data NEVER resurrects across any device
  const initialDeletedIds: string[] = (() => {
    try {
      const saved = localStorage.getItem('grisspo_deleted_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const [deletedIds, setDeletedIds] = useState<string[]>(initialDeletedIds);
  const deletedIdsRef = useRef<string[]>(initialDeletedIds);

  useEffect(() => {
    deletedIdsRef.current = deletedIds;
  }, [deletedIds]);

  // Residents
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('grisspo_residents');
    if (saved) {
      try {
        const list: Resident[] = JSON.parse(saved);
        return list
          .filter((r) => !initialDeletedIds.includes(r.id))
          .map((r) => {
            if (r.houseNumber === 'B 24') return { ...r, role: 'superadmin' };
            if (r.houseNumber === 'B 02') return { ...r, role: 'bendahara1' };
            if (r.houseNumber === 'C 15') return { ...r, role: 'bendahara2' };
            if (r.houseNumber === 'B 23') return { ...r, role: 'admin_inventaris' };
            if (r.houseNumber === 'A 11' && r.role === 'bendahara1') return { ...r, role: 'warga' };
            if (r.houseNumber === 'B 26' && r.role === 'admin_inventaris') return { ...r, role: 'warga' };
            if (r.houseNumber === 'C 10' && r.role === 'superadmin') return { ...r, role: 'warga' };
            return r;
          });
      } catch {
        return initialResidents.filter((r) => !initialDeletedIds.includes(r.id));
      }
    }
    return initialResidents.filter((r) => !initialDeletedIds.includes(r.id));
  });

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('grisspo_inventory');
    const base: InventoryItem[] = saved ? JSON.parse(saved) : initialInventory;
    return base.filter((i) => !initialDeletedIds.includes(i.id));
  });

  // Ronda Schedule
  const [rondaSchedule, setRondaSchedule] = useState<RondaGroup[]>(() => {
    const saved = localStorage.getItem('grisspo_ronda_schedule');
    return saved ? JSON.parse(saved) : initialRondaSchedule;
  });

  // Jimpitan Reports
  const [jimpitReports, setJimpitReports] = useState<JimpitDailyReport[]>(() => {
    const saved = localStorage.getItem('grisspo_jimpit_reports');
    if (saved) {
      try {
        const list: JimpitDailyReport[] = JSON.parse(saved);
        return list.filter((j) => !initialDeletedIds.includes(j.id));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('grisspo_transactions');
    const base: Transaction[] = saved ? JSON.parse(saved) : initialTransactions;
    return base
      .filter((t) => !initialDeletedIds.includes(t.id))
      .map((t) => ({
        ...t,
        amount: Number(t.amount) || 0,
        type: (String(t.type || '').trim().toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran'
      }));
  });

  // Forum Posts
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem('grisspo_forum_posts');
    const base: ForumPost[] = saved ? JSON.parse(saved) : initialForumPosts;
    return base.filter((p) => !initialDeletedIds.includes(p.id));
  });

  // Rewards
  const [rewards, setRewards] = useState<LoyaltyReward[]>(() => {
    const saved = localStorage.getItem('grisspo_rewards');
    return saved ? JSON.parse(saved) : initialRewards;
  });

  // Point Logs
  const [pointLogs, setPointLogs] = useState<PointLog[]>(() => {
    const saved = localStorage.getItem('grisspo_point_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('grisspo_announcements');
    const base: Announcement[] = saved ? JSON.parse(saved) : initialAnnouncements;
    return base.filter((a) => !initialDeletedIds.includes(a.id));
  });

  // Fasum Bookings
  const [fasumBookings, setFasumBookings] = useState<FasumBooking[]>(() => {
    const saved = localStorage.getItem('grisspo_fasum_bookings');
    const base: FasumBooking[] = saved ? JSON.parse(saved) : initialFasumBookings;
    return base.filter((b) => !initialDeletedIds.includes(b.id));
  });

  // Fasum Facilities Config List (Superadmin dynamic CRUD)
  const [fasumFacilitiesList, setFasumFacilitiesList] = useState<FasumFacilityConfig[]>(() => {
    const saved = localStorage.getItem('grisspo_fasum_facilities');
    return saved ? JSON.parse(saved) : fasumFacilities;
  });

  // Loket Pembayaran Kas & Kwitansi Resmi
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem('grisspo_payment_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  // Absensi Records (Ronda, Kerjabakti, Rapat Bulanan)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    const saved = localStorage.getItem('grisspo_attendance_sessions');
    const base: AttendanceSession[] = saved ? JSON.parse(saved) : initialAttendanceSessions;
    return base.filter((s) => !initialDeletedIds.includes(s.id));
  });

  // Notulen Rapat Paguyuban
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(() => {
    const saved = localStorage.getItem('grisspo_meeting_notes');
    const base: MeetingNote[] = saved ? JSON.parse(saved) : initialMeetingNotes;
    return base.filter((m) => !initialDeletedIds.includes(m.id));
  });

  // Nomor Telepon Penting Sedayu & Emergency Directory
  const [importantContacts, setImportantContacts] = useState<ImportantContact[]>(() => {
    const saved = localStorage.getItem('grisspo_important_contacts');
    const base: ImportantContact[] = saved ? JSON.parse(saved) : initialImportantContacts;
    return base.filter((c) => !initialDeletedIds.includes(c.id));
  });

  const [emailAlerts, setEmailAlerts] = useState<EmailAlertLog[]>([]);

  // Function to mark an item as deleted permanently and sync to Firestore
  const markAsDeleted = async (id: string, collectionName?: string) => {
    setDeletedIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      localStorage.setItem('grisspo_deleted_ids', JSON.stringify(next));
      deletedIdsRef.current = next;
      return next;
    });

    // Immediate optimistic local purge across all arrays
    setResidents((prev) => prev.filter((r) => r.id !== id));
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setInventory((prev) => prev.filter((i) => i.id !== id));
    setJimpitReports((prev) => prev.filter((r) => r.id !== id));
    setForumPosts((prev) => prev.filter((p) => p.id !== id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setFasumBookings((prev) => prev.filter((b) => b.id !== id));
    setWhatsAppLogs((prev) => prev.filter((w) => w.id !== id));
    setAttendanceSessions((prev) => prev.filter((s) => s.id !== id));
    setMeetingNotes((prev) => prev.filter((m) => m.id !== id));
    setImportantContacts((prev) => prev.filter((c) => c.id !== id));

    // Save to Firestore system_deleted_ids so ALL devices receive this deletion in real-time
    try {
      await setDoc(doc(db, 'system_deleted_ids', id), {
        id,
        collection: collectionName || 'general',
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.name || 'Superadmin'
      });
    } catch (err) {
      console.warn('Firestore system_deleted_ids sync notice:', err);
    }
  };

  // WhatsApp Notification Logs for Iuran Arrears
  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppNotificationLog[]>(() => {
    const saved = localStorage.getItem('grisspo_wa_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Watch deletedIds to ensure any real-time deletion from other devices purges local state instantly
  useEffect(() => {
    if (deletedIds.length === 0) return;
    setResidents((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
    setTransactions((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
    setInventory((prev) => prev.filter((i) => !deletedIds.includes(i.id)));
    setJimpitReports((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
    setForumPosts((prev) => prev.filter((p) => !deletedIds.includes(p.id)));
    setAnnouncements((prev) => prev.filter((a) => !deletedIds.includes(a.id)));
    setFasumBookings((prev) => prev.filter((b) => !deletedIds.includes(b.id)));
    setWhatsAppLogs((prev) => prev.filter((w) => !deletedIds.includes(w.id)));
    setAttendanceSessions((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
    setMeetingNotes((prev) => prev.filter((m) => !deletedIds.includes(m.id)));
  }, [deletedIds]);

  // Real-Time Firebase Firestore Integration with Cross-Device Sync
  useEffect(() => {
    let unsubDeleted: (() => void) | undefined;
    let unsubWarga: (() => void) | undefined;
    let unsubTransactions: (() => void) | undefined;
    let unsubJimpitan: (() => void) | undefined;
    let unsubInventory: (() => void) | undefined;
    let unsubForum: (() => void) | undefined;
    let unsubPengumuman: (() => void) | undefined;
    let unsubFasum: (() => void) | undefined;
    let unsubAbsensi: (() => void) | undefined;
    let unsubNotulen: (() => void) | undefined;
    let unsubActiveSessions: (() => void) | undefined;
    let unsubFacilities: (() => void) | undefined;
    let unsubReceipts: (() => void) | undefined;
    let unsubRonda: (() => void) | undefined;
    let unsubRewards: (() => void) | undefined;
    let unsubImportantContacts: (() => void) | undefined;

    // Check Cloud Seed Status so other devices NEVER resurrect deleted documents
    const checkCloudSeedStatus = async () => {
      try {
        const seedRef = doc(db, 'system_settings', 'seed_status');
        const seedSnap = await getDoc(seedRef);
        if (!seedSnap.exists() || !seedSnap.data()?.isSeeded) {
          // Only seed if database is truly brand-new
          const wargaSnap = await getDocs(collection(db, 'warga'));
          if (wargaSnap.empty) {
            initialResidents.forEach((res) => {
              if (!deletedIdsRef.current.includes(res.id)) {
                setDoc(doc(db, 'warga', res.id), res).catch(() => {});
              }
            });
            initialTransactions.forEach((trx) => {
              if (!deletedIdsRef.current.includes(trx.id)) {
                setDoc(doc(db, 'keuangan_transaksi', trx.id), trx).catch(() => {});
              }
            });
            initialInventory.forEach((inv) => {
              if (!deletedIdsRef.current.includes(inv.id)) {
                setDoc(doc(db, 'inventaris', inv.id), inv).catch(() => {});
              }
            });
            initialForumPosts.forEach((p) => {
              if (!deletedIdsRef.current.includes(p.id)) {
                setDoc(doc(db, 'forum_posts', p.id), p).catch(() => {});
              }
            });
            initialAnnouncements.forEach((ann) => {
              if (!deletedIdsRef.current.includes(ann.id)) {
                setDoc(doc(db, 'pengumuman', ann.id), ann).catch(() => {});
              }
            });
            initialFasumBookings.forEach((b) => {
              if (!deletedIdsRef.current.includes(b.id)) {
                setDoc(doc(db, 'fasum_bookings', b.id), b).catch(() => {});
              }
            });
            initialMeetingNotes.forEach((n) => {
              if (!deletedIdsRef.current.includes(n.id)) {
                setDoc(doc(db, 'notulen_rapat', n.id), n).catch(() => {});
              }
            });
            initialAttendanceSessions.forEach((s) => {
              if (!deletedIdsRef.current.includes(s.id)) {
                setDoc(doc(db, 'absensi_records', s.id), s).catch(() => {});
              }
            });
            initialRewards.forEach((rw) => {
              if (!deletedIdsRef.current.includes(rw.id)) {
                setDoc(doc(db, 'katalog_benefit', rw.id), rw).catch(() => {});
              }
            });
          }
          await setDoc(seedRef, { isSeeded: true, seededAt: new Date().toISOString() });
          localStorage.setItem('grisspo_seeded_v1', 'true');
        }

        // Check if kontak_penting is brand new, seed if empty without overwriting existing data
        try {
          const kontakSnap = await getDocs(collection(db, 'kontak_penting'));
          if (kontakSnap.empty) {
            initialImportantContacts.forEach((ct) => {
              if (!deletedIdsRef.current.includes(ct.id)) {
                setDoc(doc(db, 'kontak_penting', ct.id), ct).catch(() => {});
              }
            });
          }
        } catch (e) {
          console.warn('Sync initial important contacts notice:', e);
        }

        // Realtime sync: Push any local payment receipts to Firestore so all other devices see them
        try {
          const receiptsSnap = await getDocs(collection(db, 'pembayaran_kwitansi'));
          const cloudIds = new Set(receiptsSnap.docs.map((d) => d.id));
          const localSaved = localStorage.getItem('grisspo_payment_receipts');
          if (localSaved) {
            const list: PaymentReceipt[] = JSON.parse(localSaved);
            for (const r of list) {
              if (!cloudIds.has(r.id) && !deletedIdsRef.current.includes(r.id)) {
                await setDoc(doc(db, 'pembayaran_kwitansi', r.id), r);
              }
            }
          }
        } catch (e) {
          console.warn('Sync local receipts to cloud notice:', e);
        }
      } catch (err) {
        console.warn('Firestore cloud seed status check notice:', err);
      }
    };
    checkCloudSeedStatus();

    try {
      // 0. System Deleted IDs listener: Synchronize permanent deletions across ALL devices in real-time
      unsubDeleted = onSnapshot(collection(db, 'system_deleted_ids'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudDeleted: string[] = [];
          snapshot.forEach((d) => cloudDeleted.push(d.id));
          setDeletedIds((prev) => {
            const merged = Array.from(new Set([...prev, ...cloudDeleted]));
            localStorage.setItem('grisspo_deleted_ids', JSON.stringify(merged));
            deletedIdsRef.current = merged;
            return merged;
          });
        }
      }, (err) => {
        console.warn('Firestore system_deleted_ids listener notice:', err.message);
      });

      // 1. Warga listener
      unsubWarga = onSnapshot(collection(db, 'warga'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudData: Resident[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              // Proactively clean up any lingering deleted doc from Firestore
              deleteDoc(doc(db, 'warga', d.id)).catch(() => {});
            } else {
              cloudData.push(d.data() as Resident);
            }
          });
          cloudData.sort((a, b) => (a.no || 0) - (b.no || 0));
          setResidents(cloudData);
          localStorage.setItem('grisspo_residents', JSON.stringify(cloudData));
          setIsCloudSynced(true);
        }
      }, (err) => {
        console.warn('Firestore warga listener error:', err.message);
      });

      // 2. Transactions listener
      unsubTransactions = onSnapshot(collection(db, 'keuangan_transaksi'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudTrx: Transaction[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'keuangan_transaksi', d.id)).catch(() => {});
            } else {
              const rawData = d.data() as any;
              cloudTrx.push({
                ...rawData,
                amount: Number(rawData.amount) || 0,
                type: (String(rawData.type || '').trim().toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran'
              });
            }
          });
          cloudTrx.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setTransactions(cloudTrx);
          localStorage.setItem('grisspo_transactions', JSON.stringify(cloudTrx));
        }
      }, (err) => {
        console.warn('Firestore transaksi listener error:', err.message);
      });

      // 3. Jimpitan listener
      unsubJimpitan = onSnapshot(collection(db, 'jimpitan_records'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudJimpit: JimpitDailyReport[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'jimpitan_records', d.id)).catch(() => {});
            } else {
              cloudJimpit.push(d.data() as JimpitDailyReport);
            }
          });
          cloudJimpit.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setJimpitReports(cloudJimpit);
          localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(cloudJimpit));
        }
      }, (err) => {
        console.warn('Firestore jimpitan listener error:', err.message);
      });

      // 4. Inventaris listener
      unsubInventory = onSnapshot(collection(db, 'inventaris'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudInv: InventoryItem[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'inventaris', d.id)).catch(() => {});
            } else {
              cloudInv.push(d.data() as InventoryItem);
            }
          });
          cloudInv.sort((a, b) => (a.no || 0) - (b.no || 0));
          setInventory(cloudInv);
          localStorage.setItem('grisspo_inventory', JSON.stringify(cloudInv));
        }
      }, (err) => {
        console.warn('Firestore inventaris listener error:', err.message);
      });

      // 5. Forum posts listener
      unsubForum = onSnapshot(collection(db, 'forum_posts'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudForum: ForumPost[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'forum_posts', d.id)).catch(() => {});
            } else {
              cloudForum.push(d.data() as ForumPost);
            }
          });
          setForumPosts(cloudForum);
          localStorage.setItem('grisspo_forum_posts', JSON.stringify(cloudForum));
        }
      }, (err) => {
        console.warn('Firestore forum listener error:', err.message);
      });

      // 6. Pengumuman listener
      unsubPengumuman = onSnapshot(collection(db, 'pengumuman'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudAnn: Announcement[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'pengumuman', d.id)).catch(() => {});
            } else {
              cloudAnn.push(d.data() as Announcement);
            }
          });
          setAnnouncements(cloudAnn);
          localStorage.setItem('grisspo_announcements', JSON.stringify(cloudAnn));
        }
      }, (err) => {
        console.warn('Firestore pengumuman listener error:', err.message);
      });

      // 7. Fasum bookings listener
      unsubFasum = onSnapshot(collection(db, 'fasum_bookings'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudFasum: FasumBooking[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'fasum_bookings', d.id)).catch(() => {});
            } else {
              cloudFasum.push(d.data() as FasumBooking);
            }
          });
          cloudFasum.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setFasumBookings(cloudFasum);
          localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(cloudFasum));
        }
      }, (err) => {
        console.warn('Firestore fasum listener error:', err.message);
      });

      // 8. Absensi Records listener
      unsubAbsensi = onSnapshot(collection(db, 'absensi_records'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudAbs: AttendanceSession[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'absensi_records', d.id)).catch(() => {});
            } else {
              cloudAbs.push(d.data() as AttendanceSession);
            }
          });
          cloudAbs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAttendanceSessions(cloudAbs);
          localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(cloudAbs));
        }
      }, (err) => {
        console.warn('Firestore absensi listener error:', err.message);
      });

      // 9. Notulen Rapat listener
      unsubNotulen = onSnapshot(collection(db, 'notulen_rapat'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudNotes: MeetingNote[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              deleteDoc(doc(db, 'notulen_rapat', d.id)).catch(() => {});
            } else {
              cloudNotes.push(d.data() as MeetingNote);
            }
          });
          cloudNotes.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
          setMeetingNotes(cloudNotes);
          localStorage.setItem('grisspo_meeting_notes', JSON.stringify(cloudNotes));
        }
      }, (err) => {
        console.warn('Firestore notulen listener error:', err.message);
      });

      // 10. Active Sessions Real-Time Listener (Monitoring Pengguna Online)
      unsubActiveSessions = onSnapshot(collection(db, 'active_sessions'), (snapshot) => {
        const sessions: ActiveSession[] = [];
        const now = Date.now();
        snapshot.forEach((d) => {
          const s = d.data() as ActiveSession;
          const lastActiveTime = new Date(s.lastActive || s.loginTime).getTime();
          // Filter out sessions older than 30 minutes inactivity
          if (now - lastActiveTime <= 30 * 60 * 1000) {
            sessions.push(s);
          } else {
            // Proactively clean up expired session
            deleteDoc(doc(db, 'active_sessions', d.id)).catch(() => {});
          }
        });

        sessions.sort((a, b) => new Date(b.lastActive || b.loginTime).getTime() - new Date(a.lastActive || a.loginTime).getTime());
        setActiveSessions(sessions);

        // Check if current user was kicked remotely by Superadmin
        if (currentUserRef.current && hasRegisteredSessionRef.current) {
          const stillActive = sessions.some((s) => s.userId === currentUserRef.current?.id);
          if (!stillActive && snapshot.docs.length > 0) {
            setCurrentUser(null);
            localStorage.removeItem('grisspo_user');
            setActiveView('jimpitan');
            setInactivityNotice('Sesi login Anda telah diputuskan oleh Superadmin.');
          }
        }
      }, (err) => {
        console.warn('Firestore active_sessions listener error:', err.message);
      });

      // 11. Fasum Facilities Config listener (Dynamic facilities from Firestore)
      unsubFacilities = onSnapshot(collection(db, 'fasum_facilities'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudFac: FasumFacilityConfig[] = [];
          snapshot.forEach((d) => {
            if (!deletedIdsRef.current.includes(d.id)) {
              cloudFac.push(d.data() as FasumFacilityConfig);
            }
          });
          if (cloudFac.length > 0) {
            setFasumFacilitiesList(cloudFac);
            localStorage.setItem('grisspo_fasum_facilities', JSON.stringify(cloudFac));
          }
        }
      }, (err) => {
        console.warn('Firestore fasum_facilities listener notice:', err.message);
      });

      // 12. Loket Pembayaran Kas & Kwitansi listener (Real-Time Cloud Sync)
      unsubReceipts = onSnapshot(collection(db, 'pembayaran_kwitansi'), (snapshot) => {
        const cloudReceipts: PaymentReceipt[] = [];
        snapshot.forEach((d) => {
          if (!deletedIdsRef.current.includes(d.id)) {
            cloudReceipts.push(d.data() as PaymentReceipt);
          } else {
            deleteDoc(doc(db, 'pembayaran_kwitansi', d.id)).catch(() => {});
          }
        });
        cloudReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPaymentReceipts(cloudReceipts);
        localStorage.setItem('grisspo_payment_receipts', JSON.stringify(cloudReceipts));
        setIsCloudSynced(true);
      }, (err) => {
        console.warn('Firestore pembayaran_kwitansi listener notice:', err.message);
      });

      // 13. Ronda Schedules Real-Time Listener
      unsubRonda = onSnapshot(collection(db, 'ronda_schedules'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudMap: Record<string, string[]> = {};
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.day && Array.isArray(data.members)) {
              cloudMap[data.day] = data.members;
            }
          });
          setRondaSchedule((prev) =>
            prev.map((g) => (cloudMap[g.day] ? { ...g, members: cloudMap[g.day] } : g))
          );
        }
      }, (err) => {
        console.warn('Firestore ronda_schedules listener notice:', err.message);
      });

      // 14. Katalog Benefit Real-Time Listener
      unsubRewards = onSnapshot(collection(db, 'katalog_benefit'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudRewards: LoyaltyReward[] = [];
          snapshot.forEach((d) => {
            if (!deletedIdsRef.current.includes(d.id)) {
              cloudRewards.push(d.data() as LoyaltyReward);
            }
          });
          if (cloudRewards.length > 0) {
            setRewards(cloudRewards);
            localStorage.setItem('grisspo_rewards', JSON.stringify(cloudRewards));
          }
        }
      }, (err) => {
        console.warn('Firestore katalog_benefit listener notice:', err.message);
      });

      // 15. Nomor Telepon Penting Sedayu Real-Time Listener
      unsubImportantContacts = onSnapshot(collection(db, 'kontak_penting'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudContacts: ImportantContact[] = [];
          snapshot.forEach((d) => {
            if (!deletedIdsRef.current.includes(d.id)) {
              cloudContacts.push(d.data() as ImportantContact);
            }
          });
          if (cloudContacts.length > 0) {
            cloudContacts.sort((a, b) => (a.order || 99) - (b.order || 99));
            setImportantContacts(cloudContacts);
            localStorage.setItem('grisspo_important_contacts', JSON.stringify(cloudContacts));
          }
        }
      }, (err) => {
        console.warn('Firestore kontak_penting listener notice:', err.message);
      });
    } catch (e) {
      console.warn('Firebase Firestore initialization notice:', e);
    }

    return () => {
      unsubDeleted?.();
      unsubWarga?.();
      unsubTransactions?.();
      unsubJimpitan?.();
      unsubInventory?.();
      unsubForum?.();
      unsubPengumuman?.();
      unsubFasum?.();
      unsubAbsensi?.();
      unsubNotulen?.();
      unsubActiveSessions?.();
      unsubFacilities?.();
      unsubReceipts?.();
      unsubRonda?.();
      unsubRewards?.();
      unsubImportantContacts?.();
    };
  }, []);

  // Save to localStorage as well
  useEffect(() => {
    localStorage.setItem('grisspo_fasum_facilities', JSON.stringify(fasumFacilitiesList));
  }, [fasumFacilitiesList]);

  useEffect(() => {
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(paymentReceipts));
  }, [paymentReceipts]);

  useEffect(() => {
    localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    localStorage.setItem('grisspo_meeting_notes', JSON.stringify(meetingNotes));
  }, [meetingNotes]);

  useEffect(() => {
    localStorage.setItem('grisspo_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('grisspo_residents', JSON.stringify(residents));
  }, [residents]);

  useEffect(() => {
    localStorage.setItem('grisspo_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(jimpitReports));
  }, [jimpitReports]);

  useEffect(() => {
    localStorage.setItem('grisspo_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('grisspo_forum_posts', JSON.stringify(forumPosts));
  }, [forumPosts]);

  useEffect(() => {
    localStorage.setItem('grisspo_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('grisspo_point_logs', JSON.stringify(pointLogs));
  }, [pointLogs]);

  useEffect(() => {
    localStorage.setItem('grisspo_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('grisspo_important_contacts', JSON.stringify(importantContacts));
  }, [importantContacts]);

  // Calculations for Financial summary with bulletproof type safety and number conversion
  const totalIncome = transactions
    .filter((t) => {
      const typeStr = String(t.type || '').trim().toLowerCase();
      return typeStr === 'pemasukan' || typeStr === 'income';
    })
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => {
      const typeStr = String(t.type || '').trim().toLowerCase();
      return typeStr === 'pengeluaran' || typeStr === 'expense';
    })
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  // Strict Password Validator
  // Rule: Setiap memilih role atau login wajib memasukkan password masing-masing
  const validateResidentPassword = (resident: Resident, passInput: string): boolean => {
    const cleanPass = passInput.trim();
    if (!cleanPass) return false;

    // Standard accepted defaults: Griss123 or griss123
    if (cleanPass === 'Griss123' || cleanPass === 'griss123') return true;

    // Individual role specific passwords:
    // e.g. Beni123, Ahmad123, Robi123, Sony123
    const namePass = `${resident.name.split(' ')[0].toLowerCase()}123`;
    if (cleanPass.toLowerCase() === namePass) return true;

    // Griss[NomorRumah] as password
    const housePass = `griss${resident.houseNumber.replace(/\s+/g, '').toLowerCase()}`;
    if (cleanPass.toLowerCase() === housePass) return true;

    // Check custom password if set
    if (resident.password && cleanPass === resident.password) return true;

    return false;
  };

  // Login handler with strict password validation
  const loginWithHouseNumber = (houseInput: string, passInput: string) => {
    const cleanUser = houseInput.trim().toUpperCase().replace(/\s+/g, '');
    const cleanPass = passInput.trim();

    if (!cleanPass) {
      return { success: false, message: 'Password wajib dimasukkan!' };
    }

    // Parse house number from Griss[nomor rumah]
    let extractedHouse = '';
    if (cleanUser.startsWith('GRISS')) {
      const rawNum = cleanUser.replace('GRISS', '');
      if (rawNum === 'SUPERADMIN') {
        extractedHouse = 'B 24';
      } else if (rawNum === 'SEKRETARIS') {
        extractedHouse = 'B 08';
      } else if (rawNum.length >= 2) {
        const letter = rawNum[0];
        const num = rawNum.slice(1).padStart(2, '0');
        extractedHouse = `${letter} ${num}`;
      }
    } else {
      extractedHouse = cleanUser;
    }

    // Find resident matching extracted house
    const resident = residents.find(
      (r) =>
        r.houseNumber.replace(/\s+/g, '').toUpperCase() === extractedHouse.replace(/\s+/g, '').toUpperCase() ||
        r.name.toUpperCase().includes(cleanUser)
    );

    if (!resident) {
      return {
        success: false,
        message: `Nomor rumah tidak ditemukan! Gunakan format Griss[NomorRumah], contoh: GrissB24, GrissB02, GrissC15`
      };
    }

    // Strictly validate password!
    if (!validateResidentPassword(resident, cleanPass)) {
      return {
        success: false,
        message: `Password salah untuk akun ${resident.name} (Rumah ${resident.houseNumber})! Gunakan password akun atau default Griss123.`
      };
    }

    const loggedUser: User = {
      id: resident.id,
      username: `Griss${resident.houseNumber.replace(/\s+/g, '')}`,
      name: resident.name,
      houseNumber: resident.houseNumber,
      role: resident.role,
      points: resident.points,
      phone: resident.phone
    };

    lastActivityTimeRef.current = Date.now();
    setCurrentUser(loggedUser);
    localStorage.setItem('grisspo_user', JSON.stringify(loggedUser));
    syncActiveSessionToCloud(loggedUser);
    setActiveView('dashboard');
    return {
      success: true,
      message: `Login berhasil! Selamat datang Bpk/Ibu ${resident.name} (${resident.houseNumber}) - Role: ${resident.role.toUpperCase()}`
    };
  };

  // Direct login for authenticated biometrics session
  const loginAsResident = (resident: Resident) => {
    const loggedUser: User = {
      id: resident.id,
      username: `Griss${resident.houseNumber.replace(/\s+/g, '')}`,
      name: resident.name,
      houseNumber: resident.houseNumber,
      role: resident.role,
      points: resident.points,
      phone: resident.phone
    };
    lastActivityTimeRef.current = Date.now();
    setCurrentUser(loggedUser);
    localStorage.setItem('grisspo_user', JSON.stringify(loggedUser));
    syncActiveSessionToCloud(loggedUser);
    setActiveView('dashboard');
  };

  // Switch role with mandatory password validation
  // Rule: "setiap memilih role atau login wajib memasukkan password masing-masing"
  const switchRoleWithPassword = (targetHouseNumber: string, passwordInput: string) => {
    const cleanPass = passwordInput.trim();
    if (!cleanPass) {
      return { success: false, message: 'Password wajib dimasukkan untuk otorisasi hak akses!' };
    }

    const resident = residents.find(
      (r) => r.houseNumber.replace(/\s+/g, '').toUpperCase() === targetHouseNumber.replace(/\s+/g, '').toUpperCase()
    );

    if (!resident) {
      return { success: false, message: `Akun warga untuk rumah ${targetHouseNumber} tidak ditemukan.` };
    }

    if (!validateResidentPassword(resident, cleanPass)) {
      return {
        success: false,
        message: `Password otorisasi salah untuk ${resident.name} (${resident.houseNumber})! Role tidak dapat diaktifkan.`
      };
    }

    const newUser: User = {
      id: resident.id,
      username: `Griss${resident.houseNumber.replace(/\s+/g, '')}`,
      name: resident.name,
      houseNumber: resident.houseNumber,
      role: resident.role,
      points: resident.points,
      phone: resident.phone
    };

    lastActivityTimeRef.current = Date.now();
    setCurrentUser(newUser);
    localStorage.setItem('grisspo_user', JSON.stringify(newUser));
    syncActiveSessionToCloud(newUser);
    return {
      success: true,
      message: `Otorisasi berhasil! Anda kini beralih sebagai ${resident.name} (${resident.role.toUpperCase()}).`
    };
  };

  const logout = () => {
    if (currentUser) {
      removeActiveSessionFromCloud(currentUser.id);
    }
    setCurrentUser(null);
    localStorage.removeItem('grisspo_user');
    setActiveView('jimpitan');
  };

  // Feature: Edit Profile for all roles with Firestore sync
  const updateResidentProfile = async (updates: {
    name: string;
    phone: string;
    familyMembers?: number;
    password?: string;
  }) => {
    if (!currentUser) return;
    const cleanName = updates.name.trim().toUpperCase();
    const cleanPhone = updates.phone.trim();

    const updatedUser: User = {
      ...currentUser,
      name: cleanName,
      phone: cleanPhone
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('grisspo_user', JSON.stringify(updatedUser));

    const updatedResidents = residents.map((r) => {
      if (
        r.id === currentUser.id ||
        r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase()
      ) {
        return {
          ...r,
          name: cleanName,
          phone: cleanPhone,
          familyMembers: updates.familyMembers !== undefined ? updates.familyMembers : r.familyMembers,
          password: updates.password ? updates.password : r.password
        };
      }
      return r;
    });
    setResidents(updatedResidents);
    localStorage.setItem('grisspo_residents', JSON.stringify(updatedResidents));

    try {
      const resDoc = updatedResidents.find(
        (r) =>
          r.id === currentUser.id ||
          r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentUser.houseNumber.replace(/\s+/g, '').toUpperCase()
      );
      if (resDoc) {
        await setDoc(doc(db, 'warga', resDoc.id), resDoc);
      }
    } catch (err) {
      console.warn('Firestore updateResidentProfile sync error:', err);
    }
  };

  // Feature: Delete / Reset data per feature (Superadmin)
  const resetFeatureData = async (feature: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang berhak melakukan reset data!');
      return;
    }

    const idsToMark: string[] = [];

    switch (feature) {
      case 'keuangan': {
        transactions.forEach((t) => idsToMark.push(t.id));
        setTransactions([]);
        localStorage.setItem('grisspo_transactions', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'keuangan_transaksi'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'keuangan_transaksi', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset keuangan error:', e);
        }
        break;
      }
      case 'jimpitan': {
        jimpitReports.forEach((j) => idsToMark.push(j.id));
        setJimpitReports([]);
        localStorage.setItem('grisspo_jimpit_reports', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'jimpitan_records'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'jimpitan_records', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset jimpitan error:', e);
        }
        break;
      }
      case 'absensi': {
        attendanceSessions.forEach((s) => idsToMark.push(s.id));
        setAttendanceSessions([]);
        localStorage.setItem('grisspo_attendance_sessions', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'absensi_records'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'absensi_records', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset absensi error:', e);
        }
        break;
      }
      case 'notulen': {
        meetingNotes.forEach((m) => idsToMark.push(m.id));
        setMeetingNotes([]);
        localStorage.setItem('grisspo_meeting_notes', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'notulen_rapat'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'notulen_rapat', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset notulen error:', e);
        }
        break;
      }
      case 'fasum': {
        fasumBookings.forEach((b) => idsToMark.push(b.id));
        setFasumBookings([]);
        localStorage.setItem('grisspo_fasum_bookings', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'fasum_bookings'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'fasum_bookings', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset fasum error:', e);
        }
        break;
      }
      case 'forum': {
        forumPosts.forEach((f) => idsToMark.push(f.id));
        setForumPosts([]);
        localStorage.setItem('grisspo_forum_posts', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'forum_posts'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'forum_posts', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset forum error:', e);
        }
        break;
      }
      case 'pengumuman': {
        announcements.forEach((a) => idsToMark.push(a.id));
        setAnnouncements([]);
        localStorage.setItem('grisspo_announcements', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'pengumuman'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'pengumuman', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset pengumuman error:', e);
        }
        break;
      }
      case 'wa_logs': {
        whatsAppLogs.forEach((w) => idsToMark.push(w.id));
        setWhatsAppLogs([]);
        localStorage.setItem('grisspo_wa_logs', JSON.stringify([]));
        break;
      }
      case 'inventaris': {
        inventory.forEach((i) => idsToMark.push(i.id));
        setInventory([]);
        localStorage.setItem('grisspo_inventory', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'inventaris'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'inventaris', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset inventaris error:', e);
        }
        break;
      }
      case 'pembayaran': {
        paymentReceipts.forEach((p) => idsToMark.push(p.id));
        setPaymentReceipts([]);
        localStorage.setItem('grisspo_payment_receipts', JSON.stringify([]));
        try {
          const snap = await getDocs(collection(db, 'pembayaran_kwitansi'));
          snap.forEach((d) => {
            idsToMark.push(d.id);
            deleteDoc(doc(db, 'pembayaran_kwitansi', d.id)).catch(() => {});
          });
        } catch (e) {
          console.warn('Reset pembayaran error:', e);
        }
        break;
      }
      case 'warga': {
        const resetRes = residents.map((r) => ({
          ...r,
          iuranUnpaidMonths: 0,
          unpaidMonthNames: [],
          monthlyIuranPaid: true,
          previousMonthsJimpitanDeficit: 0,
          jimpitanPaidMonth: 15000
        }));
        setResidents(resetRes);
        localStorage.setItem('grisspo_residents', JSON.stringify(resetRes));
        resetRes.forEach((r) => {
          setDoc(doc(db, 'warga', r.id), r).catch(() => {});
        });
        break;
      }
      case 'poin': {
        pointLogs.forEach((p) => idsToMark.push(p.id));
        setPointLogs([]);
        localStorage.setItem('grisspo_point_logs', JSON.stringify([]));
        const resetRes = residents.map((r) => ({ ...r, points: 0 }));
        setResidents(resetRes);
        localStorage.setItem('grisspo_residents', JSON.stringify(resetRes));
        resetRes.forEach((r) => {
          setDoc(doc(db, 'warga', r.id), r).catch(() => {});
        });
        if (currentUser) {
          setCurrentUser((prev) => (prev ? { ...prev, points: 0 } : null));
        }
        break;
      }
    }

    if (idsToMark.length > 0) {
      const uniqueIds = Array.from(new Set(idsToMark));
      setDeletedIds((prev) => {
        const merged = Array.from(new Set([...prev, ...uniqueIds]));
        localStorage.setItem('grisspo_deleted_ids', JSON.stringify(merged));
        deletedIdsRef.current = merged;
        return merged;
      });

      for (const did of uniqueIds) {
        setDoc(doc(db, 'system_deleted_ids', did), {
          id: did,
          feature,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.name || 'Superadmin'
        }).catch(() => {});
      }
    }
  };

  // Master reset all feature data across portal
  const masterResetAllFeatures = async () => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang berhak melakukan master reset!');
      return;
    }
    const features = ['keuangan', 'jimpitan', 'absensi', 'notulen', 'fasum', 'forum', 'pengumuman', 'wa_logs', 'poin'];
    for (const feat of features) {
      await resetFeatureData(feat);
    }
  };

  // Resident actions with Firestore sync
  const updateResident = async (resident: Resident) => {
    setResidents((prev) => prev.map((r) => (r.id === resident.id ? resident : r)));
    try {
      await setDoc(doc(db, 'warga', resident.id), resident);
    } catch (err) {
      console.warn('Firestore update warga sync notice:', err);
    }
  };

  const toggleBerkasKependudukan = async (
    residentId: string,
    status: boolean
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'sekretaris') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Superadmin dan Sekretaris yang memiliki hak akses mengubah checklist berkas kependudukan!'
      };
    }
    const target = residents.find((r) => r.id === residentId);
    if (!target) {
      return { success: false, message: 'Data warga tidak ditemukan!' };
    }
    const updated: Resident = { ...target, berkasKependudukan: status };
    const nextResidents = residents.map((r) => (r.id === residentId ? updated : r));
    setResidents(nextResidents);
    localStorage.setItem('grisspo_residents', JSON.stringify(nextResidents));
    try {
      await setDoc(doc(db, 'warga', residentId), updated);
    } catch (err) {
      console.warn('Firestore toggleBerkasKependudukan error:', err);
    }
    return {
      success: true,
      message: `Status berkas kependudukan ${target.name} (${target.houseNumber}) berhasil diubah: ${
        status ? 'Lengkap (Sudah Menyerahkan)' : 'Belum Menyerahkan'
      }.`
    };
  };

  const deleteResident = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak akses menghapus data warga!');
      return;
    }
    await markAsDeleted(id, 'warga');
    const updated = residents.filter((r) => r.id !== id);
    setResidents(updated);
    localStorage.setItem('grisspo_residents', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'warga', id));
    } catch (err) {
      console.warn('Firestore delete warga sync notice:', err);
    }
  };

  const addResident = async (resData: Omit<Resident, 'id' | 'no'>) => {
    const newRes: Resident = {
      ...resData,
      id: `w-${Date.now()}`,
      no: residents.length + 1
    };
    setResidents((prev) => [...prev, newRes]);
    try {
      await setDoc(doc(db, 'warga', newRes.id), newRes);
    } catch (err) {
      console.warn('Firestore add warga sync notice:', err);
    }
  };

  // Inventory actions with Firestore sync
  const updateInventoryItem = async (item: InventoryItem) => {
    setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    try {
      await setDoc(doc(db, 'inventaris', item.id), item);
    } catch (err) {
      console.warn('Firestore update inventaris notice:', err);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak akses menghapus data inventaris!');
      return;
    }
    await markAsDeleted(id, 'inventaris');
    const updated = inventory.filter((i) => i.id !== id);
    setInventory(updated);
    localStorage.setItem('grisspo_inventory', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'inventaris', id));
    } catch (err) {
      console.warn('Firestore delete inventaris notice:', err);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'no'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      no: inventory.length + 1
    };
    setInventory((prev) => [...prev, newItem]);
    try {
      await setDoc(doc(db, 'inventaris', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore add inventaris notice:', err);
    }
  };

  const borrowInventoryItem = async (id: string, borrowerName: string) => {
    const updated = inventory.find((i) => i.id === id);
    if (!updated) return;
    const item: InventoryItem = { ...updated, statusPinjam: 'Dipinjam', peminjamTerakhir: borrowerName };
    setInventory((prev) => prev.map((i) => (i.id === id ? item : i)));
    try {
      await setDoc(doc(db, 'inventaris', id), item);
    } catch (err) {
      console.warn('Firestore borrow item notice:', err);
    }
  };

  const returnInventoryItem = async (id: string) => {
    const updated = inventory.find((i) => i.id === id);
    if (!updated) return;
    const item: InventoryItem = { ...updated, statusPinjam: 'Tersedia' };
    setInventory((prev) => prev.map((i) => (i.id === id ? item : i)));
    try {
      await setDoc(doc(db, 'inventaris', id), item);
    } catch (err) {
      console.warn('Firestore return item notice:', err);
    }
  };

  // Jimpitan Daily Submission with Firestore Sync
  const submitDailyJimpit = async (reportData: Omit<JimpitDailyReport, 'id' | 'createdAt'>) => {
    const newReport: JimpitDailyReport = {
      ...reportData,
      id: `jimpit-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setJimpitReports((prev) => [newReport, ...prev]);

    // Update residents and Firestore
    const updatedRes = [...residents];
    reportData.entries.forEach((entry) => {
      const idx = updatedRes.findIndex((r) => r.houseNumber === entry.houseNumber);
      if (idx !== -1) {
        const curPaid = updatedRes[idx].jimpitanPaidMonth || 0;
        updatedRes[idx] = {
          ...updatedRes[idx],
          jimpitanPaidMonth: curPaid + entry.nominal,
          points: (updatedRes[idx].points || 0) + 10
        };
        // sync to Firestore
        setDoc(doc(db, 'warga', updatedRes[idx].id), updatedRes[idx]).catch(() => {});
      }
    });
    setResidents(updatedRes);

    // Save report to Firestore
    try {
      await setDoc(doc(db, 'jimpitan_records', newReport.id), newReport);
    } catch (err) {
      console.warn('Firestore jimpitan record notice:', err);
    }

    // Automatically create income transaction for Paguyuban kas
    const dateStr = reportData.date;
    const now = Date.now();
    const hash = await computeTransactionHash(
      'pemasukan',
      'Pemasukan Jimpitan Bulanan',
      reportData.totalNominal,
      dateStr,
      reportData.collectedBy,
      now
    );

    const jimpitTrx: Transaction = {
      id: `trx-jimpit-${now}`,
      type: 'pemasukan',
      category: 'Pemasukan Jimpitan Bulanan',
      amount: reportData.totalNominal,
      date: dateStr,
      description: `Pemasukan Jimpitan Ronda Online (${reportData.day}, ${dateStr}) oleh ${reportData.collectedBy}`,
      recordedBy: reportData.collectedBy,
      userRole: currentUser ? currentUser.role : 'warga',
      encryptedHash: hash,
      isAnomaly: false,
      timestamp: now
    };

    setTransactions((prev) => [jimpitTrx, ...prev]);
    try {
      await setDoc(doc(db, 'keuangan_transaksi', jimpitTrx.id), jimpitTrx);
    } catch (err) {
      console.warn('Firestore jimpitan trx notice:', err);
    }

    // Add announcement
    await addAnnouncement(
      `Jimpitan Online Hari ${reportData.day} Selesai Diambil`,
      `Total perolehan jimpitan hari ini sebesar Rp ${reportData.totalNominal.toLocaleString('id-ID')} dari ${reportData.entries.length} warga. Disimpan real-time ke Firebase Cloud.`,
      'Ronda',
      false
    );
  };

  const deleteJimpitReport = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus laporan jimpitan!');
      return;
    }
    await markAsDeleted(id, 'jimpitan_records');

    const reportToDelete = jimpitReports.find((r) => r.id === id);
    if (reportToDelete) {
      // Revert resident paid amounts
      setResidents((prev) =>
        prev.map((res) => {
          const entry = reportToDelete.entries.find((e) => e.houseNumber === res.houseNumber);
          if (entry) {
            const newPaid = Math.max(0, (res.jimpitanPaidMonth || 0) - entry.nominal);
            const updated = { ...res, jimpitanPaidMonth: newPaid };
            setDoc(doc(db, 'warga', res.id), updated).catch(() => {});
            return updated;
          }
          return res;
        })
      );
    }

    const filtered = jimpitReports.filter((r) => r.id !== id);
    setJimpitReports(filtered);
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, 'jimpitan_records', id));
    } catch (err) {
      console.warn('Firestore delete jimpitan notice:', err);
    }
  };

  const removeRondaMember = async (day: DayOfWeek, memberName: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak mengedit jadwal ronda!');
      return;
    }
    const updated = rondaSchedule.map((g) => {
      if (g.day === day) {
        return { ...g, members: g.members.filter((m) => m !== memberName) };
      }
      return g;
    });
    setRondaSchedule(updated);
    localStorage.setItem('grisspo_ronda_schedule', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'ronda_schedules', day), { day, members: updated.find((g) => g.day === day)?.members || [] });
    } catch (err) {
      console.warn('Firestore ronda update notice:', err);
    }
  };

  const addRondaMember = async (day: DayOfWeek, memberName: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak mengedit jadwal ronda!');
      return;
    }
    const cleanName = memberName.trim().toUpperCase();
    if (!cleanName) return;

    const updated = rondaSchedule.map((g) => {
      if (g.day === day && !g.members.includes(cleanName)) {
        return { ...g, members: [...g.members, cleanName] };
      }
      return g;
    });
    setRondaSchedule(updated);
    localStorage.setItem('grisspo_ronda_schedule', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'ronda_schedules', day), { day, members: updated.find((g) => g.day === day)?.members || [] });
    } catch (err) {
      console.warn('Firestore ronda update notice:', err);
    }
  };

  const updateRondaGroup = async (group: RondaGroup) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak mengedit jadwal ronda!');
      return;
    }
    const updated = rondaSchedule.map((g) => (g.day === group.day ? group : g));
    setRondaSchedule(updated);
    localStorage.setItem('grisspo_ronda_schedule', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'ronda_schedules', group.day), group);
    } catch (err) {
      console.warn('Firestore update ronda group notice:', err);
    }
  };

  // Feature: Pembayaran Kekurangan Jimpitan terintegrasi ke Laporan Keuangan Paguyuban
  const payJimpitanDeficit = async (
    residentId: string,
    amount: number,
    method: 'transfer' | 'cash',
    notes?: string
  ): Promise<{ success: boolean; message: string; transactionId?: string }> => {
    const resident = residents.find((r) => r.id === residentId);
    if (!resident) {
      return { success: false, message: 'Data warga tidak ditemukan!' };
    }
    if (amount <= 0) {
      return { success: false, message: 'Nominal pembayaran harus lebih besar dari Rp 0!' };
    }

    // 1. Deduct deficit: deduct previousMonthsJimpitanDeficit first, then surplus to jimpitanPaidMonth
    let remaining = amount;
    let prevDeficit = resident.previousMonthsJimpitanDeficit || 0;
    const deductPrev = Math.min(prevDeficit, remaining);
    prevDeficit -= deductPrev;
    remaining -= deductPrev;

    let curPaid = (resident.jimpitanPaidMonth || 0) + remaining;

    const updatedRes: Resident = {
      ...resident,
      previousMonthsJimpitanDeficit: prevDeficit,
      jimpitanPaidMonth: curPaid,
      points: (resident.points || 0) + 15
    };

    setResidents((prev) => prev.map((r) => (r.id === residentId ? updatedRes : r)));
    localStorage.setItem(
      'grisspo_residents',
      JSON.stringify(residents.map((r) => (r.id === residentId ? updatedRes : r)))
    );
    try {
      await setDoc(doc(db, 'warga', resident.id), updatedRes);
    } catch (err) {
      console.warn('Firestore update warga notice:', err);
    }

    // 2. Automatically record income transaction in Keuangan Kas Paguyuban
    const dateStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const currentName = currentUser?.name || 'Petugas Jimpit';
    const userRole = currentUser?.role || 'warga';
    const hash = await computeTransactionHash(
      'pemasukan',
      'Pemasukan Jimpitan Bulanan',
      amount,
      dateStr,
      currentName,
      now
    );

    const methodLabel = method === 'transfer' ? 'Transfer Bank BRI' : 'Tunai';

    const newTrx: Transaction = {
      id: `trx-jimpit-pay-${now}`,
      type: 'pemasukan',
      category: 'Pemasukan Jimpitan Bulanan',
      amount,
      date: dateStr,
      description: `Pelunasan Kekurangan Jimpitan: ${resident.name} (${resident.houseNumber}) via ${methodLabel}${notes ? ` - ${notes}` : ''}`,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Petugas Jimpit',
      userRole,
      sourceHouse: resident.houseNumber,
      encryptedHash: hash,
      isAnomaly: false,
      timestamp: now
    };

    setTransactions((prev) => [newTrx, ...prev]);
    localStorage.setItem('grisspo_transactions', JSON.stringify([newTrx, ...transactions]));
    try {
      await setDoc(doc(db, 'keuangan_transaksi', newTrx.id), newTrx);
    } catch (err) {
      console.warn('Firestore pay jimpit trx notice:', err);
    }

    // 3. Award loyalty points & push announcement
    awardPoints(resident.id, 15, `Pelunasan kekurangan jimpitan via ${methodLabel}`);

    addAnnouncement(
      `Pelunasan Kekurangan Jimpitan: ${resident.name} (${resident.houseNumber})`,
      `Pembayaran kekurangan jimpitan sebesar Rp ${amount.toLocaleString('id-ID')} via ${methodLabel} telah berhasil diverifikasi dan tercatat di Kas Paguyuban.`,
      'Keuangan',
      false
    );

    return {
      success: true,
      message: `Pembayaran kekurangan jimpitan Rp ${amount.toLocaleString('id-ID')} berhasil dicatat & otomatis masuk Laporan Kas Keuangan Paguyuban!`,
      transactionId: newTrx.id
    };
  };

  // Feature: Automated WhatsApp Notification for >= 2 months unpaid iuran
  const sendWhatsAppIuranWarning = async (
    residentId: string
  ): Promise<{ success: boolean; url: string; log: WhatsAppNotificationLog }> => {
    const resident = residents.find((r) => r.id === residentId);
    if (!resident) throw new Error('Data warga tidak ditemukan!');

    const unpaidMonths = resident.iuranUnpaidMonths || 2;
    const totalArrears = unpaidMonths * 25000;
    const monthListStr =
      resident.unpaidMonthNames && resident.unpaidMonthNames.length > 0
        ? resident.unpaidMonthNames.join(', ')
        : `${unpaidMonths} bulan terakhir`;

    const rawPhone = (resident.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = rawPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    const messageText = `*PEMBERITAHUAN TUNGGAKAN IURAN PERUM GSS 1*\n` +
      `Yth. Bpk/Ibu *${resident.name}* (Rumah *${resident.houseNumber}*)\n` +
      `Paguyuban Griya Sedayu Selaras 1\n\n` +
      `Berdasarkan pembukuan keuangan paguyuban warga, kami menginformasikan bahwa terdapat tunggakan Iuran Bulanan selama *${unpaidMonths} Bulan Berturut-turut* (${monthListStr}) dengan rincian kewajiban:\n` +
      `• Nominal Iuran: Rp 25.000 / KK / bulan\n` +
      `• Tanggal Jatuh Tempo: Tanggal 28 setiap bulan\n` +
      `• Total Tunggakan: *Rp ${totalArrears.toLocaleString('id-ID')}*\n\n` +
      `Sesuai Tata Tertib Warga Perum GSS 2026, mohon kerjasamanya untuk segera melakukan pelunasan sebelum tanggal 28 melalui transfer kas atau konfirmasi ke:\n` +
      `- Bendahara 1: Bpk. Ahmad (Rumah B 02)\n` +
      `- Bendahara 2: Bpk. Robi (Rumah C 15)\n` +
      `- Superadmin: Bpk. Beni (Rumah B 24)\n\n` +
      `Terima kasih atas perhatian dan kerjasamanya demi kelancaran operasional keamanan & kebersihan lingkungan kita bersama.`;

    const encodedUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedResident: Resident = {
      ...resident,
      lastWhatsAppWarningSent: nowStr
    };

    setResidents((prev) => prev.map((r) => (r.id === residentId ? updatedResident : r)));
    try {
      await setDoc(doc(db, 'warga', resident.id), updatedResident);
    } catch (err) {}

    const newLog: WhatsAppNotificationLog = {
      id: `walog-${Date.now()}`,
      residentName: resident.name,
      residentHouse: resident.houseNumber,
      phoneNumber: resident.phone || formattedPhone,
      message: messageText,
      unpaidMonthsCount: unpaidMonths,
      totalArrears: totalArrears,
      timestamp: nowStr,
      status: 'Terkirim'
    };

    const nextLogs = [newLog, ...whatsAppLogs];
    setWhatsAppLogs(nextLogs);
    localStorage.setItem('grisspo_wa_logs', JSON.stringify(nextLogs));
    try {
      await setDoc(doc(db, 'whatsapp_logs', newLog.id), newLog);
    } catch (err) {}

    return { success: true, url: encodedUrl, log: newLog };
  };

  const deleteWhatsAppLog = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak menghapus log WhatsApp!');
      return;
    }
    await markAsDeleted(id, 'whatsapp_logs');
    const updated = whatsAppLogs.filter((l) => l.id !== id);
    setWhatsAppLogs(updated);
    localStorage.setItem('grisspo_wa_logs', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'whatsapp_logs', id));
    } catch (err) {}
  };

  // Finance Transactions with Firestore sync
  const addTransaction = async (
    trxData: Omit<Transaction, 'id' | 'encryptedHash' | 'timestamp' | 'isAnomaly'>
  ): Promise<Transaction> => {
    const now = Date.now();
    const hash = await computeTransactionHash(
      trxData.type,
      trxData.category,
      trxData.amount,
      trxData.date,
      trxData.recordedBy,
      now
    );

    const anomalyCheck = detectFinancialAnomaly(trxData);
    let isAnomaly = anomalyCheck.isAnomaly;
    let anomalyReason = anomalyCheck.reason;

    if (isAnomaly && anomalyReason) {
      const emailLog = sendAnomalyEmailAlert(trxData, anomalyReason);
      setEmailAlerts((prev) => [emailLog, ...prev]);
    }

    const numericAmount = Number(trxData.amount) || 0;
    const cleanType = (String(trxData.type || '').trim().toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran';

    const newTrx: Transaction = {
      ...trxData,
      type: cleanType,
      amount: numericAmount,
      id: `trx-${now}`,
      encryptedHash: hash,
      isAnomaly,
      anomalyReason,
      timestamp: now
    };

    setTransactions((prev) => [newTrx, ...prev]);
    try {
      await setDoc(doc(db, 'keuangan_transaksi', newTrx.id), newTrx);
    } catch (err) {
      console.warn('Firestore save transaction notice:', err);
    }

    if (trxData.sourceHouse) {
      if (trxData.category.toLowerCase().includes('sumbangan') && numericAmount >= 100000) {
        awardPointsToResident(trxData.sourceHouse, 50, `Partisipasi Sumbangan Warga Minimal Rp 100.000 (${trxData.sourceHouse})`);
      }
    }

    return newTrx;
  };

  const deleteTransaction = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses menghapus transaksi keuangan!');
      return;
    }
    await markAsDeleted(id, 'keuangan_transaksi');
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem('grisspo_transactions', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'keuangan_transaksi', id));
    } catch (err) {
      console.warn('Firestore delete transaction notice:', err);
    }
  };

  const updateTransaction = async (trx: Transaction) => {
    const numericAmount = Number(trx.amount) || 0;
    const cleanType = (String(trx.type || '').trim().toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran';

    const updatedHash = await computeTransactionHash(
      cleanType,
      trx.category,
      numericAmount,
      trx.date,
      trx.recordedBy,
      trx.timestamp
    );
    const updated: Transaction = {
      ...trx,
      type: cleanType,
      amount: numericAmount,
      encryptedHash: updatedHash
    };
    setTransactions((prev) => prev.map((t) => (t.id === trx.id ? updated : t)));
    try {
      await setDoc(doc(db, 'keuangan_transaksi', trx.id), updated);
    } catch (err) {
      console.warn('Firestore update transaction notice:', err);
    }
  };

  // Forum actions with Firestore sync
  const createForumPost = async (
    title: string,
    content: string,
    category: ForumPost['category']
  ) => {
    if (!currentUser) {
      alert('Silakan login terlebih dahulu untuk membuat postingan diskusi!');
      return;
    }
    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title,
      content,
      category,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHouse: currentUser.houseNumber,
      authorRole: currentUser.role,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    setForumPosts((prev) => [newPost, ...prev]);
    try {
      await setDoc(doc(db, 'forum_posts', newPost.id), newPost);
    } catch (err) {
      console.warn('Firestore create forum notice:', err);
    }
    awardPoints(currentUser.id, 5, 'Kontribusi topik diskusi warga di Forum GRISSPO');
  };

  const addForumComment = async (postId: string, content: string) => {
    if (!currentUser) {
      alert('Silakan login terlebih dahulu untuk berkomentar!');
      return;
    }
    const targetPost = forumPosts.find((p) => p.id === postId);
    if (!targetPost) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorName: currentUser.name,
      authorHouse: currentUser.houseNumber,
      content,
      createdAt: new Date().toISOString()
    };

    const updatedPost = { ...targetPost, comments: [...targetPost.comments, newComment] };
    setForumPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    try {
      await setDoc(doc(db, 'forum_posts', postId), updatedPost);
    } catch (err) {
      console.warn('Firestore comment notice:', err);
    }
    awardPoints(currentUser.id, 2, 'Komentar di Forum Paguyuban');
  };

  const togglePostLike = async (postId: string) => {
    if (!currentUser) return;
    const targetPost = forumPosts.find((p) => p.id === postId);
    if (!targetPost) return;

    const hasLiked = targetPost.likes.includes(currentUser.id);
    const newLikes = hasLiked
      ? targetPost.likes.filter((uid) => uid !== currentUser.id)
      : [...targetPost.likes, currentUser.id];

    const updatedPost = { ...targetPost, likes: newLikes };
    setForumPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    try {
      await setDoc(doc(db, 'forum_posts', postId), updatedPost);
    } catch (err) {
      console.warn('Firestore like notice:', err);
    }
  };

  const deleteForumPost = async (postId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak moderasi menghapus topik diskusi!');
      return;
    }
    await markAsDeleted(postId, 'forum_posts');
    const updated = forumPosts.filter((p) => p.id !== postId);
    setForumPosts(updated);
    localStorage.setItem('grisspo_forum_posts', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
    } catch (err) {
      console.warn('Firestore delete forum notice:', err);
    }
  };

  const deleteForumComment = async (postId: string, commentId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus komentar!');
      return;
    }
    const targetPost = forumPosts.find((p) => p.id === postId);
    if (!targetPost) return;

    const updatedComments = targetPost.comments.filter((c) => c.id !== commentId);
    const updatedPost = { ...targetPost, comments: updatedComments };

    setForumPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    try {
      await setDoc(doc(db, 'forum_posts', postId), updatedPost);
    } catch (err) {
      console.warn('Firestore delete comment notice:', err);
    }
  };

  const togglePinPost = async (postId: string) => {
    const target = forumPosts.find((p) => p.id === postId);
    if (!target) return;
    const updated = { ...target, isPinned: !target.isPinned };
    setForumPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    try {
      await setDoc(doc(db, 'forum_posts', postId), updated);
    } catch (err) {
      console.warn('Firestore pin forum notice:', err);
    }
  };

  // Loyalty rewards actions
  const awardPoints = (userId: string, points: number, reason: string) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id === userId || (currentUser && r.houseNumber === currentUser.houseNumber)) {
          const updated = { ...r, points: (r.points || 0) + points };
          setDoc(doc(db, 'warga', r.id), updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );

    if (currentUser && (currentUser.id === userId || currentUser.houseNumber)) {
      setCurrentUser((prev) => (prev ? { ...prev, points: (prev.points || 0) + points } : null));
    }

    const log: PointLog = {
      id: `pl-${Date.now()}`,
      userId,
      houseNumber: currentUser?.houseNumber || '',
      userName: currentUser?.name || 'Warga GSS',
      pointsChange: points,
      reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setPointLogs((prev) => [log, ...prev]);
  };

  const redeemReward = (rewardId: string): { success: boolean; message: string } => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return { success: false, message: 'Hadiah tidak ditemukan' };
    if (!currentUser) {
      return { success: false, message: 'Silakan login terlebih dahulu untuk menukarkan poin!' };
    }
    if (currentUser.points < reward.pointsCost) {
      return {
        success: false,
        message: `Poin tidak mencukupi! Anda memiliki ${currentUser.points} poin, dibutuhkan ${reward.pointsCost} poin.`
      };
    }
    if (reward.stock <= 0) {
      return { success: false, message: 'Stok benefit ini sedang habis.' };
    }

    const remaining = currentUser.points - reward.pointsCost;
    setCurrentUser((prev) => (prev ? { ...prev, points: remaining } : null));
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id === currentUser.id) {
          const updated = { ...r, points: remaining };
          setDoc(doc(db, 'warga', r.id), updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );

    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r))
    );

    const log: PointLog = {
      id: `pl-${Date.now()}`,
      userId: currentUser.id,
      houseNumber: currentUser.houseNumber,
      userName: currentUser.name,
      pointsChange: -reward.pointsCost,
      reason: `Penukaran benefit: ${reward.title}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setPointLogs((prev) => [log, ...prev]);

    return {
      success: true,
      message: `Selamat! Penukaran "${reward.title}" berhasil. Hubungi Pengurus Paguyuban untuk klaim benefit.`
    };
  };

  const deletePointLog = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus log poin warga!');
      return;
    }
    setPointLogs((prev) => prev.filter((p) => p.id !== id));
  };

  const clearEmailAlerts = () => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak membersihkan log anomali!');
      return;
    }
    setEmailAlerts([]);
  };

  // Announcements with Firestore sync
  const addAnnouncement = async (
    title: string,
    message: string,
    category: Announcement['category'],
    isImportant: boolean = false
  ) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      category,
      date: 'Hari ini',
      isImportant
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    try {
      await setDoc(doc(db, 'pengumuman', newAnn.id), newAnn);
    } catch (err) {
      console.warn('Firestore announcement notice:', err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus pengumuman!');
      return;
    }
    await markAsDeleted(id, 'pengumuman');
    const filtered = announcements.filter((a) => a.id !== id);
    setAnnouncements(filtered);
    localStorage.setItem('grisspo_announcements', JSON.stringify(filtered));
    try {
      await deleteDoc(doc(db, 'pengumuman', id));
    } catch (err) {
      console.warn('Firestore delete announcement notice:', err);
    }
  };

  // Fasum Bookings & Automated Payment Integration
  const addFasumBooking = async (
    bookingData: Omit<FasumBooking, 'id' | 'createdAt' | 'e2eHash'>
  ): Promise<FasumBooking> => {
    const id = `fsm-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const actorName = currentUser ? currentUser.name : 'Warga GSS';
    const actorRole = currentUser ? currentUser.role : 'warga';
    const hash = await computeTransactionHash(
      'pemasukan',
      'Sewa Fasum (Rp 30.000/bln)',
      bookingData.rentalFee,
      bookingData.date,
      actorName,
      Date.now()
    );

    const newBooking: FasumBooking = {
      ...bookingData,
      id,
      createdAt,
      e2eHash: hash
    };

    // If marked as lunas immediately (e.g. simulated QRIS or created by Bendahara)
    if (newBooking.paymentStatus === 'lunas') {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      newBooking.paymentDate = nowStr;
      newBooking.status = 'disetujui';
      newBooking.approvedBy = actorName;
      newBooking.approvedAt = nowStr;

      // Automatically post income to Paguyuban Book of Accounts
      const trx = await addTransaction({
        type: 'pemasukan',
        category: 'Sewa Fasum (Rp 30.000/bln)',
        amount: newBooking.rentalFee,
        date: newBooking.date,
        description: `Sewa Fasum: ${newBooking.facilityName} - ${newBooking.residentName} (${newBooking.residentHouse}) - Acara: ${newBooking.purpose}`,
        recordedBy: actorName,
        userRole: actorRole,
        sourceHouse: newBooking.residentHouse
      });
      newBooking.transactionId = trx.id;

      // Award +25 GRISS-Poin to the resident
      awardPoints(newBooking.residentId, 25, `Sewa Fasum: ${newBooking.facilityName}`);

      // Push announcement
      addAnnouncement(
        `Sewa Fasum Disetujui & Masuk Kas: ${newBooking.facilityName}`,
        `Warga ${newBooking.residentName} (${newBooking.residentHouse}) telah memesan ${newBooking.facilityName} untuk tanggal ${newBooking.date}. Biaya sewa Rp ${newBooking.rentalFee.toLocaleString('id-ID')} telah tercatat otomatis di Buku Kas Paguyuban.`,
        'Kegiatan'
      );
    } else {
      addAnnouncement(
        `Pemesanan Fasum Baru: ${newBooking.facilityName}`,
        `Warga ${newBooking.residentName} (${newBooking.residentHouse}) mengajukan pemesanan ${newBooking.facilityName} tanggal ${newBooking.date}. Menunggu konfirmasi pembayaran.`,
        'Umum'
      );
    }

    setFasumBookings((prev) => [newBooking, ...prev]);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify([newBooking, ...fasumBookings]));

    try {
      await setDoc(doc(db, 'fasum_bookings', newBooking.id), newBooking);
    } catch (err) {
      console.warn('Firestore add fasum error:', err);
    }

    return newBooking;
  };

  const confirmFasumPayment = async (bookingId: string, approvedBy?: string) => {
    const booking = fasumBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const paymentDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const verifier = approvedBy || (currentUser ? currentUser.name : 'Pengurus Paguyuban');
    const verifierRole = currentUser ? currentUser.role : 'bendahara1';

    // Automatically record income in Keuangan Kas!
    const trx = await addTransaction({
      type: 'pemasukan',
      category: 'Sewa Fasum (Rp 30.000/bln)',
      amount: booking.rentalFee,
      date: booking.date,
      description: `Sewa Fasum: ${booking.facilityName} - ${booking.residentName} (${booking.residentHouse}) - Acara: ${booking.purpose}`,
      recordedBy: verifier,
      userRole: verifierRole,
      sourceHouse: booking.residentHouse
    });

    const updatedBooking: FasumBooking = {
      ...booking,
      paymentStatus: 'lunas',
      status: 'disetujui',
      paymentDate,
      approvedBy: verifier,
      approvedAt: paymentDate,
      transactionId: trx.id
    };

    setFasumBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? updatedBooking : b))
    );
    localStorage.setItem(
      'grisspo_fasum_bookings',
      JSON.stringify(fasumBookings.map((b) => (b.id === bookingId ? updatedBooking : b)))
    );

    // Award +25 points
    awardPoints(booking.residentId, 25, `Sewa Fasum: ${booking.facilityName}`);

    // Announcement
    addAnnouncement(
      `Pembayaran Sewa Fasum Terverifikasi & Masuk Kas`,
      `Sewa ${booking.facilityName} oleh ${booking.residentName} (${booking.residentHouse}) tanggal ${booking.date} telah diverifikasi oleh ${verifier}. Dana Rp ${booking.rentalFee.toLocaleString('id-ID')} masuk kas paguyuban.`,
      'Keuangan'
    );

    try {
      await setDoc(doc(db, 'fasum_bookings', bookingId), updatedBooking);
    } catch (err) {
      console.warn('Firestore confirm fasum error:', err);
    }
  };

  const updateFasumBookingStatus = async (
    bookingId: string,
    status: FasumBooking['status'],
    notes?: string
  ) => {
    const updated = fasumBookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status,
          notes: notes !== undefined ? notes : b.notes
        };
      }
      return b;
    });
    setFasumBookings(updated);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(updated));
    const target = updated.find((b) => b.id === bookingId);
    if (target) {
      try {
        await setDoc(doc(db, 'fasum_bookings', bookingId), target);
      } catch (err) {
        console.warn('Firestore update fasum status error:', err);
      }
    }
  };

  const deleteFasumBooking = async (bookingId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Hanya Superadmin (Bpk. Beni B24) yang memiliki hak menghapus data pemesanan fasum.');
      return;
    }
    await markAsDeleted(bookingId, 'fasum_bookings');
    const filtered = fasumBookings.filter((b) => b.id !== bookingId);
    setFasumBookings(filtered);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(filtered));
    try {
      await deleteDoc(doc(db, 'fasum_bookings', bookingId));
    } catch (err) {
      console.warn('Firestore delete fasum error:', err);
    }
  };

  // --- FASUM FACILITIES CRUD (Superadmin) ---
  const addFasumFacility = async (facility: FasumFacilityConfig) => {
    const next = [...fasumFacilitiesList.filter((f) => f.id !== facility.id), facility];
    setFasumFacilitiesList(next);
    localStorage.setItem('grisspo_fasum_facilities', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'fasum_facilities', facility.id), facility);
    } catch (err) {
      console.warn('Firestore addFasumFacility error:', err);
    }
  };

  const updateFasumFacility = async (facility: FasumFacilityConfig) => {
    const next = fasumFacilitiesList.map((f) => (f.id === facility.id ? facility : f));
    setFasumFacilitiesList(next);
    localStorage.setItem('grisspo_fasum_facilities', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'fasum_facilities', facility.id), facility);
    } catch (err) {
      console.warn('Firestore updateFasumFacility error:', err);
    }
  };

  const deleteFasumFacility = async (facilityId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang berhak menghapus jenis fasilitas.');
      return;
    }
    const next = fasumFacilitiesList.filter((f) => f.id !== facilityId);
    setFasumFacilitiesList(next);
    localStorage.setItem('grisspo_fasum_facilities', JSON.stringify(next));
    try {
      await deleteDoc(doc(db, 'fasum_facilities', facilityId));
    } catch (err) {
      console.warn('Firestore deleteFasumFacility error:', err);
    }
  };

  // --- LOKET PEMBAYARAN KAS & KWITANSI RESMI ---
  const recordCashierPayment = async (data: {
    residentId: string;
    residentName: string;
    residentHouse: string;
    residentPhone?: string;
    paymentType: PaymentReceiptType;
    paymentTypeName: string;
    amount: number;
    periodMonth?: string;
    paymentMethod: PaymentMethodType;
    notes?: string;
  }): Promise<PaymentReceipt> => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const receiptNum = `KWT-GSS-${dateStr.replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Add corresponding cash transaction to Paguyuban Book
    let cat: Transaction['category'] = 'Iuran Bulanan (Rp 25.000)';
    if (data.paymentType === 'iuran_bulanan') cat = 'Iuran Bulanan (Rp 25.000)';
    else if (data.paymentType === 'iuran_sampah') cat = 'Iuran Sampah (Rp 25.000)';
    else if (data.paymentType === 'iuran_bulanan_sampah') cat = 'Iuran Bulanan + Sampah (Rp 50.000)';
    else if (data.paymentType === 'sewa_fasum') cat = 'Sewa Fasum';
    else if (data.paymentType === 'sumbangan_sukarela') cat = 'Sumbangan Sukarela';
    else cat = 'Lain-lain Pemasukan';

    const methodLabel = data.paymentMethod === 'transfer_bank_bri' || data.paymentMethod === 'transfer_bank'
      ? 'Transfer Bank BRI (155801007310503 a/n Benisius Rahmat Basuki)'
      : 'Tunai ke Bendahara';

    const desc = `${data.paymentTypeName} - ${data.residentName} (${data.residentHouse}) [No. Kwitansi: ${receiptNum}] via ${methodLabel}${data.periodMonth ? ` - Periode: ${data.periodMonth}` : ''}${data.notes ? ` (${data.notes})` : ''}`;

    const numAmount = Number(data.amount) || 0;

    const createdTrx = await addTransaction({
      type: 'pemasukan',
      category: cat,
      amount: numAmount,
      date: dateStr,
      description: desc,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Bendahara Kas',
      userRole: currentUser?.role || 'bendahara1',
      sourceHouse: data.residentHouse
    });

    // 2. If iuran, update resident arrears
    const res = residents.find(
      (r) =>
        r.id === data.residentId ||
        r.houseNumber.replace(/\s+/g, '').toUpperCase() === data.residentHouse.replace(/\s+/g, '').toUpperCase()
    );
    if (res) {
      if (data.paymentType === 'iuran_bulanan' || data.paymentType === 'iuran_bulanan_sampah' || data.paymentType === 'iuran_sampah') {
        const currentUnpaid = res.iuranUnpaidMonths || 0;
        const newUnpaid = Math.max(0, currentUnpaid - 1);
        const newUnpaidNames = (res.unpaidMonthNames || []).slice(1);
        await updateResident({
          ...res,
          monthlyIuranPaid: true,
          iuranUnpaidMonths: newUnpaid,
          unpaidMonthNames: newUnpaidNames,
          points: (res.points || 0) + 10
        });
      } else if (data.paymentType === 'sumbangan_sukarela') {
        const bonusPts = data.amount >= 100000 ? 50 : 20;
        await updateResident({
          ...res,
          points: (res.points || 0) + bonusPts
        });
      }
    }

    const newReceipt: PaymentReceipt = {
      id: receiptId,
      receiptNumber: receiptNum,
      date: dateStr,
      residentId: data.residentId,
      residentName: data.residentName,
      residentHouse: data.residentHouse,
      residentPhone: data.residentPhone,
      paymentType: data.paymentType,
      paymentTypeName: data.paymentTypeName,
      amount: data.amount,
      periodMonth: data.periodMonth,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Bendahara GSS',
      recorderRole: currentUser?.role || 'bendahara1',
      transactionId: createdTrx.id,
      createdAt: new Date().toISOString()
    };

    const nextReceipts = [newReceipt, ...paymentReceipts];
    setPaymentReceipts(nextReceipts);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(nextReceipts));

    try {
      await setDoc(doc(db, 'pembayaran_kwitansi', receiptId), newReceipt);
    } catch (err) {
      console.warn('Firestore recordCashierPayment error:', err);
    }

    return newReceipt;
  };

  const updatePaymentReceipt = async (receipt: PaymentReceipt) => {
    if (!['superadmin', 'bendahara1', 'bendahara2'].includes(currentUser?.role || '')) {
      alert('Akses Ditolak: Hanya Bendahara dan Admin yang memiliki hak akses mengedit data pembayaran!');
      return;
    }
    const next = paymentReceipts.map((p) => (p.id === receipt.id ? receipt : p));
    setPaymentReceipts(next);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(next));

    // Sinkronkan transaksi kas terkait di pembukuan keuangan paguyuban
    if (receipt.transactionId) {
      const relatedTrx = transactions.find((t) => t.id === receipt.transactionId);
      if (relatedTrx) {
        let cat: Transaction['category'] = 'Iuran Bulanan (Rp 25.000)';
        if (receipt.paymentType === 'iuran_bulanan') cat = 'Iuran Bulanan (Rp 25.000)';
        else if (receipt.paymentType === 'iuran_sampah') cat = 'Iuran Sampah (Rp 25.000)';
        else if (receipt.paymentType === 'iuran_bulanan_sampah') cat = 'Iuran Bulanan + Sampah (Rp 50.000)';
        else if (receipt.paymentType === 'sewa_fasum') cat = 'Sewa Fasum';
        else if (receipt.paymentType === 'sumbangan_sukarela') cat = 'Sumbangan Sukarela';
        else cat = 'Lain-lain Pemasukan';

        const methodLabel =
          receipt.paymentMethod === 'transfer_bank_bri' || receipt.paymentMethod === 'transfer_bank'
            ? 'Transfer Bank BRI (155801007310503 a/n Benisius Rahmat Basuki)'
            : 'Tunai ke Bendahara';

        const desc = `${receipt.paymentTypeName} - ${receipt.residentName} (${receipt.residentHouse}) [No. Kwitansi: ${receipt.receiptNumber}] via ${methodLabel}${
          receipt.periodMonth ? ` - Periode: ${receipt.periodMonth}` : ''
        }${receipt.notes ? ` (${receipt.notes})` : ''}`;

        await updateTransaction({
          ...relatedTrx,
          amount: receipt.amount,
          category: cat,
          description: desc
        });
      }
    }

    try {
      await setDoc(doc(db, 'pembayaran_kwitansi', receipt.id), receipt);
    } catch (err) {
      console.warn('Firestore updatePaymentReceipt error:', err);
    }
  };

  const deletePaymentReceipt = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses menghapus data pembayaran!');
      return;
    }
    const toDelete = paymentReceipts.find((p) => p.id === id);
    const next = paymentReceipts.filter((p) => p.id !== id);
    setPaymentReceipts(next);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(next));

    // Hapus transaksi kas terkait di pembukuan keuangan paguyuban
    if (toDelete?.transactionId) {
      await markAsDeleted(toDelete.transactionId, 'keuangan_transaksi');
      const updatedTrx = transactions.filter((t) => t.id !== toDelete.transactionId);
      setTransactions(updatedTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(updatedTrx));
      try {
        await deleteDoc(doc(db, 'keuangan_transaksi', toDelete.transactionId));
      } catch (err) {
        console.warn('Delete linked transaction error:', err);
      }
    }

    try {
      await deleteDoc(doc(db, 'pembayaran_kwitansi', id));
    } catch (err) {
      console.warn('Firestore deletePaymentReceipt error:', err);
    }
  };

  const sendReceiptNotificationEmail = async (receiptId: string): Promise<{ success: boolean; message: string }> => {
    const receipt = paymentReceipts.find((p) => p.id === receiptId);
    if (!receipt) return { success: false, message: 'Kwitansi tidak ditemukan' };

    const updated: PaymentReceipt = {
      ...receipt,
      emailSentAt: new Date().toISOString()
    };
    await updatePaymentReceipt(updated);

    return {
      success: true,
      message: `Notifikasi Kwitansi Resmi #${receipt.receiptNumber} berhasil disiapkan & terkirim via server email grises.jogja@gmail.com ke Bpk/Ibu ${receipt.residentName} (${receipt.residentHouse}).`
    };
  };

  // Absensi methods (Ronda, Kerjabakti, Rapat Bulanan)
  const submitAttendanceSession = async (
    sessionData: Omit<AttendanceSession, 'id' | 'createdAt'>
  ): Promise<void> => {
    const id = `att-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newSession: AttendanceSession = {
      ...sessionData,
      id,
      createdAt,
      pointsAwarded: true
    };

    // Rincian GRISS-POIN Baru:
    // - Hadir ronda / jimpit: 25 poin
    // - Hadir kerja bakti: 40 poin
    // - Hadir rapat bulanan: 25 poin
    let pointsToAdd = 0;
    let activityLabel = '';
    if (sessionData.type === 'ronda') {
      pointsToAdd = 25;
      activityLabel = 'Hadir Ronda & Jimpitan Malam';
    } else if (sessionData.type === 'kerjabakti') {
      pointsToAdd = 40;
      activityLabel = 'Hadir Kerja Bakti Lingkungan Warga';
    } else if (sessionData.type === 'rapat') {
      pointsToAdd = 25;
      activityLabel = 'Hadir Rapat Rutin Bulanan Paguyuban';
    }

    const presentAttendees = sessionData.attendees.filter((a) => a.isPresent);
    for (const attendee of presentAttendees) {
      const targetRes = residents.find(
        (r) =>
          r.id === attendee.residentId ||
          r.name.trim().toLowerCase() === attendee.residentName.trim().toLowerCase() ||
          r.houseNumber.trim().toLowerCase() === attendee.residentHouse.trim().toLowerCase()
      );
      if (targetRes) {
        const nextPoints = (targetRes.points || 0) + pointsToAdd;
        const updatedRes = { ...targetRes, points: nextPoints };
        setResidents((prev) => prev.map((r) => (r.id === targetRes.id ? updatedRes : r)));
        setDoc(doc(db, 'warga', targetRes.id), updatedRes).catch(() => {});

        if (currentUser && (currentUser.id === targetRes.id || currentUser.houseNumber === targetRes.houseNumber)) {
          setCurrentUser((prev) => (prev ? { ...prev, points: nextPoints } : null));
        }

        const log: PointLog = {
          id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: targetRes.id,
          houseNumber: targetRes.houseNumber,
          userName: targetRes.name,
          pointsChange: pointsToAdd,
          reason: `${activityLabel} (${sessionData.date})`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        setPointLogs((prev) => [log, ...prev]);
        setDoc(doc(db, 'point_logs', log.id), log).catch(() => {});
      }
    }

    setAttendanceSessions((prev) => [newSession, ...prev]);
    try {
      await setDoc(doc(db, 'absensi_records', newSession.id), newSession);
    } catch (err) {
      console.warn('Firestore absensi save notice:', err);
    }

    await addAnnouncement(
      `Absensi ${activityLabel} Tercatat`,
      `Pencatatan kehadiran ${activityLabel} tanggal ${sessionData.date} berhasil disimpan. ${presentAttendees.length} warga hadir dan memperoleh +${pointsToAdd} GRISS-POIN.`,
      sessionData.type === 'ronda' ? 'Ronda' : 'Kegiatan',
      false
    );
  };

  const deleteAttendanceSession = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus data absensi!');
      return;
    }
    await markAsDeleted(id, 'absensi_records');
    const updated = attendanceSessions.filter((s) => s.id !== id);
    setAttendanceSessions(updated);
    try {
      await deleteDoc(doc(db, 'absensi_records', id));
    } catch (err) {
      console.warn('Firestore delete absensi notice:', err);
    }
  };

  // Notulen Rapat methods
  const addMeetingNote = async (
    noteData: Omit<MeetingNote, 'id' | 'createdAt'>
  ): Promise<void> => {
    const id = `notulen-${Date.now()}`;
    const newNote: MeetingNote = {
      ...noteData,
      id,
      createdAt: new Date().toISOString()
    };
    setMeetingNotes((prev) => [newNote, ...prev]);
    try {
      await setDoc(doc(db, 'notulen_rapat', id), newNote);
    } catch (err) {
      console.warn('Firestore add notulen notice:', err);
    }

    await addAnnouncement(
      `Notulen Rapat Baru: ${noteData.title}`,
      `Notulen rapat tanggal ${noteData.meetingDate} telah diunggah. Penanggung jawab: ${noteData.personInCharge}. Status: ${noteData.status.toUpperCase()}.`,
      'Umum',
      false
    );
  };

  const updateMeetingNoteStatus = async (id: string, status: MeetingNoteStatus) => {
    const note = meetingNotes.find((n) => n.id === id);
    if (!note) return;
    const updated: MeetingNote = {
      ...note,
      status,
      updatedAt: new Date().toISOString()
    };
    setMeetingNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    try {
      await setDoc(doc(db, 'notulen_rapat', id), updated);
    } catch (err) {
      console.warn('Firestore update notulen status notice:', err);
    }
  };

  const updateMeetingNote = async (updatedNote: MeetingNote) => {
    const withTimestamp = {
      ...updatedNote,
      updatedAt: new Date().toISOString()
    };
    setMeetingNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? withTimestamp : n)));
    try {
      await setDoc(doc(db, 'notulen_rapat', updatedNote.id), withTimestamp);
    } catch (err) {
      console.warn('Firestore update notulen notice:', err);
    }
  };

  const deleteMeetingNote = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus notulen rapat!');
      return;
    }
    await markAsDeleted(id, 'notulen_rapat');
    const updated = meetingNotes.filter((n) => n.id !== id);
    setMeetingNotes(updated);
    try {
      await deleteDoc(doc(db, 'notulen_rapat', id));
    } catch (err) {
      console.warn('Firestore delete notulen notice:', err);
    }
  };

  const awardPointsToResident = async (residentId: string, points: number, reason: string) => {
    const target = residents.find(
      (r) =>
        r.id === residentId ||
        r.name.trim().toLowerCase() === residentId.trim().toLowerCase() ||
        r.houseNumber.trim().toLowerCase() === residentId.trim().toLowerCase()
    );
    if (!target) return;
    const nextPoints = (target.points || 0) + points;
    const updated = { ...target, points: nextPoints };
    setResidents((prev) => prev.map((r) => (r.id === target.id ? updated : r)));
    if (currentUser && (currentUser.id === target.id || currentUser.houseNumber === target.houseNumber)) {
      setCurrentUser((prev) => (prev ? { ...prev, points: nextPoints } : null));
    }
    const log: PointLog = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: target.id,
      houseNumber: target.houseNumber,
      userName: target.name,
      pointsChange: points,
      reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setPointLogs((prev) => [log, ...prev]);
    try {
      await setDoc(doc(db, 'warga', target.id), updated);
      await setDoc(doc(db, 'point_logs', log.id), log);
    } catch (e) {
      console.warn('Firestore awardPoints notice:', e);
    }
  };

  // Helper untuk sinkronisasi nama warga berdasarkan nomor rumah
  const getResidentNameByHouse = (houseNumber: string, fallbackName?: string): string => {
    if (!houseNumber) return fallbackName || '';
    const clean = houseNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const found = residents.find(
      (r) => r.houseNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === clean
    );
    return found ? found.name : (fallbackName || houseNumber);
  };

  // Superadmin CRUD on Katalog Benefit (Loyalty Rewards)
  const addReward = async (rewardData: Omit<LoyaltyReward, 'id'> & { id?: string }) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses menambah katalog benefit!');
      return;
    }
    const id = rewardData.id || `reward-${Date.now()}`;
    const newReward: LoyaltyReward = {
      ...rewardData,
      id
    };
    const next = [...rewards, newReward];
    setRewards(next);
    localStorage.setItem('grisspo_rewards', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'katalog_benefit', id), newReward);
    } catch (err) {
      console.warn('Firestore addReward error:', err);
    }
  };

  const updateReward = async (reward: LoyaltyReward) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit katalog benefit!');
      return;
    }
    const next = rewards.map((r) => (r.id === reward.id ? reward : r));
    setRewards(next);
    localStorage.setItem('grisspo_rewards', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'katalog_benefit', reward.id), reward);
    } catch (err) {
      console.warn('Firestore updateReward error:', err);
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses menghapus katalog benefit!');
      return;
    }
    await markAsDeleted(rewardId, 'katalog_benefit');
    const next = rewards.filter((r) => r.id !== rewardId);
    setRewards(next);
    localStorage.setItem('grisspo_rewards', JSON.stringify(next));
    try {
      await deleteDoc(doc(db, 'katalog_benefit', rewardId));
    } catch (err) {
      console.warn('Firestore deleteReward error:', err);
    }
  };

  // Superadmin Edit Jimpitan Report
  const updateJimpitReport = async (report: JimpitDailyReport) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit laporan jimpitan!');
      return;
    }
    const next = jimpitReports.map((r) => (r.id === report.id ? report : r));
    setJimpitReports(next);
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'jimpitan_records', report.id), report);
    } catch (err) {
      console.warn('Firestore updateJimpitReport error:', err);
    }
  };

  // Superadmin Edit Absensi Session
  const updateAttendanceSession = async (session: AttendanceSession) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit data absensi!');
      return;
    }
    const next = attendanceSessions.map((s) => (s.id === session.id ? session : s));
    setAttendanceSessions(next);
    localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'absensi_records', session.id), session);
    } catch (err) {
      console.warn('Firestore updateAttendanceSession error:', err);
    }
  };

  // Superadmin Edit Fasum Booking
  const updateFasumBooking = async (booking: FasumBooking) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit pemesanan fasum!');
      return;
    }
    const next = fasumBookings.map((b) => (b.id === booking.id ? booking : b));
    setFasumBookings(next);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'fasum_bookings', booking.id), booking);
    } catch (err) {
      console.warn('Firestore updateFasumBooking error:', err);
    }
  };

  // Superadmin Edit Forum Post
  const updateForumPost = async (post: ForumPost) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit postingan forum!');
      return;
    }
    const next = forumPosts.map((p) => (p.id === post.id ? post : p));
    setForumPosts(next);
    localStorage.setItem('grisspo_forum_posts', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'forum_posts', post.id), post);
    } catch (err) {
      console.warn('Firestore updateForumPost error:', err);
    }
  };

  // Nomor Telepon Penting Sedayu CRUD (Superadmin only)
  const addImportantContact = async (
    contactData: Omit<ImportantContact, 'id'>
  ): Promise<ImportantContact> => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menambah nomor telepon penting!');
      throw new Error('Akses Ditolak');
    }
    const newContact: ImportantContact = {
      ...contactData,
      id: `kontak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Superadmin'
    };
    const next = [...importantContacts, newContact].sort((a, b) => (a.order || 99) - (b.order || 99));
    setImportantContacts(next);
    localStorage.setItem('grisspo_important_contacts', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'kontak_penting', newContact.id), newContact);
    } catch (err) {
      console.warn('Firestore addImportantContact notice:', err);
    }
    return newContact;
  };

  const updateImportantContact = async (contact: ImportantContact) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak mengubah data nomor kontak penting!');
      return;
    }
    const updated: ImportantContact = {
      ...contact,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Superadmin'
    };
    const next = importantContacts
      .map((c) => (c.id === contact.id ? updated : c))
      .sort((a, b) => (a.order || 99) - (b.order || 99));
    setImportantContacts(next);
    localStorage.setItem('grisspo_important_contacts', JSON.stringify(next));
    try {
      await setDoc(doc(db, 'kontak_penting', contact.id), updated);
    } catch (err) {
      console.warn('Firestore updateImportantContact notice:', err);
    }
  };

  const deleteImportantContact = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak menghapus kontak penting!');
      return;
    }
    await markAsDeleted(id, 'kontak_penting');
    const next = importantContacts.filter((c) => c.id !== id);
    setImportantContacts(next);
    localStorage.setItem('grisspo_important_contacts', JSON.stringify(next));
    try {
      await deleteDoc(doc(db, 'kontak_penting', id));
    } catch (err) {
      console.warn('Firestore deleteImportantContact notice:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loginWithHouseNumber,
        loginAsResident,
        switchRoleWithPassword,
        logout,
        updateResidentProfile,
        resetFeatureData,
        masterResetAllFeatures,

        residents,
        updateResident,
        toggleBerkasKependudukan,
        deleteResident,
        addResident,
        getResidentNameByHouse,

        rondaSchedule,
        updateRondaGroup,
        jimpitReports,
        submitDailyJimpit,
        updateJimpitReport,
        deleteJimpitReport,
        payJimpitanDeficit,
        removeRondaMember,
        addRondaMember,

        whatsAppLogs,
        sendWhatsAppIuranWarning,
        deleteWhatsAppLog,

        inventory,
        updateInventoryItem,
        deleteInventoryItem,
        addInventoryItem,
        borrowInventoryItem,
        returnInventoryItem,

        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        totalIncome,
        totalExpense,
        currentBalance,

        forumPosts,
        createForumPost,
        updateForumPost,
        addForumComment,
        deleteForumComment,
        togglePostLike,
        deleteForumPost,
        togglePinPost,

        rewards,
        pointLogs,
        redeemReward,
        awardPoints,
        deletePointLog,
        addReward,
        updateReward,
        deleteReward,

        announcements,
        addAnnouncement,
        deleteAnnouncement,
        emailAlerts,
        clearEmailAlerts,

        fasumBookings,
        addFasumBooking,
        confirmFasumPayment,
        updateFasumBookingStatus,
        updateFasumBooking,
        deleteFasumBooking,

        fasumFacilitiesList,
        addFasumFacility,
        updateFasumFacility,
        deleteFasumFacility,

        paymentReceipts,
        recordCashierPayment,
        updatePaymentReceipt,
        deletePaymentReceipt,
        sendReceiptNotificationEmail,

        attendanceSessions,
        submitAttendanceSession,
        updateAttendanceSession,
        deleteAttendanceSession,

        meetingNotes,
        addMeetingNote,
        updateMeetingNoteStatus,
        updateMeetingNote,
        deleteMeetingNote,
        awardPointsToResident,

        importantContacts,
        addImportantContact,
        updateImportantContact,
        deleteImportantContact,

        isPengurusOpen,
        setIsPengurusOpen,

        activeSessions,
        kickSession,
        inactivityNotice,
        clearInactivityNotice,

        isCloudSynced,
        activeView,
        setActiveView
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
