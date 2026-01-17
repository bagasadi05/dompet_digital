/**
 * Export utilities for generating PDF reports with Premium Design
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TransactionType } from '../services/types';
import { formatCurrency, formatDate } from './index';

// Colors
const COLORS = {
    primary: [16, 185, 129] as [number, number, number], // Emerald-500
    secondary: [79, 70, 229] as [number, number, number], // Indigo-600
    accent: [20, 184, 166] as [number, number, number], // Teal-500
    text: {
        primary: [17, 24, 39] as [number, number, number], // Gray-900
        secondary: [107, 114, 128] as [number, number, number], // Gray-500
        light: [255, 255, 255] as [number, number, number], // White
    },
    bg: {
        light: [249, 250, 251] as [number, number, number], // Gray-50
        card: [255, 255, 255] as [number, number, number],
    },
    success: [22, 163, 74] as [number, number, number], // Green-600
    danger: [220, 38, 38] as [number, number, number], // Red-600
};

// Helper: Draw Header
const drawHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    const pageWidth = doc.internal.pageSize.width;

    // Header Background Gradient (Simulated with lines)
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // App Name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Dompet Digital', 14, 20);

    // Document Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 30);

    // Decorative Circle
    doc.setFillColor(255, 255, 255);
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.circle(pageWidth - 20, 0, 40, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Printed Date
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Dicetak: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 35, { align: 'right' });

    if (subtitle) {
        doc.setFontSize(10);
        doc.text(subtitle, pageWidth - 14, 25, { align: 'right' });
    }
};

// Helper: Draw Summary Card
const drawSummaryCard = (
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    amount: number,
    color: [number, number, number]
) => {
    // Card Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');

    // Left Colored Stripe
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, 2, h, 3, 3, 'F');
    // Fix corners for stripe
    doc.rect(x + 1, y, 1, h, 'F');

    // Title
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(title, x + 6, y + 10);

    // Amount
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(formatCurrency(amount), x + 6, y + 22);
};

// Helper: Custom Table Style
const getTableTheme = () => ({
    headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontStyle: 'bold' as const,
        halign: 'left' as const,
        cellPadding: 4,
    },
    bodyStyles: {
        textColor: [55, 65, 81] as [number, number, number], // Gray-700
        fontSize: 9,
        cellPadding: 3,
    },
    alternateRowStyles: {
        fillColor: [249, 250, 251] as [number, number, number], // Gray-50
    },
    columnStyles: {
        amount: { halign: 'right' as const, fontStyle: 'bold' as const },
    },
});

// Export transactions to PDF
export const exportTransactionsToPDF = (
    transactions: Transaction[],
    filename?: string
): void => {
    const doc = new jsPDF();

    // Draw Premium Header
    drawHeader(doc, 'Laporan Transaksi');

    // Filter Stats
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);

    // Brief Summary
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text.secondary[0], COLORS.text.secondary[1], COLORS.text.secondary[2]);
    doc.text(`Total Transaksi: ${totalTransactions}`, 14, 50);
    doc.text(`Total Saldo Periode: ${formatCurrency(totalAmount)}`, 14, 56);

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
        startY: 65,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
        body: tableData,
        theme: 'plain',
        ...getTableTheme(),
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' } // Amount column
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
                const type = data.cell.raw;
                if (type === 'Pemasukan') {
                    data.cell.styles.textColor = COLORS.success;
                } else {
                    data.cell.styles.textColor = COLORS.danger;
                }
            }
        }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    const finalName = filename || `transaksi_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(finalName);
};

// Export comprehensive report to PDF
export const exportReportToPDF = (
    transactions: Transaction[],
    period?: string
): void => {
    const doc = new jsPDF();

    // Draw Premium Header
    drawHeader(doc, 'Laporan Keuangan Ringkas', period ? `Periode: ${period}` : 'Semua Waktu');

    // Summary Statistics
    const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Draw Summary Cards (3 Columns)
    const cardY = 55;
    const cardWidth = 58;
    const cardHeight = 30;
    const gap = 6;
    const startX = 14;

    drawSummaryCard(doc, startX, cardY, cardWidth, cardHeight, 'Pemasukan', totalIncome, COLORS.success);
    drawSummaryCard(doc, startX + cardWidth + gap, cardY, cardWidth, cardHeight, 'Pengeluaran', totalExpense, COLORS.danger);
    drawSummaryCard(doc, startX + (cardWidth + gap) * 2, cardY, cardWidth, cardHeight, 'Saldo Bersih', netBalance, COLORS.secondary);

    // Initial Y for content below cards
    let currentY = cardY + cardHeight + 15;

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
        doc.setFontSize(12);
        doc.setTextColor(COLORS.text.primary[0], COLORS.text.primary[1], COLORS.text.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Pengeluaran Terbesar per Kategori', 14, currentY);

        const categoryData = topCategories.map(([cat, amount]) => [
            cat,
            ((amount / totalExpense) * 100).toFixed(1) + '%',
            formatCurrency(amount)
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Kategori', 'Persentase', 'Total']],
            body: categoryData,
            theme: 'plain',
            ...getTableTheme(),
            tableWidth: 100,
            columnStyles: {
                2: { halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 14 }
        });

        // Add a pie chart representation visually (rectangles) next to table if possible, or just skip for simplicity
        // Let's just create a list on the right side if there's space, or keep it simple.

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recent Transactions Table
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text.primary[0], COLORS.text.primary[1], COLORS.text.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Riwayat Transaksi Terakhir (Maks 50)', 14, currentY);

    const tableData = transactions.slice(0, 50).map(tx => [ // Limit to last 50 for report
        formatDate(tx.date),
        tx.description,
        tx.category,
        tx.type === TransactionType.INCOME ? 'Masuk' : 'Keluar',
        formatCurrency(tx.amount)
    ]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
        body: tableData,
        theme: 'plain',
        ...getTableTheme(),
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
                const type = data.cell.raw;
                if (type === 'Masuk') {
                    data.cell.styles.textColor = COLORS.success;
                } else {
                    data.cell.styles.textColor = COLORS.danger;
                }
            }
        }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Footer Line
        doc.setDrawColor(229, 231, 235);
        doc.line(14, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 15);

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Dompet Digital - Laporan Keuangan Pribadi', 14, doc.internal.pageSize.height - 10);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    const fileName = `laporan_${period ? period.replace(/\s+/g, '_').toLowerCase() : 'lengkap'}.pdf`;
    doc.save(fileName);
};
