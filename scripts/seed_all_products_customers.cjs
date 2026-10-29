const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Pick the latest CSV in public/assets/aistudio
const assetDir = path.resolve('public/assets/aistudio');
const files = fs.readdirSync(assetDir).filter(f => f.startsWith('AS_Computer_Shop_Management_System'));
files.sort((a, b) => {
  const statA = fs.statSync(path.join(assetDir, a)).mtimeMs;
  const statB = fs.statSync(path.join(assetDir, b)).mtimeMs;
  return statB - statA;
});

const latestCSV = files.length > 0 ? path.join(assetDir, files[0]) : path.join(assetDir, 'AS_Computer_Shop_Management_System_9b748c27');
console.log('Using CSV file:', latestCSV);

const dbPath = path.resolve('as_computer.db');

function parseCSV(text) {
  const lines = [];
  let row = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i+1];
    if (c === '\"') {
      if (inQ && n === '\"') { cur += '\"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      row.push(cur.trim()); cur = '';
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && n === '\n') i++;
      row.push(cur.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) lines.push(row);
      row = []; cur = '';
    } else {
      cur += c;
    }
  }
  if (cur || row.length) { row.push(cur.trim()); lines.push(row); }
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

  // Ensure tables exist
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

  // Clear sales, sale_items, due_ledger, customers, products
  db.run("DELETE FROM sales;");
  db.run("DELETE FROM sale_items;");
  db.run("DELETE FROM due_ledger;");
  db.run("DELETE FROM customers;");
  db.run("DELETE FROM products;");

  const csvRaw = fs.readFileSync(latestCSV, 'utf8');
  const allLines = parseCSV(csvRaw);
  const rows = allLines.slice(1);

  console.log(`Processing all ${rows.length} transactions...`);

  const customerMap = new Map();
  // Standard defaults
  customerMap.set('Cash Customer', { name: 'Cash Customer', phone: '01904142370', address: 'Paduar Bazar, Cumilla' });
  customerMap.set('Md Abu Said', { name: 'Md Abu Said', phone: '01904142370', address: 'Paduar Bazar, Cumilla' });
  customerMap.set('Md Sujon', { name: 'Md Sujon', phone: '01812345678', address: 'Paduar Bazar, Cumilla' });
  customerMap.set('Al-Amin Traders', { name: 'Al-Amin Traders', phone: '01711223344', address: 'Paduar Bazar Biswa Road, Cumilla' });

  const productMap = new Map();

  // Helper to categorize products
  function determineCategory(pName, declaredCat) {
    const lower = pName.toLowerCase();
    const dLower = (declaredCat || '').toLowerCase();
    
    if (dLower.includes('servicing') || lower.includes('repair') || lower.includes('thermal paste') || lower.includes('cleaning') || lower.includes('setup') || lower.includes('power supply')) {
      return 'Servicing';
    }
    if (dLower.includes('stationery') || lower.includes('paper') || lower.includes('pen') || lower.includes('envelope') || lower.includes('khata') || lower.includes('glue') || lower.includes('fevicol') || lower.includes('stamp') || lower.includes('folder') || lower.includes('frame') || lower.includes('ring') || lower.includes('খাম') || lower.includes('কলম') || lower.includes('কারবন') || lower.includes('খাতা')) {
      return 'Stationery Products';
    }
    if (dLower.includes('online') || lower.includes('application') || lower.includes('apply') || lower.includes('tax') || lower.includes('nid') || lower.includes('birth') || lower.includes('passport') || lower.includes('email') || lower.includes('scan') || lower.includes('admission') || lower.includes('tin') || lower.includes('নামজারি') || lower.includes('আবেদন') || lower.includes('বোর্ড')) {
      return 'Online Application';
    }
    return 'Photocopy';
  }

  let importedSalesCount = 0;
  let importedDueCount = 0;
  let totalDueDr = 0;

  for (const r of rows) {
    const invNo = parseInt(r[0]);
    if (isNaN(invNo)) continue;

    const ts = r[1] || '';
    const user = r[2] || 'Md Abu Said';
    let rawCust = (r[3] || 'Cash Customer').trim();

    // Replace "New Customer" with "Cash Customer"
    if (rawCust.toLowerCase() === 'new customer' || rawCust === '' || /^cash customer \(\d+\)$/i.test(rawCust)) {
      rawCust = 'Cash Customer';
    }

    let cPhone = (r[4] || '').trim();
    if (rawCust === 'Cash Customer' && !cPhone) {
      cPhone = '01904142370';
    }

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
    if (!customerMap.has(rawCust)) {
      customerMap.set(rawCust, {
        name: rawCust,
        phone: cPhone,
        address: 'Paduar Bazar, Cumilla'
      });
    } else {
      const existing = customerMap.get(rawCust);
      if (!existing.phone && cPhone) existing.phone = cPhone;
    }

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
      invNo, ts, dateOnly, user, null, rawCust,
      cPhone, 'Paduar Bazar, Cumilla', cat, desc,
      subtotal, discount, grandTotal, paid, due, JSON.stringify(parsedItems)
    ]);
    importedSalesCount++;

    // Process items & track products
    for (const item of parsedItems) {
      const pName = (item.name || '').trim();
      if (!pName) continue;
      const declaredCat = item.category || cat;
      const finalCat = determineCategory(pName, declaredCat);
      const price = parseFloat(item.price) || 0;
      const costPrice = parseFloat(item.costPrice) || 0;
      const qty = parseFloat(item.qty) || 1;
      const total = parseFloat(item.total) || (price * qty);

      db.run(`
        INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [invNo, invNo, finalCat, pName, price, costPrice, qty, total]);

      if (!productMap.has(pName)) {
        const isStationery = finalCat === 'Stationery Products';
        productMap.set(pName, {
          name: pName,
          category: finalCat,
          price: price,
          costPrice: costPrice,
          stockQty: isStationery ? 35 : null,
          lowStockLimit: 5
        });
      } else {
        const existing = productMap.get(pName);
        if (price > 0 && existing.price === 0) existing.price = price;
        if (costPrice > 0 && existing.costPrice === 0) existing.costPrice = costPrice;
      }
    }

    // Insert due if due > 0
    if (due > 0) {
      db.run(`
        INSERT INTO due_ledger (
          entry_id, date, customer_name, customer_phone, customer_address,
          transaction_type, description, due_dr, paid_cr, user_name, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `DUE-INV-${invNo}`,
        dateOnly,
        rawCust,
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

  // Populate ALL products into products table
  let pSl = 1;
  const sortedProducts = Array.from(productMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  for (const p of sortedProducts) {
    db.run(`
      INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [pSl++, p.category, p.name, p.price, p.costPrice || 0, p.stockQty, p.lowStockLimit || 5]);
  }

  // Populate ALL customers into customers table
  let cSl = 1;
  const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => {
    if (a.name === 'Cash Customer') return -1;
    if (b.name === 'Cash Customer') return 1;
    return a.name.localeCompare(b.name, 'bn');
  });

  for (const c of sortedCustomers) {
    db.run(`
      INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)
    `, [cSl++, c.name, c.phone, c.address || 'Paduar Bazar, Cumilla']);
  }

  // Save database to disk
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log(`Import Complete:`);
  console.log(`- Total Sales: ${importedSalesCount}`);
  console.log(`- Total Due Records: ${importedDueCount} (Amount: Tk ${totalDueDr})`);
  console.log(`- Total Products Created: ${sortedProducts.length}`);
  console.log(`- Total Customers Created: ${sortedCustomers.length}`);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
