export type Category = 'Photocopy' | 'Online Application' | 'Stationery Products';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  phone?: string;
  permissions?: string;
}

export interface Customer {
  id: number;
  rowId: number;
  sl: number;
  name: string;
  phone: string;
  address: string;
}

export interface Product {
  id: number;
  rowId: number;
  sl: number;
  category: Category;
  name: string;
  price: number;
  costPrice: number;
  stockQty: number | null;
  lowStockLimit: number;
}

export interface SaleItem {
  category: Category;
  name: string;
  price: number;
  costPrice?: number;
  qty: number;
  total: number;
}

export interface SaleRecord {
  id: number;
  rowId: number;
  invoiceNo: number;
  timestamp: string;
  rawDate: string;
  date: string;
  user: string;
  customer: string;
  phone: string;
  address?: string;
  category: string;
  desc?: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paid: number;
  due: number;
  items: SaleItem[];
}

export interface DueRecord {
  id: string;
  rowId: number;
  date: string;
  customer: string;
  phone: string;
  address?: string;
  type: string;
  desc: string;
  due: number;
  paid: number;
  user: string;
  timestamp: string;
}

export interface CustomerDueSummary {
  name: string;
  phone: string;
  address: string;
  totalDue: number;
  totalPaid: number;
  netBalance: number;
}

export interface PurchaseRecord {
  id: string;
  rowId: number;
  date: string;
  timestamp: string;
  product: string;
  category: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  notes?: string;
  user: string;
}

export interface ExpenseRecord {
  id: number;
  rowId: number;
  expId: string;
  timestamp: string;
  date: string;
  category: string;
  desc: string;
  amount: number;
  user: string;
}

export interface DenominationCounts {
  n1000?: number;
  n500?: number;
  n200?: number;
  n100?: number;
  n50?: number;
  n20?: number;
  n10?: number;
  n5?: number;
  coins?: number;
}

export interface CashClosingRecord {
  id: string;
  rowId: number;
  date: string;
  closedAt: string;
  user: string;
  openingCash: number;
  prevShortageDeducted: number;
  salesInflow: number;
  dueInflow: number;
  totalInflow: number;
  expenseOutflow: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: 'Matched' | 'Short' | 'Excess';
  notes: string;
  denominations: DenominationCounts;
}
