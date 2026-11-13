import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { populateMasterData } from './seedAllData.js';

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
      (1, 'Photocopy', 'Color Print', 10, 0, NULL, 5),
      (2, 'Photocopy', 'Black & White Print', 5, 0, NULL, 5),
      (3, 'Photocopy', 'A4 Photocopy', 3, 0, NULL, 5),
      (4, 'Photocopy', 'A4 Photocopy (Duplex)', 4, 0, NULL, 5),
      (5, 'Photocopy', 'LG Photocopy', 4, 0, NULL, 5),
      (6, 'Photocopy', 'Legal Photocopy (Duplex)', 5, 0, NULL, 5),
      (7, 'Photocopy', 'PP Size Photo', 10, 0, NULL, 5),
      (8, 'Photocopy', 'PDF File Editor', 50, 0, NULL, 5),
      (9, 'Photocopy', 'Service Charge', 0, 0, NULL, 5),
      (10, 'Photocopy', 'CV Compose', 100, 0, NULL, 5),
      (11, 'Photocopy', 'Computer Compose & Typing', 50, 0, NULL, 5),
      (12, 'Photocopy', 'Stamp Composing & Typing', 100, 0, NULL, 5),
      (13, 'Photocopy', 'NID Card Lamination', 40, 0, NULL, 5),
      (14, 'Photocopy', 'A4 Lamination', 30, 0, NULL, 5),
      (15, 'Photocopy', 'Legal Lamination', 40, 0, NULL, 5),
      (16, 'Photocopy', 'PVC ID Card Print', 200, 0, NULL, 5),
      (17, 'Photocopy', 'Sticker Paper Print', 30, 0, NULL, 5),
      (18, 'Photocopy', 'JSC/SSC Certificate', 200, 0, NULL, 5),

      (1, 'Online Application', 'XI Class Admission', 100, 0, NULL, 5),
      (2, 'Online Application', 'Online Application', 100, 0, NULL, 5),
      (3, 'Online Application', 'Job Application', 100, 0, NULL, 5),
      (4, 'Online Application', 'Birth Certificate Apply', 100, 0, NULL, 5),
      (5, 'Online Application', 'Passport Online Apply', 200, 0, NULL, 5),
      (6, 'Online Application', 'NID Application', 200, 0, NULL, 5),
      (7, 'Online Application', 'Nid Correction Application', 200, 0, NULL, 5),
      (8, 'Online Application', 'NID Card Download', 100, 0, NULL, 5),
      (9, 'Online Application', 'NID Server Copy', 100, 0, NULL, 5),
      (10, 'Online Application', 'Land Tax Payment', 100, 0, NULL, 5),
      (11, 'Online Application', 'Income tax return', 500, 0, NULL, 5),
      (12, 'Online Application', 'Scan & Email Service', 10, 0, NULL, 5),

      (1, 'Stationery Products', '50 Tk Stamp Paper', 70, 0, NULL, 5),
      (2, 'Stationery Products', '100 Tk Stamp Paper', 120, 0, NULL, 5),
      (3, 'Stationery Products', 'Letter Envelope', 5, 0, NULL, 5),
      (4, 'Stationery Products', 'A4 Size Envelope', 5, 0, NULL, 5),
      (5, 'Stationery Products', 'Clear File Folder', 20, 0, NULL, 5),
      (6, 'Stationery Products', 'Sticker Paper', 20, 0, NULL, 5),
      (7, 'Stationery Products', 'A4 Size 80 GSM Offset Paper', 460, 0, NULL, 5),
      (8, 'Stationery Products', 'A4 Size 70 GSM Offset Paper', 360, 0, NULL, 5),
      (9, 'Stationery Products', 'A4 Size 100 GSM Offset Paper', 550, 0, NULL, 5),
      (10, 'Stationery Products', 'Matador All Time Ball Pen', 6, 0, NULL, 5),
      (11, 'Stationery Products', 'Hi-School Ball Pen', 5, 0, NULL, 5),
      (12, 'Stationery Products', 'Fevicol Clear Glue - 50 gm', 25, 0, NULL, 5),
      (13, 'Stationery Products', 'Fevicol MR Glue', 20, 0, NULL, 5),
      (14, 'Stationery Products', 'Court File General', 20, 0, NULL, 5),
      (15, 'Stationery Products', 'A4 Management File', 20, 0, NULL, 5),
      (16, 'Stationery Products', 'Fiber Frame', 250, 0, NULL, 5),
      (17, 'Stationery Products', 'LG Size 70 GSM Offset Paper', 480, 0, NULL, 5);
    `);
  }

  // Ensure historical master sales exist
  const salesCount = (db.exec("SELECT COUNT(*) as count FROM sales")[0]?.values[0][0] as number) || 0;
  if (salesCount < 50) {
    populateMasterData(db);
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
