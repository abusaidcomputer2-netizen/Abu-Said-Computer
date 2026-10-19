import { Product, Customer, User, SaleRecord, DueRecord, CustomerDueSummary, ExpenseRecord, PurchaseRecord, CashClosingRecord } from '../types';

export const INITIAL_USER_PASSWORDS: Record<string, string> = {
  'md abu said': '12345',
  'md sujon': '2008',
  'md saimon hasan': '1020'
};

export const FALLBACK_USERS: User[] = [
  {
    id: 1,
    username: 'Md Abu Said',
    role: 'admin',
    phone: '01904142370',
    permissions: 'all'
  },
  {
    id: 2,
    username: 'Md Sujon',
    role: 'staff',
    phone: '01800000000',
    permissions: 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'
  },
  {
    id: 3,
    username: 'Md Saimon Hasan',
    role: 'staff',
    phone: '01700000000',
    permissions: 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'
  }
];

export const FALLBACK_PRODUCTS: Product[] = [];
export const FALLBACK_CUSTOMERS: Customer[] = [];
export const FALLBACK_SALES: SaleRecord[] = [];
export const FALLBACK_DUE_RECORDS: DueRecord[] = [];
export const FALLBACK_CUSTOMER_SUMMARIES: CustomerDueSummary[] = [];
export const FALLBACK_DUE_TOTALS = {
  shopTotalDue: 0,
  shopTotalPaid: 0,
  netDue: 0
};
export const FALLBACK_EXPENSES: ExpenseRecord[] = [];
export const FALLBACK_PURCHASES: PurchaseRecord[] = [];
export const FALLBACK_CASH_CLOSINGS: CashClosingRecord[] = [];
