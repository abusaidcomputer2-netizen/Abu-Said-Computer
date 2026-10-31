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
  // Ensure default users exist
  const userCount = db.exec("SELECT COUNT(*) as count FROM users")[0]?.values[0][0] as number;
  if (userCount === 0) {
    db.run(`
      INSERT INTO users (username, password_hash, role, phone, permissions) VALUES
      ('Md Abu Said', '12345', 'admin', '01904142370', 'all'),
      ('Md Sujon', '2008', 'staff', '01800000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'),
      ('Md Saimon Hasan', '1020', 'staff', '01700000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print');
    `);
  }

  // Ensure default products exist for Abu Said Computer
  const prodCount = db.exec("SELECT COUNT(*) as count FROM products")[0]?.values[0][0] as number;
  if (prodCount === 0) {
    db.run(`
      INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES
      (1, 'Photocopy', 'A4 Photocopy', 2.5, 1.2, NULL, 5),
      (2, 'Photocopy', 'A4 Photocopy (Duplex)', 4, 1.8, NULL, 5),
      (3, 'Photocopy', 'LG Photocopy', 4, 1.8, NULL, 5),
      (4, 'Photocopy', 'Legal Photocopy (Duplex)', 5, 2.2, NULL, 5),
      (5, 'Photocopy', 'Color Print', 10, 4, NULL, 5),
      (6, 'Photocopy', 'A4 Color Print', 10, 4, NULL, 5),
      (7, 'Photocopy', 'LG Color Print', 15, 6, NULL, 5),
      (8, 'Photocopy', 'Black & White Print', 5, 2, NULL, 5),
      (9, 'Photocopy', 'PP Size Photo', 10, 3, NULL, 5),
      (10, 'Photocopy', 'Photo Print (Glossy 4R)', 30, 12, NULL, 5),
      (11, 'Photocopy', 'A4 Lamination', 30, 10, NULL, 5),
      (12, 'Photocopy', 'NID Card Lamination', 40, 12, NULL, 5),
      (13, 'Photocopy', 'Legal Size Lamination', 50, 15, NULL, 5),
      (14, 'Photocopy', 'PVC ID Card Print', 100, 35, NULL, 5),
      (15, 'Photocopy', 'Computer Compose & Typing', 20, 0, NULL, 5),
      (16, 'Photocopy', 'Stamp Composing & Typing', 100, 0, NULL, 5),
      (17, 'Photocopy', 'CV Compose', 100, 0, NULL, 5),
      (18, 'Photocopy', 'PDF File Editor', 50, 0, NULL, 5),
      (19, 'Photocopy', 'Service Charge', 25, 0, NULL, 5),
      (20, 'Photocopy', 'Sticker Paper Print', 20, 8, NULL, 5),

      (1, 'Online Application', 'Scan & Email Service', 10, 0, NULL, 5),
      (2, 'Online Application', 'Job Online Application', 100, 0, NULL, 5),
      (3, 'Online Application', 'Passport Online Application', 150, 0, NULL, 5),
      (4, 'Online Application', 'NID Correction Application', 190, 0, NULL, 5),
      (5, 'Online Application', 'NID Card Download', 50, 0, NULL, 5),
      (6, 'Online Application', 'Birth Certificate Application', 50, 0, NULL, 5),
      (7, 'Online Application', 'University Admission Form', 150, 0, NULL, 5),
      (8, 'Online Application', 'XI Class Admission', 100, 0, NULL, 5),
      (9, 'Online Application', 'Income Tax Return', 200, 0, NULL, 5),
      (10, 'Online Application', 'Land Tax Payment', 35, 0, NULL, 5),
      (11, 'Online Application', 'Driving License / BRTA Service', 300, 0, NULL, 5),
      (12, 'Online Application', 'Online Application', 100, 0, NULL, 5),

      (1, 'Stationery Products', 'A4 Size 70 GSM Offset Paper', 360, 330, NULL, 5),
      (2, 'Stationery Products', 'Paper Ream A4 (80 GSM)', 480, 420, NULL, 5),
      (3, 'Stationery Products', 'Paper Ream Legal (80 GSM)', 550, 480, NULL, 5),
      (4, 'Stationery Products', '100 Tk Stamp Paper', 120, 105, NULL, 5),
      (5, 'Stationery Products', '50 Tk Stamp Paper', 65, 55, NULL, 5),
      (6, 'Stationery Products', 'Court File General', 20, 15, NULL, 10),
      (7, 'Stationery Products', 'Clear File Folder', 20, 14, NULL, 10),
      (8, 'Stationery Products', 'Plastic File Folder', 25, 15, NULL, 10),
      (9, 'Stationery Products', 'A4 Size Envelope', 5, 3, NULL, 20),
      (10, 'Stationery Products', 'Letter Envelope', 5, 2.5, NULL, 25),
      (11, 'Stationery Products', 'Ballpen (Matador All-Time)', 6, 4.5, NULL, 20),
      (12, 'Stationery Products', 'Hi-School Ball Pen', 5, 4, NULL, 15),
      (13, 'Stationery Products', 'Fevicol Clear Glue - 50 gm', 25, 18, NULL, 5),
      (14, 'Stationery Products', 'Fevicol MR Glue', 20, 15, NULL, 5),
      (15, 'Stationery Products', 'Fiber Frame', 200, 150, NULL, 3),
      (16, 'Stationery Products', 'Spiral Binding Ring', 40, 20, NULL, 10),
      (17, 'Stationery Products', 'Carbon Paper', 5, 3, NULL, 10),

      (1, 'Servicing', 'Windows 10/11 Setup', 300, 0, NULL, 5),
      (2, 'Servicing', 'PC Repair & Servicing', 200, 0, NULL, 5),
      (3, 'Servicing', 'Printer Repair Service', 300, 0, NULL, 5),
      (4, 'Servicing', 'Laptop Cleaning & Thermal Paste', 200, 0, NULL, 5);
    `);
  }

  // Ensure default customer accounts exist
  const custCount = db.exec("SELECT COUNT(*) as count FROM customers")[0]?.values[0][0] as number;
  if (custCount === 0) {
    db.run(`
      INSERT INTO customers (sl, name, phone, address) VALUES
      (1, 'Cash Customer', '01904142370', 'Paduar Bazar, Cumilla'),
      (2, 'Md Abu Said', '01904142370', 'Paduar Bazar, Cumilla'),
      (3, 'Md Sujon', '01812345678', 'Paduar Bazar, Cumilla'),
      (4, 'Al-Amin Traders', '01711223344', 'Paduar Bazar Biswa Road, Cumilla'),
      (5, 'General Customer', '01900000000', 'Cumilla Sadar South');
    `);
  }

  // Set permanent Google Apps Script webhook URL
  db.run(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('apps_script_url', 'https://script.google.com/macros/s/AKfycbxpPzExy1dxtfFNivYU4rVuNGQLCSD8DQEnMGFYugplvK_i4NCZ4GuGYuIUZtbjhUyp4g/exec');
  `);
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
