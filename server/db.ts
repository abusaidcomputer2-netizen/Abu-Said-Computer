import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database;
const DB_FILE = path.resolve(process.cwd(), 'as_computer.db');

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      phone TEXT DEFAULT '',
      permissions TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sl INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sl INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      selling_price REAL NOT NULL DEFAULT 0,
      cost_price REAL NOT NULL DEFAULT 0,
      stock_qty REAL DEFAULT 0,
      low_stock_limit REAL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no INTEGER UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      user_name TEXT NOT NULL,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      customer_address TEXT DEFAULT '',
      category_summary TEXT NOT NULL,
      description TEXT DEFAULT '',
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      paid REAL NOT NULL DEFAULT 0,
      due REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      invoice_no INTEGER NOT NULL,
      category TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      qty REAL NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS due_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id TEXT NOT NULL,
      date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT DEFAULT '',
      customer_address TEXT DEFAULT '',
      transaction_type TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_dr REAL NOT NULL DEFAULT 0,
      paid_cr REAL NOT NULL DEFAULT 0,
      user_name TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Stationery Products',
      qty REAL NOT NULL DEFAULT 1,
      unit_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      supplier TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount REAL NOT NULL,
      user_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cash_closings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closing_id TEXT NOT NULL,
      date TEXT UNIQUE NOT NULL,
      closed_at TEXT NOT NULL,
      user_name TEXT NOT NULL,
      opening_cash REAL NOT NULL DEFAULT 0,
      prev_shortage_deducted REAL NOT NULL DEFAULT 0,
      sales_inflow REAL NOT NULL DEFAULT 0,
      due_inflow REAL NOT NULL DEFAULT 0,
      total_inflow REAL NOT NULL DEFAULT 0,
      expense_outflow REAL NOT NULL DEFAULT 0,
      expected_cash REAL NOT NULL DEFAULT 0,
      actual_cash REAL NOT NULL DEFAULT 0,
      difference REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      notes TEXT DEFAULT '',
      denominations_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);
    CREATE INDEX IF NOT EXISTS idx_due_customer ON due_ledger(customer_name);
    CREATE INDEX IF NOT EXISTS idx_due_date ON due_ledger(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
  `);

  // Seed default data if empty
  seedInitialData();
  saveDatabase();

  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function seedInitialData(): void {
  // Check users
  const userCount = db.exec("SELECT COUNT(*) as count FROM users")[0]?.values[0][0] as number;
  if (userCount === 0) {
    db.run(`
      INSERT INTO users (username, password_hash, role, phone, permissions) VALUES
      ('Md Abu Said', '12345', 'admin', '01904142370', 'all'),
      ('Md Sujon', '2008', 'staff', '01800000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'),
      ('Md Saimon Hasan', '1020', 'staff', '01700000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print');
    `);
  }

  // Check products
  const productCount = db.exec("SELECT COUNT(*) as count FROM products")[0]?.values[0][0] as number;
  if (productCount === 0) {
    db.run(`
      INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES
      (1, 'Photocopy', 'A4 B/W Photocopy (Single)', 3, 1, NULL, 5),
      (2, 'Photocopy', 'A4 B/W Photocopy (Double)', 5, 1.8, NULL, 5),
      (3, 'Photocopy', 'Legal B/W Photocopy', 4, 1.5, NULL, 5),
      (4, 'Photocopy', 'A4 Color Print (Glossy)', 15, 6, NULL, 5),
      (5, 'Photocopy', 'Document Scanning & Email', 20, 2, NULL, 5),
      (6, 'Photocopy', 'Lamination A4', 20, 7, NULL, 5),
      
      (1, 'Online Application', 'Job Application Form Fillup', 150, 0, NULL, 5),
      (2, 'Online Application', 'Birth Registration / Shonod', 100, 0, NULL, 5),
      (3, 'Online Application', 'NID Correction / Re-issue', 200, 0, NULL, 5),
      (4, 'Online Application', 'Passport Online Application', 300, 0, NULL, 5),
      (5, 'Online Application', 'College / University Admission', 150, 0, NULL, 5),
      (6, 'Online Application', 'Police Clearance Application', 250, 0, NULL, 5),

      (1, 'Stationery Products', 'Bashundhara A4 Paper 80GSM (Ream)', 380, 320, 45, 5),
      (2, 'Stationery Products', 'PaperOne A4 70GSM (Ream)', 350, 295, 30, 5),
      (3, 'Stationery Products', 'Legal Paper Ream (80GSM)', 450, 390, 18, 5),
      (4, 'Stationery Products', 'Matador Ball Pen (Black/Blue)', 5, 3.8, 120, 20),
      (5, 'Stationery Products', 'Clear Plastic Document File', 15, 8, 80, 15),
      (6, 'Stationery Products', 'Gel Pen (Pilot G2)', 60, 45, 25, 5),
      (7, 'Stationery Products', 'Lamination Pouch A4 (Pkt 100pcs)', 350, 280, 12, 3),
      (8, 'Stationery Products', 'Stamp Pad Ink Blue', 40, 25, 15, 3),
      (9, 'Stationery Products', 'Spiral Binding Sheet A4', 8, 4, 150, 25),
      (10, 'Stationery Products', 'Stapler Machine No. 10', 85, 60, 10, 2);
    `);
  }

  // Check customers
  const customerCount = db.exec("SELECT COUNT(*) as count FROM customers")[0]?.values[0][0] as number;
  if (customerCount === 0) {
    db.run(`
      INSERT INTO customers (sl, name, phone, address) VALUES
      (1, 'Al Aqsa Qiraatul Quran Madrasa', '01819234567', 'Paduar Bazar, Cumilla'),
      (2, 'Hasan Trading Corporation', '01711223344', 'Kazi Para, Sadar Dakshin, Cumilla'),
      (3, 'Noorani Muallim Training Center', '01912345678', 'Paduar Bazar, Cumilla'),
      (4, 'Ali Ahmed', '01623456789', 'Ramgati, Lakshmipur'),
      (5, 'Darul Ihsan Madrasa', '01734567890', 'Paduar Bazar, Cumilla'),
      (6, 'Kabir Enterprise', '01845678901', 'Tombulpur, Cumilla');
    `);
  }

  // Check sales
  const salesCount = db.exec("SELECT COUNT(*) as count FROM sales")[0]?.values[0][0] as number;
  if (salesCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('en-US', { hour12: true });

    db.run(`
      INSERT INTO sales (
        invoice_no, timestamp, date, user_name, customer_id, customer_name, customer_phone, customer_address,
        category_summary, description, subtotal, discount, grand_total, paid, due, items_json
      ) VALUES
      (4001, '12-Oct-2026 10:30:15 AM', '2026-10-12', 'Md Abu Said', 1, 'Al Aqsa Qiraatul Quran Madrasa', '01819234567', 'Paduar Bazar, Cumilla',
       'Photocopy, Stationery Products', 'Question papers print & paper reams', 1850, 50, 1800, 1000, 800,
       '[{"category":"Photocopy","name":"A4 B/W Photocopy (Single)","price":3,"costPrice":1,"qty":200,"total":600},{"category":"Stationery Products","name":"Bashundhara A4 Paper 80GSM (Ream)","price":380,"costPrice":320,"qty":2,"total":760},{"category":"Photocopy","name":"Lamination A4","price":20,"costPrice":7,"qty":24,"total":480}]'
      ),
      (4002, '13-Oct-2026 02:15:40 PM', '2026-10-13', 'Md Sujon', 2, 'Hasan Trading Corporation', '01711223344', 'Kazi Para, Sadar Dakshin, Cumilla',
       'Online Application', 'Trade license renewal & online tax filing', 950, 0, 950, 950, 0,
       '[{"category":"Online Application","name":"Job Application Form Fillup","price":150,"costPrice":0,"qty":3,"total":450},{"category":"Online Application","name":"Birth Registration / Shonod","price":100,"costPrice":0,"qty":5,"total":500}]'
      ),
      (4003, '14-Oct-2026 09:45:00 AM', '${today}', 'Md Abu Said', 3, 'Noorani Muallim Training Center', '01912345678', 'Paduar Bazar, Cumilla',
       'Photocopy, Stationery Products', 'Syllabus printing and binding files', 1250, 50, 1200, 700, 500,
       '[{"category":"Photocopy","name":"A4 B/W Photocopy (Double)","price":5,"costPrice":1.8,"qty":150,"total":750},{"category":"Stationery Products","name":"Clear Plastic Document File","price":15,"costPrice":8,"qty":20,"total":300},{"category":"Photocopy","name":"Spiral Binding Sheet A4","price":8,"costPrice":4,"qty":25,"total":200}]'
      );
    `);

    // Insert corresponding due ledger entries
    db.run(`
      INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp) VALUES
      ('INV-4001', '2026-10-12', 'Al Aqsa Qiraatul Quran Madrasa', '01819234567', 'Paduar Bazar, Cumilla', 'Memo / Bill', 'Memo #4001 [Question papers print & paper reams]', 800, 0, 'Md Abu Said', '2026-10-12 10:30:15'),
      ('INV-4003', '${today}', 'Noorani Muallim Training Center', '01912345678', 'Paduar Bazar, Cumilla', 'Memo / Bill', 'Memo #4003 [Syllabus printing and binding files]', 500, 0, 'Md Abu Said', '${today} 09:45:00'),
      ('PAY-1001', '2026-10-13', 'Al Aqsa Qiraatul Quran Madrasa', '01819234567', 'Paduar Bazar, Cumilla', 'Payment Received', 'Cash payment at counter', 0, 300, 'Md Sujon', '2026-10-13 16:20:00');
    `);

    // Insert sample expenses
    db.run(`
      INSERT INTO expenses (expense_id, timestamp, date, category, description, amount, user_name) VALUES
      ('EXP-1001', '2026-10-10 11:00:00', '2026-10-10', 'Shop Rent', 'Shop monthly advance rent part', 3000, 'Md Abu Said'),
      ('EXP-1002', '2026-10-11 14:30:00', '2026-10-11', 'Electricity Bill', 'Palli Bidyut September bill', 1850, 'Md Abu Said'),
      ('EXP-1003', '2026-10-12 17:15:00', '2026-10-12', 'Tea & Snacks', 'Staff afternoon tea & guest hospitality', 120, 'Md Sujon'),
      ('EXP-1004', '2026-10-14 10:00:00', '${today}', 'Machine Maintenance', 'Photocopy drum cleaning & roller lube', 350, 'Md Abu Said');
    `);

    // Insert sample purchases
    db.run(`
      INSERT INTO purchases (purchase_id, date, timestamp, product_name, category, qty, unit_cost, total_cost, supplier, notes, user_name) VALUES
      ('PUR-1001', '2026-10-11', '2026-10-11 12:00:00', 'Bashundhara A4 Paper 80GSM (Ream)', 'Stationery Products', 20, 320, 6400, 'Dhaka Paper Mart', 'Stock replenishment invoice #982', 'Md Abu Said'),
      ('PUR-1002', '2026-10-13', '2026-10-13 15:30:00', 'Matador Ball Pen (Black/Blue)', 'Stationery Products', 100, 3.8, 380, 'Cumilla Stationers', 'Pen box delivery', 'Md Abu Said');
    `);
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
