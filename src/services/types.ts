
export enum TransactionType {
  INCOME = 'pemasukan',
  EXPENSE = 'pengeluaran',
}

export enum Category {
  MAKANAN = 'Makanan & Minuman',
  TRANSPORTASI = 'Transportasi',
  TAGIHAN = 'Tagihan & Utilitas',
  HIBURAN = 'Hiburan',
  BELANJA = 'Belanja',
  KESEHATAN = 'Kesehatan',
  GAJI = 'Gaji',
  TABUNGAN = 'Tabungan & Investasi',
  LAINNYA = 'Lainnya',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO 8601 format
  goalId?: string;
  billId?: string; // Link to associated bill
}

export interface Budget {
  id: string;
  category: Category;
  budget_limit: number;
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO 8601 format
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  nextDueDate: string; // ISO 8601 format
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
}

export interface SavingTip {
  id: string;
  tip: string;
}

export interface AppNotification {
  id: string;
  type: 'bill_due' | 'budget_warning' | 'budget_exceeded' | 'goal_achieved';
  title: string;
  message: string;
  linkTo: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string; // ISO String
  icon: 'bill' | 'budget' | 'goal';
}

export const expenseCategories: Category[] = [
  Category.MAKANAN,
  Category.TRANSPORTASI,
  Category.TAGIHAN,
  Category.HIBURAN,
  Category.BELANJA,
  Category.KESEHATAN,
  Category.TABUNGAN,
  Category.LAINNYA,
];

export const incomeCategories: Category[] = [
  Category.GAJI,
  Category.LAINNYA,
];