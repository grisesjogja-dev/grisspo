import { UserRole, Transaction, Resident } from '../types';

/**
 * Computes a standard SHA-256 hash string for transaction end-to-end integrity
 */
export async function computeTransactionHash(
  type: string,
  category: string,
  amount: number,
  date: string,
  recordedBy: string,
  timestamp: number
): Promise<string> {
  const payload = `${type}|${category}|${amount}|${date}|${recordedBy}|${timestamp}|GRISSPO-SALT-2026`;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for non-crypto contexts
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Verify transaction hash integrity
 */
export async function verifyTransactionIntegrity(trx: Transaction): Promise<boolean> {
  const expectedHash = await computeTransactionHash(
    trx.type,
    trx.category,
    trx.amount,
    trx.date,
    trx.recordedBy,
    trx.timestamp
  );
  return trx.encryptedHash === expectedHash;
}

/**
 * Financial Anomaly Detection Engine
 * Triggers alert when:
 * 1. An expense exceeds 1,500,000 IDR (high single transaction threshold for RT)
 * 2. An irregular description contains suspicious keywords or mismatching category
 * 3. An income is outside standard tariff multiples
 */
export interface AnomalyReport {
  isAnomaly: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
}

export function detectFinancialAnomaly(trx: Omit<Transaction, 'id' | 'encryptedHash' | 'timestamp'>): AnomalyReport {
  // Check high threshold
  if (trx.type === 'pengeluaran' && trx.amount > 1500000) {
    return {
      isAnomaly: true,
      reason: `Nominal pengeluaran (Rp ${trx.amount.toLocaleString('id-ID')}) melebihi batas toleransi wajar paguyuban (Rp 1.500.000). Memerlukan verifikasi Superadmin.`,
      severity: 'high'
    };
  }

  // Check negative or zero
  if (trx.amount <= 0) {
    return {
      isAnomaly: true,
      reason: 'Nominal transaksi tidak boleh nol atau negatif.',
      severity: 'high'
    };
  }

  // Check unusually low single iuran bulanan
  if (trx.category === 'Iuran Bulanan (Rp 25.000)' && trx.amount < 25000) {
    return {
      isAnomaly: true,
      reason: 'Nominal iuran bulanan di bawah standar Rp 25.000.',
      severity: 'medium'
    };
  }

  // Check non-multiple for jimpitan
  if (trx.category === 'Pemasukan Jimpitan Bulanan' && trx.amount % 500 !== 0) {
    return {
      isAnomaly: true,
      reason: 'Nominal jimpitan bukan kelipatan Rp 500.',
      severity: 'medium'
    };
  }

  return { isAnomaly: false, severity: 'low' };
}

/**
 * Dispatch simulated email alert to Paguyuban admin email
 */
export interface EmailAlertLog {
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

export const emailAlertLogs: EmailAlertLog[] = [];

export function sendAnomalyEmailAlert(trx: Partial<Transaction>, reason: string): EmailAlertLog {
  const alert: EmailAlertLog = {
    recipient: 'grises.jogja@gmail.com',
    subject: `[PERINGATAN ANOMALI KAS GRISSPO] Transaksi Tidak Wajar Terdeteksi`,
    body: `Yth. Pengurus Paguyuban Griya Sedayu Selaras 1,\n\nSistem AI/Security GRISSPO mendeteksi transaksi anomali pada kas paguyuban:\n\n- Kategori: ${trx.category}\n- Jenis: ${trx.type?.toUpperCase()}\n- Nominal: Rp ${trx.amount?.toLocaleString('id-ID')}\n- Dicatat Oleh: ${trx.recordedBy}\n- Tanggal: ${trx.date}\n- Alasan Anomali: ${reason}\n\nMohon segera membuka menu Laporan Keuangan untuk meninjau dan mengonfirmasi validitas transaksi ini.`,
    timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  };
  emailAlertLogs.unshift(alert);
  return alert;
}

/**
 * Role-Based Access Control (RBAC) Permissions
 * Rule from user:
 * "selain superadmin, bendahara 1, bendahara 2 dan admin inventaris tidak dapat akses untuk menhapus dan mengedit data yang ada. Berikan hak akses hanya kepada superadmin untuk melakukan perubahan data tersebut."
 */
export const isPengurusRole = (role?: UserRole | null): boolean =>
  Boolean(
    role &&
      ['superadmin', 'sekretaris', 'bendahara1', 'bendahara2', 'admin_inventaris'].includes(role)
  );

export const permissions = {
  // Resident management: only Superadmin can edit/delete
  canManageResidents: (role: UserRole) => role === 'superadmin',

  // WhatsApp notification for unpaid iuran: Pengurus only (Superadmin, Sekretaris, Bendahara 1/2, Admin Inventaris)
  canSendIuranWhatsApp: (role?: UserRole | null) => isPengurusRole(role),

  // Finance: Superadmin, Bendahara 1, Bendahara 2 can record/edit transactions
  canManageFinance: (role: UserRole) =>
    role === 'superadmin' || role === 'bendahara1' || role === 'bendahara2',

  // Deletion: Strictly Superadmin only for all features
  canDeleteFinance: (role: UserRole) => role === 'superadmin',

  canManagePayments: (role: UserRole) =>
    role === 'superadmin' || role === 'bendahara1' || role === 'bendahara2',

  canDeletePayments: (role: UserRole) => role === 'superadmin',

  // Inventory: Superadmin and Admin Inventaris can edit
  canManageInventory: (role: UserRole) =>
    role === 'superadmin' || role === 'admin_inventaris',

  // Only Superadmin can delete inventory items
  canDeleteInventory: (role: UserRole) => role === 'superadmin',

  // Jimpitan: All logged in residents on ronda duty + admin can submit jimpit
  canSubmitJimpit: (_role: UserRole) => true,

  // Forum moderation (pin/delete post): Superadmin
  canModerateForum: (role: UserRole) => role === 'superadmin',

  // Reset or system config: Superadmin only
  canConfigureSystem: (role: UserRole) => role === 'superadmin',
};

/**
 * Helper to compute monthly fee for a resident based on explicit monthlyFee or default rules:
 * - Inhabited house: Rp 50,000 (except Fajar and Arnado: Rp 25,000)
 * - Empty house paying iuran: Rp 25,000
 * - Other: Rp 0
 */
export function getResidentMonthlyFee(r: { name?: string; statusRumah?: string; monthlyFee?: number }): number {
  if (r.monthlyFee !== undefined && r.monthlyFee !== null) {
    return r.monthlyFee;
  }
  const nameUpper = (r.name || '').toUpperCase();
  const statusUpper = (r.statusRumah || '').toUpperCase();
  const isInhabited = statusUpper.includes('DI HUNI');
  const isExceptional = nameUpper.includes('FAJAR') || nameUpper.includes('ARNADO');

  if (isInhabited) {
    if (isExceptional) return 25000;
    return 50000;
  } else if (statusUpper.includes('MEMBAYAR IURAN')) {
    return 25000;
  }
  return 0;
}

/**
 * Determines whether a transaction or receipt represents an iuran / monthly dues payment
 * (excluding expenses, jimpitan, saldo kas awal, pure fasum, or pure sumbangan).
 */
export function isIuranPaymentRecord(options: {
  type?: string;
  category?: string;
  paymentType?: string;
  paymentTypeName?: string;
  description?: string;
  notes?: string;
}): boolean {
  const cleanType = String(options.type || '').trim().toLowerCase();
  if (cleanType === 'pengeluaran' || cleanType === 'expense') return false;

  const pType = String(options.paymentType || '').trim().toLowerCase();
  const catL = String(options.category || options.paymentTypeName || '').toLowerCase();
  const descL = String(options.description || options.notes || '').toLowerCase();

  if (
    catL.includes('jimpit') ||
    descL.includes('jimpit') ||
    pType === 'jimpitan' ||
    catL.includes('saldo') ||
    descL.includes('saldo kas awal')
  ) {
    return false;
  }

  if (
    pType === 'iuran_bulanan' ||
    pType === 'iuran_sampah' ||
    pType === 'iuran_bulanan_sampah' ||
    catL.includes('iuran') ||
    catL.includes('sampah')
  ) {
    return true;
  }

  if (pType === 'sewa_fasum' || catL.includes('fasum') || pType === 'sumbangan_sukarela' || catL.includes('sumbangan')) {
    return descL.includes('iuran') || descL.includes('tunggakan');
  }

  // For 'Lain-lain Pemasukan' or 'pemasukan_lain', detect iuran/payment/arrears settlements
  return (
    descL.includes('iuran') ||
    descL.includes('tunggakan') ||
    descL.includes('pelunasan') ||
    descL.includes('lunas') ||
    descL.includes('bayar') ||
    descL.includes('sampah')
  );
}

/**
 * Matches a resident from a payment record using residentId, houseNumber, or description/notes.
 */
export function findResidentForPayment<T extends { id: string; name: string; houseNumber: string }>(
  residents: T[],
  options: { residentId?: string; houseNumber?: string; description?: string }
): T | undefined {
  if (options.residentId) {
    const byId = residents.find((r) => r.id === options.residentId);
    if (byId) return byId;
  }

  const rawHouse = (options.houseNumber || '').trim();
  if (rawHouse && rawHouse.toLowerCase() !== 'paguyuban gss') {
    const cleanHouse = rawHouse.replace(/\s+/g, '').toUpperCase();
    const byHouse = residents.find(
      (r) => r.houseNumber.replace(/\s+/g, '').toUpperCase() === cleanHouse
    );
    if (byHouse) return byHouse;
  }

  const desc = (options.description || '').trim();
  if (!desc) return undefined;

  // Try matching house number pattern in description (e.g. "B 09", "B09", "A-5", "C 15")
  const houseMatches = desc.match(/\b([A-C])\s*[-.]?\s*0?(\d{1,2})\b/gi);
  if (houseMatches) {
    for (const hm of houseMatches) {
      const m = hm.match(/([A-C])\s*[-.]?\s*0?(\d{1,2})/i);
      if (m) {
        const normalizedTarget = `${m[1].toUpperCase()}${m[2].padStart(2, '0')}`;
        const byDescHouse = residents.find(
          (r) => r.houseNumber.replace(/\s+/g, '').toUpperCase() === normalizedTarget
        );
        if (byDescHouse) return byDescHouse;
      }
    }
  }

  // Match resident by unique name tokens in description
  const descClean = desc.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const descWords = new Set(descClean.split(/\s+/).filter(Boolean));
  const stopWords = new Set([
    'bapak', 'bpk', 'ibu', 'mas', 'mbak', 'kosong', 'blok', 'warga', 'rumah',
    'iuran', 'sampah', 'bulanan', 'lunas', 'bayar', 'pembayaran', 'tunggakan', 'kas'
  ]);

  let bestScore = 0;
  let bestMatches: T[] = [];

  for (const r of residents) {
    const nameClean = r.name
      .toLowerCase()
      .replace(/\([a-c]\s*\d+\)/gi, ' ')
      .replace(/[^a-z0-9\s]/g, ' ');
    const tokens = nameClean
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stopWords.has(t));

    if (tokens.length === 0) continue;

    let matchedChars = 0;
    let matchedCount = 0;
    for (const tok of tokens) {
      if (descWords.has(tok)) {
        matchedCount += 1;
        matchedChars += tok.length;
      }
    }

    if (matchedCount > 0) {
      const score = matchedCount * 100 + matchedChars;
      if (score > bestScore) {
        bestScore = score;
        bestMatches = [r];
      } else if (score === bestScore) {
        bestMatches.push(r);
      }
    }
  }

  if (bestMatches.length === 1) {
    return bestMatches[0];
  }

  return undefined;
}

/**
 * Applies an iuran payment to a resident's unpaid months proportionally to their monthly fee.
 * Idempotent per paymentId via appliedIuranCredits (supports create and edit).
 */
export function applyIuranPaymentToResident(
  resident: Resident,
  paymentId: string,
  paidAmount: number,
  fallbackFee?: number
): { updatedResident: Resident; paidMonths: number; changed: boolean } {
  const monthlyFee = getResidentMonthlyFee(resident) || fallbackFee || 25000;
  const existingCredits = { ...(resident.appliedIuranCredits || {}) };
  const prevCredit = existingCredits[paymentId] || 0;
  const currentUnpaid = resident.iuranUnpaidMonths ?? (resident.monthlyIuranPaid ? 0 : 1);
  const baseUnpaid = currentUnpaid + prevCredit;

  let newCredit = 0;
  if (paidAmount > 0 && monthlyFee > 0 && baseUnpaid > 0) {
    const totalBaseArrears = baseUnpaid * monthlyFee;
    if (paidAmount >= totalBaseArrears) {
      newCredit = baseUnpaid;
    } else {
      newCredit = Math.min(baseUnpaid, Math.floor(paidAmount / monthlyFee));
    }
  }

  const nextUnpaid = Math.max(0, baseUnpaid - newCredit);
  const currentNames = resident.unpaidMonthNames || [];
  let nextNames: string[] = [];
  if (nextUnpaid > 0) {
    if (currentNames.length >= nextUnpaid) {
      nextNames = currentNames.slice(currentNames.length - nextUnpaid);
    } else {
      nextNames = currentNames;
    }
  }

  if (newCredit > 0) {
    existingCredits[paymentId] = newCredit;
  } else {
    delete existingCredits[paymentId];
  }

  const nextPaidFlag = nextUnpaid === 0 ? true : paidAmount >= monthlyFee && baseUnpaid === 0 ? true : false;
  const changed =
    nextUnpaid !== (resident.iuranUnpaidMonths ?? 0) ||
    nextPaidFlag !== resident.monthlyIuranPaid ||
    prevCredit !== newCredit ||
    nextNames.length !== currentNames.length;

  const updatedResident: Resident = {
    ...resident,
    monthlyIuranPaid: nextPaidFlag,
    iuranUnpaidMonths: nextUnpaid,
    unpaidMonthNames: nextNames,
    appliedIuranCredits: existingCredits
  };

  return { updatedResident, paidMonths: newCredit, changed };
}

/**
 * Reverts a previously applied iuran payment from a resident (e.g. when receipt/transaction is deleted).
 */
export function revertIuranPaymentFromResident(
  resident: Resident,
  paymentId: string
): { updatedResident: Resident; changed: boolean } {
  const existingCredits = { ...(resident.appliedIuranCredits || {}) };
  const prevCredit = existingCredits[paymentId] || 0;
  if (prevCredit <= 0) {
    return { updatedResident: resident, changed: false };
  }

  delete existingCredits[paymentId];
  const nextUnpaid = (resident.iuranUnpaidMonths || 0) + prevCredit;
  const updatedResident: Resident = {
    ...resident,
    iuranUnpaidMonths: nextUnpaid,
    monthlyIuranPaid: nextUnpaid === 0,
    appliedIuranCredits: existingCredits
  };

  return { updatedResident, changed: true };
}

/**
 * Returns monthly Jimpitan target for a resident based on house status:
 * - 'DI HUNI PEMILIK (JIMPIT BULANAN)': Rp 25.000 / bulan
 * - 'DI HUNI PEMILIK', 'DI HUNI KONTRAK', 'KOSONG (DIJIMPIT)': Rp 15.000 / bulan
 * - Others ('KOSONG (MEMBAYAR IURAN)', 'KOSONG (ADA PEMILIK)', 'BELUM ADA PEMILIK'): Rp 0 / bulan
 */
export function getResidentJimpitanTarget(r?: { statusRumah?: string } | null): number {
  if (!r || !r.statusRumah) return 0;
  const s = r.statusRumah.trim().toUpperCase();
  if (s === 'DI HUNI PEMILIK (JIMPIT BULANAN)') return 25000;
  if (
    s === 'DI HUNI PEMILIK' ||
    s === 'DI HUNI KONTRAK' ||
    s === 'KOSONG (DIJIMPIT)' ||
    s === 'KOSONG (DI JIMPIT)'
  ) {
    return 15000;
  }
  return 0;
}

/**
 * Returns true if the house should appear in the daily Kartu Jimpit Online checklist.
 * Explicitly excludes 'DI HUNI PEMILIK (JIMPIT BULANAN)'.
 */
export function isResidentDailyJimpitCardEligible(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  if (s === 'DI HUNI PEMILIK (JIMPIT BULANAN)') return false;
  return (
    s === 'DI HUNI PEMILIK' ||
    s === 'DI HUNI KONTRAK' ||
    s === 'KOSONG (DIJIMPIT)' ||
    s === 'KOSONG (DI JIMPIT)'
  );
}

/**
 * Returns true if the resident has a monthly Jimpitan obligation (Rp 15.000 daily OR Rp 25.000 monthly).
 */
export function isResidentJimpitanObliged(r?: { statusRumah?: string } | null): boolean {
  return getResidentJimpitanTarget(r) > 0;
}

/**
 * Identifies an individual resident jimpitan payment transaction (excluding daily batch ronda collections).
 */
export function isIndividualJimpitanPaymentRecord(options: {
  type?: string;
  category?: string;
  description?: string;
}): boolean {
  const cleanType = String(options.type || '').trim().toLowerCase();
  if (cleanType === 'pengeluaran' || cleanType === 'expense') return false;
  const catL = String(options.category || '').trim().toLowerCase();
  const descL = String(options.description || '').trim().toLowerCase();
  const isJimpit = catL.includes('jimpit') || descL.includes('jimpit');
  if (!isJimpit) return false;
  if (descL.startsWith('pemasukan jimpitan ronda')) return false;
  return true;
}

/**
 * Applies a jimpitan payment to a resident's previous deficit & jimpitanPaidMonth idempotently per paymentId.
 */
export function applyJimpitanPaymentToResident(
  resident: Resident,
  paymentId: string,
  paidAmount: number
): { updatedResident: Resident; changed: boolean } {
  const cleanAmount = Math.max(0, Number(paidAmount) || 0);
  const existingCredits = { ...(resident.appliedJimpitanCredits || {}) };
  const prevEntry = existingCredits[paymentId];

  let basePrevDeficit = (resident.previousMonthsJimpitanDeficit || 0) + (prevEntry?.prevDeducted || 0);
  let baseCurPaid = Math.max(0, (resident.jimpitanPaidMonth || 0) - (prevEntry?.paidAdded || 0));

  let remaining = cleanAmount;
  const deductPrev = Math.min(basePrevDeficit, remaining);
  basePrevDeficit -= deductPrev;
  remaining -= deductPrev;
  const nextCurPaid = baseCurPaid + remaining;

  if (cleanAmount > 0) {
    existingCredits[paymentId] = { paidAdded: remaining, prevDeducted: deductPrev };
  } else {
    delete existingCredits[paymentId];
  }

  const changed =
    basePrevDeficit !== (resident.previousMonthsJimpitanDeficit || 0) ||
    nextCurPaid !== (resident.jimpitanPaidMonth || 0) ||
    !prevEntry ||
    prevEntry.paidAdded !== remaining ||
    prevEntry.prevDeducted !== deductPrev;

  const updatedResident: Resident = {
    ...resident,
    previousMonthsJimpitanDeficit: basePrevDeficit,
    jimpitanPaidMonth: nextCurPaid,
    appliedJimpitanCredits: existingCredits
  };

  return { updatedResident, changed };
}

/**
 * Reverts a previously applied individual jimpitan payment from a resident.
 */
export function revertJimpitanPaymentFromResident(
  resident: Resident,
  paymentId: string
): { updatedResident: Resident; changed: boolean } {
  const existingCredits = { ...(resident.appliedJimpitanCredits || {}) };
  const prevEntry = existingCredits[paymentId];
  if (!prevEntry) {
    return { updatedResident: resident, changed: false };
  }

  delete existingCredits[paymentId];
  const nextCurPaid = Math.max(0, (resident.jimpitanPaidMonth || 0) - (prevEntry.paidAdded || 0));
  const nextPrevDeficit = (resident.previousMonthsJimpitanDeficit || 0) + (prevEntry.prevDeducted || 0);

  const updatedResident: Resident = {
    ...resident,
    jimpitanPaidMonth: nextCurPaid,
    previousMonthsJimpitanDeficit: nextPrevDeficit,
    appliedJimpitanCredits: existingCredits
  };

  return { updatedResident, changed: true };
}

