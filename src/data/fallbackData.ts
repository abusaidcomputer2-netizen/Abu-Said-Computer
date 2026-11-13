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
  {
    "id": 19,
    "rowId": 19,
    "sl": 1,
    "category": "Online Application",
    "name": "XI Class Admission",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 20,
    "rowId": 20,
    "sl": 2,
    "category": "Online Application",
    "name": "Online Application",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 21,
    "rowId": 21,
    "sl": 3,
    "category": "Online Application",
    "name": "Job Application",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 22,
    "rowId": 22,
    "sl": 4,
    "category": "Online Application",
    "name": "Birth Certificate Apply",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 23,
    "rowId": 23,
    "sl": 5,
    "category": "Online Application",
    "name": "Passport Online Apply",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 24,
    "rowId": 24,
    "sl": 6,
    "category": "Online Application",
    "name": "NID Application",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 25,
    "rowId": 25,
    "sl": 7,
    "category": "Online Application",
    "name": "Nid Correction Application",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 26,
    "rowId": 26,
    "sl": 8,
    "category": "Online Application",
    "name": "NID Card Download",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 27,
    "rowId": 27,
    "sl": 9,
    "category": "Online Application",
    "name": "NID Server Copy",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 28,
    "rowId": 28,
    "sl": 10,
    "category": "Online Application",
    "name": "Land Tax Payment",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 29,
    "rowId": 29,
    "sl": 11,
    "category": "Online Application",
    "name": "Income tax return",
    "price": 500,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 30,
    "rowId": 30,
    "sl": 12,
    "category": "Online Application",
    "name": "Scan & Email Service",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 1,
    "rowId": 1,
    "sl": 1,
    "category": "Photocopy",
    "name": "Color Print",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 2,
    "rowId": 2,
    "sl": 2,
    "category": "Photocopy",
    "name": "Black & White Print",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 3,
    "rowId": 3,
    "sl": 3,
    "category": "Photocopy",
    "name": "A4 Photocopy",
    "price": 3,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 4,
    "rowId": 4,
    "sl": 4,
    "category": "Photocopy",
    "name": "A4 Photocopy (Duplex)",
    "price": 4,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 5,
    "rowId": 5,
    "sl": 5,
    "category": "Photocopy",
    "name": "LG Photocopy",
    "price": 4,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 6,
    "rowId": 6,
    "sl": 6,
    "category": "Photocopy",
    "name": "Legal Photocopy (Duplex)",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 7,
    "rowId": 7,
    "sl": 7,
    "category": "Photocopy",
    "name": "PP Size Photo",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 8,
    "rowId": 8,
    "sl": 8,
    "category": "Photocopy",
    "name": "PDF File Editor",
    "price": 50,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 9,
    "rowId": 9,
    "sl": 9,
    "category": "Photocopy",
    "name": "Service Charge",
    "price": 0,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 10,
    "rowId": 10,
    "sl": 10,
    "category": "Photocopy",
    "name": "CV Compose",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 11,
    "rowId": 11,
    "sl": 11,
    "category": "Photocopy",
    "name": "Computer Compose & Typing",
    "price": 50,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 12,
    "rowId": 12,
    "sl": 12,
    "category": "Photocopy",
    "name": "Stamp Composing & Typing",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 13,
    "rowId": 13,
    "sl": 13,
    "category": "Photocopy",
    "name": "NID Card Lamination",
    "price": 40,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 14,
    "rowId": 14,
    "sl": 14,
    "category": "Photocopy",
    "name": "A4 Lamination",
    "price": 30,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 15,
    "rowId": 15,
    "sl": 15,
    "category": "Photocopy",
    "name": "Legal Lamination",
    "price": 40,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 16,
    "rowId": 16,
    "sl": 16,
    "category": "Photocopy",
    "name": "PVC ID Card Print",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 17,
    "rowId": 17,
    "sl": 17,
    "category": "Photocopy",
    "name": "Sticker Paper Print",
    "price": 30,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 18,
    "rowId": 18,
    "sl": 18,
    "category": "Photocopy",
    "name": "JSC/SSC Certificate",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 31,
    "rowId": 31,
    "sl": 1,
    "category": "Stationery Products",
    "name": "50 Tk Stamp Paper",
    "price": 70,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 32,
    "rowId": 32,
    "sl": 2,
    "category": "Stationery Products",
    "name": "100 Tk Stamp Paper",
    "price": 120,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 33,
    "rowId": 33,
    "sl": 3,
    "category": "Stationery Products",
    "name": "Letter Envelope",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 34,
    "rowId": 34,
    "sl": 4,
    "category": "Stationery Products",
    "name": "A4 Size Envelope",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 35,
    "rowId": 35,
    "sl": 5,
    "category": "Stationery Products",
    "name": "Clear File Folder",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 36,
    "rowId": 36,
    "sl": 6,
    "category": "Stationery Products",
    "name": "Sticker Paper",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 37,
    "rowId": 37,
    "sl": 7,
    "category": "Stationery Products",
    "name": "A4 Size 80 GSM Offset Paper",
    "price": 460,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 38,
    "rowId": 38,
    "sl": 8,
    "category": "Stationery Products",
    "name": "A4 Size 70 GSM Offset Paper",
    "price": 360,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 39,
    "rowId": 39,
    "sl": 9,
    "category": "Stationery Products",
    "name": "A4 Size 100 GSM Offset Paper",
    "price": 550,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 40,
    "rowId": 40,
    "sl": 10,
    "category": "Stationery Products",
    "name": "Matador All Time Ball Pen",
    "price": 6,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 41,
    "rowId": 41,
    "sl": 11,
    "category": "Stationery Products",
    "name": "Hi-School Ball Pen",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 42,
    "rowId": 42,
    "sl": 12,
    "category": "Stationery Products",
    "name": "Fevicol Clear Glue - 50 gm",
    "price": 25,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 43,
    "rowId": 43,
    "sl": 13,
    "category": "Stationery Products",
    "name": "Fevicol MR Glue",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 44,
    "rowId": 44,
    "sl": 14,
    "category": "Stationery Products",
    "name": "Court File General",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 45,
    "rowId": 45,
    "sl": 15,
    "category": "Stationery Products",
    "name": "A4 Management File",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 46,
    "rowId": 46,
    "sl": 16,
    "category": "Stationery Products",
    "name": "Fiber Frame",
    "price": 250,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 47,
    "rowId": 47,
    "sl": 17,
    "category": "Stationery Products",
    "name": "LG Size 70 GSM Offset Paper",
    "price": 480,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  }
];

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
