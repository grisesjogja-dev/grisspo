import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction, JimpitDailyReport, Resident } from '../types';

/**
 * Export Financial Transactions to clean PDF
 */
export function exportFinanceToPDF(
  transactions: Transaction[],
  periodTitle: string,
  totalIncome: number,
  totalExpense: number,
  currentBalance: number
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GRISSPO - LAPORAN KEUANGAN PAGUYUBAN', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Perumahan Griya Sedayu Selaras 1 - Bantul, D.I. Yogyakarta', pageWidth / 2, 18, { align: 'center' });
  doc.text(`Periode Laporan: ${periodTitle} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 23, { align: 'center' });

  // Summary Cards
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  let y = 36;

  // Box 1: Total Pemasukan
  doc.setFillColor(240, 253, 244);
  doc.rect(14, y, 56, 18, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.rect(14, y, 56, 18, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PEMASUKAN', 16, y + 6);
  doc.setFontSize(11);
  doc.text(`Rp ${totalIncome.toLocaleString('id-ID')}`, 16, y + 13);

  // Box 2: Total Pengeluaran
  doc.setFontSize(10);
  doc.setFillColor(254, 242, 242);
  doc.rect(77, y, 56, 18, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(77, y, 56, 18, 'D');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL PENGELUARAN', 79, y + 6);
  doc.setFontSize(11);
  doc.text(`Rp ${totalExpense.toLocaleString('id-ID')}`, 79, y + 13);

  // Box 3: Saldo Kas Saat Ini
  doc.setFontSize(10);
  doc.setFillColor(239, 246, 255);
  doc.rect(140, y, 56, 18, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(140, y, 56, 18, 'D');
  doc.setTextColor(30, 64, 175);
  doc.text('SALDO KAS BERSIH', 142, y + 6);
  doc.setFontSize(11);
  doc.text(`Rp ${currentBalance.toLocaleString('id-ID')}`, 142, y + 13);

  // Table Header
  y = 62;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('No', 16, y + 5.5);
  doc.text('Tanggal', 24, y + 5.5);
  doc.text('Kategori', 48, y + 5.5);
  doc.text('Keterangan', 92, y + 5.5);
  doc.text('Tipe', 145, y + 5.5);
  doc.text('Nominal (Rp)', 193, y + 5.5, { align: 'right' });

  y += 10;
  doc.setFont('helvetica', 'normal');

  transactions.forEach((trx, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), 16, y);
    doc.text(trx.date, 24, y);

    const categoryText = doc.splitTextToSize(trx.category, 40);
    doc.text(categoryText[0] || trx.category, 48, y);

    const descText = doc.splitTextToSize(trx.description, 50);
    doc.text(descText[0] || trx.description, 92, y);

    if (trx.type === 'pemasukan') {
      doc.setTextColor(22, 163, 74);
      doc.text('Masuk (+)', 145, y);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('Keluar (-)', 145, y);
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Rp ${trx.amount.toLocaleString('id-ID')}`, 193, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // Subtle line
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 3, pageWidth - 14, y + 3);

    y += 7;
  });

  // Footer Signatures
  if (y > 240) {
    doc.addPage();
    y = 20;
  } else {
    y += 12;
  }

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text('Mengetahui / Mengesahkan,', 14, y);
  doc.text('Ketua Paguyuban GSS 1', 14, y + 5);
  doc.text('Bendahara 1 / Bendahara 2', pageWidth - 60, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Bpk. BENI', 14, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text('(Ketua / Superadmin)', 14, y + 29);

  doc.setFont('helvetica', 'bold');
  doc.text('Bpk. CATUR / AHMAD 2', pageWidth - 60, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text('(Bendahara Kas)', pageWidth - 60, y + 29);

  doc.save(`Laporan_Keuangan_GRISSPO_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export Financial Transactions to Excel (.xlsx)
 */
export function exportFinanceToExcel(transactions: Transaction[], currentBalance: number) {
  const data: any[] = transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.date,
    Tipe: t.type === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
    Kategori: t.category,
    Keterangan: t.description,
    'Nominal (Rp)': t.amount,
    'Dicatat Oleh': t.recordedBy,
    'Status Audit': t.isAnomaly ? 'Anomali Perlu Verifikasi' : 'Terverifikasi SHA-256',
    'Hash Integritas': t.encryptedHash
  }));

  // Add Summary row
  data.push({
    No: 0,
    Tanggal: 'TOTAL KAS',
    Tipe: 'SALDO BERSIH',
    Kategori: 'AKUMULASI',
    Keterangan: 'Total Saldo Kas Paguyuban Griya Sedayu Selaras',
    'Nominal (Rp)': currentBalance,
    'Dicatat Oleh': 'Sistem GRISSPO',
    'Status Audit': 'LENGKAP',
    'Hash Integritas': '-'
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan GSS');

  // Generate and download
  XLSX.writeFile(workbook, `Laporan_Keuangan_GSS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Jimpitan Monthly Deficit & Report to Excel
 */
export function exportJimpitanReportToExcel(residents: Resident[], reports: JimpitDailyReport[]) {
  const targetMonthly = 15000;
  const data = residents.map((r, idx) => {
    const paid = r.jimpitanPaidMonth || 0;
    const deficit = Math.max(0, targetMonthly - paid);
    return {
      No: idx + 1,
      'No Rumah': r.houseNumber,
      'Nama Warga': r.name,
      Blok: r.block,
      'Status Rumah': r.statusRumah,
      'Target Bulanan (Rp)': targetMonthly,
      'Sudah Masuk (Rp)': paid,
      'Kekurangan (Rp)': deficit,
      'Status Jimpitan': deficit === 0 ? 'LUNAS (Rp 15.000)' : `KURANG Rp ${deficit.toLocaleString('id-ID')}`
    };
  });

  const wsResidents = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsResidents, 'Status Jimpitan Warga');

  // Sheet 2: Daily reports
  const dailyData: any[] = [];
  reports.forEach((rep) => {
    rep.entries.forEach((entry) => {
      dailyData.push({
        Tanggal: rep.date,
        Hari: rep.day,
        'No Rumah': entry.houseNumber,
        'Nama Warga': entry.residentName,
        'Nominal (Rp)': entry.nominal,
        Metode: entry.paymentMethod,
        'Petugas Pengambil': rep.collectedBy,
        'Waktu Input': entry.timestamp
      });
    });
  });

  if (dailyData.length > 0) {
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Riwayat Jimpitan Harian');
  }

  XLSX.writeFile(wb, `Laporan_Jimpitan_GSS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Single Daily Jimpitan Report to PDF
 */
export function exportDailyJimpitanToPDF(report: JimpitDailyReport) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(180, 83, 9); // Amber 700
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('GRISSPO - LAPORAN JIMPITAN RONDA HARIAN', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Paguyuban Warga Perumahan Griya Sedayu Selaras 1', pageWidth / 2, 17, { align: 'center' });
  doc.text(`Hari: ${report.day}, ${report.date} | Petugas: ${report.collectedBy}`, pageWidth / 2, 23, { align: 'center' });

  // Summary Metrics Box
  doc.setTextColor(30, 41, 59);
  const y = 35;

  doc.setFillColor(254, 243, 199); // Amber 100
  doc.rect(14, y, 88, 18, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.rect(14, y, 88, 18, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9);
  doc.text('TOTAL PEROLEHAN HARI INI', 18, y + 6);
  doc.setFontSize(13);
  doc.text(`Rp ${report.totalNominal.toLocaleString('id-ID')}`, 18, y + 14);

  doc.setFillColor(240, 253, 244); // Green 100
  doc.rect(108, y, 88, 18, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.rect(108, y, 88, 18, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(9);
  doc.text('WARGA MENJIMPIT', 112, y + 6);
  doc.setFontSize(13);
  doc.text(`${report.entries.length} Rumah (Kelipatan Rp 500)`, 112, y + 14);

  // Table of entries
  let tableY = 60;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, tableY, pageWidth - 28, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('No', 16, tableY + 5.5);
  doc.text('No Rumah', 26, tableY + 5.5);
  doc.text('Nama Warga', 50, tableY + 5.5);
  doc.text('Metode', 110, tableY + 5.5);
  doc.text('Waktu', 138, tableY + 5.5);
  doc.text('Nominal (Rp)', 193, tableY + 5.5, { align: 'right' });

  tableY += 10;
  doc.setFont('helvetica', 'normal');

  report.entries.forEach((entry, idx) => {
    if (tableY > 265) {
      doc.addPage();
      tableY = 20;
    }

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), 16, tableY);
    doc.setFont('helvetica', 'bold');
    doc.text(entry.houseNumber, 26, tableY);
    doc.setFont('helvetica', 'normal');
    doc.text(entry.residentName, 50, tableY);
    doc.text(entry.paymentMethod.toUpperCase(), 110, tableY);
    doc.text(entry.timestamp || '-', 138, tableY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`Rp ${entry.nominal.toLocaleString('id-ID')}`, 193, tableY, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // line
    doc.setDrawColor(241, 245, 249);
    doc.line(14, tableY + 2.5, pageWidth - 14, tableY + 2.5);

    tableY += 6.5;
  });

  // Footer / Signatures
  if (tableY > 240) {
    doc.addPage();
    tableY = 20;
  } else {
    tableY += 10;
  }

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text('Petugas Ronda Pengambil Jimpit,', 14, tableY);
  doc.text('Mengetahui / Mengesahkan,', pageWidth - 65, tableY);
  doc.text('Ketua Paguyuban GSS 1', pageWidth - 65, tableY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(report.collectedBy, 14, tableY + 24);
  doc.text('Bpk. BENI (Rumah B 24)', pageWidth - 65, tableY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text('Petugas Ronda Malam', 14, tableY + 28);
  doc.text('Ketua Paguyuban & Superadmin', pageWidth - 65, tableY + 28);

  doc.save(`Laporan_Jimpitan_Harian_${report.day}_${report.date}.pdf`);
}

/**
 * Export Monthly Jimpitan Deficit & Master Table for all 58 residents to PDF
 */
export function exportMonthlyJimpitanToPDF(
  residents: Resident[],
  _reports: JimpitDailyReport[],
  monthTitle: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const targetMonthly = 15000;

  const totalResidents = residents.length;
  const lunasCount = residents.filter((r) => (r.jimpitanPaidMonth || 0) >= targetMonthly).length;
  const totalTerkumpul = residents.reduce((acc, r) => acc + (r.jimpitanPaidMonth || 0), 0);
  const totalTarget = totalResidents * targetMonthly;
  const totalKekurangan = residents.reduce((acc, r) => {
    const paid = r.jimpitanPaidMonth || 0;
    return acc + Math.max(0, targetMonthly - paid);
  }, 0);

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GRISSPO - REKAPITULASI JIMPITAN BULANAN (58 WARGA)', pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${monthTitle} | Target Standar: Rp 15.000 / KK / Bulan`, pageWidth / 2, 17, { align: 'center' });
  doc.text('Perumahan Griya Sedayu Selaras 1 - Bantul, D.I. Yogyakarta', pageWidth / 2, 22, { align: 'center' });

  // 3 Summary Boxes
  let y = 34;

  // Box 1: Total Terkumpul
  doc.setFillColor(240, 253, 244);
  doc.rect(14, y, 56, 17, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.rect(14, y, 56, 17, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.text('TOTAL TERKUMPUL', 16, y + 5.5);
  doc.setFontSize(11);
  doc.text(`Rp ${totalTerkumpul.toLocaleString('id-ID')}`, 16, y + 12.5);

  // Box 2: Total Kekurangan
  doc.setFillColor(254, 242, 242);
  doc.rect(77, y, 56, 17, 'F');
  doc.setDrawColor(239, 68, 68);
  doc.rect(77, y, 56, 17, 'D');
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(8);
  doc.text('TOTAL KEKURANGAN', 79, y + 5.5);
  doc.setFontSize(11);
  doc.text(`Rp ${totalKekurangan.toLocaleString('id-ID')}`, 79, y + 12.5);

  // Box 3: Capaian & Status
  doc.setFillColor(239, 246, 255);
  doc.rect(140, y, 56, 17, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.rect(140, y, 56, 17, 'D');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(8);
  doc.text('STATUS WARGA LUNAS', 142, y + 5.5);
  doc.setFontSize(11);
  const percent = totalTarget > 0 ? Math.round((totalTerkumpul / totalTarget) * 100) : 0;
  doc.text(`${lunasCount} / ${totalResidents} KK (${percent}%)`, 142, y + 12.5);

  // Table Header
  y = 57;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('No', 16, y + 5);
  doc.text('Rumah', 25, y + 5);
  doc.text('Nama Kepala Keluarga', 44, y + 5);
  doc.text('Blok', 105, y + 5);
  doc.text('Target', 123, y + 5);
  doc.text('Terbayar', 152, y + 5);
  doc.text('Kekurangan / Status', 193, y + 5, { align: 'right' });

  y += 9.5;
  doc.setFont('helvetica', 'normal');

  residents.forEach((r, idx) => {
    if (y > 272) {
      doc.addPage();
      y = 18;
      // Repeat small header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('No', 16, y + 4.5);
      doc.text('Rumah', 25, y + 4.5);
      doc.text('Nama Kepala Keluarga', 44, y + 4.5);
      doc.text('Blok', 105, y + 4.5);
      doc.text('Target', 123, y + 4.5);
      doc.text('Terbayar', 152, y + 4.5);
      doc.text('Kekurangan / Status', 193, y + 4.5, { align: 'right' });
      y += 8.5;
      doc.setFont('helvetica', 'normal');
    }

    const paid = r.jimpitanPaidMonth || 0;
    const deficit = Math.max(0, targetMonthly - paid);
    const isLunas = deficit === 0;

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), 16, y);

    doc.setFont('helvetica', 'bold');
    doc.text(r.houseNumber, 25, y);
    doc.setFont('helvetica', 'normal');

    const nameText = r.name.length > 25 ? r.name.substring(0, 25) + '...' : r.name;
    doc.text(nameText, 44, y);
    doc.text(`Blok ${r.block}`, 105, y);
    doc.text(`Rp 15.000`, 123, y);
    doc.text(`Rp ${paid.toLocaleString('id-ID')}`, 152, y);

    doc.setFont('helvetica', 'bold');
    if (isLunas) {
      doc.setTextColor(22, 101, 52);
      doc.text('LUNAS', 193, y, { align: 'right' });
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text(`Kurang Rp ${deficit.toLocaleString('id-ID')}`, 193, y, { align: 'right' });
    }
    doc.setFont('helvetica', 'normal');

    // line
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    y += 5.5;
  });

  // Footer Signatures
  if (y > 245) {
    doc.addPage();
    y = 20;
  } else {
    y += 8;
  }

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.text('Mengetahui / Mengesahkan,', 14, y);
  doc.text('Ketua Paguyuban Perum GSS 1', 14, y + 4.5);
  doc.text('Bendahara Paguyuban Kas', pageWidth - 65, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Bpk. BENI (Rumah B 24)', 14, y + 22);
  doc.text('Bpk. AHMAD (B 02) / ROBY (C 15)', pageWidth - 65, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('Ketua & Superadmin Portal', 14, y + 26);
  doc.text('Bendahara 1 & Bendahara 2', pageWidth - 65, y + 26);

  doc.save(`Rekap_Jimpitan_Bulanan_GSS_${monthTitle.replace(/\s+/g, '_')}.pdf`);
}

