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

export const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, rowId: 1, sl: 1, category: 'Photocopy', name: 'A4 B/W Photocopy (Single)', price: 3, costPrice: 1, stockQty: null, lowStockLimit: 5 },
  { id: 2, rowId: 2, sl: 2, category: 'Photocopy', name: 'A4 B/W Photocopy (Double)', price: 5, costPrice: 1.8, stockQty: null, lowStockLimit: 5 },
  { id: 3, rowId: 3, sl: 3, category: 'Photocopy', name: 'Legal B/W Photocopy', price: 4, costPrice: 1.5, stockQty: null, lowStockLimit: 5 },
  { id: 4, rowId: 4, sl: 4, category: 'Photocopy', name: 'A4 Color Print (Glossy)', price: 15, costPrice: 6, stockQty: null, lowStockLimit: 5 },
  { id: 5, rowId: 5, sl: 5, category: 'Photocopy', name: 'Document Scanning & Email', price: 20, costPrice: 2, stockQty: null, lowStockLimit: 5 },
  { id: 6, rowId: 6, sl: 6, category: 'Photocopy', name: 'Lamination A4', price: 20, costPrice: 7, stockQty: null, lowStockLimit: 5 },

  { id: 7, rowId: 7, sl: 1, category: 'Online Application', name: 'Job Application Form Fillup', price: 150, costPrice: 0, stockQty: null, lowStockLimit: 5 },
  { id: 8, rowId: 8, sl: 2, category: 'Online Application', name: 'Birth Registration / Shonod', price: 100, costPrice: 0, stockQty: null, lowStockLimit: 5 },
  { id: 9, rowId: 9, sl: 3, category: 'Online Application', name: 'NID Correction / Re-issue', price: 200, costPrice: 0, stockQty: null, lowStockLimit: 5 },
  { id: 10, rowId: 10, sl: 4, category: 'Online Application', name: 'Passport Online Application', price: 300, costPrice: 0, stockQty: null, lowStockLimit: 5 },
  { id: 11, rowId: 11, sl: 5, category: 'Online Application', name: 'University Admission Online', price: 200, costPrice: 0, stockQty: null, lowStockLimit: 5 },
  { id: 12, rowId: 12, sl: 6, category: 'Online Application', name: 'TIN Certificate Registration', price: 150, costPrice: 0, stockQty: null, lowStockLimit: 5 },

  { id: 13, rowId: 13, sl: 1, category: 'Stationery Products', name: 'Matador Hi-School Ballpen (Box 12pcs)', price: 60, costPrice: 48, stockQty: 25, lowStockLimit: 5 },
  { id: 14, rowId: 14, sl: 2, category: 'Stationery Products', name: 'Matador Orbit Ball Pen (Black/Blue)', price: 5, costPrice: 3.8, stockQty: 120, lowStockLimit: 20 },
  { id: 15, rowId: 15, sl: 3, category: 'Stationery Products', name: 'A4 Double A Paper (80 GSM Rim 500 Sheets)', price: 420, costPrice: 375, stockQty: 18, lowStockLimit: 4 },
  { id: 16, rowId: 16, sl: 4, category: 'Stationery Products', name: 'Paper One A4 70 GSM Rim', price: 380, costPrice: 340, stockQty: 14, lowStockLimit: 4 },
  { id: 17, rowId: 17, sl: 5, category: 'Stationery Products', name: 'Clear File Folder (A4 Size)', price: 35, costPrice: 22, stockQty: 45, lowStockLimit: 10 },
  { id: 18, rowId: 18, sl: 6, category: 'Stationery Products', name: 'Stapler Medium + Pins (Kangaro 10)', price: 120, costPrice: 90, stockQty: 12, lowStockLimit: 3 },
  { id: 19, rowId: 19, sl: 7, category: 'Stationery Products', name: 'Correction Pen (Fluid Whitener)', price: 40, costPrice: 28, stockQty: 22, lowStockLimit: 5 }
];

export const FALLBACK_CUSTOMERS: Customer[] = [
  { id: 1, rowId: 1, sl: 1, name: 'Al Aqsa Qiraatul Quran Madrasa', phone: '01819234567', address: 'Paduar Bazar, Cumilla' },
  { id: 2, rowId: 2, sl: 2, name: 'Hasan Trading Corporation', phone: '01711223344', address: 'Kazi Para, Sadar Dakshin, Cumilla' },
  { id: 3, rowId: 3, sl: 3, name: 'Noorani Muallim Training Center', phone: '01912345678', address: 'Paduar Bazar, Cumilla' },
  { id: 4, rowId: 4, sl: 4, name: 'Bhai Bhai General Store', phone: '01822000000', address: 'Bhai Bhai Super Market, Cumilla' },
  { id: 5, rowId: 5, sl: 5, name: 'Kazi Nazrul Islam Library', phone: '01633000000', address: 'Kandirpar, Cumilla' },
  { id: 6, rowId: 6, sl: 6, name: 'New Customer', phone: '01904142370', address: 'Paduar Bazar, Cumilla' }
];

const today = new Date().toISOString().split('T')[0];
const ym = today.slice(0, 7);

export const FALLBACK_SALES: SaleRecord[] = [
  {
    id: 4001,
    rowId: 4001,
    invoiceNo: 4001,
    timestamp: `${today} 10:30 AM`,
    rawDate: today,
    date: today,
    user: 'Md Abu Said',
    customer: 'Al Aqsa Qiraatul Quran Madrasa',
    phone: '01819234567',
    address: 'Paduar Bazar, Cumilla',
    category: 'Photocopy, Stationery Products',
    desc: 'Question papers print & paper reams',
    subtotal: 1850,
    discount: 50,
    grandTotal: 1800,
    paid: 1000,
    due: 800,
    items: [
      { category: 'Photocopy', name: 'A4 B/W Photocopy (Single)', price: 3, costPrice: 1, qty: 200, total: 600 },
      { category: 'Stationery Products', name: 'A4 Double A Paper (80 GSM Rim 500 Sheets)', price: 420, costPrice: 375, qty: 2, total: 840 },
      { category: 'Photocopy', name: 'Lamination A4', price: 20, costPrice: 7, qty: 18, total: 360 }
    ]
  },
  {
    id: 4002,
    rowId: 4002,
    invoiceNo: 4002,
    timestamp: `${today} 11:45 AM`,
    rawDate: today,
    date: today,
    user: 'Md Sujon',
    customer: 'Hasan Trading Corporation',
    phone: '01711223344',
    address: 'Kazi Para, Sadar Dakshin, Cumilla',
    category: 'Online Application',
    desc: 'Trade license renewal & online tax filing',
    subtotal: 950,
    discount: 0,
    grandTotal: 950,
    paid: 950,
    due: 0,
    items: [
      { category: 'Online Application', name: 'Job Application Form Fillup', price: 150, costPrice: 0, qty: 3, total: 450 },
      { category: 'Online Application', name: 'Birth Registration / Shonod', price: 100, costPrice: 0, qty: 5, total: 500 }
    ]
  },
  {
    id: 4003,
    rowId: 4003,
    invoiceNo: 4003,
    timestamp: `${today} 02:15 PM`,
    rawDate: today,
    date: today,
    user: 'Md Saimon Hasan',
    customer: 'Noorani Muallim Training Center',
    phone: '01912345678',
    address: 'Paduar Bazar, Cumilla',
    category: 'Photocopy, Stationery Products',
    desc: 'Syllabus printing and binding files',
    subtotal: 1250,
    discount: 50,
    grandTotal: 1200,
    paid: 700,
    due: 500,
    items: [
      { category: 'Photocopy', name: 'A4 B/W Photocopy (Double)', price: 5, costPrice: 1.8, qty: 150, total: 750 },
      { category: 'Stationery Products', name: 'Clear File Folder (A4 Size)', price: 35, costPrice: 22, qty: 10, total: 350 },
      { category: 'Photocopy', name: 'Legal B/W Photocopy', price: 4, costPrice: 1.5, qty: 25, total: 100 }
    ]
  },
  {
    id: 4004,
    rowId: 4004,
    invoiceNo: 4004,
    timestamp: `${ym}-10 04:30 PM`,
    rawDate: `${ym}-10`,
    date: `${ym}-10`,
    user: 'Md Abu Said',
    customer: 'Bhai Bhai General Store',
    phone: '01822000000',
    address: 'Bhai Bhai Super Market, Cumilla',
    category: 'Stationery Products',
    desc: 'Counter stationery supplies',
    subtotal: 620,
    discount: 20,
    grandTotal: 600,
    paid: 600,
    due: 0,
    items: [
      { category: 'Stationery Products', name: 'Matador Hi-School Ballpen (Box 12pcs)', price: 60, costPrice: 48, qty: 5, total: 300 },
      { category: 'Stationery Products', name: 'Stapler Medium + Pins (Kangaro 10)', price: 120, costPrice: 90, qty: 2, total: 240 },
      { category: 'Stationery Products', name: 'Correction Pen (Fluid Whitener)', price: 40, costPrice: 28, qty: 2, total: 80 }
    ]
  }
];

export const FALLBACK_DUE_RECORDS: DueRecord[] = [
  {
    id: 'INV-4001',
    rowId: 1,
    date: today,
    customer: 'Al Aqsa Qiraatul Quran Madrasa',
    phone: '01819234567',
    address: 'Paduar Bazar, Cumilla',
    type: 'Memo / Bill',
    desc: 'Memo #4001 [Question papers print & paper reams]',
    due: 800,
    paid: 0,
    user: 'Md Abu Said',
    timestamp: `${today} 10:30 AM`
  },
  {
    id: 'PAY-1001',
    rowId: 2,
    date: today,
    customer: 'Al Aqsa Qiraatul Quran Madrasa',
    phone: '01819234567',
    address: 'Paduar Bazar, Cumilla',
    type: 'Payment Received',
    desc: 'Cash collection at shop counter',
    due: 0,
    paid: 300,
    user: 'Md Sujon',
    timestamp: `${today} 01:15 PM`
  },
  {
    id: 'INV-4003',
    rowId: 3,
    date: today,
    customer: 'Noorani Muallim Training Center',
    phone: '01912345678',
    address: 'Paduar Bazar, Cumilla',
    type: 'Memo / Bill',
    desc: 'Memo #4003 [Syllabus printing and binding files]',
    due: 500,
    paid: 0,
    user: 'Md Saimon Hasan',
    timestamp: `${today} 02:15 PM`
  }
];

export const FALLBACK_CUSTOMER_SUMMARIES: CustomerDueSummary[] = [
  {
    name: 'Al Aqsa Qiraatul Quran Madrasa',
    phone: '01819234567',
    address: 'Paduar Bazar, Cumilla',
    totalDue: 800,
    totalPaid: 300,
    netBalance: 500
  },
  {
    name: 'Noorani Muallim Training Center',
    phone: '01912345678',
    address: 'Paduar Bazar, Cumilla',
    totalDue: 500,
    totalPaid: 0,
    netBalance: 500
  }
];

export const FALLBACK_DUE_TOTALS = {
  shopTotalDue: 1300,
  shopTotalPaid: 300,
  netDue: 1000
};

export const FALLBACK_EXPENSES: ExpenseRecord[] = [
  {
    id: 1,
    rowId: 1,
    expId: 'EXP-1001',
    timestamp: `${today} 11:00 AM`,
    date: today,
    category: 'চা-নাস্তা',
    desc: 'Staff afternoon tea & guest hospitality',
    amount: 150,
    user: 'Md Abu Said'
  },
  {
    id: 2,
    rowId: 2,
    expId: 'EXP-1002',
    timestamp: `${today} 01:30 PM`,
    date: today,
    category: 'দোকান ভাড়া',
    desc: 'Shop advance monthly partial rent',
    amount: 3000,
    user: 'Md Abu Said'
  },
  {
    id: 3,
    rowId: 3,
    expId: 'EXP-1003',
    timestamp: `${ym}-11 05:00 PM`,
    date: `${ym}-11`,
    category: 'বিদ্যুৎ বিল',
    desc: 'Palli Bidyut office power bill',
    amount: 1850,
    user: 'Md Abu Said'
  }
];

export const FALLBACK_PURCHASES: PurchaseRecord[] = [
  {
    id: 'PUR-1001',
    rowId: 1,
    date: today,
    timestamp: `${today} 09:30 AM`,
    product: 'A4 Double A Paper (80 GSM Rim 500 Sheets)',
    category: 'Stationery Products',
    qty: 10,
    unitCost: 375,
    totalCost: 3750,
    supplier: 'Dhaka Paper Mart, Chowmuhani',
    notes: 'Paper reams received in good condition',
    user: 'Md Abu Said'
  },
  {
    id: 'PUR-1002',
    rowId: 2,
    date: `${ym}-12`,
    timestamp: `${ym}-12 03:00 PM`,
    product: 'Matador Orbit Ball Pen (Black/Blue)',
    category: 'Stationery Products',
    qty: 100,
    unitCost: 3.8,
    totalCost: 380,
    supplier: 'Cumilla Stationers, Kandirpar',
    notes: 'Pen stock replenishment',
    user: 'Md Abu Said'
  }
];

export const FALLBACK_CASH_CLOSINGS: CashClosingRecord[] = [
  {
    id: 'CLS-20261014',
    rowId: 1,
    date: `${ym}-14`,
    closedAt: '09:00 PM',
    user: 'Md Abu Said',
    openingCash: 500,
    prevShortageDeducted: 0,
    salesInflow: 3250,
    dueInflow: 500,
    totalInflow: 4250,
    expenseOutflow: 1200,
    expectedCash: 3050,
    actualCash: 3050,
    difference: 0,
    status: 'Matched',
    notes: 'All counter cash accounts perfectly matched for the day.',
    denominations: {
      n1000: 2,
      n500: 2,
      n50: 1
    }
  }
];
