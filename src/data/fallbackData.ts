import { Product, Customer, User } from '../types';

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
  { id: 1, rowId: 1, sl: 1, name: 'Md Abu Said', phone: '01904142370', address: 'Paduar Bazar, Cumilla' },
  { id: 2, rowId: 2, sl: 2, name: 'Cumilla Polytechnic Institute', phone: '01819000000', address: 'Kotbari, Cumilla' },
  { id: 3, rowId: 3, sl: 3, name: 'Paduar Bazar High School', phone: '01711000000', address: 'Paduar Bazar, Cumilla' },
  { id: 4, rowId: 4, sl: 4, name: 'Bhai Bhai General Store', phone: '01822000000', address: 'Bhai Bhai Super Market, Cumilla' },
  { id: 5, rowId: 5, sl: 5, name: 'Kazi Nazrul Islam Library', phone: '01633000000', address: 'Kandirpar, Cumilla' }
];
