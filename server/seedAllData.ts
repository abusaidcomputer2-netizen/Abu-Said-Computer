import fs from 'fs';
import type { Database } from 'sql.js';
import { FALLBACK_CUSTOMERS } from '../src/data/fallbackData.js';

export function populateMasterData(db: Database): boolean {
  // Check if we need to seed sales
  const existingCustCount = (db.exec('SELECT COUNT(*) as count FROM customers')[0]?.values[0][0] as number) || 0;
  const existingSalesCount = (db.exec('SELECT COUNT(*) as count FROM sales')[0]?.values[0][0] as number) || 0;

  if (existingSalesCount > 50) {
    return false; // Already populated
  }

  console.log(`[Seed] Populating master database (existing customers: ${existingCustCount}, sales: ${existingSalesCount})...`);

  // Clear existing small/partial data
  db.run('DELETE FROM customers');
  db.run('DELETE FROM sales');
  db.run('DELETE FROM sale_items');
  db.run('DELETE FROM due_ledger');

  // Customer map
  const custMap = new Map<string, { sl: number; name: string; phone: string; address: string }>();
  // Ensure Cash Customer is #1
  custMap.set('cash customer', {
    sl: 1,
    name: 'Cash Customer',
    phone: '',
    address: ''
  });

  // Add from FALLBACK_CUSTOMERS
  for (const c of FALLBACK_CUSTOMERS) {
    if (!c.name) continue;
    const key = c.name.trim().toLowerCase();
    if (key === 'cash customer') continue;
    custMap.set(key, {
      sl: custMap.size + 1,
      name: c.name.trim(),
      phone: (c.phone || '').trim(),
      address: (c.address || '').trim() || 'Paduar Bazar, Cumilla'
    });
  }

  // Parse CSV
  const csvPath = 'public/assets/aistudio/AS_Computer_Shop_Management_System_ab39e0b6';
  let salesRows: string[][] = [];

  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const fields: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          if (inQuotes && line[c + 1] === '"') {
            cur += '"';
            c++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          fields.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      fields.push(cur);

      if (fields.length >= 12) {
        salesRows.push(fields);
        const cName = (fields[3] || '').trim();
        const cPhone = (fields[4] || '').trim();
        if (cName && cName.toLowerCase() !== 'cash customer') {
          const key = cName.toLowerCase();
          if (!custMap.has(key)) {
            custMap.set(key, {
              sl: custMap.size + 1,
              name: cName,
              phone: cPhone,
              address: 'Paduar Bazar, Cumilla'
            });
          } else if (cPhone && !custMap.get(key)!.phone) {
            custMap.get(key)!.phone = cPhone;
          }
        }
      }
    }
  }

  // 1. Leave customers table clean (only explicitly saved customers belong in Customer Directory)
  console.log('[Seed] Customer Directory remains clean (only explicitly saved customers).');

  // 2. Insert sales, sale_items, due_ledger
  let saleId = 1;
  for (const r of salesRows) {
    const invNo = parseInt(r[0], 10);
    const timestamp = (r[1] || '').trim();
    let rawDate = timestamp.split(' ')[0] || '';
    const slashMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      rawDate = `${slashMatch[3]}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
    }
    const user = (r[2] || 'Md Abu Said').trim();
    const customer = (r[3] || 'Cash Customer').trim();
    const phone = (r[4] || '').trim();
    const category = (r[5] || 'Photocopy').trim();
    const desc = (r[6] || '').trim();
    const subtotal = parseFloat(r[7]) || 0;
    const discount = parseFloat(r[8]) || 0;
    const grandTotal = parseFloat(r[9]) || 0;
    const paid = parseFloat(r[10]) || 0;
    const due = parseFloat(r[11]) || 0;
    const itemsJson = (r[12] || '[]').trim();

    const custKey = customer.toLowerCase();
    const address = custKey === 'cash customer' ? '' : (custMap.get(custKey)?.address || 'Paduar Bazar, Cumilla');

    db.run(
      'INSERT INTO sales (id, invoice_no, timestamp, date, user_name, customer_name, customer_phone, customer_address, category_summary, description, subtotal, discount, grand_total, paid, due, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [saleId, invNo, timestamp, rawDate, user, customer, phone, address, category, desc, subtotal, discount, grandTotal, paid, due, itemsJson]
    );

    // Parse and insert items
    try {
      const items = JSON.parse(itemsJson);
      if (Array.isArray(items)) {
        for (const it of items) {
          db.run(
            'INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [saleId, invNo, it.category || category, it.name || '', parseFloat(it.price) || 0, parseFloat(it.costPrice) || 0, parseFloat(it.qty) || 1, parseFloat(it.total) || 0]
          );
        }
      }
    } catch {}

    // Record Due Ledger
    if (due > 0) {
      const dueDesc = desc ? `Invoice #${invNo} - ${category} [${desc}]` : `Invoice #${invNo} - ${category}`;
      db.run(
        'INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`INV-${invNo}`, rawDate, customer, phone, address, 'Memo / Bill', dueDesc, due, 0, user, timestamp]
      );
    }

    saleId++;
  }
  console.log(`[Seed] Inserted ${salesRows.length} sales invoices.`);
  return true;
}
