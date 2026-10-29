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
      (1, 'Photocopy', 'A4 Normal Photocopy', 5, 2, NULL, 5),
      (2, 'Photocopy', 'A4 Both Side Photocopy', 8, 3, NULL, 5),
      (3, 'Photocopy', 'Legal Size Photocopy', 8, 3, NULL, 5),
      (4, 'Photocopy', 'A4 Color Print', 20, 8, NULL, 5),
      (5, 'Photocopy', 'Photo Print (Glossy 4R)', 30, 12, NULL, 5),
      (6, 'Photocopy', 'Lamination (A4)', 25, 10, NULL, 5),
      (1, 'Online Application', 'Job Online Application', 100, 0, NULL, 5),
      (2, 'Online Application', 'University Admission Form', 150, 0, NULL, 5),
      (3, 'Online Application', 'NID Correction / Download', 100, 0, NULL, 5),
      (4, 'Online Application', 'Passport Online Application', 250, 0, NULL, 5),
      (5, 'Online Application', 'Birth Certificate Application', 100, 0, NULL, 5),
      (6, 'Online Application', 'Driving License / BRTA Service', 300, 0, NULL, 5),
      (1, 'Stationery Products', 'Paper Ream A4 (80 GSM)', 480, 420, 35, 5),
      (2, 'Stationery Products', 'Paper Ream A4 (70 GSM)', 420, 370, 25, 5),
      (3, 'Stationery Products', 'Paper Ream Legal (80 GSM)', 550, 480, 15, 5),
      (4, 'Stationery Products', 'Ballpen (Matador All-Time)', 6, 4.5, 120, 20),
      (5, 'Stationery Products', 'Spiral Binding Ring', 40, 20, 50, 10),
      (6, 'Stationery Products', 'Plastic File Folder', 25, 15, 60, 15);
    `);
  }

  // Ensure default customer accounts exist
  const custCount = db.exec("SELECT COUNT(*) as count FROM customers")[0]?.values[0][0] as number;
  if (custCount === 0) {
    db.run(`
      INSERT INTO customers (sl, name, phone, address) VALUES
      (1, 'Md Abu Said', '01904142370', 'Paduar Bazar, Cumilla'),
      (2, 'Md Sujon', '01812345678', 'Paduar Bazar, Cumilla'),
      (3, 'Al-Amin Traders', '01711223344', 'Paduar Bazar Biswa Road, Cumilla'),
      (4, 'General Customer', '01900000000', 'Cumilla Sadar South');
    `);
  }

  // Seed October 2026 sales & due records from provided CSV if sales table is empty
  seedOctoberSalesData();

  // Set permanent Google Apps Script webhook URL
  db.run(`
    INSERT OR REPLACE INTO app_settings (key, value)
    VALUES ('apps_script_url', 'https://script.google.com/macros/s/AKfycbxpPzExy1dxtfFNivYU4rVuNGQLCSD8DQEnMGFYugplvK_i4NCZ4GuGYuIUZtbjhUyp4g/exec');
  `);
}

function parseCSVLines(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (insideQuote && next === '"') {
        cur += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (c === ',' && !insideQuote) {
      row.push(cur.trim());
      cur = '';
    } else if ((c === '\n' || c === '\r') && !insideQuote) {
      if (c === '\r' && next === '\n') i++;
      row.push(cur.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    lines.push(row);
  }
  return lines;
}

function seedOctoberSalesData(): void {
  const salesCount = db.exec("SELECT COUNT(*) as count FROM sales")[0]?.values[0][0] as number;
  if (salesCount > 0) return;

  const csvPath = path.resolve(process.cwd(), 'public/assets/aistudio/AS_Computer_Shop_Management_System_40d860e8');
  if (!fs.existsSync(csvPath)) return;

  try {
    const csvRaw = fs.readFileSync(csvPath, 'utf8');
    const allLines = parseCSVLines(csvRaw);
    const rows = allLines.slice(1).filter(r => {
      const ts = r[1] || '';
      return ts.startsWith('2026-10') || ts.includes('/10/2026') || ts.includes('-10-2026');
    });

    if (rows.length === 0) return;

    const customerMap = new Map<string, { name: string; phone: string; address: string }>();
    customerMap.set('Md Abu Said', { name: 'Md Abu Said', phone: '01904142370', address: 'Paduar Bazar, Cumilla' });
    customerMap.set('Md Sujon', { name: 'Md Sujon', phone: '01812345678', address: 'Paduar Bazar, Cumilla' });
    customerMap.set('Al-Amin Traders', { name: 'Al-Amin Traders', phone: '01711223344', address: 'Paduar Bazar Biswa Road, Cumilla' });

    const productMap = new Map<string, { category: string; name: string; price: number; costPrice: number; stockQty: number | null; lowStockLimit: number }>();

    const standardProducts = [
      { category: 'Photocopy', name: 'A4 Photocopy', price: 2.5, costPrice: 1.2, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'A4 Photocopy (Duplex)', price: 4, costPrice: 1.8, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'LG Photocopy', price: 4, costPrice: 1.8, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Legal Photocopy (Duplex)', price: 5, costPrice: 2.2, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Color Print', price: 10, costPrice: 4, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Lg Colour Print', price: 15, costPrice: 6, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Black & White Print', price: 5, costPrice: 2, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'PP Size Photo', price: 10, costPrice: 3, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'A4 Lamination', price: 30, costPrice: 10, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'NID Card Lamination', price: 40, costPrice: 12, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'PVC ID Card Print', price: 100, costPrice: 35, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Computer Compose & Typing', price: 15, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Stamp Composing & Typing', price: 100, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'CV Compose', price: 100, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'PDF File Editor', price: 50, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Service Charge', price: 25, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Photocopy', name: 'Sticker Paper Print', price: 20, costPrice: 8, stockQty: null, lowStockLimit: 5 },
      
      { category: 'Online Application', name: 'Scan & Email Service', price: 10, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Job Application', price: 100, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Passport Online Apply', price: 150, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Nid Correction Application', price: 190, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Birth Certificate Apply', price: 40, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'NID Application', price: 150, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Income tax return', price: 200, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Land Tax Payment', price: 35, costPrice: 0, stockQty: null, lowStockLimit: 5 },
      { category: 'Online Application', name: 'Online Application', price: 100, costPrice: 0, stockQty: null, lowStockLimit: 5 },

      { category: 'Stationery Products', name: 'A4 Size 70 GSM Offset Paper', price: 360, costPrice: 330, stockQty: 42, lowStockLimit: 5 },
      { category: 'Stationery Products', name: 'Paper Ream A4 (80 GSM)', price: 480, costPrice: 420, stockQty: 35, lowStockLimit: 5 },
      { category: 'Stationery Products', name: 'Paper Ream Legal (80 GSM)', price: 550, costPrice: 480, stockQty: 18, lowStockLimit: 5 },
      { category: 'Stationery Products', name: '৳100 Stamp Paper', price: 120, costPrice: 105, stockQty: 25, lowStockLimit: 5 },
      { category: 'Stationery Products', name: '৳50 Stamp Paper', price: 65, costPrice: 55, stockQty: 30, lowStockLimit: 5 },
      { category: 'Stationery Products', name: 'Court File General', price: 20, costPrice: 15, stockQty: 45, lowStockLimit: 10 },
      { category: 'Stationery Products', name: 'Clear File Folder', price: 20, costPrice: 14, stockQty: 60, lowStockLimit: 10 },
      { category: 'Stationery Products', name: 'A4 Size Envelope', price: 5, costPrice: 3, stockQty: 150, lowStockLimit: 20 },
      { category: 'Stationery Products', name: 'Letter Envelope', price: 5, costPrice: 2.5, stockQty: 200, lowStockLimit: 25 },
      { category: 'Stationery Products', name: 'Pen', price: 6, costPrice: 4.5, stockQty: 120, lowStockLimit: 20 },
      { category: 'Stationery Products', name: 'Hi-School Ball Pen', price: 5, costPrice: 4, stockQty: 85, lowStockLimit: 15 },
      { category: 'Stationery Products', name: 'Fevicol Clear Glue - 50 gm', price: 25, costPrice: 18, stockQty: 22, lowStockLimit: 5 },
      { category: 'Stationery Products', name: 'Fevicol MR Glue', price: 20, costPrice: 15, stockQty: 16, lowStockLimit: 5 },
      { category: 'Stationery Products', name: 'Fiber Frame', price: 200, costPrice: 150, stockQty: 12, lowStockLimit: 3 },
      { category: 'Stationery Products', name: 'Spiral Binding Ring', price: 40, costPrice: 20, stockQty: 50, lowStockLimit: 10 }
    ];

    standardProducts.forEach(p => productMap.set(p.name, p));

    for (const r of rows) {
      const invNo = parseInt(r[0]);
      const ts = r[1];
      const user = r[2] || 'Md Abu Said';
      const cName = (r[3] || 'Cash Customer').trim();
      const cPhone = (r[4] || '').trim();
      const cat = r[5] || 'Photocopy';
      const desc = r[6] || '';
      const subtotal = parseFloat((r[7] || '0').replace(/,/g, '')) || 0;
      const discount = parseFloat((r[8] || '0').replace(/,/g, '')) || 0;
      const grandTotal = parseFloat((r[9] || '0').replace(/,/g, '')) || 0;
      const paid = parseFloat((r[10] || '0').replace(/,/g, '')) || 0;
      const due = parseFloat((r[11] || '0').replace(/,/g, '')) || 0;
      const itemsRaw = r[12] || '[]';
      const dateOnly = ts.substring(0, 10);

      if (!customerMap.has(cName)) {
        customerMap.set(cName, { name: cName, phone: cPhone, address: 'Paduar Bazar, Cumilla' });
      } else {
        const existing = customerMap.get(cName)!;
        if (!existing.phone && cPhone) existing.phone = cPhone;
      }

      let parsedItems: any[] = [];
      try {
        parsedItems = JSON.parse(itemsRaw);
      } catch (e) {
        parsedItems = [];
      }

      db.run(`
        INSERT INTO sales (
          invoice_no, timestamp, date, user_name, customer_id, customer_name,
          customer_phone, customer_address, category_summary, description,
          subtotal, discount, grand_total, paid, due, items_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invNo, ts, dateOnly, user, null, cName,
        cPhone, 'Paduar Bazar, Cumilla', cat, desc,
        subtotal, discount, grandTotal, paid, due, JSON.stringify(parsedItems)
      ]);

      for (const item of parsedItems) {
        const pName = (item.name || '').trim();
        const iCat = item.category || cat;
        const price = parseFloat(item.price) || 0;
        const costPrice = parseFloat(item.costPrice) || 0;
        const qty = parseFloat(item.qty) || 1;
        const total = parseFloat(item.total) || (price * qty);

        db.run(`
          INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [invNo, invNo, iCat, pName, price, costPrice, qty, total]);

        if (!productMap.has(pName)) {
          productMap.set(pName, {
            category: iCat,
            name: pName,
            price: price,
            costPrice: costPrice,
            stockQty: iCat === 'Stationery Products' ? 20 : null,
            lowStockLimit: 5
          });
        }
      }

      if (due > 0) {
        db.run(`
          INSERT INTO due_ledger (
            entry_id, date, customer_name, customer_phone, customer_address,
            transaction_type, description, due_dr, paid_cr, user_name, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `DUE-INV-${invNo}`,
          dateOnly,
          cName,
          cPhone,
          'Paduar Bazar, Cumilla',
          'Invoice Due',
          `Memo #${invNo} Due Balance`,
          due,
          0,
          user,
          ts
        ]);
      }
    }

    db.run("DELETE FROM customers;");
    let cSl = 1;
    for (const [_, c] of customerMap.entries()) {
      db.run(`
        INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)
      `, [cSl++, c.name, c.phone, c.address || 'Paduar Bazar, Cumilla']);
    }

    db.run("DELETE FROM products;");
    let pSl = 1;
    for (const [_, p] of productMap.entries()) {
      db.run(`
        INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [pSl++, p.category, p.name, p.price, p.costPrice || 0, p.stockQty, p.lowStockLimit || 5]);
    }
  } catch (err) {
    console.error('Error during seedOctoberSalesData:', err);
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
