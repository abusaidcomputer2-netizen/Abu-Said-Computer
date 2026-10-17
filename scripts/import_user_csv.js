const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.resolve(process.cwd(), 'as_computer.db');
const CSV_FILE = path.resolve(process.cwd(), 'user_sales_data.csv');

const EXPENSE_MAP = {
  'shop rent': 'দোকান ভাড়া',
  'electricity bill': 'বিদ্যুৎ বিল',
  'internet bill': 'ইন্টারনেট বিল',
  'staff salary': 'কর্মচারী বেতন',
  'salary': 'কর্মচারী বেতন',
  'paper purchase': 'কাগজ ক্রয়',
  'ink / toner': 'কালি ও টোনার ক্রয়',
  'ink and toner': 'কালি ও টোনার ক্রয়',
  'machine maintenance': 'মেশিন মেরামত ও সার্ভিসিং',
  'tea & snacks': 'চা ও আপ্যায়ন',
  'tea and snacks': 'চা ও আপ্যায়ন',
  'stationery products purchase': 'স্টেশনারি মালামাল ক্রয়',
  'photocopy paper & toner purchase': 'ফটোকপি কাগজ ও মালামাল',
  'hardware & tools': 'হার্ডওয়্যার ও কম্পিউটার যন্ত্রাংশ',
  'conveyance': 'যাতায়াত ও পরিবহন খরচ',
  'mobile recharge': 'মোবাইল রিচার্জ ও বিল',
  'others': 'অন্যান্য খরচ',
  'general': 'অন্যান্য খরচ',
  'shop expense': 'অন্যান্য খরচ'
};

function translateExpenseCat(cat) {
  if (!cat) return 'অন্যান্য খরচ';
  const k = cat.toLowerCase().trim();
  return EXPENSE_MAP[k] || cat;
}

function parseCsv(csvText) {
  const clean = csvText.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) rows.push(currentRow);
  }
  return rows;
}

async function runImport() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_FILE);
  const db = new SQL.Database(fileBuffer);

  // 1. Translate English categories in existing expenses table
  const existingExpenses = db.exec("SELECT id, category FROM expenses");
  if (existingExpenses.length > 0 && existingExpenses[0].values) {
    for (const [id, cat] of existingExpenses[0].values) {
      const bnCat = translateExpenseCat(cat);
      if (bnCat !== cat) {
        db.run("UPDATE expenses SET category = ? WHERE id = ?", [bnCat, id]);
        console.log(`Translated expense #${id}: "${cat}" -> "${bnCat}"`);
      }
    }
  }

  // 2. Wipe previous sales, sale_items, and due_ledger records as requested
  db.run("DELETE FROM sales;");
  db.run("DELETE FROM sale_items;");
  db.run("DELETE FROM due_ledger;");
  console.log("Cleared old sales, sale_items, and due_ledger.");

  // 3. Read and parse CSV
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCsv(csvContent);
  const headers = rows[0];
  const dataRows = rows.slice(1);

  console.log(`Found ${dataRows.length} data rows in CSV`);

  let importedSales = 0;
  let importedItems = 0;
  let importedDues = 0;
  let newCustomers = 0;

  for (const row of dataRows) {
    if (!row || row.length < 5 || !row[0]) continue;

    const invNo = parseInt(row[0].trim(), 10);
    if (!invNo) continue;

    const timestamp = row[1]?.trim() || '';
    const user = row[2]?.trim() || 'Md Abu Said';
    const customer = row[3]?.trim() || 'New Customer';
    const phone = row[4]?.trim() || '';
    const category = row[5]?.trim() || 'Photocopy';
    const desc = row[6]?.trim() || '';

    const subtotal = parseFloat(row[7]?.replace(/,/g, '')) || 0;
    const discount = parseFloat(row[8]?.replace(/,/g, '')) || 0;
    const paid = parseFloat(row[9]?.replace(/,/g, '')) || 0;
    const netOrDue = parseFloat(row[10]?.replace(/,/g, '')) || 0;
    
    // In this CSV, Net Amount = Paid Amount in standard sales, but if netAmount was 0 and row has due
    // Let's check: Net Amount column (index 10) is grandTotal or Net. Let's see: if Paid + Due = Total
    const grandTotal = subtotal - discount;
    let due = 0;
    if (paid < grandTotal) {
      due = Math.round((grandTotal - paid) * 100) / 100;
    }

    const itemsRaw = row[11]?.trim() || '[]';
    let items = [];
    try {
      items = JSON.parse(itemsRaw);
    } catch (e) {
      items = [{ category, name: desc || category, price: grandTotal, qty: 1, total: grandTotal }];
    }

    // Extract Date from Timestamp (format: YYYY-MM-DD or M/D/YYYY)
    let dateStr = new Date().toISOString().split('T')[0];
    if (timestamp) {
      const parts = timestamp.split(' ')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
        dateStr = parts;
      } else if (parts.includes('/')) {
        const p = parts.split('/');
        if (p.length === 3) {
          const m = p[0].padStart(2, '0');
          const d = p[1].padStart(2, '0');
          const y = p[2].length === 2 ? `20${p[2]}` : p[2];
          dateStr = `${y}-${m}-${d}`;
        }
      }
    }

    // Ensure customer exists in customers table
    if (customer && customer !== 'New Customer' && customer !== 'General Customer') {
      const custCheck = db.exec("SELECT id FROM customers WHERE LOWER(name) = ?", [customer.toLowerCase()]);
      if (custCheck.length === 0 || !custCheck[0].values || custCheck[0].values.length === 0) {
        const countRes = db.exec("SELECT COUNT(*) FROM customers");
        const nextSl = (countRes[0]?.values[0][0] || 0) + 1;
        db.run("INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)", [nextSl, customer, phone, '']);
        newCustomers++;
      }
    }

    // Insert sale
    db.run(`
      INSERT INTO sales (
        invoice_no, timestamp, date, user_name, customer_name, customer_phone,
        customer_address, category_summary, description, subtotal, discount,
        grand_total, paid, due, items_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invNo, timestamp, dateStr, user, customer, phone,
      '', category, desc, subtotal, discount,
      grandTotal, paid, due, JSON.stringify(items)
    ]);
    importedSales++;

    // Insert items
    for (const it of items) {
      db.run(`
        INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invNo, invNo, it.category || category, it.name || desc || category,
        it.price || 0, it.costPrice || 0, it.qty || 1, it.total || (it.price * it.qty) || 0
      ]);
      importedItems++;
    }

    // If due > 0, insert into due_ledger
    if (due > 0) {
      const entryId = `DUE-${invNo}-${Date.now()}`;
      db.run(`
        INSERT INTO due_ledger (
          entry_id, date, customer_name, customer_phone, customer_address,
          transaction_type, description, due_dr, paid_cr, user_name, timestamp
        ) VALUES (?, ?, ?, ?, ?, 'due_added', ?, ?, 0, ?, ?)
      `, [
        entryId, dateStr, customer, phone, '',
        `Invoice #${invNo} - ${category}`, due, user, timestamp
      ]);
      importedDues++;
    }
  }

  // Save changes to disk
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  console.log(`\nImport Success!`);
  console.log(`- Sales imported: ${importedSales}`);
  console.log(`- Sale items imported: ${importedItems}`);
  console.log(`- Due ledger entries: ${importedDues}`);
  console.log(`- New customers added: ${newCustomers}`);
}

runImport().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
