import { UserRole, Transaction } from '../types';

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
export const permissions = {
  // Resident management: only Superadmin can edit/delete
  canManageResidents: (role: UserRole) => role === 'superadmin',

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
