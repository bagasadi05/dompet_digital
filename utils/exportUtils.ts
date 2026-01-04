/**
 * Export utilities for generating PDF reports
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TransactionType } from '../services/types';
import { formatCurrency, formatDate } from './index';

// Export transactions to PDF
export const exportTransactionsToPDF = (
    transactions: Transaction[],
    filename?: string
): void => {
    const doc = new jsPDF();
    const date = formatDate(new Date().toISOString());

    // Title
    doc.setFontSize(18);
    doc.text('Laporan Transaksi Keuangan', 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${date}`, 14, 28);

    // Table Data
    const tableData = transactions.map(tx => [
        formatDate(tx.date),
        tx.description,
        tx.category,
        tx.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran',
        formatCurrency(tx.amount)
    ]);

    // Table
    autoTable(doc, {
        startY: 35,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Primary color
        footStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        styles: { fontSize: 10, cellPadding: 3 },
    });

    const finalName = filename || `transaksi_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(finalName);
};

// Export comprehensive report to PDF
export const exportReportToPDF = (
    transactions: Transaction[],
    period?: string
): void => {
    const doc = new jsPDF();
    const date = formatDate(new Date().toISOString());

    // Title
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('Dompet Digital', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Laporan Keuangan Ringkas', 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode Laporan: ${period || 'Semua Waktu'}`, 14, 38);
    doc.text(`Dicetak pada: ${date}`, 14, 43);

    // Summary Statistics
    const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, 50, 180, 40, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Total Pemasukan', 25, 65);
    doc.text('Total Pengeluaran', 85, 65);
    doc.text('Saldo Bersih', 145, 65);

    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(formatCurrency(totalIncome), 25, 75);

    doc.setTextColor(220, 38, 38); // Red
    doc.text(formatCurrency(totalExpense), 85, 75);

    doc.setTextColor(79, 70, 229); // Primary
    doc.text(formatCurrency(netBalance), 145, 75);

    // Category Breakdown (Top 5 Expenses)
    const categoryTotals = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topCategories.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Pengeluaran Terbesar per Kategori', 14, 105);

        const categoryData = topCategories.map(([cat, amount]) => [cat, formatCurrency(amount)]);

        autoTable(doc, {
            startY: 110,
            head: [['Kategori', 'Total']],
            body: categoryData,
            theme: 'plain',
            headStyles: { fillColor: [240, 240, 240], textColor: 50 },
            styles: { fontSize: 10 },
            tableWidth: 100
        });
    }

    // Recent Transactions Table
    const finalY = (doc as any).lastAutoTable?.finalY || 110;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Riwayat Transaksi Terakhir', 14, finalY + 20);

    const tableData = transactions.slice(0, 50).map(tx => [ // Limit to last 50 for report
        formatDate(tx.date),
        tx.description,
        tx.category,
        tx.type === TransactionType.INCOME ? 'Masuk' : 'Keluar',
        formatCurrency(tx.amount)
    ]);

    autoTable(doc, {
        startY: finalY + 25,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    const fileName = `laporan_${period ? period.replace(/\s+/g, '_').toLowerCase() : 'lengkap'}.pdf`;
    doc.save(fileName);
};
