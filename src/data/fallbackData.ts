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
    "category": "Photocopy",
    "name": "A4 Photocopy",
    "price": 2.5,
    "costPrice": 1.2,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 20,
    "rowId": 20,
    "sl": 2,
    "category": "Photocopy",
    "name": "A4 Photocopy (Duplex)",
    "price": 4,
    "costPrice": 1.8,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 21,
    "rowId": 21,
    "sl": 3,
    "category": "Photocopy",
    "name": "LG Photocopy",
    "price": 4,
    "costPrice": 1.8,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 22,
    "rowId": 22,
    "sl": 4,
    "category": "Photocopy",
    "name": "Legal Photocopy (Duplex)",
    "price": 5,
    "costPrice": 2.2,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 23,
    "rowId": 23,
    "sl": 5,
    "category": "Photocopy",
    "name": "Color Print",
    "price": 10,
    "costPrice": 4,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 24,
    "rowId": 24,
    "sl": 6,
    "category": "Photocopy",
    "name": "A4 Color Print",
    "price": 10,
    "costPrice": 4,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 25,
    "rowId": 25,
    "sl": 7,
    "category": "Photocopy",
    "name": "Lg Colour Print",
    "price": 15,
    "costPrice": 6,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 26,
    "rowId": 26,
    "sl": 8,
    "category": "Photocopy",
    "name": "Black & White Print",
    "price": 5,
    "costPrice": 2,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 27,
    "rowId": 27,
    "sl": 9,
    "category": "Photocopy",
    "name": "A4 Black & White",
    "price": 5,
    "costPrice": 2,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 28,
    "rowId": 28,
    "sl": 10,
    "category": "Photocopy",
    "name": "PP Size Photo",
    "price": 10,
    "costPrice": 3,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 29,
    "rowId": 29,
    "sl": 11,
    "category": "Photocopy",
    "name": "A4 Lamination",
    "price": 30,
    "costPrice": 10,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 30,
    "rowId": 30,
    "sl": 12,
    "category": "Photocopy",
    "name": "NID Card Lamination",
    "price": 40,
    "costPrice": 12,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 31,
    "rowId": 31,
    "sl": 13,
    "category": "Photocopy",
    "name": "PVC ID Card Print",
    "price": 100,
    "costPrice": 35,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 32,
    "rowId": 32,
    "sl": 14,
    "category": "Photocopy",
    "name": "Computer Compose & Typing",
    "price": 15,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 33,
    "rowId": 33,
    "sl": 15,
    "category": "Photocopy",
    "name": "Stamp Composing & Typing",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 34,
    "rowId": 34,
    "sl": 16,
    "category": "Photocopy",
    "name": "CV Compose",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 35,
    "rowId": 35,
    "sl": 17,
    "category": "Photocopy",
    "name": "PDF File Editor",
    "price": 50,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 36,
    "rowId": 36,
    "sl": 18,
    "category": "Photocopy",
    "name": "Service Charge",
    "price": 25,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 37,
    "rowId": 37,
    "sl": 19,
    "category": "Photocopy",
    "name": "Sticker Paper Print",
    "price": 20,
    "costPrice": 8,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 38,
    "rowId": 38,
    "sl": 20,
    "category": "Online Application",
    "name": "Scan & Email Service",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 39,
    "rowId": 39,
    "sl": 21,
    "category": "Online Application",
    "name": "Job Application",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 40,
    "rowId": 40,
    "sl": 22,
    "category": "Online Application",
    "name": "Passport Online Apply",
    "price": 150,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 41,
    "rowId": 41,
    "sl": 23,
    "category": "Online Application",
    "name": "Nid Correction Application",
    "price": 190,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 42,
    "rowId": 42,
    "sl": 24,
    "category": "Online Application",
    "name": "Birth Certificate Apply",
    "price": 40,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 43,
    "rowId": 43,
    "sl": 25,
    "category": "Online Application",
    "name": "NID Application",
    "price": 150,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 44,
    "rowId": 44,
    "sl": 26,
    "category": "Online Application",
    "name": "Income tax return",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 45,
    "rowId": 45,
    "sl": 27,
    "category": "Online Application",
    "name": "Land Tax Payment",
    "price": 35,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 46,
    "rowId": 46,
    "sl": 28,
    "category": "Online Application",
    "name": "Online Application",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 47,
    "rowId": 47,
    "sl": 29,
    "category": "Stationery Products",
    "name": "A4 Size 70 GSM Offset Paper",
    "price": 360,
    "costPrice": 330,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 48,
    "rowId": 48,
    "sl": 30,
    "category": "Stationery Products",
    "name": "Paper Ream A4 (80 GSM)",
    "price": 480,
    "costPrice": 420,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 49,
    "rowId": 49,
    "sl": 31,
    "category": "Stationery Products",
    "name": "Paper Ream Legal (80 GSM)",
    "price": 550,
    "costPrice": 480,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 50,
    "rowId": 50,
    "sl": 32,
    "category": "Stationery Products",
    "name": "100 Tk Stamp Paper",
    "price": 120,
    "costPrice": 105,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 51,
    "rowId": 51,
    "sl": 33,
    "category": "Stationery Products",
    "name": "50 Tk Stamp Paper",
    "price": 65,
    "costPrice": 55,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 52,
    "rowId": 52,
    "sl": 34,
    "category": "Stationery Products",
    "name": "Court File General",
    "price": 20,
    "costPrice": 15,
    "stockQty": null,
    "lowStockLimit": 10
  },
  {
    "id": 53,
    "rowId": 53,
    "sl": 35,
    "category": "Stationery Products",
    "name": "Clear File Folder",
    "price": 20,
    "costPrice": 14,
    "stockQty": null,
    "lowStockLimit": 10
  },
  {
    "id": 54,
    "rowId": 54,
    "sl": 36,
    "category": "Stationery Products",
    "name": "A4 Size Envelope",
    "price": 5,
    "costPrice": 3,
    "stockQty": null,
    "lowStockLimit": 20
  },
  {
    "id": 55,
    "rowId": 55,
    "sl": 37,
    "category": "Stationery Products",
    "name": "Letter Envelope",
    "price": 5,
    "costPrice": 2.5,
    "stockQty": null,
    "lowStockLimit": 25
  },
  {
    "id": 56,
    "rowId": 56,
    "sl": 38,
    "category": "Stationery Products",
    "name": "Pen",
    "price": 6,
    "costPrice": 4.5,
    "stockQty": null,
    "lowStockLimit": 20
  },
  {
    "id": 57,
    "rowId": 57,
    "sl": 39,
    "category": "Stationery Products",
    "name": "Hi-School Ball Pen",
    "price": 5,
    "costPrice": 4,
    "stockQty": null,
    "lowStockLimit": 15
  },
  {
    "id": 58,
    "rowId": 58,
    "sl": 40,
    "category": "Stationery Products",
    "name": "Fevicol Clear Glue - 50 gm",
    "price": 25,
    "costPrice": 18,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 59,
    "rowId": 59,
    "sl": 41,
    "category": "Stationery Products",
    "name": "Fevicol MR Glue",
    "price": 20,
    "costPrice": 15,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 60,
    "rowId": 60,
    "sl": 42,
    "category": "Stationery Products",
    "name": "Fiber Frame",
    "price": 200,
    "costPrice": 150,
    "stockQty": null,
    "lowStockLimit": 3
  },
  {
    "id": 61,
    "rowId": 61,
    "sl": 43,
    "category": "Stationery Products",
    "name": "Spiral Binding Ring",
    "price": 40,
    "costPrice": 20,
    "stockQty": null,
    "lowStockLimit": 10
  },
  {
    "id": 62,
    "rowId": 62,
    "sl": 44,
    "category": "Photocopy",
    "name": "Laptop Cleaning & Thermal Paste",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 63,
    "rowId": 63,
    "sl": 45,
    "category": "Photocopy",
    "name": "Compose",
    "price": 30,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 64,
    "rowId": 64,
    "sl": 46,
    "category": "Online Application",
    "name": "NID Card Download",
    "price": 150,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 65,
    "rowId": 65,
    "sl": 47,
    "category": "Photocopy",
    "name": "Photo Print",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 66,
    "rowId": 66,
    "sl": 48,
    "category": "Photocopy",
    "name": "Photocopy & Color Print",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 67,
    "rowId": 67,
    "sl": 49,
    "category": "Photocopy",
    "name": "Photocopy Service",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 68,
    "rowId": 68,
    "sl": 50,
    "category": "Photocopy",
    "name": "Print & Edite",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 69,
    "rowId": 69,
    "sl": 51,
    "category": "Stationery Products",
    "name": "Pen / Khata",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 70,
    "rowId": 70,
    "sl": 52,
    "category": "Photocopy",
    "name": "Print & Photocopy Combo",
    "price": 325,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 71,
    "rowId": 71,
    "sl": 53,
    "category": "Stationery Products",
    "name": "Excel File Edite",
    "price": 70,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 72,
    "rowId": 72,
    "sl": 54,
    "category": "Photocopy",
    "name": "Windows 10/11 Setup",
    "price": 200,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 73,
    "rowId": 73,
    "sl": 55,
    "category": "Photocopy",
    "name": "Print Black & White",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 74,
    "rowId": 74,
    "sl": 56,
    "category": "Photocopy",
    "name": "A4 Photocopy (Both Side)",
    "price": 4,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 75,
    "rowId": 75,
    "sl": 57,
    "category": "Online Application",
    "name": "NID Card Application",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 76,
    "rowId": 76,
    "sl": 58,
    "category": "Photocopy",
    "name": "ID Card Lamination",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 77,
    "rowId": 77,
    "sl": 59,
    "category": "Photocopy",
    "name": "Sarvice Charge",
    "price": 1,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 78,
    "rowId": 78,
    "sl": 60,
    "category": "Online Application",
    "name": "Service Item",
    "price": 400,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 79,
    "rowId": 79,
    "sl": 61,
    "category": "Online Application",
    "name": "NID Server Copy",
    "price": 70,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 80,
    "rowId": 80,
    "sl": 62,
    "category": "Photocopy",
    "name": "Printer Repair Service",
    "price": 300,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 81,
    "rowId": 81,
    "sl": 63,
    "category": "Online Application",
    "name": "Certificate Carection Apply",
    "price": 1,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 82,
    "rowId": 82,
    "sl": 64,
    "category": "Stationery Products",
    "name": "Envelope",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 83,
    "rowId": 83,
    "sl": 65,
    "category": "Photocopy",
    "name": "Pdf Scan",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 84,
    "rowId": 84,
    "sl": 66,
    "category": "Photocopy",
    "name": "Stemp Print",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 85,
    "rowId": 85,
    "sl": 67,
    "category": "Photocopy",
    "name": "A4 Print",
    "price": 1.5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 86,
    "rowId": 86,
    "sl": 68,
    "category": "Photocopy",
    "name": "PC Repair",
    "price": 150,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 87,
    "rowId": 87,
    "sl": 69,
    "category": "Photocopy",
    "name": "Legal Photocopy (Both Side)",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 88,
    "rowId": 88,
    "sl": 70,
    "category": "Online Application",
    "name": "NmaJari",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 89,
    "rowId": 89,
    "sl": 71,
    "category": "Online Application",
    "name": "Xi Addmistion",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 90,
    "rowId": 90,
    "sl": 72,
    "category": "Photocopy",
    "name": "Legal Lamination",
    "price": 40,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 91,
    "rowId": 91,
    "sl": 73,
    "category": "Photocopy",
    "name": "NH 350W Power Supply Showcase",
    "price": 1350,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 92,
    "rowId": 92,
    "sl": 74,
    "category": "Stationery Products",
    "name": "Sticker Paper",
    "price": 20,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 93,
    "rowId": 93,
    "sl": 75,
    "category": "Online Application",
    "name": "XI Class Admission",
    "price": 75,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 94,
    "rowId": 94,
    "sl": 76,
    "category": "Stationery Products",
    "name": "Matador All-Time Pen",
    "price": 6,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 95,
    "rowId": 95,
    "sl": 77,
    "category": "Stationery Products",
    "name": "A4 size Papar",
    "price": 2.5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 96,
    "rowId": 96,
    "sl": 78,
    "category": "Online Application",
    "name": "Invitation Card Design",
    "price": 30,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 97,
    "rowId": 97,
    "sl": 79,
    "category": "Photocopy",
    "name": "Sticker Paper Print",
    "price": 50,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 98,
    "rowId": 98,
    "sl": 80,
    "category": "Photocopy",
    "name": "SCAN Copy",
    "price": 10,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 99,
    "rowId": 99,
    "sl": 81,
    "category": "Online Application",
    "name": "Tin_Certificate",
    "price": 111,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 100,
    "rowId": 100,
    "sl": 82,
    "category": "Online Application",
    "name": "Online Application Service",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 101,
    "rowId": 101,
    "sl": 83,
    "category": "Stationery Products",
    "name": "Carbon Paper",
    "price": 5,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 102,
    "rowId": 102,
    "sl": 84,
    "category": "Photocopy",
    "name": "PSC _ Certificate",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 104,
    "rowId": 104,
    "sl": 86,
    "category": "Photocopy",
    "name": "SSC Certificate",
    "price": 100,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  },
  {
    "id": 105,
    "rowId": 105,
    "sl": 87,
    "category": "Stationery Products",
    "name": "Color Paper",
    "price": 2,
    "costPrice": 0,
    "stockQty": null,
    "lowStockLimit": 5
  }
];

export const FALLBACK_CUSTOMERS: Customer[] = [
  {
    "id": 5,
    "rowId": 5,
    "sl": 1,
    "name": "Cash Customer",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 6,
    "rowId": 6,
    "sl": 2,
    "name": "Md Abu Said",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 7,
    "rowId": 7,
    "sl": 3,
    "name": "Md Sujon",
    "phone": "01812345678",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 8,
    "rowId": 8,
    "sl": 4,
    "name": "Al-Amin Traders",
    "phone": "01711223344",
    "address": "Paduar Bazar Biswa Road, Cumilla"
  },
  {
    "id": 9,
    "rowId": 9,
    "sl": 5,
    "name": "Rakib Miah",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 10,
    "rowId": 10,
    "sl": 6,
    "name": "Sandhani Life Insurance",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 11,
    "rowId": 11,
    "sl": 7,
    "name": "Rabbi Vai",
    "phone": "01611718785",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 12,
    "rowId": 12,
    "sl": 8,
    "name": "Alamgir Hossain",
    "phone": "01811800441",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 13,
    "rowId": 13,
    "sl": 9,
    "name": "Mizanur Rahman",
    "phone": "01730064186",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 14,
    "rowId": 14,
    "sl": 10,
    "name": "Hasan",
    "phone": "01616246530",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 15,
    "rowId": 15,
    "sl": 11,
    "name": "Moniruzzaman khan",
    "phone": "01335096683",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 16,
    "rowId": 16,
    "sl": 12,
    "name": "Monaim BM LPG",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 17,
    "rowId": 17,
    "sl": 13,
    "name": "Abid Hossan khan",
    "phone": "01729079062",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 18,
    "rowId": 18,
    "sl": 14,
    "name": "Harunur Rashid_South Filling",
    "phone": "01718058492",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 19,
    "rowId": 19,
    "sl": 15,
    "name": "Ankel",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 20,
    "rowId": 20,
    "sl": 16,
    "name": "Abu Said",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 21,
    "rowId": 21,
    "sl": 17,
    "name": "Md Kabir Hossain",
    "phone": "01329657823",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 22,
    "rowId": 22,
    "sl": 18,
    "name": "Md Burhan Uddin",
    "phone": "01865588153",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 23,
    "rowId": 23,
    "sl": 19,
    "name": "golam",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 24,
    "rowId": 24,
    "sl": 20,
    "name": "Ariful Haque",
    "phone": "01757474715",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 25,
    "rowId": 25,
    "sl": 21,
    "name": "Al Aqsa Qiraatul Quran Madrasa",
    "phone": "01830548440",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 26,
    "rowId": 26,
    "sl": 22,
    "name": "Narchar Forkania Hafizia Nurani Madrasa",
    "phone": "01829110358",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 27,
    "rowId": 27,
    "sl": 23,
    "name": "AS Computer",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 28,
    "rowId": 28,
    "sl": 24,
    "name": "Maynamati Electric House",
    "phone": "01729683326",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 29,
    "rowId": 29,
    "sl": 25,
    "name": "Nam nai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 30,
    "rowId": 30,
    "sl": 26,
    "name": "Saimon Hasan",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 31,
    "rowId": 31,
    "sl": 27,
    "name": "Former 85 Dag",
    "phone": "01862333833",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 32,
    "rowId": 32,
    "sl": 28,
    "name": "Harunur Rashid",
    "phone": "01718058492",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 33,
    "rowId": 33,
    "sl": 29,
    "name": "Tiens Group Bangladesh",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 34,
    "rowId": 34,
    "sl": 30,
    "name": "Vision Emporium Showroom",
    "phone": "01844665712",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 35,
    "rowId": 35,
    "sl": 31,
    "name": "Radia Mim Hasina",
    "phone": "01838-517025",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 36,
    "rowId": 36,
    "sl": 32,
    "name": "Tofazzal Hossain",
    "phone": "01772231089",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 37,
    "rowId": 37,
    "sl": 33,
    "name": "NABANA LPG Gas",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 38,
    "rowId": 38,
    "sl": 34,
    "name": "Mahin Uddin",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 39,
    "rowId": 39,
    "sl": 35,
    "name": "Ariful",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 40,
    "rowId": 40,
    "sl": 36,
    "name": "M/S Chandpur Tiles & Sanitary",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 41,
    "rowId": 41,
    "sl": 37,
    "name": "Polar Ice Cream",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 42,
    "rowId": 42,
    "sl": 38,
    "name": "Bangladesh Ansar",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 43,
    "rowId": 43,
    "sl": 39,
    "name": "Tanvir",
    "phone": "01883637272",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 44,
    "rowId": 44,
    "sl": 40,
    "name": "Maine Uddin Mamun",
    "phone": "01628053033",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 45,
    "rowId": 45,
    "sl": 41,
    "name": "Abdul Karim",
    "phone": "01825382498",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 46,
    "rowId": 46,
    "sl": 42,
    "name": "Saim",
    "phone": "01856515599",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 47,
    "rowId": 47,
    "sl": 43,
    "name": "Mobassher Ahmed",
    "phone": "01726480436",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 48,
    "rowId": 48,
    "sl": 44,
    "name": "Amir Hussain",
    "phone": "01914348963",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 49,
    "rowId": 49,
    "sl": 45,
    "name": "Md. Rifat Hossain",
    "phone": "01710204516",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 50,
    "rowId": 50,
    "sl": 46,
    "name": "Thamina",
    "phone": "01716888231",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 51,
    "rowId": 51,
    "sl": 47,
    "name": "Jagaran",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 52,
    "rowId": 52,
    "sl": 48,
    "name": "Tanvir Relative",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 53,
    "rowId": 53,
    "sl": 49,
    "name": "Ali Ahmed",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 54,
    "rowId": 54,
    "sl": 50,
    "name": "Shahadat Hossen",
    "phone": "01871155858",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 55,
    "rowId": 55,
    "sl": 51,
    "name": "Master  Kamal",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 56,
    "rowId": 56,
    "sl": 52,
    "name": "Sreebolopur 85 Dag",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 57,
    "rowId": 57,
    "sl": 53,
    "name": "Tarek kazipara",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 58,
    "rowId": 58,
    "sl": 54,
    "name": "Polar icecreem",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 59,
    "rowId": 59,
    "sl": 55,
    "name": "Ibrahim",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 60,
    "rowId": 60,
    "sl": 56,
    "name": "Md Amimul Irfan",
    "phone": "01929139871",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 61,
    "rowId": 61,
    "sl": 57,
    "name": "Bizli Cables",
    "phone": "01896008169",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 62,
    "rowId": 62,
    "sl": 58,
    "name": "Lira Industrial Ent. Ltd",
    "phone": "01841327814",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 63,
    "rowId": 63,
    "sl": 59,
    "name": "Bizli",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 64,
    "rowId": 64,
    "sl": 60,
    "name": "Rasel Lal Mai",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 65,
    "rowId": 65,
    "sl": 61,
    "name": "Sami",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 66,
    "rowId": 66,
    "sl": 62,
    "name": "AYESHA SIDDIKA",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 67,
    "rowId": 67,
    "sl": 63,
    "name": "Agency",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 68,
    "rowId": 68,
    "sl": 64,
    "name": "Rasel",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 69,
    "rowId": 69,
    "sl": 65,
    "name": "Krishi Card List",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 70,
    "rowId": 70,
    "sl": 66,
    "name": "seraj",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 71,
    "rowId": 71,
    "sl": 67,
    "name": "South Comilla",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 72,
    "rowId": 72,
    "sl": 68,
    "name": "TAnia",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 73,
    "rowId": 73,
    "sl": 69,
    "name": "Ahmed",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 74,
    "rowId": 74,
    "sl": 70,
    "name": "Jogonnath",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 75,
    "rowId": 75,
    "sl": 71,
    "name": "Sorif Vai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 76,
    "rowId": 76,
    "sl": 72,
    "name": "id card",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 77,
    "rowId": 77,
    "sl": 73,
    "name": "...........nam nai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 78,
    "rowId": 78,
    "sl": 74,
    "name": "asan",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 79,
    "rowId": 79,
    "sl": 75,
    "name": "hanina",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 80,
    "rowId": 80,
    "sl": 76,
    "name": "sauth comilla",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 81,
    "rowId": 81,
    "sl": 77,
    "name": "Ikbal",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 82,
    "rowId": 82,
    "sl": 78,
    "name": "Khata Customer",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 83,
    "rowId": 83,
    "sl": 79,
    "name": "Smia  xI  Admisstion",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 84,
    "rowId": 84,
    "sl": 80,
    "name": "Mamar Boro Bhai (Acquaintance)",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 85,
    "rowId": 85,
    "sl": 81,
    "name": "Saimon",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 86,
    "rowId": 86,
    "sl": 82,
    "name": "SAmad",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 87,
    "rowId": 87,
    "sl": 83,
    "name": "Haron Vai Xi Addmistion",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 88,
    "rowId": 88,
    "sl": 84,
    "name": "Mamar Bhabi",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 89,
    "rowId": 89,
    "sl": 85,
    "name": "Ilyas Cumilla",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 90,
    "rowId": 90,
    "sl": 86,
    "name": "Vision Electronics",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 91,
    "rowId": 91,
    "sl": 87,
    "name": "south comilla",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 92,
    "rowId": 92,
    "sl": 88,
    "name": "Pad Print",
    "phone": "01875587127",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 93,
    "rowId": 93,
    "sl": 89,
    "name": "Haron vai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 94,
    "rowId": 94,
    "sl": 90,
    "name": "Vision",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 95,
    "rowId": 95,
    "sl": 91,
    "name": "vision",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 96,
    "rowId": 96,
    "sl": 92,
    "name": "Lamal",
    "phone": "01718058492",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 97,
    "rowId": 97,
    "sl": 93,
    "name": "xi Addmisstion",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 98,
    "rowId": 98,
    "sl": 94,
    "name": "Xi Addmition",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 99,
    "rowId": 99,
    "sl": 95,
    "name": "Nurani Muallim Training Center",
    "phone": "01719-855514",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 100,
    "rowId": 100,
    "sl": 96,
    "name": "College Fee",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 101,
    "rowId": 101,
    "sl": 97,
    "name": "Hojor",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 102,
    "rowId": 102,
    "sl": 98,
    "name": "CV Edit",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 103,
    "rowId": 103,
    "sl": 99,
    "name": "Mehedi",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 104,
    "rowId": 104,
    "sl": 100,
    "name": "New Dhaka Store",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 105,
    "rowId": 105,
    "sl": 101,
    "name": "Orpita Motilal Debnat",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 106,
    "rowId": 106,
    "sl": 102,
    "name": "bank",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 107,
    "rowId": 107,
    "sl": 103,
    "name": "dus bangla bank",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 108,
    "rowId": 108,
    "sl": 104,
    "name": "phato",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 109,
    "rowId": 109,
    "sl": 105,
    "name": "Ibn Sina",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 110,
    "rowId": 110,
    "sl": 106,
    "name": "Labbaik Hafizia Madrasa",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 111,
    "rowId": 111,
    "sl": 107,
    "name": "S",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 112,
    "rowId": 112,
    "sl": 108,
    "name": "Bkash /nagod",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 113,
    "rowId": 113,
    "sl": 109,
    "name": "Al Azhar",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 114,
    "rowId": 114,
    "sl": 110,
    "name": "Md Elias Hossain",
    "phone": "01812933614",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 115,
    "rowId": 115,
    "sl": 111,
    "name": "Xi Addmisstion Edit",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 116,
    "rowId": 116,
    "sl": 112,
    "name": "Janina",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 117,
    "rowId": 117,
    "sl": 113,
    "name": "Younus Mia",
    "phone": "01843210450",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 118,
    "rowId": 118,
    "sl": 114,
    "name": "Md. Manzure Alahi",
    "phone": "01708814803",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 119,
    "rowId": 119,
    "sl": 115,
    "name": "Lira Unique",
    "phone": "01329747005",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 120,
    "rowId": 120,
    "sl": 116,
    "name": "Igloo Ice",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 121,
    "rowId": 121,
    "sl": 117,
    "name": "Abu Said Computer",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 122,
    "rowId": 122,
    "sl": 118,
    "name": "Abu Taher",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 123,
    "rowId": 123,
    "sl": 119,
    "name": "Sahidul islam",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 124,
    "rowId": 124,
    "sl": 120,
    "name": "Hilful Fujul Somiti (Joymongolpur)",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 125,
    "rowId": 125,
    "sl": 121,
    "name": "BRAC Migraeion",
    "phone": "01877167805",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 126,
    "rowId": 126,
    "sl": 122,
    "name": "Sahid",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 127,
    "rowId": 127,
    "sl": 123,
    "name": "Safayet Ullah",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 128,
    "rowId": 128,
    "sl": 124,
    "name": "Md Ariful",
    "phone": "01647602409",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 129,
    "rowId": 129,
    "sl": 125,
    "name": "Md Masud Hossain",
    "phone": "01329723519",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 130,
    "rowId": 130,
    "sl": 126,
    "name": "Dr. Jafor",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 131,
    "rowId": 131,
    "sl": 127,
    "name": "MD. RIYAD HASAN",
    "phone": "01927491124",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 132,
    "rowId": 132,
    "sl": 128,
    "name": "Omara ⛽ LPG",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 133,
    "rowId": 133,
    "sl": 129,
    "name": "Mohammad Nazrol  Islam",
    "phone": "01815000195",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 134,
    "rowId": 134,
    "sl": 130,
    "name": "AS  Computer",
    "phone": "01954054042",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 135,
    "rowId": 135,
    "sl": 131,
    "name": "Master Kamal Hossain",
    "phone": "01920195998",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 136,
    "rowId": 136,
    "sl": 132,
    "name": "Center Student",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 137,
    "rowId": 137,
    "sl": 133,
    "name": "Md Mohibbullah Ashick",
    "phone": "01836358020",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 138,
    "rowId": 138,
    "sl": 134,
    "name": "Hasan Trading Corporation",
    "phone": "01335096683",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 139,
    "rowId": 139,
    "sl": 135,
    "name": "Felix Food & Beverage Ltd",
    "phone": "01865588153",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 140,
    "rowId": 140,
    "sl": 136,
    "name": "Ali Ahmed Plaza",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 141,
    "rowId": 141,
    "sl": 137,
    "name": "Md Imran",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 142,
    "rowId": 142,
    "sl": 138,
    "name": "Arshiya Telecom (Anisur Rahman)",
    "phone": "01716559903",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 143,
    "rowId": 143,
    "sl": 139,
    "name": "Mojahid",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 144,
    "rowId": 144,
    "sl": 140,
    "name": "MD. HASAN ABDULLAH NIROB",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 145,
    "rowId": 145,
    "sl": 141,
    "name": "RAHUL DEBNATH",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 146,
    "rowId": 146,
    "sl": 142,
    "name": "Imran",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 147,
    "rowId": 147,
    "sl": 143,
    "name": "Nawsadul",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 148,
    "rowId": 148,
    "sl": 144,
    "name": "LIRA",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 149,
    "rowId": 149,
    "sl": 145,
    "name": "Dhruba Chandra Sarker",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 150,
    "rowId": 150,
    "sl": 146,
    "name": "Email Sent",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 151,
    "rowId": 151,
    "sl": 147,
    "name": "Laptop Malik",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 152,
    "rowId": 152,
    "sl": 148,
    "name": "OMARA LPG",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 153,
    "rowId": 153,
    "sl": 149,
    "name": "~MD RUBEL MIA",
    "phone": "0 1731-602901",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 154,
    "rowId": 154,
    "sl": 150,
    "name": "print",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 155,
    "rowId": 155,
    "sl": 151,
    "name": "Upogela Doctor 116 rom",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 156,
    "rowId": 156,
    "sl": 152,
    "name": "Nadia",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 157,
    "rowId": 157,
    "sl": 153,
    "name": "Sweety",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 158,
    "rowId": 158,
    "sl": 154,
    "name": "Harunur Rashid ar md char",
    "phone": "01718058492",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 159,
    "rowId": 159,
    "sl": 155,
    "name": "Md. Momin Hossain (BM Energy BD Limited)",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 160,
    "rowId": 160,
    "sl": 156,
    "name": "RASEL MIA",
    "phone": "01576774614",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 161,
    "rowId": 161,
    "sl": 157,
    "name": "As",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 162,
    "rowId": 162,
    "sl": 158,
    "name": "Enginer",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 163,
    "rowId": 163,
    "sl": 159,
    "name": "Khokon Paul",
    "phone": "01994466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 164,
    "rowId": 164,
    "sl": 160,
    "name": "Old Paduar Bazar Eidgah Mosque",
    "phone": "01889205926",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 165,
    "rowId": 165,
    "sl": 161,
    "name": "Dr. Master Kamal",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 166,
    "rowId": 166,
    "sl": 162,
    "name": "Victoria Tourism",
    "phone": "01717094659",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 167,
    "rowId": 167,
    "sl": 163,
    "name": "Korim",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 168,
    "rowId": 168,
    "sl": 164,
    "name": "As Computer",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 169,
    "rowId": 169,
    "sl": 165,
    "name": "Omera",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 170,
    "rowId": 170,
    "sl": 166,
    "name": "Abu jor",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 171,
    "rowId": 171,
    "sl": 167,
    "name": "Omera lpg",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 172,
    "rowId": 172,
    "sl": 168,
    "name": "Rakcin Dokander",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 173,
    "rowId": 173,
    "sl": 169,
    "name": "AS",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 174,
    "rowId": 174,
    "sl": 170,
    "name": "Mehedi hasan mahi",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 175,
    "rowId": 175,
    "sl": 171,
    "name": "New Customer (Cash)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 176,
    "rowId": 176,
    "sl": 172,
    "name": "Tareq Refrigeration",
    "phone": "01708379190",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 177,
    "rowId": 177,
    "sl": 173,
    "name": "Md. Joynal",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 178,
    "rowId": 178,
    "sl": 174,
    "name": "Rabby Vai",
    "phone": "01611718785",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 179,
    "rowId": 179,
    "sl": 175,
    "name": "Mainuddin Prodhan",
    "phone": "01913805317",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 180,
    "rowId": 180,
    "sl": 176,
    "name": "TNS",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 181,
    "rowId": 181,
    "sl": 177,
    "name": "Tahsin Store",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 182,
    "rowId": 182,
    "sl": 178,
    "name": "K.M. Moin Uddin",
    "phone": "01626955979",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 183,
    "rowId": 183,
    "sl": 179,
    "name": "Nahid",
    "phone": "01300079268",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 184,
    "rowId": 184,
    "sl": 180,
    "name": "Asianpaint",
    "phone": "01711101946",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 185,
    "rowId": 185,
    "sl": 181,
    "name": "Dr. Faiyaz",
    "phone": "01843713439",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 186,
    "rowId": 186,
    "sl": 182,
    "name": "Tiens Group",
    "phone": "01611718785",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 187,
    "rowId": 187,
    "sl": 183,
    "name": "A K M Ashikuzzaman",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 188,
    "rowId": 188,
    "sl": 184,
    "name": "MD Lovelu",
    "phone": "01912248177",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 189,
    "rowId": 189,
    "sl": 185,
    "name": "Mamunur Rashid (Bangas)",
    "phone": "01778877064",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 190,
    "rowId": 190,
    "sl": 186,
    "name": "Apu",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 191,
    "rowId": 191,
    "sl": 187,
    "name": "Hayata Mahmud (BM Energy LPG)",
    "phone": "01777740196",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 192,
    "rowId": 192,
    "sl": 188,
    "name": "Shifat Shariar (Lira Pip)",
    "phone": "01841327814",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 193,
    "rowId": 193,
    "sl": 189,
    "name": "MR.Mamun",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 194,
    "rowId": 194,
    "sl": 190,
    "name": "United Aygaz  Lpg  Ltd.",
    "phone": "01722217609",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 195,
    "rowId": 195,
    "sl": 191,
    "name": "Omera LPG",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 196,
    "rowId": 196,
    "sl": 192,
    "name": "Hasibul Hasan (Lira Pip)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 197,
    "rowId": 197,
    "sl": 193,
    "name": "Md. Monaem Hosan (UNITEX LP GAS)",
    "phone": "01762867979",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 198,
    "rowId": 198,
    "sl": 194,
    "name": "Md. Manzure Alahi (Omera LPG)",
    "phone": "01708814803",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 199,
    "rowId": 199,
    "sl": 195,
    "name": "AKM L",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 200,
    "rowId": 200,
    "sl": 196,
    "name": "Janntul Naima",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 201,
    "rowId": 201,
    "sl": 197,
    "name": "A.K.M. Lokman",
    "phone": "01771770044",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 202,
    "rowId": 202,
    "sl": 198,
    "name": "Rifat Hossain",
    "phone": "01710204516",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 203,
    "rowId": 203,
    "sl": 199,
    "name": "Khokon",
    "phone": "01992466944",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 204,
    "rowId": 204,
    "sl": 200,
    "name": "Md Ala Uddin (Jamuna LPG)",
    "phone": "01755555365",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 205,
    "rowId": 205,
    "sl": 201,
    "name": "Md. Yasin Arfat",
    "phone": "01590094168",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 206,
    "rowId": 206,
    "sl": 202,
    "name": "Shariar Shifat (Lira pip)",
    "phone": "01841327814",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 207,
    "rowId": 207,
    "sl": 203,
    "name": "Tanha Tiles",
    "phone": "01609296073",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 208,
    "rowId": 208,
    "sl": 204,
    "name": "Md Imran Hossen",
    "phone": "01797410330",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 209,
    "rowId": 209,
    "sl": 205,
    "name": "Sazzad Hasan (Delta LPG)",
    "phone": "01709817321",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 210,
    "rowId": 210,
    "sl": 206,
    "name": "Shiblu",
    "phone": "01646578758",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 211,
    "rowId": 211,
    "sl": 207,
    "name": "Safiul Alam",
    "phone": "01919195287",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 212,
    "rowId": 212,
    "sl": 208,
    "name": "Salam Vai (DBBL)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 213,
    "rowId": 213,
    "sl": 209,
    "name": "Ashick CHD",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 214,
    "rowId": 214,
    "sl": 210,
    "name": "Mahde Hasan Faride",
    "phone": "01790297610",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 215,
    "rowId": 215,
    "sl": 211,
    "name": "Aminul Islam",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 216,
    "rowId": 216,
    "sl": 212,
    "name": "Masum Billah",
    "phone": "01762407869",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 217,
    "rowId": 217,
    "sl": 213,
    "name": "Faroqueo",
    "phone": "01890066678",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 218,
    "rowId": 218,
    "sl": 214,
    "name": "Himo",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 219,
    "rowId": 219,
    "sl": 215,
    "name": "Costomer _ (2)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 220,
    "rowId": 220,
    "sl": 216,
    "name": "Hasibul Hasan (Lira Pipe)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 221,
    "rowId": 221,
    "sl": 217,
    "name": "Nazmul",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 222,
    "rowId": 222,
    "sl": 218,
    "name": "Najmul Islam Nahid",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 223,
    "rowId": 223,
    "sl": 219,
    "name": "Tanvir Ahamed",
    "phone": "01313036759",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 224,
    "rowId": 224,
    "sl": 220,
    "name": "IBN SINA Pharmaceutical PLC",
    "phone": "01687882674",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 225,
    "rowId": 225,
    "sl": 221,
    "name": "Customer (10)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 226,
    "rowId": 226,
    "sl": 222,
    "name": "Mst. Fatematuz Mim",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 227,
    "rowId": 227,
    "sl": 223,
    "name": "Subrata Sharma",
    "phone": "01729079495",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 228,
    "rowId": 228,
    "sl": 224,
    "name": "Customer (4)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 229,
    "rowId": 229,
    "sl": 225,
    "name": "Polar Ice Cream",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 230,
    "rowId": 230,
    "sl": 226,
    "name": "Hasibul Hasan (Lira)",
    "phone": "01329747005",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 231,
    "rowId": 231,
    "sl": 227,
    "name": "Rana Vai",
    "phone": "01732403403",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 232,
    "rowId": 232,
    "sl": 228,
    "name": "PSC _ Certificate",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 233,
    "rowId": 233,
    "sl": 229,
    "name": "‍Sorowar Sharif",
    "phone": "01862333833",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 234,
    "rowId": 234,
    "sl": 230,
    "name": "Md. Tohidul Azad Rafat",
    "phone": "01540647334",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 235,
    "rowId": 235,
    "sl": 231,
    "name": "bondu",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 236,
    "rowId": 236,
    "sl": 232,
    "name": "A.K.M Lokman",
    "phone": "01771770044",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 237,
    "rowId": 237,
    "sl": 233,
    "name": "Kamrul Hasan",
    "phone": "01923661169",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 238,
    "rowId": 238,
    "sl": 234,
    "name": "Mohammed Shamim",
    "phone": "01810029723",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 239,
    "rowId": 239,
    "sl": 235,
    "name": "Bin Mshal Travels",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 240,
    "rowId": 240,
    "sl": 236,
    "name": "Mamunur Rashid",
    "phone": "01778877064",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 241,
    "rowId": 241,
    "sl": 237,
    "name": "Saymon Bair Baiyap",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 242,
    "rowId": 242,
    "sl": 238,
    "name": "Bandupy Sumaiya islam",
    "phone": "01863574562",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 243,
    "rowId": 243,
    "sl": 239,
    "name": "Asianprint",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 244,
    "rowId": 244,
    "sl": 240,
    "name": "Rahim Bhuiyan",
    "phone": "01647512928",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 245,
    "rowId": 245,
    "sl": 241,
    "name": "Customer (2)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 246,
    "rowId": 246,
    "sl": 242,
    "name": "Ali Ahmed Plaza",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 247,
    "rowId": 247,
    "sl": 243,
    "name": "Talha",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 248,
    "rowId": 248,
    "sl": 244,
    "name": "Imran _ Vai",
    "phone": "01797410330",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 249,
    "rowId": 249,
    "sl": 245,
    "name": "Customer (7)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 250,
    "rowId": 250,
    "sl": 246,
    "name": "Customer (3)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 251,
    "rowId": 251,
    "sl": 247,
    "name": "Md Mozahidul Islam",
    "phone": "01812359180",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 252,
    "rowId": 252,
    "sl": 248,
    "name": "Sohorab Hazari",
    "phone": "01991409177",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 253,
    "rowId": 253,
    "sl": 249,
    "name": "Golam Rabbani",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 254,
    "rowId": 254,
    "sl": 250,
    "name": "Masum Farniture",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 255,
    "rowId": 255,
    "sl": 251,
    "name": "Bundur Bodo Bai",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 256,
    "rowId": 256,
    "sl": 252,
    "name": "Coconat Dokander",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 257,
    "rowId": 257,
    "sl": 253,
    "name": "Mr. Mamun",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 258,
    "rowId": 258,
    "sl": 254,
    "name": "Jomuna LPG",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 259,
    "rowId": 259,
    "sl": 255,
    "name": "Sami Alam",
    "phone": "01602771630",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 260,
    "rowId": 260,
    "sl": 256,
    "name": "Md Rana",
    "phone": "01313036759",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 261,
    "rowId": 261,
    "sl": 257,
    "name": "Hazi Asu Mia Hujur",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 262,
    "rowId": 262,
    "sl": 258,
    "name": "Mithun Ahmed",
    "phone": "01897790553",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 263,
    "rowId": 263,
    "sl": 259,
    "name": "Rabbi (Tines)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 264,
    "rowId": 264,
    "sl": 260,
    "name": "Harunur Rashid",
    "phone": "মনে নেই",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 265,
    "rowId": 265,
    "sl": 261,
    "name": "MOTALEB HOSSEN",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 266,
    "rowId": 266,
    "sl": 262,
    "name": "Hafez Shahidul Islam",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 267,
    "rowId": 267,
    "sl": 263,
    "name": "Irfan Sair",
    "phone": "01929139871",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 268,
    "rowId": 268,
    "sl": 264,
    "name": "Nid Carecction",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 269,
    "rowId": 269,
    "sl": 265,
    "name": "Nesaria Housing Welfare Society",
    "phone": "01684678220",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 270,
    "rowId": 270,
    "sl": 266,
    "name": "New Apu",
    "phone": "01754307940",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 271,
    "rowId": 271,
    "sl": 267,
    "name": "majumder",
    "phone": "01711155114",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 272,
    "rowId": 272,
    "sl": 268,
    "name": "Ramjan",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 273,
    "rowId": 273,
    "sl": 269,
    "name": "Joynal Sir",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 274,
    "rowId": 274,
    "sl": 270,
    "name": "SL Soleman",
    "phone": "01858537438",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 275,
    "rowId": 275,
    "sl": 271,
    "name": "Kazi",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 276,
    "rowId": 276,
    "sl": 272,
    "name": "A.K.M Ashikuzzaman (Omara LPG)",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 277,
    "rowId": 277,
    "sl": 273,
    "name": "Markazur Amjad",
    "phone": "01754738455",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 278,
    "rowId": 278,
    "sl": 274,
    "name": "Abdur Rahman",
    "phone": "01716370285",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 279,
    "rowId": 279,
    "sl": 275,
    "name": "Akram",
    "phone": "01904142370",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 280,
    "rowId": 280,
    "sl": 276,
    "name": "Haji Asumiya Bhuiyan Madrasa",
    "phone": "01626955979",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 281,
    "rowId": 281,
    "sl": 277,
    "name": "Nesariya Housing",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 282,
    "rowId": 282,
    "sl": 278,
    "name": "Customer",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 283,
    "rowId": 283,
    "sl": 279,
    "name": "Kabir Vai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 284,
    "rowId": 284,
    "sl": 280,
    "name": "NGO",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 285,
    "rowId": 285,
    "sl": 281,
    "name": "Azad",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 286,
    "rowId": 286,
    "sl": 282,
    "name": "Cash Customer (6)",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 287,
    "rowId": 287,
    "sl": 283,
    "name": "Ansar BD",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 288,
    "rowId": 288,
    "sl": 284,
    "name": "Cash Customer (2)",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 289,
    "rowId": 289,
    "sl": 285,
    "name": "Dr. Japor",
    "phone": "01712216737",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 290,
    "rowId": 290,
    "sl": 286,
    "name": "Joynal Vai",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 291,
    "rowId": 291,
    "sl": 287,
    "name": "A.K.M Ashikuzzaman",
    "phone": "01787673976",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 292,
    "rowId": 292,
    "sl": 288,
    "name": "NAsir Uddin",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 293,
    "rowId": 293,
    "sl": 289,
    "name": "Amirul Islam",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 294,
    "rowId": 294,
    "sl": 290,
    "name": "IBN Sina",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 295,
    "rowId": 295,
    "sl": 291,
    "name": "J A Sagor",
    "phone": "01581703822",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 296,
    "rowId": 296,
    "sl": 292,
    "name": "Cash Customer (4)",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 297,
    "rowId": 297,
    "sl": 293,
    "name": "Rahidul Islam (Rana)",
    "phone": "01732403403",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 298,
    "rowId": 298,
    "sl": 294,
    "name": "Omara LPG",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 299,
    "rowId": 299,
    "sl": 295,
    "name": "Regular Customer (Old)",
    "phone": "Whatapp A",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 300,
    "rowId": 300,
    "sl": 296,
    "name": "MD.Shahadat Hossain",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 301,
    "rowId": 301,
    "sl": 297,
    "name": "Samiya Akther",
    "phone": "01759375921",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 302,
    "rowId": 302,
    "sl": 298,
    "name": "Bandhupir Jamai",
    "phone": "মনে নেই",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 303,
    "rowId": 303,
    "sl": 299,
    "name": "VIP Salon",
    "phone": "01623793333",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 304,
    "rowId": 304,
    "sl": 300,
    "name": "Cash Customer (11)",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  },
  {
    "id": 305,
    "rowId": 305,
    "sl": 301,
    "name": "Younus Manager",
    "phone": "",
    "address": "Paduar Bazar, Cumilla"
  }
];

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
