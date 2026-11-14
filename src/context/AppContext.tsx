import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  setDoc as rawSetDoc,
  deleteDoc as rawDeleteDoc,
  getDocs,
  getDoc,
  disableNetwork
} from 'firebase/firestore';
import { ConfirmModal } from '../components/ConfirmModal';

// Helper to recursively remove undefined values before writing to Firestore
function sanitizeForFirestore<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    Object.entries(obj as Record<string, any>).forEach(([key, val]) => {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    });
    return cleaned as T;
  }
  return obj;
}

const MEMBER_NAME_ALIASES: Record<string, string[]> = {
  dewa: ['dewo', 'dewa'],
  dewo: ['dewa', 'dewo'],
  robi: ['roby', 'robi'],
  roby: ['robi', 'roby']
};

export function normalizeCleanName(name: string): string {
  return (name || '')
    .replace(/^(bapak|bpk\.?|ibu|mas|mbak)\s+/i, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function findResidentByMemberName(memberName: string, residentsList: Resident[]): Resident | undefined {
  const cleanTarget = normalizeCleanName(memberName);
  if (!cleanTarget) return undefined;
  const aliases = MEMBER_NAME_ALIASES[cleanTarget] || [cleanTarget];

  return residentsList.find((r) => {
    const resClean = normalizeCleanName(r.name);
    if (!resClean) return false;
    return aliases.some((alias) => resClean === alias || resClean.includes(alias) || alias.includes(resClean));
  });
}

export function getLocalDateString(dateInput: Date = new Date()): string {
  return `${dateInput.getFullYear()}-${String(dateInput.getMonth() + 1).padStart(2, '0')}-${String(
    dateInput.getDate()
  ).padStart(2, '0')}`;
}

export function mapPaymentTypeToCategory(
  paymentType: PaymentReceiptType,
  paymentTypeName?: string
): Transaction['category'] {
  const n = (paymentTypeName || '').toLowerCase();
  if (n.includes('saldo') && n.includes('awal')) return 'Saldo Kas Awal';
  switch (paymentType) {
    case 'iuran_bulanan':
      return 'Iuran Bulanan (Rp 25.000)';
    case 'iuran_sampah':
      return 'Iuran Sampah (Rp 25.000)';
    case 'iuran_bulanan_sampah':
      return 'Iuran Bulanan + Sampah (Rp 50.000)';
    case 'sewa_fasum':
      return n.includes('30.000') ? 'Sewa Fasum (Rp 30.000/bln)' : 'Sewa Fasum';
    case 'sumbangan_sukarela':
      return 'Sumbangan Sukarela';
    default: {
      if (n.includes('saldo') && n.includes('awal')) return 'Saldo Kas Awal';
      if (n.includes('sampah') && n.includes('bulanan')) return 'Iuran Bulanan + Sampah (Rp 50.000)';
      if (n.includes('sampah')) return 'Iuran Sampah (Rp 25.000)';
      if (n.includes('bulanan') || n.includes('iuran')) return 'Iuran Bulanan (Rp 25.000)';
      if (n.includes('fasum')) return n.includes('30.000') ? 'Sewa Fasum (Rp 30.000/bln)' : 'Sewa Fasum';
      if (n.includes('sumbangan')) return 'Sumbangan Sukarela';
      if (n.includes('jimpit')) return 'Pemasukan Jimpitan Bulanan';
      return 'Lain-lain Pemasukan';
    }
  }
}

export function mapCategoryToPaymentType(category?: string): PaymentReceiptType {
  const catL = (category || '').toLowerCase();
  if (catL.includes('sampah') && catL.includes('bulanan')) return 'iuran_bulanan_sampah';
  if (catL.includes('sampah')) return 'iuran_sampah';
  if (catL.includes('bulanan') || catL.includes('iuran')) return 'iuran_bulanan';
  if (catL.includes('fasum')) return 'sewa_fasum';
  if (catL.includes('sumbangan')) return 'sumbangan_sukarela';
  return 'pemasukan_lain';
}

export const LEGACY_FAKE_SEED_IDS = new Set([
  'jimpit-2026-11-11',
  'jimpit-2026-11-12',
  'trx-jimpit-2026-11-11',
  'trx-jimpit-2026-11-12'
]);

export function normalizeTransactionCategory(t: Partial<Transaction>): Transaction['category'] {
  const cleanType = String(t.type || '').trim().toLowerCase();
  const rawCat = String(t.category || '').trim();
  if (cleanType === 'pengeluaran' || cleanType === 'expense') {
    return (rawCat || 'Operasional & Lain-lain') as Transaction['category'];
  }
  const idL = String(t.id || '').toLowerCase();
  const catL = rawCat.toLowerCase();
  const descL = String(t.description || '').toLowerCase();
  if (
    idL.startsWith('trx-jimpit-') ||
    catL.includes('jimpit') ||
    (!rawCat && descL.includes('jimpit')) ||
    descL.startsWith('pemasukan jimpitan') ||
    descL.startsWith('pelunasan kekurangan jimpitan')
  ) {
    return 'Pemasukan Jimpitan Bulanan';
  }
  return (rawCat || 'Lain-lain Pemasukan') as Transaction['category'];
}

export function buildReconciledTransactions(
  baseTransactions: Transaction[],
  receipts: PaymentReceipt[],
  jimpitList: JimpitDailyReport[],
  deletedIdsList: string[],
  fasumBookingsList: FasumBooking[] = []
): Transaction[] {
  const deletedSet = new Set(deletedIdsList);
  const result: Transaction[] = [];
  const seenIds = new Set<string>();

  for (const t of baseTransactions) {
    if (!t || !t.id || LEGACY_FAKE_SEED_IDS.has(t.id) || deletedSet.has(t.id) || seenIds.has(t.id)) continue;
    seenIds.add(t.id);
    const rawType = String(t.type || '').trim().toLowerCase();
    const cleanType = (rawType === 'pengeluaran' || rawType === 'expense' ? 'pengeluaran' : 'pemasukan') as
      | 'pemasukan'
      | 'pengeluaran';
    result.push({
      ...t,
      type: cleanType,
      amount: Number(t.amount) || 0,
      category: normalizeTransactionCategory({ ...t, type: cleanType })
    });
  }

  for (const receipt of receipts) {
    if (!receipt || !receipt.id || deletedSet.has(receipt.id)) continue;
    const strippedId = receipt.id.replace(/^receipt-/, '');
    if (
      receipt.id.startsWith('receipt-trx-jimpit-') ||
      String(receipt.paymentType || '').toLowerCase() === 'jimpitan' ||
      (receipt.paymentTypeName || '').toLowerCase().includes('jimpit') ||
      (receipt.notes || '').toLowerCase().includes('jimpit')
    ) {
      continue;
    }
    const candidateTrxId = receipt.transactionId || `trx-sync-${receipt.id}`;
    if (
      LEGACY_FAKE_SEED_IDS.has(candidateTrxId) ||
      LEGACY_FAKE_SEED_IDS.has(strippedId) ||
      deletedSet.has(candidateTrxId) ||
      deletedSet.has(strippedId) ||
      deletedSet.has(`receipt-${candidateTrxId}`) ||
      seenIds.has(candidateTrxId)
    ) {
      continue;
    }
    const amount = Number(receipt.amount) || 0;
    if (amount <= 0) continue;

    const methodLabel =
      receipt.paymentMethod === 'transfer_bank_bri' || receipt.paymentMethod === 'transfer_bank'
        ? 'Transfer Bank BRI'
        : 'Tunai';
    const dateStr = receipt.date || getLocalDateString(new Date(receipt.createdAt || Date.now()));
    seenIds.add(candidateTrxId);

    result.push({
      id: candidateTrxId,
      type: 'pemasukan',
      category: mapPaymentTypeToCategory(receipt.paymentType, receipt.paymentTypeName),
      amount,
      date: dateStr,
      description: `${receipt.paymentTypeName} - ${receipt.residentName} (${receipt.residentHouse}) [No. Kwitansi: ${receipt.receiptNumber}] via ${methodLabel}${
        receipt.periodMonth ? ` - Periode: ${receipt.periodMonth}` : ''
      }${receipt.notes ? ` (${receipt.notes})` : ''}`,
      recordedBy: receipt.recordedBy || 'Bendahara Kas',
      userRole: receipt.recorderRole || 'bendahara1',
      sourceHouse: receipt.residentHouse,
      encryptedHash: `hash-sync-${candidateTrxId}`,
      isAnomaly: false,
      timestamp: receipt.createdAt ? new Date(receipt.createdAt).getTime() : new Date(`${dateStr}T12:00:00`).getTime()
    });
  }

  for (const report of jimpitList) {
    if (!report || !report.id || LEGACY_FAKE_SEED_IDS.has(report.id) || deletedSet.has(report.id)) continue;
    const isPelunasan = report.reportType === 'pelunasan' || report.id.startsWith('jimpit-pay-');
    const targetTrxId = report.transactionId || `trx-${report.id}`;
    if (LEGACY_FAKE_SEED_IDS.has(targetTrxId) || deletedSet.has(targetTrxId) || seenIds.has(targetTrxId)) continue;

    const amount = Number(report.totalNominal) || 0;
    if (amount <= 0) continue;

    if (!isPelunasan) {
      const hasDailyJimpitTrxForDate = result.some((t) => {
        if (t.type !== 'pemasukan' || t.date !== report.date) return false;
        const catL = String(t.category || '').toLowerCase();
        const descL = String(t.description || '').toLowerCase();
        return (catL.includes('jimpit') || descL.includes('jimpit')) && !descL.includes('pelunasan');
      });
      if (hasDailyJimpitTrxForDate) continue;
    }

    seenIds.add(targetTrxId);
    const ts = report.createdAt
      ? new Date(report.createdAt).getTime()
      : new Date(`${report.date}T21:00:00+07:00`).getTime();

    result.push({
      id: targetTrxId,
      type: 'pemasukan',
      category: 'Pemasukan Jimpitan Bulanan',
      amount,
      date: report.date,
      description: isPelunasan
        ? report.notes || `Pelunasan Kekurangan Jimpitan (${report.date})`
        : `Pemasukan Jimpitan Ronda Online (${report.day}, ${report.date}) oleh ${report.collectedBy}`,
      recordedBy: report.collectedBy,
      userRole: 'warga',
      encryptedHash: `hash-sync-${targetTrxId}`,
      isAnomaly: false,
      timestamp: Number.isFinite(ts) ? ts : Date.now()
    });
  }

  // Reconcile paid Fasum bookings in case their linked kas transaction wasn't synced yet
  for (const booking of fasumBookingsList) {
    if (!booking || !booking.id || deletedSet.has(booking.id)) continue;
    if (booking.paymentStatus !== 'lunas') continue;
    const fee = Number(booking.rentalFee) || 0;
    if (fee <= 0) continue;

    const targetTrxId = booking.transactionId || `trx-fasum-${booking.id}`;
    if (deletedSet.has(targetTrxId) || seenIds.has(targetTrxId)) continue;

    const bookingHouseClean = (booking.residentHouse || '').replace(/\s+/g, '').toUpperCase();
    const hasMatchingFasumTrx = result.some((t) => {
      if (t.type !== 'pemasukan' || t.date !== booking.date || (Number(t.amount) || 0) !== fee) return false;
      const catL = String(t.category || '').toLowerCase();
      if (!catL.includes('fasum')) return false;
      const tHouseClean = (t.sourceHouse || '').replace(/\s+/g, '').toUpperCase();
      const descL = String(t.description || '').toLowerCase();
      return (
        (bookingHouseClean && tHouseClean === bookingHouseClean) ||
        (booking.facilityName && descL.includes(booking.facilityName.toLowerCase()))
      );
    });
    if (hasMatchingFasumTrx) continue;

    seenIds.add(targetTrxId);
    const ts = booking.approvedAt
      ? new Date(booking.approvedAt.replace(' ', 'T')).getTime()
      : new Date(`${booking.date}T12:00:00`).getTime();

    result.push({
      id: targetTrxId,
      type: 'pemasukan',
      category: 'Sewa Fasum (Rp 30.000/bln)',
      amount: fee,
      date: booking.date,
      description: `Sewa Fasum: ${booking.facilityName} - ${booking.residentName} (${booking.residentHouse}) - Acara: ${booking.purpose}`,
      recordedBy: booking.approvedBy || 'Bendahara Paguyuban',
      userRole: 'bendahara1',
      sourceHouse: booking.residentHouse,
      encryptedHash: `hash-sync-${targetTrxId}`,
      isAnomaly: false,
      timestamp: Number.isFinite(ts) ? ts : Date.now()
    });
  }

  return result.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}

export interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

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
  addTransaction: (
    trx: Omit<Transaction, 'id' | 'encryptedHash' | 'timestamp' | 'isAnomaly'>,
    options?: { skipReceiptCreation?: boolean }
  ) => Promise<Transaction>;
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
    date?: string;
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
  lastSyncedAt: string;
  triggerManualSync: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  deletedIds: string[];

  // Global Confirmation Dialog for all user actions
  confirmAction: (options: ConfirmActionOptions) => void;
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
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const triggerManualSyncImplRef = useRef<(() => Promise<void>) | null>(null);

  const triggerManualSync = () => {
    setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    if (triggerManualSyncImplRef.current) {
      triggerManualSyncImplRef.current().catch((err) => {
        console.warn('Manual sync notice:', err);
      });
    }
  };

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
  const lastCloudHeartbeatRef = useRef<number>(0);
  const hasRegisteredSessionRef = useRef<boolean>(false);
  const firestoreQuotaExceededRef = useRef<boolean>(false);
  const cleanedDeletedIdsRef = useRef<Set<string>>(new Set());
  const hasAlertedQuotaRef = useRef<boolean>(false);

  const getPacificDateKey = (): string => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      // Fallback: Pacific Standard Time (UTC-8)
      return new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }
  };

  const isQuotaExhaustedToday = (): boolean => {
    if (firestoreQuotaExceededRef.current) return true;
    const todayPt = getPacificDateKey();
    try {
      const legacyUtc = localStorage.getItem('grisspo_quota_exhausted_utc');
      if (legacyUtc) {
        localStorage.removeItem('grisspo_quota_exhausted_utc');
      }
      const savedDay = localStorage.getItem('grisspo_quota_exhausted_pt');
      if (savedDay && savedDay === todayPt) {
        firestoreQuotaExceededRef.current = true;
        return true;
      }
      if (savedDay && savedDay !== todayPt) {
        localStorage.removeItem('grisspo_quota_exhausted_pt');
      }
    } catch {
      // ignore storage errors
    }
    return false;
  };

  const isQuotaExceededError = (err: unknown): boolean => {
    const code = (err as any)?.code;
    const msg = String((err as any)?.message || err || '').toLowerCase();
    return code === 'resource-exhausted' || msg.includes('resource-exhausted') || msg.includes('quota');
  };

  const handleFirestoreWriteFailure = (err: unknown, contextLabel: string, _notifyUser = false) => {
    if (isQuotaExceededError(err)) {
      firestoreQuotaExceededRef.current = true;
      try {
        localStorage.setItem('grisspo_quota_exhausted_pt', getPacificDateKey());
      } catch {
        // ignore
      }
      // Halt Firestore SDK internal backoff write retries immediately for this tab
      disableNetwork(db).catch(() => {});
      if (!hasAlertedQuotaRef.current) {
        hasAlertedQuotaRef.current = true;
        console.warn(
          `Firestore daily write quota exceeded during ${contextLabel}. Cloud writes paused until next Pacific Time day reset; data remains saved locally.`
        );
      }
      return;
    }
    console.warn(`Firestore ${contextLabel} error:`, err);
  };

  // Persistent registry of local writes awaiting Firestore upload (prevents onSnapshot from wiping unsynced data)
  const unsyncedDocsRef = useRef<Record<string, { collection: string; id: string; updatedAt: string }>>((() => {
    try {
      const saved = localStorage.getItem('grisspo_unsynced_docs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })());

  const persistUnsyncedRegistry = () => {
    try {
      localStorage.setItem('grisspo_unsynced_docs', JSON.stringify(unsyncedDocsRef.current));
    } catch {
      // ignore storage errors
    }
  };

  const markDocUnsynced = (collectionName: string, docId: string) => {
    unsyncedDocsRef.current[`${collectionName}:${docId}`] = {
      collection: collectionName,
      id: docId,
      updatedAt: new Date().toISOString()
    };
    persistUnsyncedRegistry();
  };

  const clearDocUnsynced = (collectionName: string, docId: string) => {
    const key = `${collectionName}:${docId}`;
    if (unsyncedDocsRef.current[key]) {
      delete unsyncedDocsRef.current[key];
      persistUnsyncedRegistry();
    }
  };

  // Safe Firestore write wrappers that respect daily quota exhaustion across all operations
  const setDoc = async (reference: any, data: any, options?: any): Promise<void> => {
    if (isQuotaExhaustedToday()) return;
    try {
      if (options) {
        await rawSetDoc(reference, data, options);
      } else {
        await rawSetDoc(reference, data);
      }
    } catch (err) {
      handleFirestoreWriteFailure(err, 'setDoc', true);
      if (!isQuotaExceededError(err)) {
        throw err;
      }
    }
  };

  const safeCloudWrite = async (collectionName: string, docId: string, payload: any): Promise<boolean> => {
    if (isQuotaExhaustedToday()) {
      markDocUnsynced(collectionName, docId);
      return false;
    }
    try {
      await rawSetDoc(doc(db, collectionName, docId), sanitizeForFirestore(payload));
      clearDocUnsynced(collectionName, docId);
      return true;
    } catch (err) {
      markDocUnsynced(collectionName, docId);
      handleFirestoreWriteFailure(err, `safeCloudWrite ${collectionName}/${docId}`, true);
      return false;
    }
  };

  const deleteDoc = async (reference: any): Promise<void> => {
    if (isQuotaExhaustedToday()) return;
    try {
      await rawDeleteDoc(reference);
    } catch (err) {
      handleFirestoreWriteFailure(err, 'deleteDoc', true);
      if (!isQuotaExceededError(err)) {
        throw err;
      }
    }
  };

  // Global Confirmation Dialog for all user actions (Hapus & Ubah data apapun)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmActionOptions | null>(null);

  const confirmAction = (options: ConfirmActionOptions) => {
    setConfirmDialog(options);
  };

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

  const syncActiveSessionToCloud = async (user: User, force = false) => {
    if (isQuotaExhaustedToday()) return;
    try {
      const lastSync = Number(localStorage.getItem('grisspo_last_session_sync') || '0');
      const lastUserId = localStorage.getItem('grisspo_last_session_uid') || '';
      if (!force && lastUserId === user.id && Date.now() - lastSync < 1800000) {
        hasRegisteredSessionRef.current = true;
        return;
      }
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
      localStorage.setItem('grisspo_last_session_sync', String(Date.now()));
      localStorage.setItem('grisspo_last_session_uid', user.id);
      hasRegisteredSessionRef.current = true;
    } catch (e) {
      handleFirestoreWriteFailure(e, 'active_sessions sync');
    }
  };

  const removeActiveSessionFromCloud = async (userId: string) => {
    try {
      hasRegisteredSessionRef.current = false;
      localStorage.removeItem('grisspo_last_session_sync');
      localStorage.removeItem('grisspo_last_session_uid');
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

  // Track active session flag silently when restored from localStorage without firing boot writes
  useEffect(() => {
    if (currentUser) {
      hasRegisteredSessionRef.current = true;
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
      } else if (
        currentUserRef.current &&
        !isQuotaExhaustedToday() &&
        elapsed < 60000 &&
        now - lastCloudHeartbeatRef.current > 900000
      ) {
        // Send heartbeat to Firestore at most once every 15 minutes to conserve daily write quota
        lastCloudHeartbeatRef.current = now;
        const sessionRef = doc(db, 'active_sessions', currentUserRef.current.id);
        setDoc(sessionRef, { lastActive: new Date().toISOString() }, { merge: true }).catch((e) => {
          handleFirestoreWriteFailure(e, 'session heartbeat');
        });
      }
    }, 5000);

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

  // Jimpitan Reports (strip erroneous Nov 11-12 dummy seed IDs while preserving all real petugas submissions)
  const [jimpitReports, setJimpitReports] = useState<JimpitDailyReport[]>(() => {
    let savedList: JimpitDailyReport[] = [];
    try {
      const saved = localStorage.getItem('grisspo_jimpit_reports');
      savedList = saved ? JSON.parse(saved) : [];
    } catch {
      savedList = [];
    }
    const deletedSet = new Set(initialDeletedIds);
    const result: JimpitDailyReport[] = [];
    const seenIds = new Set<string>();
    for (const item of savedList) {
      if (!item || !item.id || LEGACY_FAKE_SEED_IDS.has(item.id) || deletedSet.has(item.id) || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      result.push(item);
    }
    return result.sort((a, b) => {
      if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('grisspo_transactions');
    const base: Transaction[] = saved ? JSON.parse(saved) : initialTransactions;
    return base
      .filter((t) => t && t.id && !LEGACY_FAKE_SEED_IDS.has(t.id) && !initialDeletedIds.includes(t.id))
      .map((t) => {
        const cleanType = (String(t.type || '').trim().toLowerCase() === 'pengeluaran' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran';
        return {
          ...t,
          amount: Number(t.amount) || 0,
          type: cleanType,
          category: normalizeTransactionCategory({ ...t, type: cleanType })
        };
      });
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
    try {
      const saved = localStorage.getItem('grisspo_payment_receipts');
      const base: PaymentReceipt[] = saved ? JSON.parse(saved) : [];
      return base.filter((p) => p && p.id && !initialDeletedIds.includes(p.id));
    } catch {
      return [];
    }
  });

  // Absensi Records (Ronda, Kerjabakti, Rapat Bulanan) - preserve petugas submissions first
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    let savedList: AttendanceSession[] = [];
    try {
      const saved = localStorage.getItem('grisspo_attendance_sessions');
      savedList = saved ? JSON.parse(saved) : [];
    } catch {
      savedList = [];
    }
    const deletedSet = new Set(initialDeletedIds);
    const result: AttendanceSession[] = [];
    const seenIds = new Set<string>();
    for (const item of savedList) {
      if (!item || !item.id || deletedSet.has(item.id) || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      result.push(item);
    }
    for (const seed of initialAttendanceSessions) {
      if (deletedSet.has(seed.id) || seenIds.has(seed.id)) continue;
      const hasSessionForDate = result.some((s) => s.date === seed.date && s.type === seed.type);
      if (!hasSessionForDate) {
        seenIds.add(seed.id);
        result.push(seed);
      }
    }
    return result.sort((a, b) => {
      if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
      return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
    });
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

  const residentsRef = useRef<Resident[]>(residents);
  const jimpitReportsRef = useRef<JimpitDailyReport[]>(jimpitReports);
  const transactionsRef = useRef<Transaction[]>(transactions);
  const paymentReceiptsRef = useRef<PaymentReceipt[]>(paymentReceipts);
  const attendanceSessionsRef = useRef<AttendanceSession[]>(attendanceSessions);
  const fasumBookingsRef = useRef<FasumBooking[]>(fasumBookings);

  useEffect(() => { residentsRef.current = residents; }, [residents]);
  useEffect(() => { jimpitReportsRef.current = jimpitReports; }, [jimpitReports]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { paymentReceiptsRef.current = paymentReceipts; }, [paymentReceipts]);
  useEffect(() => { attendanceSessionsRef.current = attendanceSessions; }, [attendanceSessions]);
  useEffect(() => { fasumBookingsRef.current = fasumBookings; }, [fasumBookings]);

  // Function to mark an item as deleted permanently and sync to Firestore
  const markAsDeleted = async (id: string, collectionName?: string) => {
    if (collectionName) {
      clearDocUnsynced(collectionName, id);
    }
    setDeletedIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      localStorage.setItem('grisspo_deleted_ids', JSON.stringify(next));
      deletedIdsRef.current = next;
      return next;
    });

    // Immediate optimistic local purge across all arrays
    setResidents((prev) => prev.filter((r) => r.id !== id));
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setPaymentReceipts((prev) => prev.filter((p) => p.id !== id));
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
    if (!isQuotaExhaustedToday()) {
      try {
        await setDoc(doc(db, 'system_deleted_ids', id), {
          id,
          collection: collectionName || 'general',
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.name || 'Superadmin'
        });
      } catch (err) {
        handleFirestoreWriteFailure(err, 'system_deleted_ids sync');
      }
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
    setPaymentReceipts((prev) =>
      prev.filter(
        (p) =>
          !deletedIds.includes(p.id) &&
          (!p.transactionId || !deletedIds.includes(p.transactionId)) &&
          !deletedIds.includes(p.id.replace(/^receipt-/, ''))
      )
    );
    setInventory((prev) => prev.filter((i) => !deletedIds.includes(i.id)));
    setJimpitReports((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
    setForumPosts((prev) => prev.filter((p) => !deletedIds.includes(p.id)));
    setAnnouncements((prev) => prev.filter((a) => !deletedIds.includes(a.id)));
    setFasumBookings((prev) => prev.filter((b) => !deletedIds.includes(b.id)));
    setWhatsAppLogs((prev) => prev.filter((w) => !deletedIds.includes(w.id)));
    setAttendanceSessions((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
    setMeetingNotes((prev) => prev.filter((m) => !deletedIds.includes(m.id)));
  }, [deletedIds]);

  // Non-destructive merge helpers so Firestore listeners NEVER wipe locally saved/unsynced petugas inputs or Nov 11-12 records
  const mergeResidentsList = (cloudList: Resident[], localList: Resident[]): Resident[] => {
    const deletedSet = new Set(deletedIdsRef.current);
    const map = new Map<string, Resident>();
    for (const item of cloudList) {
      if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
    }
    for (const localItem of localList) {
      if (!localItem || !localItem.id || deletedSet.has(localItem.id)) continue;
      if (unsyncedDocsRef.current[`warga:${localItem.id}`] || !map.has(localItem.id)) {
        map.set(localItem.id, localItem);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.no || 0) - (b.no || 0));
  };

  const mergeTransactionsList = (cloudList: Transaction[], localList: Transaction[]): Transaction[] => {
    const deletedSet = new Set(deletedIdsRef.current);
    const map = new Map<string, Transaction>();
    for (const item of cloudList) {
      if (item && item.id && !LEGACY_FAKE_SEED_IDS.has(item.id) && !deletedSet.has(item.id)) {
        const rawType = String(item.type || '').trim().toLowerCase();
        const cleanType = (rawType === 'pengeluaran' || rawType === 'expense' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran';
        map.set(item.id, {
          ...item,
          amount: Number(item.amount) || 0,
          type: cleanType,
          category: normalizeTransactionCategory({ ...item, type: cleanType })
        });
      }
    }
    for (const localItem of localList) {
      if (!localItem || !localItem.id || LEGACY_FAKE_SEED_IDS.has(localItem.id) || deletedSet.has(localItem.id)) continue;
      if (unsyncedDocsRef.current[`keuangan_transaksi:${localItem.id}`] || !map.has(localItem.id)) {
        const rawType = String(localItem.type || '').trim().toLowerCase();
        const cleanType = (rawType === 'pengeluaran' || rawType === 'expense' ? 'pengeluaran' : 'pemasukan') as 'pemasukan' | 'pengeluaran';
        map.set(localItem.id, {
          ...localItem,
          amount: Number(localItem.amount) || 0,
          type: cleanType,
          category: normalizeTransactionCategory({ ...localItem, type: cleanType })
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  };

  const mergeJimpitList = (cloudList: JimpitDailyReport[], localList: JimpitDailyReport[]): JimpitDailyReport[] => {
    const deletedSet = new Set(deletedIdsRef.current);
    const map = new Map<string, JimpitDailyReport>();
    for (const item of cloudList) {
      if (item && item.id && !LEGACY_FAKE_SEED_IDS.has(item.id) && !deletedSet.has(item.id)) map.set(item.id, item);
    }
    for (const localItem of localList) {
      if (!localItem || !localItem.id || LEGACY_FAKE_SEED_IDS.has(localItem.id) || deletedSet.has(localItem.id)) continue;
      if (unsyncedDocsRef.current[`jimpitan_records:${localItem.id}`] || !map.has(localItem.id)) {
        map.set(localItem.id, localItem);
      }
    }
    const merged = Array.from(map.values());
    return merged.sort((a, b) => {
      if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  };

  const mergeAttendanceList = (cloudList: AttendanceSession[], localList: AttendanceSession[]): AttendanceSession[] => {
    const deletedSet = new Set(deletedIdsRef.current);
    const map = new Map<string, AttendanceSession>();
    for (const item of cloudList) {
      if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
    }
    for (const localItem of localList) {
      if (!localItem || !localItem.id || deletedSet.has(localItem.id)) continue;
      if (unsyncedDocsRef.current[`absensi_records:${localItem.id}`] || !map.has(localItem.id)) {
        map.set(localItem.id, localItem);
      }
    }
    const merged = Array.from(map.values());
    for (const seed of initialAttendanceSessions) {
      if (deletedSet.has(seed.id) || map.has(seed.id)) continue;
      const hasForDate = merged.some((s) => s.date === seed.date && s.type === seed.type);
      if (!hasForDate) {
        merged.push(seed);
      }
    }
    return merged.sort((a, b) => {
      if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
      return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
    });
  };

  const mergeReceiptsList = (cloudList: PaymentReceipt[], localList: PaymentReceipt[]): PaymentReceipt[] => {
    const deletedSet = new Set(deletedIdsRef.current);
    const isReceiptDeleted = (item: PaymentReceipt) => {
      const stripped = (item.id || '').replace(/^receipt-/, '');
      return (
        deletedSet.has(item.id) ||
        LEGACY_FAKE_SEED_IDS.has(stripped) ||
        deletedSet.has(stripped) ||
        (item.transactionId
          ? deletedSet.has(item.transactionId) || LEGACY_FAKE_SEED_IDS.has(item.transactionId)
          : false)
      );
    };
    const map = new Map<string, PaymentReceipt>();
    for (const item of cloudList) {
      if (item && item.id && !isReceiptDeleted(item)) map.set(item.id, item);
    }
    for (const localItem of localList) {
      if (!localItem || !localItem.id || isReceiptDeleted(localItem)) continue;
      if (unsyncedDocsRef.current[`pembayaran_kwitansi:${localItem.id}`] || !map.has(localItem.id)) {
        map.set(localItem.id, localItem);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const dateA = a.date || a.createdAt?.slice(0, 10) || '';
      const dateB = b.date || b.createdAt?.slice(0, 10) || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  };

  const flushUnsyncedToCloud = async () => {
    if (isQuotaExhaustedToday()) return;
    const entries = Object.values(unsyncedDocsRef.current);
    for (const entry of entries) {
      if (isQuotaExhaustedToday()) break;
      if (LEGACY_FAKE_SEED_IDS.has(entry.id) || deletedIdsRef.current.includes(entry.id)) {
        clearDocUnsynced(entry.collection, entry.id);
        continue;
      }
      let payload: any = null;
      switch (entry.collection) {
        case 'jimpitan_records':
          payload = jimpitReportsRef.current.find((r) => r.id === entry.id);
          break;
        case 'absensi_records':
          payload = attendanceSessionsRef.current.find((s) => s.id === entry.id);
          break;
        case 'keuangan_transaksi':
          payload = transactionsRef.current.find((t) => t.id === entry.id);
          break;
        case 'pembayaran_kwitansi':
          payload = paymentReceiptsRef.current.find((p) => p.id === entry.id);
          break;
        case 'warga':
          payload = residentsRef.current.find((r) => r.id === entry.id);
          break;
        case 'fasum_bookings':
          payload = fasumBookingsRef.current.find((b) => b.id === entry.id);
          break;
      }
      if (payload) {
        await safeCloudWrite(entry.collection, entry.id, payload);
      } else {
        clearDocUnsynced(entry.collection, entry.id);
      }
    }
  };

  const cleanedFakeSeedIdsRef = useRef<Set<string>>(new Set());
  const cloudJimpitIdsRef = useRef<Set<string> | null>(null);
  const cloudTrxIdsRef = useRef<Set<string> | null>(null);
  const cloudAbsIdsRef = useRef<Set<string> | null>(null);

  const purgeLegacyFakeSeedDocOnce = async (collectionName: 'jimpitan_records' | 'keuangan_transaksi', docId: string) => {
    if (!LEGACY_FAKE_SEED_IDS.has(docId) || isQuotaExhaustedToday()) return;
    const key = `${collectionName}:${docId}`;
    if (cleanedFakeSeedIdsRef.current.has(key)) return;
    cleanedFakeSeedIdsRef.current.add(key);
    try {
      await rawDeleteDoc(doc(db, collectionName, docId));
    } catch (err) {
      handleFirestoreWriteFailure(err, `cleanup ${key}`);
    }
  };

  // Recover & upload any real local petugas submissions (including prior Nov 11-12 inputs cached before unsynced registry existed)
  const recoverLocalPetugasReportsToCloud = async () => {
    if (isQuotaExhaustedToday()) return;
    if (cloudJimpitIdsRef.current) {
      for (const report of jimpitReportsRef.current) {
        if (isQuotaExhaustedToday()) break;
        if (LEGACY_FAKE_SEED_IDS.has(report.id) || deletedIdsRef.current.includes(report.id)) continue;
        if (!cloudJimpitIdsRef.current.has(report.id)) {
          await safeCloudWrite('jimpitan_records', report.id, report);
        }
        const linkedTrxId = report.transactionId || `trx-${report.id}`;
        if (
          cloudTrxIdsRef.current &&
          !LEGACY_FAKE_SEED_IDS.has(linkedTrxId) &&
          !deletedIdsRef.current.includes(linkedTrxId) &&
          !cloudTrxIdsRef.current.has(linkedTrxId)
        ) {
          const linkedTrx = buildReconciledTransactions(
            transactionsRef.current,
            paymentReceiptsRef.current,
            [report],
            deletedIdsRef.current
          ).find((t) => t.id === linkedTrxId);
          if (linkedTrx) {
            await safeCloudWrite('keuangan_transaksi', linkedTrx.id, linkedTrx);
          }
        }
      }
    }
    if (cloudAbsIdsRef.current) {
      for (const sess of attendanceSessionsRef.current) {
        if (isQuotaExhaustedToday()) break;
        if (sess.id.startsWith('att-2026-11-') || deletedIdsRef.current.includes(sess.id)) continue;
        if (!cloudAbsIdsRef.current.has(sess.id)) {
          await safeCloudWrite('absensi_records', sess.id, sess);
        }
      }
    }
  };

  triggerManualSyncImplRef.current = async () => {
    try {
      const [delSnap, wargaSnap, trxSnap, jimpitSnap, absSnap, receiptSnap] = await Promise.all([
        getDocs(collection(db, 'system_deleted_ids')),
        getDocs(collection(db, 'warga')),
        getDocs(collection(db, 'keuangan_transaksi')),
        getDocs(collection(db, 'jimpitan_records')),
        getDocs(collection(db, 'absensi_records')),
        getDocs(collection(db, 'pembayaran_kwitansi'))
      ]);

      const cloudDeleted: string[] = [];
      delSnap.forEach((d) => cloudDeleted.push(d.id));
      if (cloudDeleted.length > 0) {
        const mergedDel = Array.from(new Set([...deletedIdsRef.current, ...cloudDeleted]));
        deletedIdsRef.current = mergedDel;
        setDeletedIds(mergedDel);
        localStorage.setItem('grisspo_deleted_ids', JSON.stringify(mergedDel));
      }

      const cloudWarga: Resident[] = [];
      wargaSnap.forEach((d) => cloudWarga.push(d.data() as Resident));
      if (cloudWarga.length > 0) {
        const mergedWarga = mergeResidentsList(cloudWarga, residentsRef.current);
        setResidents(mergedWarga);
        localStorage.setItem('grisspo_residents', JSON.stringify(mergedWarga));
      }

      const cloudTrx: Transaction[] = [];
      const cloudTrxIds = new Set<string>();
      trxSnap.forEach((d) => {
        if (LEGACY_FAKE_SEED_IDS.has(d.id)) {
          purgeLegacyFakeSeedDocOnce('keuangan_transaksi', d.id).catch(() => {});
          return;
        }
        cloudTrxIds.add(d.id);
        cloudTrx.push(d.data() as Transaction);
      });
      cloudTrxIdsRef.current = cloudTrxIds;
      const mergedTrx = mergeTransactionsList(cloudTrx, transactionsRef.current);
      transactionsRef.current = mergedTrx;
      setTransactions(mergedTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(mergedTrx));

      const cloudJimpit: JimpitDailyReport[] = [];
      const cloudJimpitIds = new Set<string>();
      jimpitSnap.forEach((d) => {
        if (LEGACY_FAKE_SEED_IDS.has(d.id)) {
          purgeLegacyFakeSeedDocOnce('jimpitan_records', d.id).catch(() => {});
          return;
        }
        cloudJimpitIds.add(d.id);
        cloudJimpit.push(d.data() as JimpitDailyReport);
      });
      cloudJimpitIdsRef.current = cloudJimpitIds;
      const mergedJimpit = mergeJimpitList(cloudJimpit, jimpitReportsRef.current);
      jimpitReportsRef.current = mergedJimpit;
      setJimpitReports(mergedJimpit);
      localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(mergedJimpit));

      const cloudAbs: AttendanceSession[] = [];
      const cloudAbsIds = new Set<string>();
      absSnap.forEach((d) => {
        cloudAbsIds.add(d.id);
        cloudAbs.push(d.data() as AttendanceSession);
      });
      cloudAbsIdsRef.current = cloudAbsIds;
      const mergedAbs = mergeAttendanceList(cloudAbs, attendanceSessionsRef.current);
      setAttendanceSessions(mergedAbs);
      localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(mergedAbs));

      const cloudRec: PaymentReceipt[] = [];
      receiptSnap.forEach((d) => cloudRec.push(d.data() as PaymentReceipt));
      const mergedRec = mergeReceiptsList(cloudRec, paymentReceiptsRef.current);
      setPaymentReceipts(mergedRec);
      localStorage.setItem('grisspo_payment_receipts', JSON.stringify(mergedRec));

      await flushUnsyncedToCloud();
      await recoverLocalPetugasReportsToCloud();
      setIsCloudSynced(true);
      setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      handleFirestoreWriteFailure(err, 'manual sync');
    }
  };

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

    // Check Cloud Seed Status once so other devices NEVER resurrect deleted documents or burn write quota
    const checkCloudSeedStatus = async () => {
      if (isQuotaExhaustedToday()) return;
      if (
        localStorage.getItem('grisspo_seeded_v1') === 'true' &&
        localStorage.getItem('grisspo_contacts_seeded_v1') === 'true'
      ) {
        return;
      }
      try {
        const seedRef = doc(db, 'system_settings', 'seed_status');
        const seedSnap = await getDoc(seedRef);
        if (!seedSnap.exists() || !seedSnap.data()?.isSeeded) {
          // Only seed if database is truly brand-new
          const wargaSnap = await getDocs(collection(db, 'warga'));
          if (wargaSnap.empty && !isQuotaExhaustedToday()) {
            const seedCollections: Array<{ col: string; items: Array<{ id: string }> }> = [
              { col: 'warga', items: initialResidents },
              { col: 'keuangan_transaksi', items: initialTransactions },
              { col: 'inventaris', items: initialInventory },
              { col: 'forum_posts', items: initialForumPosts },
              { col: 'pengumuman', items: initialAnnouncements },
              { col: 'fasum_bookings', items: initialFasumBookings },
              { col: 'notulen_rapat', items: initialMeetingNotes },
              { col: 'absensi_records', items: initialAttendanceSessions },
              { col: 'katalog_benefit', items: initialRewards },
              { col: 'kontak_penting', items: initialImportantContacts }
            ];
            for (const group of seedCollections) {
              if (isQuotaExhaustedToday()) break;
              for (const item of group.items) {
                if (isQuotaExhaustedToday()) break;
                if (!deletedIdsRef.current.includes(item.id)) {
                  await setDoc(doc(db, group.col, item.id), item).catch((e) =>
                    handleFirestoreWriteFailure(e, `seed ${group.col}`)
                  );
                }
              }
            }
          }
          if (!isQuotaExhaustedToday()) {
            await setDoc(seedRef, { isSeeded: true, seededAt: new Date().toISOString() });
            localStorage.setItem('grisspo_seeded_v1', 'true');
          }
        } else {
          localStorage.setItem('grisspo_seeded_v1', 'true');
        }

        // One-time check for kontak_penting only if not yet marked seeded locally
        if (localStorage.getItem('grisspo_contacts_seeded_v1') !== 'true' && !isQuotaExhaustedToday()) {
          try {
            const kontakSnap = await getDocs(collection(db, 'kontak_penting'));
            if (kontakSnap.empty) {
              for (const ct of initialImportantContacts) {
                if (isQuotaExhaustedToday()) break;
                if (!deletedIdsRef.current.includes(ct.id)) {
                  await setDoc(doc(db, 'kontak_penting', ct.id), ct).catch((e) =>
                    handleFirestoreWriteFailure(e, 'seed kontak')
                  );
                }
              }
            }
            localStorage.setItem('grisspo_contacts_seeded_v1', 'true');
          } catch (e) {
            handleFirestoreWriteFailure(e, 'sync initial important contacts');
          }
        }
      } catch (err) {
        handleFirestoreWriteFailure(err, 'cloud seed status check');
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

      // Keep onSnapshot listeners strictly read-only to prevent automatic delete storms
      const cleanupDeletedDocOnce = (_colName: string, _docId: string) => {};

      // 1. Warga listener
      unsubWarga = onSnapshot(collection(db, 'warga'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudData: Resident[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              cleanupDeletedDocOnce('warga', d.id);
            } else {
              cloudData.push(d.data() as Resident);
            }
          });
          const merged = mergeResidentsList(cloudData, residentsRef.current);
          setResidents(merged);
          localStorage.setItem('grisspo_residents', JSON.stringify(merged));
          setIsCloudSynced(true);
          setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }, (err) => {
        console.warn('Firestore warga listener error:', err.message);
      });

      // 2. Transactions listener (non-destructive merge + purge legacy fake seed trx)
      unsubTransactions = onSnapshot(collection(db, 'keuangan_transaksi'), (snapshot) => {
        const cloudTrx: Transaction[] = [];
        const cloudTrxIds = new Set<string>();
        snapshot.forEach((d) => {
          if (LEGACY_FAKE_SEED_IDS.has(d.id)) {
            purgeLegacyFakeSeedDocOnce('keuangan_transaksi', d.id).catch(() => {});
            return;
          }
          if (deletedIdsRef.current.includes(d.id)) {
            cleanupDeletedDocOnce('keuangan_transaksi', d.id);
          } else {
            cloudTrxIds.add(d.id);
            cloudTrx.push(d.data() as Transaction);
          }
        });
        cloudTrxIdsRef.current = cloudTrxIds;
        const merged = mergeTransactionsList(cloudTrx, transactionsRef.current);
        transactionsRef.current = merged;
        setTransactions(merged);
        localStorage.setItem('grisspo_transactions', JSON.stringify(merged));
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        recoverLocalPetugasReportsToCloud().catch(() => {});
      }, (err) => {
        console.warn('Firestore transaksi listener error:', err.message);
      });

      // 3. Jimpitan listener (non-destructive merge, purges fake Nov 11-12 seed IDs, preserves & syncs real petugas submissions)
      unsubJimpitan = onSnapshot(collection(db, 'jimpitan_records'), (snapshot) => {
        const cloudJimpit: JimpitDailyReport[] = [];
        const cloudJimpitIds = new Set<string>();
        snapshot.forEach((d) => {
          if (LEGACY_FAKE_SEED_IDS.has(d.id)) {
            purgeLegacyFakeSeedDocOnce('jimpitan_records', d.id).catch(() => {});
            return;
          }
          if (deletedIdsRef.current.includes(d.id)) {
            cleanupDeletedDocOnce('jimpitan_records', d.id);
          } else {
            cloudJimpitIds.add(d.id);
            cloudJimpit.push(d.data() as JimpitDailyReport);
          }
        });
        cloudJimpitIdsRef.current = cloudJimpitIds;
        const merged = mergeJimpitList(cloudJimpit, jimpitReportsRef.current);
        jimpitReportsRef.current = merged;
        setJimpitReports(merged);
        localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(merged));
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        flushUnsyncedToCloud().catch(() => {});
        recoverLocalPetugasReportsToCloud().catch(() => {});
      }, (err) => {
        console.warn('Firestore jimpitan listener error:', err.message);
      });

      // 4. Inventaris listener
      unsubInventory = onSnapshot(collection(db, 'inventaris'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudInv: InventoryItem[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              cleanupDeletedDocOnce('inventaris', d.id);
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
              cleanupDeletedDocOnce('forum_posts', d.id);
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
              cleanupDeletedDocOnce('pengumuman', d.id);
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
              cleanupDeletedDocOnce('fasum_bookings', d.id);
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

      // 8. Absensi Records listener (non-destructive merge)
      unsubAbsensi = onSnapshot(collection(db, 'absensi_records'), (snapshot) => {
        const cloudAbs: AttendanceSession[] = [];
        const cloudAbsIds = new Set<string>();
        snapshot.forEach((d) => {
          if (deletedIdsRef.current.includes(d.id)) {
            cleanupDeletedDocOnce('absensi_records', d.id);
          } else {
            cloudAbsIds.add(d.id);
            cloudAbs.push(d.data() as AttendanceSession);
          }
        });
        cloudAbsIdsRef.current = cloudAbsIds;
        const merged = mergeAttendanceList(cloudAbs, attendanceSessionsRef.current);
        attendanceSessionsRef.current = merged;
        setAttendanceSessions(merged);
        localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(merged));
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        recoverLocalPetugasReportsToCloud().catch(() => {});
      }, (err) => {
        console.warn('Firestore absensi listener error:', err.message);
      });

      // 9. Notulen Rapat listener
      unsubNotulen = onSnapshot(collection(db, 'notulen_rapat'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudNotes: MeetingNote[] = [];
          snapshot.forEach((d) => {
            if (deletedIdsRef.current.includes(d.id)) {
              cleanupDeletedDocOnce('notulen_rapat', d.id);
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
            cleanupDeletedDocOnce('active_sessions', d.id);
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

      // 12. Loket Pembayaran Kas & Kwitansi listener (Real-Time Cloud Sync, non-destructive merge)
      unsubReceipts = onSnapshot(collection(db, 'pembayaran_kwitansi'), (snapshot) => {
        const cloudReceipts: PaymentReceipt[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as PaymentReceipt;
          const strippedId = d.id.replace(/^receipt-/, '');
          const isDeleted =
            deletedIdsRef.current.includes(d.id) ||
            deletedIdsRef.current.includes(strippedId) ||
            LEGACY_FAKE_SEED_IDS.has(strippedId) ||
            (data.transactionId
              ? deletedIdsRef.current.includes(data.transactionId) || LEGACY_FAKE_SEED_IDS.has(data.transactionId)
              : false);
          if (!isDeleted) {
            cloudReceipts.push(data);
          } else {
            cleanupDeletedDocOnce('pembayaran_kwitansi', d.id);
          }
        });
        const merged = mergeReceiptsList(cloudReceipts, paymentReceiptsRef.current);
        paymentReceiptsRef.current = merged;
        setPaymentReceipts(merged);
        localStorage.setItem('grisspo_payment_receipts', JSON.stringify(merged));
        setIsCloudSynced(true);
        setLastSyncedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  // Reconciled financial ledger: single source of truth across transactions, paymentReceipts, jimpitReports, and fasumBookings
  const reconciledTransactions = useMemo(
    () => buildReconciledTransactions(transactions, paymentReceipts, jimpitReports, deletedIds, fasumBookings),
    [transactions, paymentReceipts, jimpitReports, deletedIds, fasumBookings]
  );

  const totalIncome = useMemo(
    () =>
      reconciledTransactions
        .filter((t) => {
          const tp = String(t.type || '').trim().toLowerCase();
          return tp === 'pemasukan' || tp === 'income';
        })
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
    [reconciledTransactions]
  );

  const totalExpense = useMemo(
    () =>
      reconciledTransactions
        .filter((t) => {
          const tp = String(t.type || '').trim().toLowerCase();
          return tp === 'pengeluaran' || tp === 'expense';
        })
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
    [reconciledTransactions]
  );

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
    setActiveView('dashboard');
    syncActiveSessionToCloud(loggedUser);
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
    setActiveView('dashboard');
    syncActiveSessionToCloud(loggedUser);
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
        transactionsRef.current.forEach((t) => {
          idsToMark.push(t.id);
          clearDocUnsynced('keuangan_transaksi', t.id);
        });
        transactionsRef.current = [];
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
        jimpitReportsRef.current.forEach((j) => {
          idsToMark.push(j.id);
          clearDocUnsynced('jimpitan_records', j.id);
          if (j.transactionId) {
            idsToMark.push(j.transactionId);
            clearDocUnsynced('keuangan_transaksi', j.transactionId);
          }
        });
        jimpitReportsRef.current = [];
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
        attendanceSessionsRef.current.forEach((s) => {
          idsToMark.push(s.id);
          clearDocUnsynced('absensi_records', s.id);
        });
        attendanceSessionsRef.current = [];
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
        paymentReceiptsRef.current.forEach((p) => {
          idsToMark.push(p.id);
          clearDocUnsynced('pembayaran_kwitansi', p.id);
          if (p.transactionId) {
            idsToMark.push(p.transactionId);
            clearDocUnsynced('keuangan_transaksi', p.transactionId);
          }
        });
        paymentReceiptsRef.current = [];
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
    const cleanRes = sanitizeForFirestore(resident);
    const next = residentsRef.current.map((r) => (r.id === cleanRes.id ? cleanRes : r));
    residentsRef.current = next;
    setResidents(next);
    localStorage.setItem('grisspo_residents', JSON.stringify(next));
    await safeCloudWrite('warga', cleanRes.id, cleanRes);
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

  // Jimpitan Daily Submission with Firestore Sync & Quota-Safe Local Persistence
  const submitDailyJimpit = async (reportData: Omit<JimpitDailyReport, 'id' | 'createdAt'>) => {
    const now = Date.now();
    const jimpitTrxId = `trx-jimpit-${now}`;
    const newReport: JimpitDailyReport = sanitizeForFirestore({
      ...reportData,
      id: `jimpit-${now}`,
      reportType: 'harian',
      transactionId: jimpitTrxId,
      createdAt: new Date().toISOString()
    });

    const nextReports = [newReport, ...jimpitReportsRef.current].sort((a, b) => {
      if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    jimpitReportsRef.current = nextReports;
    setJimpitReports(nextReports);
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(nextReports));

    // Update residents and queue/save to Firestore safely
    const updatedRes = [...residentsRef.current];
    const modifiedResidents: Resident[] = [];
    reportData.entries.forEach((entry) => {
      const idx = updatedRes.findIndex((r) => r.houseNumber === entry.houseNumber);
      if (idx !== -1) {
        const curPaid = updatedRes[idx].jimpitanPaidMonth || 0;
        updatedRes[idx] = {
          ...updatedRes[idx],
          jimpitanPaidMonth: curPaid + entry.nominal,
          points: (updatedRes[idx].points || 0) + 10
        };
        modifiedResidents.push(updatedRes[idx]);
      }
    });
    residentsRef.current = updatedRes;
    setResidents(updatedRes);
    localStorage.setItem('grisspo_residents', JSON.stringify(updatedRes));

    for (const modRes of modifiedResidents) {
      safeCloudWrite('warga', modRes.id, modRes).catch(() => {});
    }

    // Save jimpitan report safely (marks unsynced if quota exhausted so onSnapshot never wipes it)
    await safeCloudWrite('jimpitan_records', newReport.id, newReport);

    // Automatically create income transaction for Paguyuban kas (excluded from Riwayat Pembayaran Kas)
    const dateStr = reportData.date;
    const parsedDateTs = new Date(`${dateStr}T21:00:00+07:00`).getTime();
    const trxTs = Number.isFinite(parsedDateTs) ? parsedDateTs : now;
    const hash = await computeTransactionHash(
      'pemasukan',
      'Pemasukan Jimpitan Bulanan',
      reportData.totalNominal,
      dateStr,
      reportData.collectedBy,
      trxTs
    );

    const jimpitTrx: Transaction = {
      id: jimpitTrxId,
      type: 'pemasukan',
      category: 'Pemasukan Jimpitan Bulanan',
      amount: Number(reportData.totalNominal) || 0,
      date: dateStr,
      description: `Pemasukan Jimpitan Ronda Online (${reportData.day}, ${dateStr}) oleh ${reportData.collectedBy}`,
      recordedBy: reportData.collectedBy,
      userRole: currentUser ? currentUser.role : 'warga',
      encryptedHash: hash,
      isAnomaly: false,
      timestamp: trxTs
    };

    const nextTrx = [jimpitTrx, ...transactionsRef.current];
    transactionsRef.current = nextTrx;
    setTransactions(nextTrx);
    localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
    await safeCloudWrite('keuangan_transaksi', jimpitTrx.id, jimpitTrx);

    // Add announcement
    await addAnnouncement(
      `Jimpitan Online Hari ${reportData.day} Selesai Diambil`,
      `Total perolehan jimpitan hari ini sebesar Rp ${reportData.totalNominal.toLocaleString('id-ID')} dari ${reportData.entries.length} warga. Tersimpan aman di sistem.`,
      'Ronda',
      false
    );
  };

  const deleteJimpitReport = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus laporan jimpitan!');
      return;
    }
    const reportToDelete = jimpitReportsRef.current.find((r) => r.id === id);
    await markAsDeleted(id, 'jimpitan_records');

    if (reportToDelete) {
      // Revert resident paid amounts
      const updatedResList = residentsRef.current.map((res) => {
        const entry = reportToDelete.entries.find((e) => e.houseNumber === res.houseNumber);
        if (entry) {
          const newPaid = Math.max(0, (res.jimpitanPaidMonth || 0) - entry.nominal);
          const updated = { ...res, jimpitanPaidMonth: newPaid };
          safeCloudWrite('warga', res.id, updated).catch(() => {});
          return updated;
        }
        return res;
      });
      residentsRef.current = updatedResList;
      setResidents(updatedResList);
      localStorage.setItem('grisspo_residents', JSON.stringify(updatedResList));

      // Remove linked transaction in keuangan_transaksi if present
      const linkedTrxId = reportToDelete.transactionId || `trx-${reportToDelete.id}`;
      await markAsDeleted(linkedTrxId, 'keuangan_transaksi');
      const updatedTrx = transactionsRef.current.filter((t) => t.id !== linkedTrxId);
      transactionsRef.current = updatedTrx;
      setTransactions(updatedTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(updatedTrx));
      try {
        await deleteDoc(doc(db, 'keuangan_transaksi', linkedTrxId));
      } catch {}
    }

    const filtered = jimpitReportsRef.current.filter((r) => r.id !== id);
    jimpitReportsRef.current = filtered;
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
    const resident = residentsRef.current.find((r) => r.id === residentId);
    if (!resident) {
      return { success: false, message: 'Data warga tidak ditemukan!' };
    }
    const cleanAmount = Number(amount) || 0;
    if (cleanAmount <= 0) {
      return { success: false, message: 'Nominal pembayaran harus lebih besar dari Rp 0!' };
    }

    // 1. Deduct deficit: deduct previousMonthsJimpitanDeficit first, then surplus to jimpitanPaidMonth
    let remaining = cleanAmount;
    let prevDeficit = resident.previousMonthsJimpitanDeficit || 0;
    const deductPrev = Math.min(prevDeficit, remaining);
    prevDeficit -= deductPrev;
    remaining -= deductPrev;

    const curPaid = (resident.jimpitanPaidMonth || 0) + remaining;

    const updatedRes: Resident = {
      ...resident,
      previousMonthsJimpitanDeficit: prevDeficit,
      jimpitanPaidMonth: curPaid,
      points: (resident.points || 0) + 15
    };

    const nextRes = residentsRef.current.map((r) => (r.id === residentId ? updatedRes : r));
    residentsRef.current = nextRes;
    setResidents(nextRes);
    localStorage.setItem('grisspo_residents', JSON.stringify(nextRes));
    await safeCloudWrite('warga', resident.id, updatedRes);

    // 2. Automatically record income transaction in Keuangan Kas Paguyuban (NOT in Riwayat Pembayaran Kas)
    const nowDate = new Date();
    const dateStr = getLocalDateString(nowDate);
    const daysList: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName: DayOfWeek = daysList[nowDate.getDay()] || 'Senin';
    const now = Date.now();
    const currentName = currentUser?.name || 'Petugas Jimpit';
    const userRole = currentUser?.role || 'warga';
    const hash = await computeTransactionHash(
      'pemasukan',
      'Pemasukan Jimpitan Bulanan',
      cleanAmount,
      dateStr,
      currentName,
      now
    );

    const methodLabel = method === 'transfer' ? 'Transfer Bank BRI' : 'Tunai';

    const newTrx: Transaction = {
      id: `trx-jimpit-pay-${now}`,
      type: 'pemasukan',
      category: 'Pemasukan Jimpitan Bulanan',
      amount: cleanAmount,
      date: dateStr,
      description: `Pelunasan Kekurangan Jimpitan: ${resident.name} (${resident.houseNumber}) via ${methodLabel}${notes ? ` - ${notes}` : ''}`,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Petugas Jimpit',
      userRole,
      sourceHouse: resident.houseNumber,
      encryptedHash: hash,
      isAnomaly: false,
      timestamp: now
    };

    const nextTrx = [newTrx, ...transactionsRef.current];
    transactionsRef.current = nextTrx;
    setTransactions(nextTrx);
    localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
    await safeCloudWrite('keuangan_transaksi', newTrx.id, newTrx);

    // 2b. Also record into History Jimpitan (jimpit_records)
    const settlementReport: JimpitDailyReport = sanitizeForFirestore({
      id: `jimpit-pay-${now}`,
      date: dateStr,
      day: dayName,
      collectedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Petugas Jimpit',
      reportType: 'pelunasan',
      transactionId: newTrx.id,
      entries: [
        {
          houseNumber: resident.houseNumber,
          residentName: resident.name,
          nominal: cleanAmount,
          paymentMethod: method,
          timestamp: nowDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          collectedBy: currentName
        }
      ],
      totalNominal: cleanAmount,
      notes: notes || `Pelunasan jimpitan bulanan ${resident.name} (${resident.houseNumber}) via ${methodLabel}`,
      createdAt: nowDate.toISOString()
    });
    const nextJimpit = [settlementReport, ...jimpitReportsRef.current];
    jimpitReportsRef.current = nextJimpit;
    setJimpitReports(nextJimpit);
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(nextJimpit));
    await safeCloudWrite('jimpitan_records', settlementReport.id, settlementReport);

    // 3. Award loyalty points & push announcement
    awardPoints(resident.id, 15, `Pelunasan kekurangan jimpitan via ${methodLabel}`);

    addAnnouncement(
      `Pelunasan Kekurangan Jimpitan: ${resident.name} (${resident.houseNumber})`,
      `Pembayaran kekurangan jimpitan sebesar Rp ${cleanAmount.toLocaleString('id-ID')} via ${methodLabel} telah berhasil diverifikasi dan tercatat di Kas Paguyuban.`,
      'Keuangan',
      false
    );

    return {
      success: true,
      message: `Pembayaran kekurangan jimpitan Rp ${cleanAmount.toLocaleString('id-ID')} berhasil dicatat ke History Jimpitan & Saldo Kas Paguyuban!`,
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

  // Finance Transactions with Firestore sync & full cross-ledger consistency
  const addTransaction = async (
    trxData: Omit<Transaction, 'id' | 'encryptedHash' | 'timestamp' | 'isAnomaly'>,
    options?: { skipReceiptCreation?: boolean }
  ): Promise<Transaction> => {
    const effectiveTimestamp = trxData.date
      ? new Date(`${trxData.date}T12:00:00`).getTime()
      : Date.now();

    const numericAmount = Number(trxData.amount) || 0;
    const rawType = String(trxData.type || '').trim().toLowerCase();
    const cleanType = (rawType === 'pengeluaran' || rawType === 'expense' ? 'pengeluaran' : 'pemasukan') as
      | 'pemasukan'
      | 'pengeluaran';
    const normalizedCategory = normalizeTransactionCategory({ ...trxData, type: cleanType });

    const hash = await computeTransactionHash(
      cleanType,
      normalizedCategory,
      numericAmount,
      trxData.date,
      trxData.recordedBy,
      effectiveTimestamp
    );

    const anomalyCheck = detectFinancialAnomaly(trxData);
    const isAnomaly = anomalyCheck.isAnomaly;
    const anomalyReason = anomalyCheck.reason;

    if (isAnomaly && anomalyReason) {
      const emailLog = sendAnomalyEmailAlert(trxData, anomalyReason);
      setEmailAlerts((prev) => [emailLog, ...prev]);
    }

    const newTrx: Transaction = {
      ...trxData,
      type: cleanType,
      category: normalizedCategory,
      amount: numericAmount,
      id: `trx-${effectiveTimestamp}-${Math.random().toString(36).substring(2, 6)}`,
      encryptedHash: hash,
      isAnomaly,
      anomalyReason,
      timestamp: effectiveTimestamp
    };

    const nextTrx = [newTrx, ...transactionsRef.current];
    transactionsRef.current = nextTrx;
    setTransactions(nextTrx);
    localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
    await safeCloudWrite('keuangan_transaksi', newTrx.id, newTrx);

    // Auto-create matching payment receipt for kas masuk (EXCLUDE JIMPITAN)
    const catL = normalizedCategory.toLowerCase();
    const descL = (trxData.description || '').toLowerCase();
    const isJimpit =
      catL.includes('jimpit') ||
      descL.startsWith('pemasukan jimpitan') ||
      descL.startsWith('pelunasan kekurangan jimpitan');

    if (cleanType === 'pemasukan' && !options?.skipReceiptCreation && !isJimpit) {
      const dateStr = trxData.date || getLocalDateString(new Date(effectiveTimestamp));
      const pType = mapCategoryToPaymentType(normalizedCategory);

      const house = trxData.sourceHouse || '';
      const matchedRes = residentsRef.current.find(
        (r) => house && r.houseNumber.replace(/\s+/g, '').toUpperCase() === house.replace(/\s+/g, '').toUpperCase()
      );

      const rId = `receipt-${newTrx.id}`;
      const newR: PaymentReceipt = {
        id: rId,
        receiptNumber: `KWT-GSS-${dateStr.replace(/-/g, '')}-${newTrx.id.slice(-4).toUpperCase()}`,
        date: dateStr,
        residentId: matchedRes ? matchedRes.id : (house ? `w-${house.replace(/\s+/g, '').toLowerCase()}` : 'gss-paguyuban'),
        residentName: matchedRes ? matchedRes.name : (house ? `Warga ${house}` : trxData.recordedBy || 'Warga GSS'),
        residentHouse: house || 'Paguyuban GSS',
        residentPhone: matchedRes?.phone || '0812-3456-7800',
        paymentType: pType,
        paymentTypeName: normalizedCategory,
        amount: numericAmount,
        periodMonth: dateStr.slice(0, 7),
        paymentMethod: (trxData.description || '').toLowerCase().includes('transfer') ? 'transfer_bank' : 'tunai',
        notes: trxData.description,
        recordedBy: trxData.recordedBy || (currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Bendahara Kas'),
        recorderRole: trxData.userRole || currentUser?.role || 'bendahara1',
        transactionId: newTrx.id,
        createdAt: new Date(effectiveTimestamp).toISOString()
      };

      const nextReceipts = [newR, ...paymentReceiptsRef.current.filter((p) => p.id !== rId && p.transactionId !== newTrx.id)];
      paymentReceiptsRef.current = nextReceipts;
      setPaymentReceipts(nextReceipts);
      localStorage.setItem('grisspo_payment_receipts', JSON.stringify(nextReceipts));
      await safeCloudWrite('pembayaran_kwitansi', newR.id, newR);

      // Update resident payment status if iuran
      if (matchedRes && (pType === 'iuran_bulanan' || pType === 'iuran_bulanan_sampah' || pType === 'iuran_sampah')) {
        const curUnpaid = matchedRes.iuranUnpaidMonths || 0;
        const nextUnpaid = Math.max(0, curUnpaid - 1);
        const nextUnpaidNames = (matchedRes.unpaidMonthNames || []).slice(1);
        const updatedRes = {
          ...matchedRes,
          monthlyIuranPaid: true,
          iuranUnpaidMonths: nextUnpaid,
          unpaidMonthNames: nextUnpaidNames,
          points: (matchedRes.points || 0) + 10
        };
        const nextRes = residentsRef.current.map((r) => (r.id === matchedRes.id ? updatedRes : r));
        residentsRef.current = nextRes;
        setResidents(nextRes);
        localStorage.setItem('grisspo_residents', JSON.stringify(nextRes));
        safeCloudWrite('warga', matchedRes.id, updatedRes).catch(() => {});
      }
    }

    if (trxData.sourceHouse) {
      if (normalizedCategory.toLowerCase().includes('sumbangan') && numericAmount >= 100000) {
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
    const updated = transactionsRef.current.filter((t) => t.id !== id);
    transactionsRef.current = updated;
    setTransactions(updated);
    localStorage.setItem('grisspo_transactions', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'keuangan_transaksi', id));
    } catch (err) {
      console.warn('Firestore delete transaction notice:', err);
    }

    // Delete ALL linked/duplicate receipts in pembayaran_kwitansi
    const linkedReceipts = paymentReceiptsRef.current.filter(
      (r) =>
        r.transactionId === id ||
        r.id === `receipt-${id}` ||
        id === `trx-sync-${r.id}`
    );
    if (linkedReceipts.length > 0) {
      const linkedReceiptIds = new Set(linkedReceipts.map((r) => r.id));
      for (const lr of linkedReceipts) {
        await markAsDeleted(lr.id, 'pembayaran_kwitansi');
        try {
          await deleteDoc(doc(db, 'pembayaran_kwitansi', lr.id));
        } catch (err) {}
      }
      const updatedReceipts = paymentReceiptsRef.current.filter((r) => !linkedReceiptIds.has(r.id));
      paymentReceiptsRef.current = updatedReceipts;
      setPaymentReceipts(updatedReceipts);
      localStorage.setItem('grisspo_payment_receipts', JSON.stringify(updatedReceipts));
    }

    // Also mark any linked jimpitan report if it was a linked jimpitan transaction
    const linkedJimpit = jimpitReportsRef.current.find(
      (j) => j.transactionId === id || `trx-${j.id}` === id
    );
    if (linkedJimpit) {
      await markAsDeleted(linkedJimpit.id, 'jimpitan_records');
      const updatedJimpit = jimpitReportsRef.current.filter((j) => j.id !== linkedJimpit.id);
      jimpitReportsRef.current = updatedJimpit;
      setJimpitReports(updatedJimpit);
      localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(updatedJimpit));
      try {
        await deleteDoc(doc(db, 'jimpitan_records', linkedJimpit.id));
      } catch {}
    }
  };

  const updateTransaction = async (trx: Transaction) => {
    const numericAmount = Number(trx.amount) || 0;
    const rawType = String(trx.type || '').trim().toLowerCase();
    const cleanType = (rawType === 'pengeluaran' || rawType === 'expense' ? 'pengeluaran' : 'pemasukan') as
      | 'pemasukan'
      | 'pengeluaran';
    const normalizedCategory = normalizeTransactionCategory({ ...trx, type: cleanType });
    const effectiveTimestamp = trx.date
      ? new Date(`${trx.date}T12:00:00`).getTime()
      : trx.timestamp || Date.now();

    const updatedHash = await computeTransactionHash(
      cleanType,
      normalizedCategory,
      numericAmount,
      trx.date,
      trx.recordedBy,
      effectiveTimestamp
    );
    const updated: Transaction = {
      ...trx,
      type: cleanType,
      category: normalizedCategory,
      amount: numericAmount,
      timestamp: effectiveTimestamp,
      encryptedHash: updatedHash
    };
    const existsInTrx = transactionsRef.current.some((t) => t.id === trx.id);
    const nextTrx = existsInTrx
      ? transactionsRef.current.map((t) => (t.id === trx.id ? updated : t))
      : [updated, ...transactionsRef.current];
    transactionsRef.current = nextTrx;
    setTransactions(nextTrx);
    localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
    await safeCloudWrite('keuangan_transaksi', trx.id, updated);

    // Sync update or removal back to all linked payment receipts
    const linkedReceipts = paymentReceiptsRef.current.filter(
      (r) => r.transactionId === trx.id || r.id === `receipt-${trx.id}` || trx.id === `trx-sync-${r.id}`
    );
    if (linkedReceipts.length > 0) {
      const isNowExpenseOrJimpit =
        cleanType === 'pengeluaran' || normalizedCategory === 'Pemasukan Jimpitan Bulanan';
      if (isNowExpenseOrJimpit) {
        const removeIds = new Set(linkedReceipts.map((r) => r.id));
        for (const lr of linkedReceipts) {
          await markAsDeleted(lr.id, 'pembayaran_kwitansi');
          try {
            await deleteDoc(doc(db, 'pembayaran_kwitansi', lr.id));
          } catch {}
        }
        const nextRec = paymentReceiptsRef.current.filter((r) => !removeIds.has(r.id));
        paymentReceiptsRef.current = nextRec;
        setPaymentReceipts(nextRec);
        localStorage.setItem('grisspo_payment_receipts', JSON.stringify(nextRec));
      } else {
        const updatesById = new Map<string, PaymentReceipt>();
        for (const lr of linkedReceipts) {
          const updatedReceipt: PaymentReceipt = {
            ...lr,
            amount: numericAmount,
            date: trx.date || lr.date,
            paymentType: mapCategoryToPaymentType(normalizedCategory),
            paymentTypeName: normalizedCategory,
            residentHouse: trx.sourceHouse || lr.residentHouse,
            notes: trx.description
          };
          updatesById.set(lr.id, updatedReceipt);
        }
        const nextRec = paymentReceiptsRef.current.map((r) => updatesById.get(r.id) || r);
        paymentReceiptsRef.current = nextRec;
        setPaymentReceipts(nextRec);
        localStorage.setItem('grisspo_payment_receipts', JSON.stringify(nextRec));
        for (const updatedReceipt of updatesById.values()) {
          await safeCloudWrite('pembayaran_kwitansi', updatedReceipt.id, updatedReceipt);
        }
      }
    }

    // Sync update back to linked jimpitan report if applicable
    const linkedJimpit = jimpitReportsRef.current.find(
      (j) => j.transactionId === trx.id || `trx-${j.id}` === trx.id
    );
    if (linkedJimpit) {
      const updatedJimpit: JimpitDailyReport = sanitizeForFirestore({
        ...linkedJimpit,
        totalNominal: numericAmount,
        date: trx.date || linkedJimpit.date,
        transactionId: trx.id
      });
      const nextJimpit = jimpitReportsRef.current.map((j) => (j.id === linkedJimpit.id ? updatedJimpit : j));
      jimpitReportsRef.current = nextJimpit;
      setJimpitReports(nextJimpit);
      localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(nextJimpit));
      await safeCloudWrite('jimpitan_records', linkedJimpit.id, updatedJimpit);
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

    const nextBookings = [newBooking, ...fasumBookingsRef.current];
    fasumBookingsRef.current = nextBookings;
    setFasumBookings(nextBookings);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(nextBookings));
    await safeCloudWrite('fasum_bookings', newBooking.id, newBooking);

    return newBooking;
  };

  const confirmFasumPayment = async (bookingId: string, approvedBy?: string) => {
    const booking = fasumBookingsRef.current.find((b) => b.id === bookingId);
    if (!booking) return;

    // Idempotency guard: prevent double transaction if already lunas with an existing kas transaction
    if (
      booking.paymentStatus === 'lunas' &&
      booking.transactionId &&
      transactionsRef.current.some((t) => t.id === booking.transactionId)
    ) {
      return;
    }

    const paymentDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const verifier = approvedBy || (currentUser ? currentUser.name : 'Pengurus Paguyuban');
    const verifierRole = currentUser ? currentUser.role : 'bendahara1';

    // Automatically record income in Keuangan Kas!
    const trx = await addTransaction({
      type: 'pemasukan',
      category: 'Sewa Fasum (Rp 30.000/bln)',
      amount: Number(booking.rentalFee) || 0,
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

    const nextBookings = fasumBookingsRef.current.map((b) => (b.id === bookingId ? updatedBooking : b));
    fasumBookingsRef.current = nextBookings;
    setFasumBookings(nextBookings);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(nextBookings));

    // Award +25 points
    awardPoints(booking.residentId, 25, `Sewa Fasum: ${booking.facilityName}`);

    // Announcement
    addAnnouncement(
      `Pembayaran Sewa Fasum Terverifikasi & Masuk Kas`,
      `Sewa ${booking.facilityName} oleh ${booking.residentName} (${booking.residentHouse}) tanggal ${booking.date} telah diverifikasi oleh ${verifier}. Dana Rp ${booking.rentalFee.toLocaleString('id-ID')} masuk kas paguyuban.`,
      'Keuangan'
    );

    await safeCloudWrite('fasum_bookings', bookingId, updatedBooking);
  };

  const updateFasumBookingStatus = async (
    bookingId: string,
    status: FasumBooking['status'],
    notes?: string
  ) => {
    const updated = fasumBookingsRef.current.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status,
          notes: notes !== undefined ? notes : b.notes
        };
      }
      return b;
    });
    fasumBookingsRef.current = updated;
    setFasumBookings(updated);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(updated));
    const target = updated.find((b) => b.id === bookingId);
    if (target) {
      await safeCloudWrite('fasum_bookings', bookingId, target);
    }
  };

  const deleteFasumBooking = async (bookingId: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Hanya Superadmin (Bpk. Beni B24) yang memiliki hak menghapus data pemesanan fasum.');
      return;
    }
    const targetBooking = fasumBookingsRef.current.find((b) => b.id === bookingId);
    if (targetBooking?.transactionId) {
      await deleteTransaction(targetBooking.transactionId);
    }
    await markAsDeleted(bookingId, 'fasum_bookings');
    const filtered = fasumBookingsRef.current.filter((b) => b.id !== bookingId);
    fasumBookingsRef.current = filtered;
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
    date?: string;
    notes?: string;
  }): Promise<PaymentReceipt> => {
    const dateStr = data.date || getLocalDateString();
    const receiptNum = `KWT-GSS-${dateStr.replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Add corresponding cash transaction to Paguyuban Book
    const cat = mapPaymentTypeToCategory(data.paymentType, data.paymentTypeName);

    const methodLabel = data.paymentMethod === 'transfer_bank_bri' || data.paymentMethod === 'transfer_bank'
      ? 'Transfer Bank BRI (155801007310503 a/n Benisius Rahmat Basuki)'
      : 'Tunai ke Bendahara';

    const desc = `${data.paymentTypeName} - ${data.residentName} (${data.residentHouse}) [No. Kwitansi: ${receiptNum}] via ${methodLabel}${data.periodMonth ? ` - Periode: ${data.periodMonth}` : ''}${data.notes ? ` (${data.notes})` : ''}`;

    const numAmount = Number(data.amount) || 0;

    const createdTrx = await addTransaction(
      {
        type: 'pemasukan',
        category: cat,
        amount: numAmount,
        date: dateStr,
        description: desc,
        recordedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Bendahara Kas',
        userRole: currentUser?.role || 'bendahara1',
        sourceHouse: data.residentHouse
      },
      { skipReceiptCreation: true }
    );

    // 2. If iuran, update resident arrears
    const res = residentsRef.current.find(
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
        const bonusPts = numAmount >= 100000 ? 50 : 20;
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
      amount: numAmount,
      periodMonth: data.periodMonth,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      recordedBy: currentUser ? `${currentUser.name} (${currentUser.houseNumber})` : 'Bendahara GSS',
      recorderRole: currentUser?.role || 'bendahara1',
      transactionId: createdTrx.id,
      createdAt: new Date(`${dateStr}T12:00:00`).toISOString()
    };

    const nextReceipts = [newReceipt, ...paymentReceiptsRef.current].sort((a, b) => {
      const dateA = a.date || a.createdAt?.slice(0, 10) || '';
      const dateB = b.date || b.createdAt?.slice(0, 10) || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    paymentReceiptsRef.current = nextReceipts;
    setPaymentReceipts(nextReceipts);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(nextReceipts));

    await safeCloudWrite('pembayaran_kwitansi', receiptId, newReceipt);

    return newReceipt;
  };

  const updatePaymentReceipt = async (receipt: PaymentReceipt) => {
    if (!['superadmin', 'bendahara1', 'bendahara2'].includes(currentUser?.role || '')) {
      alert('Akses Ditolak: Hanya Bendahara dan Admin yang memiliki hak akses mengedit data pembayaran!');
      return;
    }

    const cat = mapPaymentTypeToCategory(receipt.paymentType, receipt.paymentTypeName);
    const methodLabel =
      receipt.paymentMethod === 'transfer_bank_bri' || receipt.paymentMethod === 'transfer_bank'
        ? 'Transfer Bank BRI (155801007310503 a/n Benisius Rahmat Basuki)'
        : 'Tunai ke Bendahara';
    const desc = `${receipt.paymentTypeName} - ${receipt.residentName} (${receipt.residentHouse}) [No. Kwitansi: ${receipt.receiptNumber}] via ${methodLabel}${
      receipt.periodMonth ? ` - Periode: ${receipt.periodMonth}` : ''
    }${receipt.notes ? ` (${receipt.notes})` : ''}`;

    const numericAmount = Number(receipt.amount) || 0;
    const dateStr = receipt.date || getLocalDateString(new Date(receipt.createdAt || Date.now()));
    const targetTrxId = receipt.transactionId || `trx-sync-${receipt.id}`;
    const finalReceipt: PaymentReceipt = {
      ...receipt,
      amount: numericAmount,
      date: dateStr,
      transactionId: targetTrxId
    };

    const next = paymentReceiptsRef.current.map((p) => (p.id === finalReceipt.id ? finalReceipt : p));
    paymentReceiptsRef.current = next;
    setPaymentReceipts(next);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(next));
    await safeCloudWrite('pembayaran_kwitansi', finalReceipt.id, finalReceipt);

    // Sinkronkan transaksi kas terkait di pembukuan keuangan paguyuban
    const relatedTrx = transactionsRef.current.find(
      (t) =>
        t.id === receipt.transactionId ||
        t.id === targetTrxId ||
        `receipt-${t.id}` === receipt.id
    );
    if (relatedTrx) {
      await updateTransaction({
        ...relatedTrx,
        amount: numericAmount,
        category: cat,
        date: dateStr,
        sourceHouse: finalReceipt.residentHouse || relatedTrx.sourceHouse,
        description: desc
      });
    } else {
      const effectiveTimestamp = new Date(`${dateStr}T12:00:00`).getTime();
      const recordedBy = finalReceipt.recordedBy || 'Bendahara Kas';
      const hash = await computeTransactionHash(
        'pemasukan',
        cat,
        numericAmount,
        dateStr,
        recordedBy,
        effectiveTimestamp
      );
      const newLinkedTrx: Transaction = {
        id: targetTrxId,
        type: 'pemasukan',
        category: cat,
        amount: numericAmount,
        date: dateStr,
        description: desc,
        recordedBy,
        userRole: finalReceipt.recorderRole || 'bendahara1',
        sourceHouse: finalReceipt.residentHouse,
        encryptedHash: hash,
        isAnomaly: false,
        timestamp: effectiveTimestamp
      };
      const nextTrx = [newLinkedTrx, ...transactionsRef.current];
      transactionsRef.current = nextTrx;
      setTransactions(nextTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
      await safeCloudWrite('keuangan_transaksi', newLinkedTrx.id, newLinkedTrx);
    }
  };

  const deletePaymentReceipt = async (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses menghapus data pembayaran!');
      return;
    }
    const toDelete = paymentReceiptsRef.current.find((p) => p.id === id);
    const linkedTrxId =
      toDelete?.transactionId ||
      (id.startsWith('receipt-') ? id.replace(/^receipt-/, '') : `trx-sync-${id}`);

    // Find ALL sibling/duplicate receipts linked to the same transaction
    const siblingReceipts = paymentReceiptsRef.current.filter(
      (p) =>
        p.id === id ||
        (linkedTrxId && (p.transactionId === linkedTrxId || p.id === `receipt-${linkedTrxId}`))
    );
    const removeReceiptIds = new Set(siblingReceipts.map((p) => p.id));
    removeReceiptIds.add(id);

    for (const rid of removeReceiptIds) {
      await markAsDeleted(rid, 'pembayaran_kwitansi');
      try {
        await deleteDoc(doc(db, 'pembayaran_kwitansi', rid));
      } catch (err) {
        console.warn('Firestore deletePaymentReceipt error:', err);
      }
    }

    const next = paymentReceiptsRef.current.filter((p) => !removeReceiptIds.has(p.id));
    paymentReceiptsRef.current = next;
    setPaymentReceipts(next);
    localStorage.setItem('grisspo_payment_receipts', JSON.stringify(next));

    // Hapus transaksi kas terkait di pembukuan keuangan paguyuban
    if (linkedTrxId) {
      await markAsDeleted(linkedTrxId, 'keuangan_transaksi');
      const updatedTrx = transactionsRef.current.filter((t) => t.id !== linkedTrxId);
      transactionsRef.current = updatedTrx;
      setTransactions(updatedTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(updatedTrx));
      try {
        await deleteDoc(doc(db, 'keuangan_transaksi', linkedTrxId));
      } catch (err) {
        console.warn('Delete linked transaction error:', err);
      }
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
    const isAdminRole = Boolean(
      currentUser && ['superadmin', 'sekretaris', 'bendahara1', 'bendahara2', 'admin_inventaris'].includes(currentUser.role)
    );

    // Khusus absensi ronda: hanya petugas ronda di hari tersebut dan admin/pengurus yang berwenang
    if (sessionData.type === 'ronda') {
      const isDutyToday = (() => {
        if (!currentUser) return false;
        const targetDay = sessionData.day || 'Senin';
        const group = rondaSchedule.find((g) => g.day === targetDay);
        if (!group) return false;
        const currentHouseClean = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
        const currentNameClean = normalizeCleanName(currentUser.name || '');
        return group.members.some((m) => {
          const mClean = normalizeCleanName(m);
          if (currentNameClean && (mClean.includes(currentNameClean) || currentNameClean.includes(mClean))) return true;
          const r = findResidentByMemberName(m, residentsRef.current);
          return Boolean(r && r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentHouseClean);
        });
      })();

      if (!isAdminRole && !isDutyToday) {
        throw new Error(
          'Akses Dibatasi: Khusus hanya petugas ronda pada hari tersebut dan admin/pengurus yang berhak melakukan absensi ronda.'
        );
      }
    }

    // Jika absensi ronda untuk tanggal tersebut sudah ada, perbarui sesi yang sudah ada
    const existingRonda = sessionData.type === 'ronda'
      ? attendanceSessionsRef.current.find((s) => s.type === 'ronda' && s.date === sessionData.date)
      : undefined;

    if (existingRonda) {
      const updatedSession: AttendanceSession = sanitizeForFirestore({
        ...existingRonda,
        ...sessionData,
        id: existingRonda.id,
        createdAt: existingRonda.createdAt,
        pointsAwarded: true
      });
      await updateAttendanceSession(updatedSession);
      return;
    }

    const id = `att-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newSession: AttendanceSession = sanitizeForFirestore({
      ...sessionData,
      id,
      createdAt,
      pointsAwarded: true
    });

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

    const presentAttendees = newSession.attendees.filter((a) => a.isPresent);
    const updatedResidentsList = [...residentsRef.current];
    const modifiedResidents: Resident[] = [];
    const newPointLogs: PointLog[] = [];

    for (const attendee of presentAttendees) {
      const targetRes =
        updatedResidentsList.find(
          (r) =>
            r.id === attendee.residentId ||
            r.houseNumber.trim().toLowerCase() === attendee.residentHouse.trim().toLowerCase()
        ) || findResidentByMemberName(attendee.residentName, updatedResidentsList);

      if (targetRes) {
        const nextPoints = (targetRes.points || 0) + pointsToAdd;
        const updatedRes = { ...targetRes, points: nextPoints };
        const idx = updatedResidentsList.findIndex((r) => r.id === targetRes.id);
        if (idx !== -1) updatedResidentsList[idx] = updatedRes;
        modifiedResidents.push(updatedRes);

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
        newPointLogs.push(log);
      }
    }

    residentsRef.current = updatedResidentsList;
    setResidents(updatedResidentsList);
    localStorage.setItem('grisspo_residents', JSON.stringify(updatedResidentsList));
    for (const modRes of modifiedResidents) {
      safeCloudWrite('warga', modRes.id, modRes).catch(() => {});
    }

    if (newPointLogs.length > 0) {
      setPointLogs((prev) => [...newPointLogs, ...prev]);
      for (const log of newPointLogs) {
        safeCloudWrite('point_logs', log.id, log).catch(() => {});
      }
    }

    const nextSessions = [newSession, ...attendanceSessionsRef.current];
    attendanceSessionsRef.current = nextSessions;
    setAttendanceSessions(nextSessions);
    localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(nextSessions));

    await safeCloudWrite('absensi_records', newSession.id, newSession);

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
    const updated = attendanceSessionsRef.current.filter((s) => s.id !== id);
    attendanceSessionsRef.current = updated;
    setAttendanceSessions(updated);
    localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(updated));
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
    const oldReport = jimpitReportsRef.current.find((r) => r.id === report.id);
    const targetTrxId = report.transactionId || `trx-${report.id}`;
    const cleanEntries = Array.isArray(report.entries)
      ? report.entries.map((e) => ({
          ...e,
          nominal: Math.max(0, Number(e.nominal) || 0)
        }))
      : [];
    const computedTotal =
      cleanEntries.length > 0
        ? cleanEntries.reduce((sum, e) => sum + e.nominal, 0)
        : Math.max(0, Number(report.totalNominal) || 0);

    const cleanReport = sanitizeForFirestore({
      ...report,
      entries: cleanEntries,
      totalNominal: computedTotal,
      transactionId: targetTrxId
    });

    if (oldReport) {
      const normalizeHouse = (h: string) => h.replace(/\s+/g, '').toUpperCase();
      const oldMap: Record<string, number> = {};
      const newMap: Record<string, number> = {};
      (oldReport.entries || []).forEach((e) => {
        const key = normalizeHouse(e.houseNumber);
        oldMap[key] = (oldMap[key] || 0) + (Number(e.nominal) || 0);
      });
      cleanEntries.forEach((e) => {
        const key = normalizeHouse(e.houseNumber);
        newMap[key] = (newMap[key] || 0) + (Number(e.nominal) || 0);
      });

      const modifiedResidents: Resident[] = [];
      const updatedResList = residentsRef.current.map((res) => {
        const key = normalizeHouse(res.houseNumber);
        const delta = (newMap[key] || 0) - (oldMap[key] || 0);
        if (delta !== 0) {
          const updatedRes = {
            ...res,
            jimpitanPaidMonth: Math.max(0, (res.jimpitanPaidMonth || 0) + delta)
          };
          modifiedResidents.push(updatedRes);
          return updatedRes;
        }
        return res;
      });
      if (modifiedResidents.length > 0) {
        residentsRef.current = updatedResList;
        setResidents(updatedResList);
        localStorage.setItem('grisspo_residents', JSON.stringify(updatedResList));
        for (const modRes of modifiedResidents) {
          safeCloudWrite('warga', modRes.id, modRes).catch(() => {});
        }
      }
    }

    const next = jimpitReportsRef.current.map((r) => (r.id === cleanReport.id ? cleanReport : r));
    jimpitReportsRef.current = next;
    setJimpitReports(next);
    localStorage.setItem('grisspo_jimpit_reports', JSON.stringify(next));
    await safeCloudWrite('jimpitan_records', cleanReport.id, cleanReport);

    const isPelunasan = cleanReport.reportType === 'pelunasan' || cleanReport.id.startsWith('jimpit-pay-');
    const updatedDescription = isPelunasan
      ? cleanReport.notes || `Pelunasan Kekurangan Jimpitan (${cleanReport.date})`
      : `Pemasukan Jimpitan Ronda Online (${cleanReport.day}, ${cleanReport.date}) oleh ${cleanReport.collectedBy}`;

    const linked = transactionsRef.current.find(
      (t) => t.id === cleanReport.transactionId || t.id === `trx-${cleanReport.id}`
    );
    if (linked) {
      await updateTransaction({
        ...linked,
        category: 'Pemasukan Jimpitan Bulanan',
        amount: cleanReport.totalNominal,
        date: cleanReport.date,
        recordedBy: cleanReport.collectedBy,
        description: updatedDescription
      });
    } else {
      const effectiveTimestamp = new Date(`${cleanReport.date}T21:00:00+07:00`).getTime();
      const hash = await computeTransactionHash(
        'pemasukan',
        'Pemasukan Jimpitan Bulanan',
        cleanReport.totalNominal,
        cleanReport.date,
        cleanReport.collectedBy,
        effectiveTimestamp
      );
      const isPelunasan = cleanReport.reportType === 'pelunasan' || cleanReport.id.startsWith('jimpit-pay-');
      const newJimpitTrx: Transaction = {
        id: targetTrxId,
        type: 'pemasukan',
        category: 'Pemasukan Jimpitan Bulanan',
        amount: cleanReport.totalNominal,
        date: cleanReport.date,
        description: isPelunasan
          ? cleanReport.notes || `Pelunasan Kekurangan Jimpitan (${cleanReport.date})`
          : `Pemasukan Jimpitan Ronda Online (${cleanReport.day}, ${cleanReport.date}) oleh ${cleanReport.collectedBy}`,
        recordedBy: cleanReport.collectedBy,
        userRole: 'warga',
        encryptedHash: hash,
        isAnomaly: false,
        timestamp: Number.isFinite(effectiveTimestamp) ? effectiveTimestamp : Date.now()
      };
      const nextTrx = [newJimpitTrx, ...transactionsRef.current];
      transactionsRef.current = nextTrx;
      setTransactions(nextTrx);
      localStorage.setItem('grisspo_transactions', JSON.stringify(nextTrx));
      await safeCloudWrite('keuangan_transaksi', newJimpitTrx.id, newJimpitTrx);
    }
  };

  // Edit / Update Absensi Session (Superadmin, Pengurus/Admin, and Duty Officers for Ronda)
  const updateAttendanceSession = async (session: AttendanceSession) => {
    const isAdminRole = Boolean(
      currentUser && ['superadmin', 'sekretaris', 'bendahara1', 'bendahara2', 'admin_inventaris'].includes(currentUser.role)
    );
    const isDutyToday = (() => {
      if (!currentUser || session.type !== 'ronda') return false;
      const targetDay = session.day || 'Senin';
      const group = rondaSchedule.find((g) => g.day === targetDay);
      if (!group) return false;
      const currentHouseClean = (currentUser.houseNumber || '').replace(/\s+/g, '').toUpperCase();
      const currentNameClean = normalizeCleanName(currentUser.name || '');
      return group.members.some((m) => {
        const mClean = normalizeCleanName(m);
        if (currentNameClean && (mClean.includes(currentNameClean) || currentNameClean.includes(mClean))) return true;
        const r = findResidentByMemberName(m, residentsRef.current);
        return Boolean(r && r.houseNumber.replace(/\s+/g, '').toUpperCase() === currentHouseClean);
      });
    })();

    if (!isAdminRole && !isDutyToday) {
      alert('Akses Ditolak: Hanya Petugas Ronda Hari Ini, Pengurus/Admin, dan Superadmin yang memiliki hak mengedit data absensi!');
      return;
    }

    const existingSession = attendanceSessionsRef.current.find((s) => s.id === session.id);
    const cleanSession = sanitizeForFirestore(session);

    // Adjust GRISS-POIN when attendance presence toggles on an existing awarded session
    if (existingSession && existingSession.pointsAwarded) {
      const pts = cleanSession.type === 'kerjabakti' ? 40 : 25;
      const updatedResidentsList = [...residentsRef.current];
      const modifiedResidents: Resident[] = [];
      let resChanged = false;
      const deltaLogs: PointLog[] = [];

      cleanSession.attendees.forEach((newAtt) => {
        const oldAtt = existingSession.attendees.find(
          (a) =>
            (a.residentId && a.residentId === newAtt.residentId) ||
            normalizeCleanName(a.residentName) === normalizeCleanName(newAtt.residentName)
        );
        const wasPresent = oldAtt ? oldAtt.isPresent : false;
        const isNowPresent = newAtt.isPresent;

        if (wasPresent !== isNowPresent) {
          const targetRes =
            updatedResidentsList.find(
              (r) =>
                r.id === newAtt.residentId ||
                r.houseNumber.trim().toLowerCase() === newAtt.residentHouse.trim().toLowerCase()
            ) || findResidentByMemberName(newAtt.residentName, updatedResidentsList);

          if (targetRes) {
            const delta = isNowPresent ? pts : -pts;
            const nextPoints = Math.max(0, (targetRes.points || 0) + delta);
            const updatedRes = { ...targetRes, points: nextPoints };
            const idx = updatedResidentsList.findIndex((r) => r.id === targetRes.id);
            if (idx !== -1) updatedResidentsList[idx] = updatedRes;
            modifiedResidents.push(updatedRes);
            resChanged = true;

            if (currentUser && (currentUser.id === targetRes.id || currentUser.houseNumber === targetRes.houseNumber)) {
              setCurrentUser((prev) => (prev ? { ...prev, points: nextPoints } : null));
            }

            const log: PointLog = {
              id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              userId: targetRes.id,
              houseNumber: targetRes.houseNumber,
              userName: targetRes.name,
              pointsChange: delta,
              reason: `Pembaruan Absensi ${cleanSession.type === 'ronda' ? 'Ronda' : cleanSession.type} (${cleanSession.date})`,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
            };
            deltaLogs.push(log);
          }
        }
      });

      if (resChanged) {
        residentsRef.current = updatedResidentsList;
        setResidents(updatedResidentsList);
        localStorage.setItem('grisspo_residents', JSON.stringify(updatedResidentsList));
        for (const modRes of modifiedResidents) {
          safeCloudWrite('warga', modRes.id, modRes).catch(() => {});
        }
      }
      if (deltaLogs.length > 0) {
        setPointLogs((prev) => [...deltaLogs, ...prev]);
        for (const log of deltaLogs) {
          safeCloudWrite('point_logs', log.id, log).catch(() => {});
        }
      }
    }

    const next = attendanceSessionsRef.current.map((s) => (s.id === cleanSession.id ? cleanSession : s));
    attendanceSessionsRef.current = next;
    setAttendanceSessions(next);
    localStorage.setItem('grisspo_attendance_sessions', JSON.stringify(next));
    await safeCloudWrite('absensi_records', cleanSession.id, cleanSession);
  };

  // Superadmin Edit Fasum Booking (synced with Keuangan Kas)
  const updateFasumBooking = async (booking: FasumBooking) => {
    if (currentUser?.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin yang memiliki hak akses mengedit pemesanan fasum!');
      return;
    }
    const prevBooking = fasumBookingsRef.current.find((b) => b.id === booking.id);
    let syncedBooking: FasumBooking = { ...booking };

    if (booking.paymentStatus === 'lunas') {
      const fee = Number(booking.rentalFee) || 0;
      const actorName = currentUser ? currentUser.name : 'Superadmin Paguyuban';
      const existingTrx = booking.transactionId
        ? transactionsRef.current.find((t) => t.id === booking.transactionId)
        : undefined;

      if (existingTrx) {
        await updateTransaction({
          ...existingTrx,
          type: 'pemasukan',
          category: existingTrx.category || 'Sewa Fasum (Rp 30.000/bln)',
          amount: fee,
          date: booking.date,
          sourceHouse: booking.residentHouse,
          description: `Sewa Fasum: ${booking.facilityName} - ${booking.residentName} (${booking.residentHouse}) - Acara: ${booking.purpose}`
        });
      } else if (fee > 0) {
        const trx = await addTransaction({
          type: 'pemasukan',
          category: 'Sewa Fasum (Rp 30.000/bln)',
          amount: fee,
          date: booking.date,
          description: `Sewa Fasum: ${booking.facilityName} - ${booking.residentName} (${booking.residentHouse}) - Acara: ${booking.purpose}`,
          recordedBy: actorName,
          userRole: currentUser.role,
          sourceHouse: booking.residentHouse
        });
        syncedBooking = {
          ...syncedBooking,
          transactionId: trx.id,
          paymentDate:
            syncedBooking.paymentDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
          approvedBy: syncedBooking.approvedBy || actorName
        };
      }
    } else if (prevBooking?.paymentStatus === 'lunas' && prevBooking.transactionId) {
      await deleteTransaction(prevBooking.transactionId);
      syncedBooking = {
        ...syncedBooking,
        transactionId: undefined
      };
    }

    const next = fasumBookingsRef.current.map((b) => (b.id === syncedBooking.id ? syncedBooking : b));
    fasumBookingsRef.current = next;
    setFasumBookings(next);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(next));
    await safeCloudWrite('fasum_bookings', syncedBooking.id, sanitizeForFirestore(syncedBooking));
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

        transactions: reconciledTransactions,
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
        lastSyncedAt,
        triggerManualSync,
        activeView,
        setActiveView,
        deletedIds,

        confirmAction
      }}
    >
      {children}
      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title || 'Konfirmasi Tindakan'}
        message={confirmDialog?.message || ''}
        confirmLabel={confirmDialog?.confirmLabel || 'Setuju'}
        cancelLabel={confirmDialog?.cancelLabel || 'Batal'}
        variant={confirmDialog?.variant || 'warning'}
        onConfirm={async () => {
          if (confirmDialog?.onConfirm) {
            await confirmDialog.onConfirm();
          }
          setConfirmDialog(null);
        }}
        onCancel={() => {
          if (confirmDialog?.onCancel) {
            confirmDialog.onCancel();
          }
          setConfirmDialog(null);
        }}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
