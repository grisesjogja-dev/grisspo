import React, { createContext, useContext, useState, useEffect } from 'react';
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
  FasumBooking
} from '../types';
import {
  initialResidents,
  initialInventory,
  initialRondaSchedule,
  initialTransactions,
  initialForumPosts,
  initialRewards,
  initialAnnouncements,
  initialFasumBookings
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
  getDocs
} from 'firebase/firestore';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  loginWithHouseNumber: (houseInput: string, passInput: string) => { success: boolean; message: string };
  switchRoleWithPassword: (houseNumber: string, passwordInput: string) => { success: boolean; message: string };
  logout: () => void;

  // Residents
  residents: Resident[];
  updateResident: (resident: Resident) => Promise<void>;
  deleteResident: (id: string) => Promise<void>;
  addResident: (resident: Omit<Resident, 'id' | 'no'>) => Promise<void>;

  // Ronda & Jimpitan
  rondaSchedule: RondaGroup[];
  jimpitReports: JimpitDailyReport[];
  submitDailyJimpit: (report: Omit<JimpitDailyReport, 'id' | 'createdAt'>) => Promise<void>;
  deleteJimpitReport: (id: string) => Promise<void>;
  removeRondaMember: (day: DayOfWeek, memberName: string) => Promise<void>;
  addRondaMember: (day: DayOfWeek, memberName: string) => Promise<void>;

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
  addForumComment: (postId: string, content: string) => Promise<void>;
  deleteForumComment: (postId: string, commentId: string) => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;
  deleteForumPost: (postId: string) => Promise<void>;
  togglePinPost: (postId: string) => Promise<void>;

  // Loyalty Points
  rewards: LoyaltyReward[];
  pointLogs: PointLog[];
  redeemReward: (rewardId: string) => { success: boolean; message: string };
  awardPoints: (userId: string, points: number, reason: string) => void;

  // Announcements & Email Alerts
  announcements: Announcement[];
  addAnnouncement: (title: string, message: string, category: Announcement['category'], isImportant?: boolean) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  emailAlerts: EmailAlertLog[];

  // Fasum Booking & Automatic Payment
  fasumBookings: FasumBooking[];
  addFasumBooking: (booking: Omit<FasumBooking, 'id' | 'createdAt' | 'e2eHash'>) => Promise<FasumBooking>;
  confirmFasumPayment: (bookingId: string, approvedBy?: string) => Promise<void>;
  updateFasumBookingStatus: (bookingId: string, status: FasumBooking['status'], notes?: string) => Promise<void>;
  deleteFasumBooking: (bookingId: string) => Promise<void>;

  // Pengurus Modal
  isPengurusOpen: boolean;
  setIsPengurusOpen: (open: boolean) => void;

  // Sync state
  isCloudSynced: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default logged in user: Beni, B 24 (Superadmin)
const defaultUser: User = {
  id: 'w-b24',
  username: 'GrissB24',
  name: 'BENI',
  houseNumber: 'B 24',
  role: 'superadmin',
  points: 450,
  phone: '0812-3456-7840'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isPengurusOpen, setIsPengurusOpen] = useState<boolean>(false);

  // User state
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('grisspo_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.houseNumber === 'B 24' || parsed.username === 'GrissB24') {
          return { ...parsed, role: 'superadmin', name: 'BENI' };
        }
        return parsed;
      } catch {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  // Residents
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('grisspo_residents');
    if (saved) {
      try {
        const list: Resident[] = JSON.parse(saved);
        return list.map((r) => {
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
        return initialResidents;
      }
    }
    return initialResidents;
  });

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('grisspo_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  // Ronda Schedule
  const [rondaSchedule] = useState<RondaGroup[]>(initialRondaSchedule);

  // Jimpitan Reports
  const [jimpitReports, setJimpitReports] = useState<JimpitDailyReport[]>(() => {
    const saved = localStorage.getItem('grisspo_jimpit_reports');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'jimpit-demo-01',
        date: new Date().toISOString().slice(0, 10),
        day: 'Sabtu',
        collectedBy: 'WALUYO & HENGKI',
        entries: [
          { houseNumber: 'A 01', residentName: 'DESTI', nominal: 1000, paymentMethod: 'cash', timestamp: '20:15 WIB', collectedBy: 'WALUYO' },
          { houseNumber: 'A 03', residentName: 'DANANG', nominal: 1500, paymentMethod: 'cash', timestamp: '20:18 WIB', collectedBy: 'WALUYO' },
          { houseNumber: 'A 04', residentName: 'NANDO', nominal: 1000, paymentMethod: 'cash', timestamp: '20:20 WIB', collectedBy: 'WALUYO' },
          { houseNumber: 'B 02', residentName: 'AHMAD 2', nominal: 2000, paymentMethod: 'transfer', timestamp: '20:40 WIB', collectedBy: 'WALUYO' },
          { houseNumber: 'B 24', residentName: 'BENI', nominal: 2000, paymentMethod: 'cash', timestamp: '20:55 WIB', collectedBy: 'WALUYO' },
          { houseNumber: 'C 15', residentName: 'ROBY C', nominal: 1500, paymentMethod: 'cash', timestamp: '21:05 WIB', collectedBy: 'WALUYO' }
        ],
        totalNominal: 9000,
        notes: 'Portal dikunci tepat pukul 21.00 WIB. Pendopo disapu dan dipel bersih.',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('grisspo_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // Forum Posts
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem('grisspo_forum_posts');
    return saved ? JSON.parse(saved) : initialForumPosts;
  });

  // Rewards
  const [rewards, setRewards] = useState<LoyaltyReward[]>(() => {
    const saved = localStorage.getItem('grisspo_rewards');
    return saved ? JSON.parse(saved) : initialRewards;
  });

  // Point Logs
  const [pointLogs, setPointLogs] = useState<PointLog[]>(() => {
    const saved = localStorage.getItem('grisspo_point_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'pl-1',
        userId: 'w-b24',
        houseNumber: 'B 24',
        userName: 'BENI',
        pointsChange: 50,
        reason: 'Kehadiran Ronda Malam & Pengawasan Portal',
        timestamp: '2026-10-30 21:00'
      },
      {
        id: 'pl-2',
        userId: 'w-b02',
        houseNumber: 'B 02',
        userName: 'AHMAD 2',
        pointsChange: 35,
        reason: 'Verifikasi Kas & Rekap Iuran Paguyuban',
        timestamp: '2026-10-29 19:30'
      }
    ];
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('grisspo_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  // Fasum Bookings
  const [fasumBookings, setFasumBookings] = useState<FasumBooking[]>(() => {
    const saved = localStorage.getItem('grisspo_fasum_bookings');
    return saved ? JSON.parse(saved) : initialFasumBookings;
  });

  const [emailAlerts, setEmailAlerts] = useState<EmailAlertLog[]>([]);

  // Real-Time Firebase Firestore Integration
  useEffect(() => {
    let unsubWarga: (() => void) | undefined;
    let unsubTransactions: (() => void) | undefined;
    let unsubJimpitan: (() => void) | undefined;
    let unsubInventory: (() => void) | undefined;
    let unsubForum: (() => void) | undefined;
    let unsubPengumuman: (() => void) | undefined;
    let unsubFasum: (() => void) | undefined;

    try {
      // 1. Warga listener
      unsubWarga = onSnapshot(collection(db, 'warga'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudData: Resident[] = [];
          snapshot.forEach((d) => {
            cloudData.push(d.data() as Resident);
          });
          cloudData.sort((a, b) => (a.no || 0) - (b.no || 0));
          setResidents(cloudData);
          localStorage.setItem('grisspo_residents', JSON.stringify(cloudData));
          setIsCloudSynced(true);
        } else {
          // If Firestore collection is empty, seed initial residents to Cloud!
          initialResidents.forEach((res) => {
            setDoc(doc(db, 'warga', res.id), res).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore warga listener error:', err.message);
      });

      // 2. Transactions listener
      unsubTransactions = onSnapshot(collection(db, 'keuangan_transaksi'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudTrx: Transaction[] = [];
          snapshot.forEach((d) => {
            cloudTrx.push(d.data() as Transaction);
          });
          cloudTrx.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setTransactions(cloudTrx);
          localStorage.setItem('grisspo_transactions', JSON.stringify(cloudTrx));
        } else {
          initialTransactions.forEach((trx) => {
            setDoc(doc(db, 'keuangan_transaksi', trx.id), trx).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore transaksi listener error:', err.message);
      });

      // 3. Jimpitan listener
      unsubJimpitan = onSnapshot(collection(db, 'jimpitan_records'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudJimpit: JimpitDailyReport[] = [];
          snapshot.forEach((d) => {
            cloudJimpit.push(d.data() as JimpitDailyReport);
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
            cloudInv.push(d.data() as InventoryItem);
          });
          cloudInv.sort((a, b) => (a.no || 0) - (b.no || 0));
          setInventory(cloudInv);
          localStorage.setItem('grisspo_inventory', JSON.stringify(cloudInv));
        } else {
          initialInventory.forEach((inv) => {
            setDoc(doc(db, 'inventaris', inv.id), inv).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore inventaris listener error:', err.message);
      });

      // 5. Forum posts listener
      unsubForum = onSnapshot(collection(db, 'forum_posts'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudForum: ForumPost[] = [];
          snapshot.forEach((d) => {
            cloudForum.push(d.data() as ForumPost);
          });
          setForumPosts(cloudForum);
          localStorage.setItem('grisspo_forum_posts', JSON.stringify(cloudForum));
        } else {
          initialForumPosts.forEach((p) => {
            setDoc(doc(db, 'forum_posts', p.id), p).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore forum listener error:', err.message);
      });

      // 6. Pengumuman listener
      unsubPengumuman = onSnapshot(collection(db, 'pengumuman'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudAnn: Announcement[] = [];
          snapshot.forEach((d) => {
            cloudAnn.push(d.data() as Announcement);
          });
          setAnnouncements(cloudAnn);
          localStorage.setItem('grisspo_announcements', JSON.stringify(cloudAnn));
        } else {
          initialAnnouncements.forEach((ann) => {
            setDoc(doc(db, 'pengumuman', ann.id), ann).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore pengumuman listener error:', err.message);
      });

      // 7. Fasum bookings listener
      unsubFasum = onSnapshot(collection(db, 'fasum_bookings'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudFasum: FasumBooking[] = [];
          snapshot.forEach((d) => {
            cloudFasum.push(d.data() as FasumBooking);
          });
          cloudFasum.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setFasumBookings(cloudFasum);
          localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(cloudFasum));
        } else {
          initialFasumBookings.forEach((b) => {
            setDoc(doc(db, 'fasum_bookings', b.id), b).catch(() => {});
          });
        }
      }, (err) => {
        console.warn('Firestore fasum listener error:', err.message);
      });
    } catch (e) {
      console.warn('Firebase Firestore initialization notice:', e);
    }

    return () => {
      unsubWarga?.();
      unsubTransactions?.();
      unsubJimpitan?.();
      unsubInventory?.();
      unsubForum?.();
      unsubPengumuman?.();
      unsubFasum?.();
    };
  }, []);

  // Save to localStorage as well
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

  // Calculations for Financial summary
  const totalIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((acc, t) => acc + t.amount, 0);

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

    setCurrentUser(loggedUser);
    return {
      success: true,
      message: `Login berhasil! Selamat datang Bpk/Ibu ${resident.name} (${resident.houseNumber}) - Role: ${resident.role.toUpperCase()}`
    };
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

    setCurrentUser(newUser);
    return {
      success: true,
      message: `Otorisasi berhasil! Anda kini beralih sebagai ${resident.name} (${resident.role.toUpperCase()}).`
    };
  };

  const logout = () => {
    const guestResident = residents.find((r) => r.houseNumber === 'A 03') || initialResidents[2];
    setCurrentUser({
      id: guestResident.id,
      username: 'GrissA03',
      name: guestResident.name,
      houseNumber: guestResident.houseNumber,
      role: 'warga',
      points: guestResident.points,
      phone: guestResident.phone
    });
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

  const deleteResident = async (id: string) => {
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak akses menghapus data warga!');
      return;
    }
    setResidents((prev) => prev.filter((r) => r.id !== id));
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
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak akses menghapus data inventaris!');
      return;
    }
    setInventory((prev) => prev.filter((i) => i.id !== id));
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
      userRole: currentUser.role,
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
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus laporan jimpitan!');
      return;
    }

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
    if (currentUser.role !== 'superadmin') {
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
    if (currentUser.role !== 'superadmin') {
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

    const newTrx: Transaction = {
      ...trxData,
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
      const pts = trxData.category.includes('Sumbangan') ? 25 : 15;
      awardPoints(currentUser.id, pts, `Pembayaran ${trxData.category}`);
    }

    return newTrx;
  };

  const deleteTransaction = async (id: string) => {
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak akses menghapus transaksi keuangan!');
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteDoc(doc(db, 'keuangan_transaksi', id));
    } catch (err) {
      console.warn('Firestore delete transaction notice:', err);
    }
  };

  const updateTransaction = async (trx: Transaction) => {
    const updatedHash = await computeTransactionHash(
      trx.type,
      trx.category,
      trx.amount,
      trx.date,
      trx.recordedBy,
      trx.timestamp
    );
    const updated = { ...trx, encryptedHash: updatedHash };
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
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak moderasi menghapus topik diskusi!');
      return;
    }
    setForumPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
    } catch (err) {
      console.warn('Firestore delete forum notice:', err);
    }
  };

  const deleteForumComment = async (postId: string, commentId: string) => {
    if (currentUser.role !== 'superadmin') {
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
        if (r.id === userId || r.houseNumber === currentUser.houseNumber) {
          const updated = { ...r, points: (r.points || 0) + points };
          setDoc(doc(db, 'warga', r.id), updated).catch(() => {});
          return updated;
        }
        return r;
      })
    );

    if (currentUser.id === userId || currentUser.houseNumber) {
      setCurrentUser((prev) => ({ ...prev, points: (prev.points || 0) + points }));
    }

    const log: PointLog = {
      id: `pl-${Date.now()}`,
      userId,
      houseNumber: currentUser.houseNumber,
      userName: currentUser.name,
      pointsChange: points,
      reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setPointLogs((prev) => [log, ...prev]);
  };

  const redeemReward = (rewardId: string): { success: boolean; message: string } => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return { success: false, message: 'Hadiah tidak ditemukan' };
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
    setCurrentUser((prev) => ({ ...prev, points: remaining }));
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
    if (currentUser.role !== 'superadmin') {
      alert('Akses Ditolak: Hanya Superadmin (Bpk. Beni B 24) yang memiliki hak menghapus pengumuman!');
      return;
    }
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
    const hash = await computeTransactionHash(
      'pemasukan',
      'Sewa Fasum (Rp 30.000/bln)',
      bookingData.rentalFee,
      bookingData.date,
      currentUser.name,
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
      newBooking.approvedBy = currentUser.name;
      newBooking.approvedAt = nowStr;

      // Automatically post income to Paguyuban Book of Accounts
      const trx = await addTransaction({
        type: 'pemasukan',
        category: 'Sewa Fasum (Rp 30.000/bln)',
        amount: newBooking.rentalFee,
        date: newBooking.date,
        description: `Sewa Fasum: ${newBooking.facilityName} - ${newBooking.residentName} (${newBooking.residentHouse}) - Acara: ${newBooking.purpose}`,
        recordedBy: currentUser.name,
        userRole: currentUser.role,
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
    const verifier = approvedBy || currentUser.name;

    // Automatically record income in Keuangan Kas!
    const trx = await addTransaction({
      type: 'pemasukan',
      category: 'Sewa Fasum (Rp 30.000/bln)',
      amount: booking.rentalFee,
      date: booking.date,
      description: `Sewa Fasum: ${booking.facilityName} - ${booking.residentName} (${booking.residentHouse}) - Acara: ${booking.purpose}`,
      recordedBy: verifier,
      userRole: currentUser.role,
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
    if (currentUser.role !== 'superadmin') {
      alert('Hanya Superadmin (Bpk. Beni B24) yang memiliki hak menghapus data pemesanan fasum.');
      return;
    }
    const filtered = fasumBookings.filter((b) => b.id !== bookingId);
    setFasumBookings(filtered);
    localStorage.setItem('grisspo_fasum_bookings', JSON.stringify(filtered));
    try {
      await deleteDoc(doc(db, 'fasum_bookings', bookingId));
    } catch (err) {
      console.warn('Firestore delete fasum error:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loginWithHouseNumber,
        switchRoleWithPassword,
        logout,

        residents,
        updateResident,
        deleteResident,
        addResident,

        rondaSchedule,
        jimpitReports,
        submitDailyJimpit,
        deleteJimpitReport,
        removeRondaMember,
        addRondaMember,

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
        addForumComment,
        deleteForumComment,
        togglePostLike,
        deleteForumPost,
        togglePinPost,

        rewards,
        pointLogs,
        redeemReward,
        awardPoints,

        announcements,
        addAnnouncement,
        deleteAnnouncement,
        emailAlerts,

        fasumBookings,
        addFasumBooking,
        confirmFasumPayment,
        updateFasumBookingStatus,
        deleteFasumBooking,

        isPengurusOpen,
        setIsPengurusOpen,

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
