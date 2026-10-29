const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const csvPath = path.resolve('public/assets/aistudio/AS_Computer_Shop_Management_System_40d860e8');
const dbPath = path.resolve('as_computer.db');

function parseCSVLines(text) {
  const lines = [];
  let row = [];
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

async function run() {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  // Create tables if not exist
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
  `);

  // Ensure default users
  const uCount = db.exec("SELECT COUNT(*) FROM users")[0]?.values[0][0] || 0;
  if (uCount === 0) {
    db.run(`
      INSERT INTO users (username, password_hash, role, phone, permissions) VALUES
      ('Md Abu Said', '12345', 'admin', '01904142370', 'all'),
      ('Md Sujon', '2008', 'staff', '01800000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'),
      ('Md Saimon Hasan', '1020', 'staff', '01700000000', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print');
    `);
  }

  // Clear existing sales, sale_items, due_ledger to ensure pristine import of October
  db.run("DELETE FROM sales;");
  db.run("DELETE FROM sale_items;");
  db.run("DELETE FROM due_ledger;");

  // Read CSV
  const csvRaw = fs.readFileSync(csvPath, 'utf8');
  const allLines = parseCSVLines(csvRaw);
  const rows = allLines.slice(1).filter(r => {
    const ts = r[1] || '';
    return ts.startsWith('2026-10') || ts.includes('/10/2026') || ts.includes('-10-2026');
  });

  console.log(`Found ${rows.length} October 2026 rows`);

  // Customer map
  const customerMap = new Map();
  // Standard customers
  customerMap.set('Md Abu Said', { name: 'Md Abu Said', phone: '01904142370', address: 'Paduar Bazar, Cumilla' });
  customerMap.set('Md Sujon', { name: 'Md Sujon', phone: '01812345678', address: 'Paduar Bazar, Cumilla' });
  customerMap.set('Al-Amin Traders', { name: 'Al-Amin Traders', phone: '01711223344', address: 'Paduar Bazar Biswa Road, Cumilla' });

  // Product map
  const productMap = new Map();

  // Standard product catalog
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

  standardProducts.forEach(p => {
    productMap.set(p.name, p);
  });

  // Track customer dues
  let importedSalesCount = 0;
  let importedDueCount = 0;
  let totalDueDr = 0;

  // Insert sales
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

    // Track customer
    if (!customerMap.has(cName)) {
      customerMap.set(cName, {
        name: cName,
        phone: cPhone,
        address: 'Paduar Bazar, Cumilla'
      });
    } else {
      const existing = customerMap.get(cName);
      if (!existing.phone && cPhone) existing.phone = cPhone;
    }

    // Process items
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(itemsRaw);
    } catch (e) {
      parsedItems = [];
    }

    // Insert sale
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
    importedSalesCount++;

    // Insert items into sale_items
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

    // Insert into due_ledger only if due > 0
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
      importedDueCount++;
      totalDueDr += due;
    }
  }

  // Populate customers table
  db.run("DELETE FROM customers;");
  let cSl = 1;
  for (const [_, c] of customerMap.entries()) {
    db.run(`
      INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)
    `, [cSl++, c.name, c.phone, c.address || 'Paduar Bazar, Cumilla']);
  }

  // Populate products table
  db.run("DELETE FROM products;");
  let pSl = 1;
  for (const [_, p] of productMap.entries()) {
    db.run(`
      INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pSl++, p.category, p.name, p.price, p.costPrice || 0, p.stockQty, p.lowStockLimit || 5]);
  }

  // Save database to disk
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log(`Successfully migrated:`);
  console.log(`- Sales: ${importedSalesCount}`);
  console.log(`- Due records: ${importedDueCount} (Total Due: Tk ${totalDueDr})`);
  console.log(`- Customers: ${customerMap.size}`);
  console.log(`- Products: ${productMap.size}`);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
