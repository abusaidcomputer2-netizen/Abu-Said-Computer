import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from './db.js';
import { createAndSyncSpreadsheet, appendSaleToSpreadsheet, appendPaymentToSpreadsheet, sendToAppsScript, PERMANENT_APPS_SCRIPT_URL } from './googleDriveService.js';

export const apiRouter = Router();

function cleanParams(params: any[] = []): any[] {
  return params.map(p => (p === undefined ? null : p));
}

// Helper to execute SQL with parameters and return array of objects
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const cleaned = cleanParams(params);
  const stmt = db.prepare(sql);
  if (cleaned.length > 0) {
    stmt.bind(cleaned);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const all = queryAll<T>(sql, params);
  return all.length > 0 ? all[0] : null;
}

function runSql(sql: string, params: any[] = []): void {
  const db = getDb();
  const cleaned = cleanParams(params);
  db.run(sql, cleaned);
  saveDatabase();
}

// ---------------- AUTH ----------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password required' });
  }

  const user = queryOne<{
    id: number;
    username: string;
    password_hash: string;
    role: string;
    phone: string;
    permissions: string;
  }>('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);

  const p = (password || '').toString().trim();
  const isMatch = user && user.password_hash === p;

  if (!user || !isMatch) {
    return res.status(401).json({ status: 'error', message: 'Incorrect username or password' });
  }

  return res.json({
    status: 'success',
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      phone: user.phone,
      permissions: user.permissions || (user.role === 'admin' ? 'all' : 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print')
    }
  });
});

// ---------------- BOOTSTRAP ----------------
apiRouter.get('/bootstrap', (req: Request, res: Response) => {
  try {
    const users = queryAll('SELECT id, username, role, phone, permissions FROM users ORDER BY username ASC');
    const products = queryAll('SELECT * FROM products ORDER BY category ASC, sl ASC');
    const customers = queryAll('SELECT * FROM customers ORDER BY sl ASC, name ASC');
    const sales = queryAll('SELECT * FROM sales ORDER BY id DESC');
    const expenses = queryAll('SELECT * FROM expenses ORDER BY id DESC');
    const dueRecords = queryAll('SELECT * FROM due_ledger ORDER BY id DESC');
    const purchases = queryAll('SELECT * FROM purchases ORDER BY id DESC');
    const cashClosings = queryAll('SELECT * FROM cash_closings ORDER BY date DESC');

    // Parse items_json
    const formattedSales = sales.map(s => ({
      rowId: s.id,
      id: s.id,
      invoiceNo: s.invoice_no,
      timestamp: s.timestamp,
      rawDate: s.date,
      date: s.date,
      user: s.user_name,
      customer: s.customer_name,
      phone: s.customer_phone,
      address: s.customer_address,
      category: s.category_summary,
      desc: s.description,
      subtotal: s.subtotal,
      discount: s.discount,
      grandTotal: s.grand_total,
      paid: s.paid,
      due: s.due,
      items: JSON.parse(s.items_json || '[]')
    }));

    // Customer summaries for Due Ledger
    const custDueMap: Record<string, {
      name: string;
      phone: string;
      address: string;
      totalDue: number;
      totalPaid: number;
      netBalance: number;
    }> = {};

    let totalShopDue = 0;
    let totalShopPaid = 0;

    dueRecords.forEach(d => {
      const cName = d.customer_name;
      if (!custDueMap[cName]) {
        custDueMap[cName] = {
          name: cName,
          phone: d.customer_phone || '',
          address: d.customer_address || '',
          totalDue: 0,
          totalPaid: 0,
          netBalance: 0
        };
      }
      custDueMap[cName].totalDue += (d.due_dr || 0);
      custDueMap[cName].totalPaid += (d.paid_cr || 0);
      custDueMap[cName].netBalance = custDueMap[cName].totalDue - custDueMap[cName].totalPaid;
      if (d.customer_phone && !custDueMap[cName].phone) custDueMap[cName].phone = d.customer_phone;
      if (d.customer_address && !custDueMap[cName].address) custDueMap[cName].address = d.customer_address;

      totalShopDue += (d.due_dr || 0);
      totalShopPaid += (d.paid_cr || 0);
    });

    const activeDueCustomers = Object.values(custDueMap)
      .filter(c => c.netBalance > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'bn'));

    return res.json({
      status: 'success',
      users,
      products: products.map(p => ({
        id: p.id,
        rowId: p.id,
        sl: p.sl,
        category: p.category,
        name: p.name,
        price: p.selling_price,
        costPrice: p.cost_price,
        stockQty: p.stock_qty,
        lowStockLimit: p.low_stock_limit
      })),
      customers: customers.map(c => ({
        id: c.id,
        rowId: c.id,
        sl: c.sl,
        name: c.name,
        phone: c.phone,
        address: c.address
      })),
      records: formattedSales,
      sales: formattedSales,
      expenses: expenses.map(e => ({
        rowId: e.id,
        id: e.id,
        expId: e.expense_id,
        timestamp: e.timestamp,
        date: e.date,
        category: e.category,
        desc: e.description,
        amount: e.amount,
        user: e.user_name
      })),
      dueRecords: dueRecords.map(d => ({
        rowId: d.id,
        id: d.entry_id,
        date: d.date,
        customer: d.customer_name,
        phone: d.customer_phone,
        address: d.customer_address,
        type: d.transaction_type,
        desc: d.description,
        due: d.due_dr,
        paid: d.paid_cr,
        user: d.user_name,
        timestamp: d.timestamp
      })),
      customerSummaries: activeDueCustomers,
      dueTotals: {
        shopTotalDue: totalShopDue,
        shopTotalPaid: totalShopPaid,
        netDue: totalShopDue - totalShopPaid
      },
      purchases: purchases.map(p => ({
        rowId: p.id,
        id: p.purchase_id,
        date: p.date,
        timestamp: p.timestamp,
        product: p.product_name,
        category: p.category,
        qty: p.qty,
        unitCost: p.unit_cost,
        totalCost: p.total_cost,
        supplier: p.supplier,
        notes: p.notes,
        user: p.user_name
      })),
      cashClosings: cashClosings.map(c => ({
        rowId: c.id,
        id: c.closing_id,
        date: c.date,
        closedAt: c.closed_at,
        user: c.user_name,
        openingCash: c.opening_cash,
        prevShortageDeducted: c.prev_shortage_deducted,
        salesInflow: c.sales_inflow,
        dueInflow: c.due_inflow,
        totalInflow: c.total_inflow,
        expenseOutflow: c.expense_outflow,
        expectedCash: c.expected_cash,
        actualCash: c.actual_cash,
        difference: c.difference,
        status: c.status,
        notes: c.notes,
        denominations: JSON.parse(c.denominations_json || '{}')
      })),
      googleDriveBackup: {
        linkedSheetId: queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'")?.value || '',
        linkedSheetUrl: queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_url'")?.value || '',
        lastBackupTime: queryOne("SELECT value FROM app_settings WHERE key = 'last_backup_time'")?.value || ''
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- PRODUCTS ----------------
apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { sl, category, name, price, costPrice, stockQty, lowStockLimit } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Product name required' });

    const cat = category || 'Photocopy';
    let finalSl = parseInt(sl, 10);
    const maxSlObj = queryOne('SELECT MAX(sl) as m FROM products WHERE category = ?', [cat]);
    const maxSl = maxSlObj?.m || 0;

    if (!finalSl || finalSl <= 0) {
      finalSl = maxSl + 1;
    } else {
      const existing = queryOne('SELECT id FROM products WHERE category = ? AND sl = ?', [cat, finalSl]);
      if (existing) {
        finalSl = maxSl + 1;
      }
    }

    runSql(
      'INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalSl, cat, name.trim(), parseFloat(price) || 0, parseFloat(costPrice) || 0, stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null, parseFloat(lowStockLimit) || 5]
    );

    const inserted = queryOne('SELECT id FROM products WHERE category = ? AND sl = ? ORDER BY id DESC', [cat, finalSl]);
    const productRecord = {
      id: inserted?.id || Date.now(),
      rowId: inserted?.id || Date.now(),
      sl: finalSl,
      category: cat,
      name: name.trim(),
      price: parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQty: stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null,
      lowStockLimit: parseFloat(lowStockLimit) || 5
    };

    // Real-time automatic background backup to Google Apps Script
    sendToAppsScript({
      action: 'add_product',
      ...productRecord
    }).catch(e => console.error('Apps Script product dispatch error:', e));

    return res.json({
      status: 'success',
      message: 'Product added successfully',
      product: productRecord
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { sl, category, name, price, costPrice, stockQty, lowStockLimit } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Product name required' });

    const cat = category || 'Photocopy';
    let finalSl = parseInt(sl, 10) || 1;

    runSql(
      'UPDATE products SET sl = ?, category = ?, name = ?, selling_price = ?, cost_price = ?, stock_qty = ?, low_stock_limit = ? WHERE id = ?',
      [finalSl, cat, name.trim(), parseFloat(price) || 0, parseFloat(costPrice) || 0, stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null, parseFloat(lowStockLimit) || 5, id]
    );

    const updatedRecord = {
      id,
      rowId: id,
      sl: finalSl,
      category: cat,
      name: name.trim(),
      price: parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQty: stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null,
      lowStockLimit: parseFloat(lowStockLimit) || 5
    };

    return res.json({
      status: 'success',
      message: 'Product updated successfully',
      product: updatedRecord
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'Product deleted successfully', id });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- CUSTOMERS ----------------
apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const { sl, name, phone, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Customer name required' });

    let finalSl = parseInt(sl, 10);
    const maxSlObj = queryOne('SELECT MAX(sl) as m FROM customers');
    const maxSl = maxSlObj?.m || 0;
    if (!finalSl || finalSl <= 0) {
      finalSl = maxSl + 1;
    }

    runSql(
      'INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)',
      [finalSl, name.trim(), phone ? phone.trim() : '', address ? address.trim() : 'Paduar Bazar, Cumilla']
    );

    const inserted = queryOne('SELECT id FROM customers WHERE name = ? ORDER BY id DESC', [name.trim()]);
    const customerRecord = {
      id: inserted?.id || Date.now(),
      rowId: inserted?.id || Date.now(),
      sl: finalSl,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : 'Paduar Bazar, Cumilla'
    };

    // Real-time automatic background backup to Google Apps Script
    sendToAppsScript({
      action: 'add_customer',
      ...customerRecord
    }).catch(e => console.error('Apps Script customer dispatch error:', e));

    return res.json({
      status: 'success',
      message: 'Customer saved successfully',
      customer: customerRecord
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/customers/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { sl, name, phone, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Customer name required' });

    let finalSl = parseInt(sl, 10) || 1;

    runSql(
      'UPDATE customers SET sl = ?, name = ?, phone = ?, address = ? WHERE id = ?',
      [finalSl, name.trim(), phone ? phone.trim() : '', address ? address.trim() : 'Paduar Bazar, Cumilla', id]
    );

    const updatedCustomer = {
      id,
      rowId: id,
      sl: finalSl,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : 'Paduar Bazar, Cumilla'
    };

    return res.json({
      status: 'success',
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM customers WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'Customer deleted successfully', id });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- INVOICES & SALES ----------------
apiRouter.post('/sales', (req: Request, res: Response) => {
  try {
    const { user, customer, phone, address, desc, subtotal, discount, grandTotal, paid, due, items } = req.body;

    // Get next invoice number >= 4001
    const maxInvObj = queryOne('SELECT MAX(invoice_no) as m FROM sales');
    const invoiceNo = Math.max(4000, maxInvObj?.m || 4000) + 1;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestampStr = now.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const categorySet = new Set<string>();
    items.forEach((it: any) => {
      if (it.category) categorySet.add(it.category);
    });
    const categorySummary = Array.from(categorySet).join(', ') || 'Photocopy';

    // 1. Insert into sales
    runSql(`
      INSERT INTO sales (
        invoice_no, timestamp, date, user_name, customer_name, customer_phone, customer_address,
        category_summary, description, subtotal, discount, grand_total, paid, due, items_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNo, timestampStr, dateStr, user || 'Staff', customer || 'New Customer',
      phone || '01904142370', address || 'Paduar Bazar, Cumilla', categorySummary,
      desc || '', parseFloat(subtotal) || 0, parseFloat(discount) || 0,
      parseFloat(grandTotal) || 0, parseFloat(paid) || 0, parseFloat(due) || 0,
      JSON.stringify(items || [])
    ]);

    const createdSale = queryOne('SELECT id FROM sales WHERE invoice_no = ?', [invoiceNo]);
    const saleId = createdSale?.id || 0;

    // Auto-save customer into customers database if not already exists
    const trimmedCustomer = (customer || '').trim();
    if (trimmedCustomer && trimmedCustomer.toLowerCase() !== 'general customer') {
      const existingCust = queryOne('SELECT id, phone, address FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [trimmedCustomer]);
      if (!existingCust) {
        const maxCustObj = queryOne('SELECT MAX(sl) as m FROM customers');
        const nextCustSl = (maxCustObj?.m || 0) + 1;
        runSql(
          'INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)',
          [nextCustSl, trimmedCustomer, phone ? phone.trim() : '', address ? address.trim() : 'Paduar Bazar, Cumilla']
        );
      } else if (phone && !existingCust.phone) {
        runSql('UPDATE customers SET phone = ?, address = ? WHERE id = ?', [phone.trim(), address ? address.trim() : existingCust.address, existingCust.id]);
      }
    }

    // 2. Insert items and automatically deduct stationery stock
    for (const it of items) {
      runSql(`
        INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId, invoiceNo, it.category, it.name,
        parseFloat(it.price) || 0, parseFloat(it.costPrice) || 0,
        parseFloat(it.qty) || 1, parseFloat(it.total) || 0
      ]);

      // Deduct product stock automatically across all inventory items
      const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [it.name]);
      if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
        const soldQty = parseFloat(it.qty) || 1;
        const newStock = Math.max(0, (prod.stock_qty || 0) - soldQty);
        runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
      }
    }
    saveDatabase();

    // 3. Record in Due Ledger if due > 0
    const dueVal = parseFloat(due) || 0;
    if (dueVal > 0) {
      const dueDesc = `Memo #${invoiceNo}${desc ? ` [${desc.trim()}]` : ''}`;
      runSql(`
        INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `INV-${invoiceNo}`, dateStr, customer || 'New Customer', phone || '01904142370',
        address || 'Paduar Bazar, Cumilla', 'Memo / Bill', dueDesc, dueVal, 0,
        user || 'Staff', `${dateStr} ${now.toTimeString().split(' ')[0]}`
      ]);
    }

    const responseRecord = {
      rowId: saleId,
      id: saleId,
      invoiceNo,
      timestamp: timestampStr,
      rawDate: dateStr,
      date: dateStr,
      user,
      customer: customer || 'New Customer',
      phone: phone || '01904142370',
      address: address || 'Paduar Bazar, Cumilla',
      category: categorySummary,
      desc,
      subtotal,
      discount,
      grandTotal,
      paid,
      due,
      items
    };

    // Real-time automatic background backup to Google Apps Script & Google Sheet
    sendToAppsScript({
      action: 'add_sale',
      ...responseRecord
    }).catch(e => console.error('Apps Script sale dispatch error:', e));

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const linkedSetting = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'");
    if (token && linkedSetting?.value) {
      appendSaleToSpreadsheet(linkedSetting.value, token, responseRecord).catch(e => console.error('Sheet append error:', e));
    }

    return res.json({
      status: 'success',
      message: `Invoice #${invoiceNo} created successfully!`,
      invoiceNo,
      invoiceData: responseRecord
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/sales/:id', (req: Request, res: Response) => {
  try {
    const saleId = parseInt(req.params.id, 10);
    const existing = queryOne('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

    const { customer, phone, address, desc, subtotal, discount, grandTotal, paid, due, items, user } = req.body;
    const oldItems = JSON.parse(existing.items_json || '[]');

    // Reconcile stock delta between old items and new items
    const deltaMap: Record<string, number> = {};
    oldItems.forEach((it: any) => {
      if (it.category === 'Stationery Products' && it.name) {
        const k = it.name.trim().toLowerCase();
        deltaMap[k] = (deltaMap[k] || 0) - (parseFloat(it.qty) || 0);
      }
    });
    items.forEach((it: any) => {
      if (it.category === 'Stationery Products' && it.name) {
        const k = it.name.trim().toLowerCase();
        deltaMap[k] = (deltaMap[k] || 0) + (parseFloat(it.qty) || 0);
      }
    });

    Object.keys(deltaMap).forEach(k => {
      const diffSold = deltaMap[k];
      if (diffSold !== 0) {
        const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = ?', [k]);
        if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
          const newStock = Math.max(0, (prod.stock_qty || 0) - diffSold);
          runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
        }
      }
    });

    const categorySet = new Set<string>();
    items.forEach((it: any) => { if (it.category) categorySet.add(it.category); });
    const categorySummary = Array.from(categorySet).join(', ') || 'Photocopy';

    // Update sales record
    runSql(`
      UPDATE sales SET
        customer_name = ?, customer_phone = ?, customer_address = ?,
        category_summary = ?, description = ?, subtotal = ?, discount = ?,
        grand_total = ?, paid = ?, due = ?, items_json = ?
      WHERE id = ?
    `, [
      customer || 'New Customer', phone || '01904142370', address || 'Paduar Bazar, Cumilla',
      categorySummary, desc || '', parseFloat(subtotal) || 0, parseFloat(discount) || 0,
      parseFloat(grandTotal) || 0, parseFloat(paid) || 0, parseFloat(due) || 0,
      JSON.stringify(items || []), saleId
    ]);

    // Replace sale_items
    runSql('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
    items.forEach((it: any) => {
      runSql(`
        INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId, existing.invoice_no, it.category, it.name,
        parseFloat(it.price) || 0, parseFloat(it.costPrice) || 0,
        parseFloat(it.qty) || 1, parseFloat(it.total) || 0
      ]);
    });

    // Sync Due Ledger
    const invNoStr = `INV-${existing.invoice_no}`;
    const dueVal = parseFloat(due) || 0;
    const existingDue = queryOne('SELECT id FROM due_ledger WHERE entry_id = ? OR description LIKE ?', [invNoStr, `%Memo #${existing.invoice_no}%`]);

    if (dueVal > 0) {
      const dueDesc = `Memo #${existing.invoice_no}${desc ? ` [${desc.trim()}]` : ''}`;
      if (existingDue) {
        runSql(`
          UPDATE due_ledger SET customer_name = ?, customer_phone = ?, customer_address = ?, description = ?, due_dr = ?, paid_cr = 0
          WHERE id = ?
        `, [customer || 'New Customer', phone || '01904142370', address || 'Paduar Bazar, Cumilla', dueDesc, dueVal, existingDue.id]);
      } else {
        runSql(`
          INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          invNoStr, existing.date, customer || 'New Customer', phone || '01904142370',
          address || 'Paduar Bazar, Cumilla', 'Memo / Bill', dueDesc, dueVal, 0,
          user || existing.user_name, existing.timestamp
        ]);
      }
    } else {
      if (existingDue) {
        runSql('UPDATE due_ledger SET due_dr = 0, description = description || " [Paid in Full]" WHERE id = ?', [existingDue.id]);
      }
    }

    const updatedSale = {
      rowId: saleId,
      id: saleId,
      invoiceNo: existing.invoice_no,
      timestamp: existing.timestamp,
      rawDate: existing.date,
      date: existing.date,
      user: existing.user_name,
      customer,
      phone,
      address,
      category: categorySummary,
      desc,
      subtotal,
      discount,
      grandTotal,
      paid,
      due,
      items
    };

    return res.json({
      status: 'success',
      message: `Invoice #${existing.invoice_no} updated successfully!`,
      invoiceData: updatedSale
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/sales/:id', (req: Request, res: Response) => {
  try {
    const saleId = parseInt(req.params.id, 10);
    const existing = queryOne('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

    // 1. Restore product stock for stationery items
    const items = JSON.parse(existing.items_json || '[]');
    items.forEach((it: any) => {
      if (it.category === 'Stationery Products' && it.name) {
        const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = LOWER(?)', [it.name]);
        if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
          const newStock = (prod.stock_qty || 0) + (parseFloat(it.qty) || 0);
          runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
        }
      }
    });

    // 2. Mark due ledger record cancelled (never delete for permanent audit history)
    runSql('UPDATE due_ledger SET due_dr = 0, description = description || " [Memo Deleted / Cancelled]" WHERE entry_id = ? OR description LIKE ?', [
      `INV-${existing.invoice_no}`,
      `%Memo #${existing.invoice_no}%`
    ]);

    // 3. Delete sale and items
    runSql('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
    runSql('DELETE FROM sales WHERE id = ?', [saleId]);

    return res.json({ status: 'success', message: `Invoice #${existing.invoice_no} deleted and stock restored!` });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- DUE LEDGER PAYMENTS ----------------
apiRouter.post('/due-ledger/payment', (req: Request, res: Response) => {
  try {
    const { customer, phone, address, amount, date, desc, user } = req.body;
    const amt = parseFloat(amount) || 0;
    if (!customer || amt <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid customer name and amount required' });
    }

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timestampStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;

    const countObj = queryOne('SELECT COUNT(*) as c FROM due_ledger');
    const entryId = `PAY-${(countObj?.c || 0) + 1001}`;

    runSql(`
      INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entryId, dateStr, customer.trim(), phone ? phone.trim() : '', address ? address.trim() : 'Paduar Bazar, Cumilla',
      'Payment Received', desc ? desc.trim() : 'Cash / bKash Payment', 0, amt, user || 'Staff', timestampStr
    ]);

    // Real-time automatic background backup to Google Apps Script & Google Sheet
    sendToAppsScript({
      action: 'add_payment',
      entryId,
      date: dateStr,
      customer: customer.trim(),
      phone: phone ? phone.trim() : '',
      desc: desc ? desc.trim() : 'Cash / bKash Payment',
      amount: amt,
      user: user || 'Staff',
      timestamp: timestampStr
    }).catch(e => console.error('Apps Script payment dispatch error:', e));

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const linkedSetting = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'");
    if (token && linkedSetting?.value) {
      appendPaymentToSpreadsheet(linkedSetting.value, token, {
        entryId,
        date: dateStr,
        customer: customer.trim(),
        phone: phone ? phone.trim() : '',
        desc: desc ? desc.trim() : 'Cash / bKash Payment',
        amount: amt,
        user: user || 'Staff',
        timestamp: timestampStr
      }).catch(e => console.error('Sheet payment append error:', e));
    }

    return res.json({ status: 'success', message: 'Payment recorded successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- PURCHASES ----------------
apiRouter.post('/purchases', (req: Request, res: Response) => {
  try {
    const { items, supplier, notes, date, user } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one product required' });
    }

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timestampStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;

    let grandTotal = 0;
    const itemSummaries: string[] = [];

    for (const it of items) {
      const pName = (it.product || '').trim();
      const qVal = parseFloat(it.qty) || 1;
      const uCost = parseFloat(it.unitCost) || 0;
      const tCost = parseFloat(it.totalCost) || (qVal * uCost);
      const cat = it.category || 'Stationery Products';

      grandTotal += tCost;
      itemSummaries.push(`${pName} (${qVal} units)`);

      const purCount = queryOne('SELECT COUNT(*) as c FROM purchases')?.c || 0;
      const purId = `PUR-${purCount + 1001}`;

      // Insert purchase
      runSql(`
        INSERT INTO purchases (purchase_id, date, timestamp, product_name, category, qty, unit_cost, total_cost, supplier, notes, user_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [purId, dateStr, timestampStr, pName, cat, qVal, uCost, tCost, supplier || '', notes || '', user || 'Staff']);

      // Increment stock in products
      const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = LOWER(?)', [pName]);
      if (prod) {
        const curStock = (prod.stock_qty || 0) + qVal;
        runSql('UPDATE products SET stock_qty = ?, cost_price = ? WHERE id = ?', [curStock, uCost > 0 ? uCost : prod.cost_price, prod.id]);
      } else {
        const maxSl = (queryOne('SELECT MAX(sl) as m FROM products WHERE category = ?', [cat])?.m || 0) + 1;
        runSql(`
          INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [maxSl, cat, pName, Math.round(uCost * 1.25), uCost, qVal, 5]);
      }
    }

    // Consolidated expense
    const expCount = queryOne('SELECT COUNT(*) as c FROM expenses')?.c || 0;
    const expId = `EXP-${expCount + 1001}`;
    const expDesc = `Product Purchase: ${itemSummaries.join(', ')}${supplier ? ` [Supplier: ${supplier}]` : ''}`;
    runSql(`
      INSERT INTO expenses (expense_id, timestamp, date, category, description, amount, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [expId, timestampStr, dateStr, 'Stationery Products Purchase', expDesc, grandTotal, user || 'Staff']);

    return res.json({ status: 'success', message: `${items.length} items purchased and stock increased!` });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

function cleanExpenseCategory(cat: string): string {
  const map: Record<string, string> = {
    'shop rent': 'Shop Rent',
    'rent': 'Shop Rent',
    'electricity bill': 'Electricity Bill',
    'electricity': 'Electricity Bill',
    'electric bill': 'Electricity Bill',
    'current bill': 'Electricity Bill',
    'internet bill': 'Internet Bill',
    'wifi bill': 'Internet Bill',
    'internet': 'Internet Bill',
    'staff salary': 'Staff Salary',
    'salary': 'Staff Salary',
    'paper purchase': 'Paper Purchase',
    'paper': 'Paper Purchase',
    'ink / toner': 'Ink & Toner',
    'ink and toner': 'Ink & Toner',
    'toner': 'Ink & Toner',
    'machine maintenance': 'Machine Repair & Servicing',
    'servicing': 'Machine Repair & Servicing',
    'repair': 'Machine Repair & Servicing',
    'tea & snacks': 'Tea & Entertainment',
    'tea and snacks': 'Tea & Entertainment',
    'snacks': 'Tea & Entertainment',
    'food': 'Tea & Entertainment',
    'tea': 'Tea & Entertainment',
    'stationery products purchase': 'Stationery Supplies',
    'stationery': 'Stationery Supplies',
    'photocopy paper & toner purchase': 'Photocopy Consumables',
    'hardware & tools': 'Hardware & Parts',
    'hardware': 'Hardware & Parts',
    'computer parts': 'Hardware & Parts',
    'conveyance': 'Conveyance & Transport',
    'transport': 'Conveyance & Transport',
    'travel': 'Conveyance & Transport',
    'fare': 'Conveyance & Transport',
    'mobile recharge': 'Mobile Bill & Recharge',
    'mobile bill': 'Mobile Bill & Recharge',
    'shop decoration': 'Shop Renovation',
    'decoration': 'Shop Renovation',
    'packaging': 'Packaging & Supplies',
    'others': 'Other Expenses',
    'general': 'Other Expenses',
    'shop expense': 'Other Expenses',
    'office expense': 'Other Expenses'
  };
  const key = (cat || '').toLowerCase().trim();
  return map[key] || cat || 'Other Expenses';
}

apiRouter.post('/photocopy-paper', (req: Request, res: Response) => {
  try {
    const { productName, qty } = req.body;
    const pName = (productName || '').trim();
    if (!pName) return res.status(400).json({ status: 'error', message: 'Product name required' });

    const qVal = parseFloat(qty) || 1;

    // Deduct stock from products inventory
    const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = LOWER(?)', [pName]);
    if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
      const newStock = Math.max(0, (prod.stock_qty || 0) - qVal);
      runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
      saveDatabase();
    }

    return res.json({ 
      status: 'success', 
      message: `Deducted ${qVal} unit(s) from paper stock for photocopy usage.` 
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/purchases/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM purchases WHERE id = ?', [id]);
    saveDatabase();
    return res.json({ status: 'success', message: 'Purchase record deleted' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- EXPENSES ----------------
apiRouter.post('/expenses', (req: Request, res: Response) => {
  try {
    const { category, description, amount, date, user } = req.body;
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return res.status(400).json({ status: 'error', message: 'Valid amount required' });

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timestampStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;

    const count = queryOne('SELECT COUNT(*) as c FROM expenses')?.c || 0;
    const expId = `EXP-${count + 1001}`;
    const cleanCategory = cleanExpenseCategory(category || 'Other Expenses');

    runSql(`
      INSERT INTO expenses (expense_id, timestamp, date, category, description, amount, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [expId, timestampStr, dateStr, cleanCategory, description ? description.trim() : '', amt, user || 'Staff']);

    saveDatabase();

    // Dispatch to Permanent Google Apps Script Web App
    sendToAppsScript({
      action: 'add_expense',
      expenseId: expId,
      timestamp: timestampStr,
      date: dateStr,
      category: cleanCategory,
      description: description || '',
      amount: amt,
      user: user || 'Staff'
    }).catch(e => console.error('Apps Script expense dispatch error:', e));

    return res.json({ status: 'success', message: 'Expense saved successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/expenses/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { category, description, amount, date } = req.body;
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return res.status(400).json({ status: 'error', message: 'Valid amount required' });

    const cleanCategory = cleanExpenseCategory(category || 'Other Expenses');
    runSql(`
      UPDATE expenses SET category = ?, description = ?, amount = ?, date = ? WHERE id = ?
    `, [cleanCategory, description ? description.trim() : '', amt, date, id]);

    saveDatabase();
    return res.json({ status: 'success', message: 'Expense updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/expenses/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM expenses WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'Expense deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- CASH CLOSING ----------------
apiRouter.post('/cash-closings', (req: Request, res: Response) => {
  try {
    const {
      date, user, openingCash, prevShortageDeducted, salesInflow, dueInflow,
      totalInflow, expenseOutflow, expectedCash, actualCash, difference, status,
      notes, denominations
    } = req.body;

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const closedAt = now.toLocaleString('en-US', { hour12: true });

    const existing = queryOne('SELECT id FROM cash_closings WHERE date = ?', [dateStr]);

    if (existing) {
      runSql(`
        UPDATE cash_closings SET
          closed_at = ?, user_name = ?, opening_cash = ?, prev_shortage_deducted = ?,
          sales_inflow = ?, due_inflow = ?, total_inflow = ?, expense_outflow = ?,
          expected_cash = ?, actual_cash = ?, difference = ?, status = ?,
          notes = ?, denominations_json = ?
        WHERE id = ?
      `, [
        closedAt, user || 'Staff', parseFloat(openingCash) || 0, parseFloat(prevShortageDeducted) || 0,
        parseFloat(salesInflow) || 0, parseFloat(dueInflow) || 0, parseFloat(totalInflow) || 0,
        parseFloat(expenseOutflow) || 0, parseFloat(expectedCash) || 0, parseFloat(actualCash) || 0,
        parseFloat(difference) || 0, status, notes || '', JSON.stringify(denominations || {}),
        existing.id
      ]);
      saveDatabase();
      return res.json({ status: 'success', message: `Cash closing updated for ${dateStr}!` });
    } else {
      const count = queryOne('SELECT COUNT(*) as c FROM cash_closings')?.c || 0;
      const closingId = `CC-${count + 1001}`;

      runSql(`
        INSERT INTO cash_closings (
          closing_id, date, closed_at, user_name, opening_cash, prev_shortage_deducted,
          sales_inflow, due_inflow, total_inflow, expense_outflow, expected_cash,
          actual_cash, difference, status, notes, denominations_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        closingId, dateStr, closedAt, user || 'Staff', parseFloat(openingCash) || 0,
        parseFloat(prevShortageDeducted) || 0, parseFloat(salesInflow) || 0,
        parseFloat(dueInflow) || 0, parseFloat(totalInflow) || 0,
        parseFloat(expenseOutflow) || 0, parseFloat(expectedCash) || 0,
        parseFloat(actualCash) || 0, parseFloat(difference) || 0, status,
        notes || '', JSON.stringify(denominations || {})
      ]);
      saveDatabase();

      // Dispatch to Permanent Google Apps Script Web App
      sendToAppsScript({
        action: 'add_cash_closing',
        closingId,
        date: dateStr,
        closedAt,
        user: user || 'Staff',
        totalInflow: parseFloat(totalInflow) || 0,
        expenseOutflow: parseFloat(expenseOutflow) || 0,
        expectedCash: parseFloat(expectedCash) || 0,
        actualCash: parseFloat(actualCash) || 0,
        difference: parseFloat(difference) || 0,
        status
      }).catch(e => console.error('Apps Script cash closing dispatch error:', e));

      return res.json({ status: 'success', message: `Cash closing saved for ${dateStr}!` });
    }
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- USERS & PERMISSIONS ----------------
apiRouter.post('/users/change-password', (req: Request, res: Response) => {
  try {
    const { username, currentPassword, newPassword, targetUserId, isAdminChange } = req.body;
    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'New password cannot be empty' });
    }

    if (isAdminChange && targetUserId) {
      runSql('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword.trim(), targetUserId]);
      return res.json({ status: 'success', message: 'Password updated successfully' });
    }

    const user = queryOne<{ id: number; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (currentPassword && user.password_hash !== currentPassword.trim()) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
    }

    runSql('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword.trim(), user.id]);
    return res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.post('/users', (req: Request, res: Response) => {
  try {
    const { username, password, role, phone, permissions } = req.body;
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Username and password required' });

    runSql(`
      INSERT INTO users (username, password_hash, role, phone, permissions) VALUES (?, ?, ?, ?, ?)
    `, [username.trim(), password.trim(), role || 'staff', phone || '', permissions || 'all']);

    return res.json({ status: 'success', message: 'User created successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { password, role, phone, permissions } = req.body;

    if (password) {
      runSql('UPDATE users SET password_hash = ?, role = ?, phone = ?, permissions = ? WHERE id = ?', [password.trim(), role, phone || '', permissions, id]);
    } else {
      runSql('UPDATE users SET role = ?, phone = ?, permissions = ? WHERE id = ?', [role, phone || '', permissions, id]);
    }

    return res.json({ status: 'success', message: 'User updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'User deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- DATA MIGRATION & EXPORT ----------------
apiRouter.post('/migrate/import-sheets', (req: Request, res: Response) => {
  try {
    const { customers, products, sales, expenses, dueLedger, purchases } = req.body;
    let importedCustomers = 0;
    let importedProducts = 0;
    let importedSales = 0;
    let importedExpenses = 0;
    let importedDues = 0;
    let importedPurchases = 0;

    if (Array.isArray(customers)) {
      customers.forEach((c: any) => {
        if (c.name) {
          const exists = queryOne('SELECT id FROM customers WHERE LOWER(name) = LOWER(?)', [c.name.trim()]);
          if (!exists) {
            runSql('INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)', [
              c.sl || (importedCustomers + 1), c.name.trim(), c.phone || '', c.address || ''
            ]);
            importedCustomers++;
          }
        }
      });
    }

    if (Array.isArray(products)) {
      products.forEach((p: any) => {
        if (p.name) {
          const exists = queryOne('SELECT id FROM products WHERE LOWER(name) = LOWER(?)', [p.name.trim()]);
          if (!exists) {
            runSql('INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES (?, ?, ?, ?, ?, ?, ?)', [
              p.sl || 1, p.category || 'Photocopy', p.name.trim(), p.price || 0, p.costPrice || 0, p.stockQty || 0, p.lowStockLimit || 5
            ]);
            importedProducts++;
          }
        }
      });
    }

    if (Array.isArray(sales)) {
      sales.forEach((s: any) => {
        const invNo = parseInt(s.invoiceNo || s.invoice_no, 10);
        if (invNo) {
          const exists = queryOne('SELECT id FROM sales WHERE invoice_no = ?', [invNo]);
          if (!exists) {
            runSql(`
              INSERT INTO sales (invoice_no, timestamp, date, user_name, customer_name, customer_phone, customer_address, category_summary, description, subtotal, discount, grand_total, paid, due, items_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              invNo, s.timestamp || '', s.date || s.rawDate || '', s.user || s.user_name || 'Staff',
              s.customer || s.customer_name || 'New Customer', s.phone || s.customer_phone || '',
              s.address || s.customer_address || '', s.category || s.category_summary || 'Photocopy',
              s.desc || s.description || '', s.subtotal || 0, s.discount || 0, s.grandTotal || s.grand_total || 0,
              s.paid || 0, s.due || 0, JSON.stringify(s.items || [])
            ]);
            importedSales++;
          }
        }
      });
    }

    return res.json({
      status: 'success',
      message: `Migration completed: ${importedCustomers} customers, ${importedProducts} products, ${importedSales} sales imported.`,
      report: { importedCustomers, importedProducts, importedSales, importedExpenses, importedDues, importedPurchases }
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- GOOGLE SHEETS LIVE SYNC ----------------

function extractGoogleSheetInfo(url: string): { spreadsheetId: string | null; gid?: string } {
  if (!url) return { spreadsheetId: null };
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : null;
  const gidMatch = url.match(/[#?&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : undefined;
  return { spreadsheetId, gid };
}

function parseCsv(csvText: string): string[][] {
  const clean = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
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
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const str = String(val)
    .replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString())
    .replace(/[^\d.-]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? fallback : n;
}

function parseDate(val: any): string {
  if (!val) {
    return new Date().toISOString().split('T')[0];
  }
  const str = String(val)
    .replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString())
    .trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Date().toISOString().split('T')[0];
}

async function fetchGoogleSheetCsv(spreadsheetId: string, gid?: string, sheetName?: string): Promise<string> {
  const urls: string[] = [];
  if (sheetName) {
    urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`);
  }
  if (gid !== undefined && gid !== '') {
    urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
  }
  urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
  urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        redirect: 'follow'
      });

      if (!response.ok) {
        continue;
      }

      const text = await response.text();
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
          throw new Error("The Google Sheet is private. Please set sheet Share settings to 'Anyone with the link can view'.");
        }
        continue;
      }

      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error("Unable to fetch data from Google Sheets. Please ensure the link is correct and set to 'Anyone with the link can view'.");
}

function findHeaderIndex(headers: string[], keywords: string[]): number {
  return headers.findIndex(h => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    return keywords.some(k => clean.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
  });
}

apiRouter.post('/google-sheets/preview', async (req: Request, res: Response) => {
  try {
    const { sheetUrl, tabName } = req.body;
    if (!sheetUrl || typeof sheetUrl !== 'string' || !sheetUrl.trim()) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid Google Sheet URL.' });
    }

    const { spreadsheetId, gid } = extractGoogleSheetInfo(sheetUrl.trim());
    if (!spreadsheetId) {
      return res.status(400).json({ status: 'error', message: 'Invalid URL. Please enter a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)' });
    }

    const csvText = await fetchGoogleSheetCsv(spreadsheetId, gid, tabName);
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No data found in the specified sheet.' });
    }

    const headers = rows[0];
    const previewRows = rows.slice(1, 6);

    return res.json({
      status: 'success',
      totalRows: Math.max(0, rows.length - 1),
      headers,
      previewRows
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message || 'Error fetching Google Sheet.' });
  }
});

apiRouter.post('/google-sheets/sync', async (req: Request, res: Response) => {
  try {
    const { sheetUrl, clearExisting = true, tabName } = req.body;
    if (!sheetUrl || typeof sheetUrl !== 'string' || !sheetUrl.trim()) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid Google Sheet URL.' });
    }

    const { spreadsheetId, gid } = extractGoogleSheetInfo(sheetUrl.trim());
    if (!spreadsheetId) {
      return res.status(400).json({ status: 'error', message: 'Invalid Google Sheet URL. It must contain https://docs.google.com/spreadsheets/d/...' });
    }

    // Check if this is the multi-tab AS Computer sheet or if specific tab requested
    let isMultiTabSync = false;
    let usersCsv = '';
    let stockCsv = '';
    let dueCsv = '';
    let salesCsv = '';

    if (!tabName && (gid === undefined || gid === '0')) {
      // Attempt multi-tab fetch
      try {
        const [uText, stText, dText, sText] = await Promise.allSettled([
          fetchGoogleSheetCsv(spreadsheetId, '1627183030', 'Users'),
          fetchGoogleSheetCsv(spreadsheetId, '892731544', 'Stock'),
          fetchGoogleSheetCsv(spreadsheetId, '1770443700', 'Due'),
          fetchGoogleSheetCsv(spreadsheetId, '0', 'Sales')
        ]);

        if (dText.status === 'fulfilled' && dText.value.length > 50 &&
            sText.status === 'fulfilled' && sText.value.length > 50) {
          isMultiTabSync = true;
          usersCsv = uText.status === 'fulfilled' ? uText.value : '';
          stockCsv = stText.status === 'fulfilled' ? stText.value : '';
          dueCsv = dText.value;
          salesCsv = sText.value;
        }
      } catch (e) {
        isMultiTabSync = false;
      }
    }

    if (isMultiTabSync) {
      // Clear existing records as requested
      if (clearExisting) {
        runSql('DELETE FROM users');
        runSql('DELETE FROM products');
        runSql('DELETE FROM customers');
        runSql('DELETE FROM sales');
        runSql('DELETE FROM sale_items');
        runSql('DELETE FROM due_ledger');
        runSql('DELETE FROM expenses');
        runSql('DELETE FROM purchases');
        runSql('DELETE FROM cash_closings');
      }

      const customersMap = new Map<string, { name: string; phone: string; address: string }>();

      // 1. Sync Users (GID 1627183030)
      let importedUsers = 0;
      if (usersCsv) {
        const uRows = parseCsv(usersCsv).slice(1);
        for (const r of uRows) {
          if (!r[0]) continue;
          const username = r[0].trim();
          const password = r[1] ? r[1].trim() : '12345';
          const role = (r[2] || 'staff').toLowerCase().trim();
          const phone = r[3] ? r[3].trim() : '';
          const permissions = role === 'admin' ? 'all' : 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print';
          runSql('INSERT INTO users (username, password_hash, role, phone, permissions) VALUES (?, ?, ?, ?, ?)', [
            username, password, role, phone, permissions
          ]);
          importedUsers++;
        }
      }
      if (importedUsers === 0) {
        // Fallback default users
        runSql(`
          INSERT INTO users (username, password_hash, role, phone, permissions) VALUES
          ('Md Abu Said', '12345', 'admin', '01904142370', 'all'),
          ('Md Sujon', '2008', 'staff', '01712345678', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'),
          ('Md Saimon Hasan', '1020', 'staff', '01812345678', 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print')
        `);
        importedUsers = 3;
      }

      // 2. Sync Stock / Products (GID 892731544)
      let importedProducts = 0;
      if (stockCsv) {
        const stRows = parseCsv(stockCsv).slice(1);
        for (let i = 0; i < stRows.length; i++) {
          const r = stRows[i];
          if (!r[2]) continue;
          const sl = parseInt(r[0]) || (i + 1);
          const category = r[1] ? r[1].trim() : 'Stationery';
          const name = r[2].trim();
          const sellingPrice = parseNumber(r[3], 0);
          const costPrice = parseNumber(r[4], 0);
          const stockQty = r[5] !== '' && r[5] !== undefined ? parseNumber(r[5], 0) : null;
          const lowStockLimit = r[6] !== '' && r[6] !== undefined ? parseNumber(r[6], 5) : 5;

          runSql('INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES (?, ?, ?, ?, ?, ?, ?)', [
            sl, category, name, sellingPrice, costPrice, stockQty, lowStockLimit
          ]);
          importedProducts++;
        }
      }

      // 3. Sync Due Ledger
      let importedDues = 0;
      if (dueCsv) {
        const dRows = parseCsv(dueCsv).slice(1);
        for (let i = 0; i < dRows.length; i++) {
          const r = dRows[i];
          if (!r[2]) continue; // Customer Name
          const entryId = r[0] ? r[0].trim() : (`DUE-${i + 1001}`);
          const date = parseDate(r[1]);
          const custName = r[2].trim();
          const phone = r[3] ? r[3].trim() : '';
          const transType = r[4] ? r[4].trim() : 'Memo / Bill';
          const desc = r[5] ? r[5].trim() : '';
          const dueDr = parseNumber(r[6], 0);
          const paidCr = parseNumber(r[7], 0);
          const user = r[8] ? r[8].trim() : 'Md Abu Said';
          const timestamp = r[9] ? r[9].trim() : (`${date} 12:00:00`);

          runSql('INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            entryId, date, custName, phone, 'Paduar Bazar, Cumilla', transType, desc, dueDr, paidCr, user, timestamp
          ]);
          importedDues++;

          if (!customersMap.has(custName.toLowerCase())) {
            customersMap.set(custName.toLowerCase(), { name: custName, phone, address: 'Paduar Bazar, Cumilla' });
          }
        }
      }

      // 4. Sync Sales & Sale Items (GID 0 - বিক্রয় খাতা)
      let importedSales = 0;
      let importedSaleItems = 0;
      if (salesCsv) {
        const sRows = parseCsv(salesCsv).slice(1);
        for (let i = 0; i < sRows.length; i++) {
          const r = sRows[i];
          if (!r.some(c => c && c.trim())) continue;
          let invNo = Math.round(parseNumber(r[0]));
          if (!invNo || invNo <= 0) invNo = 4001 + i;
          const timestamp = r[1] ? r[1].trim() : new Date().toISOString();
          const date = parseDate(timestamp);
          const user = r[2] ? r[2].trim() : 'Staff';
          const customer = r[3] ? r[3].trim() : 'General Customer';
          const phone = r[4] ? r[4].trim() : '';
          const category = r[5] ? r[5].trim() : 'Photocopy';
          const desc = r[6] ? r[6].trim() : category;
          const subtotal = parseNumber(r[7], 0);
          const discount = parseNumber(r[8], 0);
          const paid = parseNumber(r[9], 0);
          const netTotal = parseNumber(r[10], subtotal - discount);
          const due = Math.max(0, Math.round((netTotal - paid) * 100) / 100);

          let items: any[] = [];
          if (r[11]) {
            try {
              const rawJson = r[11].trim();
              if (rawJson.startsWith('[') && rawJson.endsWith(']')) {
                items = JSON.parse(rawJson);
              }
            } catch (e) {}
          }
          if (!items || items.length === 0) {
            items = [{
              category,
              name: desc || category,
              price: netTotal,
              costPrice: Math.round(netTotal * 0.4),
              qty: 1,
              total: netTotal
            }];
          }

          runSql('INSERT INTO sales (invoice_no, timestamp, date, user_name, customer_name, customer_phone, customer_address, category_summary, description, subtotal, discount, grand_total, paid, due, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            invNo, timestamp, date, user, customer, phone, 'Paduar Bazar, Cumilla', category, desc, subtotal, discount, netTotal, paid, due, JSON.stringify(items)
          ]);
          importedSales++;

          const saleId = invNo;
          for (const it of items) {
            runSql('INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
              saleId, invNo, it.category || category, it.name || desc,
              parseFloat(it.price) || 0, parseFloat(it.costPrice) || 0,
              parseFloat(it.qty) || 1, parseFloat(it.total) || 0
            ]);
            importedSaleItems++;
          }

          if (customer && customer !== 'General Customer' && !customersMap.has(customer.toLowerCase())) {
            customersMap.set(customer.toLowerCase(), { name: customer, phone, address: 'Paduar Bazar, Cumilla' });
          }
        }
      }

      // 5. Populate Customers Directory
      let custSl = 1;
      for (const cust of customersMap.values()) {
        runSql('INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)', [
          custSl++, cust.name, cust.phone, cust.address
        ]);
      }

      saveDatabase();

      return res.json({
        status: 'success',
        message: `Google Sheet synchronized successfully! Imported ${importedSales} memos, ${importedDues} due records, ${importedProducts} stock products, and ${importedUsers} user accounts.`,
        report: {
          importedSales,
          importedDues,
          importedProducts,
          importedUsers,
          importedCustomers: customersMap.size,
          importedExpenses: 0
        }
      });
    }

    // Single-tab fallback
    const csvText = await fetchGoogleSheetCsv(spreadsheetId, gid, tabName);
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      return res.status(400).json({ status: 'error', message: 'No data rows found in Google Sheet (at least 1 header and 1 data row required).' });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const invIndex = findHeaderIndex(headers, ['invoice no', 'invoiceno', 'invoice_no', 'invoice', 'inv', 'memo no', 'memo', 'মেমো নং', 'মেমো', 'ভাউচার', 'ইনভয়েস']);
    const dateIndex = findHeaderIndex(headers, ['date', 'তারিখ', 'timestamp', 'time', 'সময়']);
    const userIndex = findHeaderIndex(headers, ['username', 'user_name', 'user', 'staff', 'cashier', 'operator', 'ইউজার', 'স্টাফ', 'অপারেটর']);
    let custIndex = findHeaderIndex(headers, ['customer name', 'customer_name', 'customer', 'client name', 'client', 'পার্টি নাম', 'কাস্টমার নাম', 'কাস্টমার', 'ক্রেতা', 'গ্রাহক']);
    if (custIndex === -1 || custIndex === userIndex) {
      custIndex = headers.findIndex((h, idx) => {
        if (idx === userIndex) return false;
        const clean = h.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
        if (clean.includes('user') || clean.includes('staff')) return false;
        return clean.includes('customer') || clean.includes('client') || clean.includes('name') || clean.includes('নাম');
      });
    }
    const phoneIndex = findHeaderIndex(headers, ['customer mobile', 'customer phone', 'mobile', 'cell', 'phone', 'contact', 'মোবাইল', 'ফোন', 'নাম্বার']);
    const addressIndex = findHeaderIndex(headers, ['address', 'location', 'ঠিকানা', 'গ্রাম']);
    const catIndex = findHeaderIndex(headers, ['category', 'service', 'type', 'ক্যাটাগরি', 'ধরন', 'বিভাগ', 'সেবা']);
    const descIndex = findHeaderIndex(headers, ['description', 'details', 'item', 'desc', 'product', 'বিবরণ', 'মালের নাম', 'পণ্য']);
    const subtotalIndex = findHeaderIndex(headers, ['subtotal', 'sub_total', 'উপমোট']);
    const discountIndex = findHeaderIndex(headers, ['discount', 'disc', 'ছাড়', 'লেস', 'কমিশন']);
    let totalIndex = findHeaderIndex(headers, ['net amount', 'net_amount', 'grand total', 'grand_total', 'grandtotal', 'সর্বমোট', 'মোট বিল', 'নেট টাকা']);
    if (totalIndex === -1) {
      totalIndex = headers.findIndex((h, idx) => {
        if (idx === subtotalIndex || idx === discountIndex) return false;
        const clean = h.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
        if (clean.includes('subtotal') || clean.includes('discount') || clean.includes('paid')) return false;
        return clean.includes('total') || clean.includes('amount') || clean.includes('bill') || clean.includes('মোট');
      });
    }
    const paidIndex = findHeaderIndex(headers, ['paid amount', 'paid_amount', 'paid', 'received', 'cash', 'deposit', 'নগদ', 'জমা', 'পরিশোধ', 'পেইড']);
    const dueIndex = findHeaderIndex(headers, ['due amount', 'due_amount', 'due', 'balance', 'outstanding', 'বাকি', 'বকেয়া', 'দেনা']);
    const itemsDataIndex = findHeaderIndex(headers, ['items data', 'items', 'item_data', 'items_json', 'পণ্য ডাটা', 'আইটেম']);

    let importedSales = 0;
    let importedCustomers = 0;
    let importedDues = 0;

    if (clearExisting) {
      runSql('DELETE FROM sales');
      runSql('DELETE FROM sale_items');
      runSql('DELETE FROM due_ledger');
      runSql('DELETE FROM customers');
    }

    let maxInvoiceNo = 1000;
    dataRows.forEach((row, i) => {
      if (!row.some(c => c && c.trim() !== '')) return;

      let invNo = invIndex >= 0 ? Math.round(parseNumber(row[invIndex])) : 0;
      if (!invNo || invNo <= 0) {
        maxInvoiceNo++;
        invNo = maxInvoiceNo;
      } else {
        maxInvoiceNo = Math.max(maxInvoiceNo, invNo);
      }

      const date = dateIndex >= 0 ? parseDate(row[dateIndex]) : new Date().toISOString().split('T')[0];
      const customer = custIndex >= 0 && row[custIndex] ? row[custIndex].trim() : 'General Customer';
      const phone = phoneIndex >= 0 && row[phoneIndex] ? row[phoneIndex].trim() : '';
      const address = addressIndex >= 0 && row[addressIndex] ? row[addressIndex].trim() : '';

      let category = catIndex >= 0 && row[catIndex] ? row[catIndex].trim() : 'Photocopy';
      const desc = descIndex >= 0 && row[descIndex] ? row[descIndex].trim() : category;
      const total = totalIndex >= 0 ? parseNumber(row[totalIndex]) : 0;
      const subtotal = subtotalIndex >= 0 ? parseNumber(row[subtotalIndex]) : total;
      const discount = discountIndex >= 0 ? parseNumber(row[discountIndex]) : Math.max(0, subtotal - total);
      let paid = paidIndex >= 0 ? parseNumber(row[paidIndex]) : total;
      let due = dueIndex >= 0 ? parseNumber(row[dueIndex]) : Math.max(0, Math.round((total - paid) * 100) / 100);
      if (paidIndex === -1 && dueIndex >= 0) {
        paid = Math.max(0, Math.round((total - due) * 100) / 100);
      }
      const user = userIndex >= 0 && row[userIndex] ? row[userIndex].trim() : 'Staff';

      if (customer && customer !== 'General Customer') {
        const custExists = queryOne('SELECT id FROM customers WHERE LOWER(name) = LOWER(?)', [customer]);
        if (!custExists) {
          runSql('INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)', [
            importedCustomers + 1, customer, phone, address || 'Paduar Bazar, Cumilla'
          ]);
          importedCustomers++;
        }
      }

      let items: any[] = [];
      if (itemsDataIndex >= 0 && row[itemsDataIndex]) {
        try {
          const rawJson = row[itemsDataIndex].trim();
          if (rawJson.startsWith('[') && rawJson.endsWith(']')) {
            items = JSON.parse(rawJson);
          }
        } catch (e) {}
      }
      if (!items || items.length === 0) {
        items = [{
          category,
          name: desc || category,
          price: total,
          costPrice: Math.round(total * 0.4),
          qty: 1,
          total
        }];
      }

      runSql(`
        INSERT OR REPLACE INTO sales (invoice_no, timestamp, date, user_name, customer_name, customer_phone, customer_address, category_summary, description, subtotal, discount, grand_total, paid, due, items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invNo, `${date} 12:00:00`, date, user, customer, phone, address || 'Paduar Bazar, Cumilla', category, desc, subtotal, discount, total, paid, due, JSON.stringify(items)
      ]);
      importedSales++;

      const createdSale = queryOne('SELECT id FROM sales WHERE invoice_no = ?', [invNo]);
      const saleId = createdSale?.id || invNo;

      for (const it of items) {
        runSql(`
          INSERT INTO sale_items (sale_id, invoice_no, category, product_name, price, cost_price, qty, total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId, invNo, it.category || category, it.name || desc,
          parseFloat(it.price) || 0, parseFloat(it.costPrice) || 0,
          parseFloat(it.qty) || 1, parseFloat(it.total) || 0
        ]);
      }

      if (due > 0) {
        const entryId = `DUE-${invNo}-${Date.now()}-${i}`;
        runSql(`
          INSERT INTO due_ledger (entry_id, date, customer_name, customer_phone, customer_address, transaction_type, description, due_dr, paid_cr, user_name, timestamp)
          VALUES (?, ?, ?, ?, ?, 'due_added', ?, ?, 0, ?, ?)
        `, [
          entryId, date, customer, phone, address || 'Paduar Bazar, Cumilla', `Invoice #${invNo} - ${category}`, due, user, `${date} 12:00:00`
        ]);
        importedDues++;
      }
    });

    saveDatabase();

    return res.json({
      status: 'success',
      message: `Google Sheet updated successfully! Imported ${importedSales} invoices/memos, ${importedCustomers} customers, and ${importedDues} due ledger records.`,
      report: {
        importedSales,
        importedCustomers,
        importedDues,
        importedExpenses: 0,
        totalRows: dataRows.length,
        headersDetected: headers
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message || 'Error processing Google Sheet data.' });
  }
});

// ---------------- GOOGLE DRIVE AUTOMATIC BACKUP & SYNC ----------------

apiRouter.post('/google-drive/create-and-sync', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Google authentication token missing. Please sign in with Google.' });
    }

    const db = getDb();
    const report = await createAndSyncSpreadsheet(db, token);
    saveDatabase();

    return res.json({
      status: 'success',
      message: 'Master Google Spreadsheet created and synced successfully!',
      report
    });
  } catch (err: any) {
    console.error('Create and sync spreadsheet error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to backup to Google Sheets.' });
  }
});

apiRouter.post('/google-drive/sync-now', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Google authentication token missing. Please sign in with Google.' });
    }

    const db = getDb();
    const linkedSetting = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'");
    const report = await createAndSyncSpreadsheet(db, token, linkedSetting?.value);
    saveDatabase();

    return res.json({
      status: 'success',
      message: 'Linked Google Spreadsheet updated and synchronized successfully!',
      report
    });
  } catch (err: any) {
    console.error('Sync now error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to update Google Sheet.' });
  }
});

apiRouter.post('/google-drive/link-sheet', async (req: Request, res: Response) => {
  try {
    const { sheetUrlOrId } = req.body;
    if (!sheetUrlOrId || !sheetUrlOrId.trim()) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid Google Sheet URL or ID' });
    }

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const cleanId = sheetUrlOrId.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || sheetUrlOrId.trim();
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

    const now = new Date().toISOString();
    runSql("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('linked_spreadsheet_id', ?, ?)", [cleanId, now]);
    runSql("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('linked_spreadsheet_url', ?, ?)", [sheetUrl, now]);
    saveDatabase();

    let report = null;
    if (token) {
      const db = getDb();
      try {
        report = await createAndSyncSpreadsheet(db, token, cleanId);
      } catch (syncErr: any) {
        console.warn('Sync on link warning:', syncErr.message);
      }
    }

    return res.json({
      status: 'success',
      message: 'Google Spreadsheet successfully linked to system!',
      linkedSheetId: cleanId,
      linkedSheetUrl: sheetUrl,
      report
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to link spreadsheet' });
  }
});

apiRouter.get('/google-drive/status', (_req: Request, res: Response) => {
  const linkedSheetId = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'")?.value || '';
  const linkedSheetUrl = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_url'")?.value || '';
  const lastBackupTime = queryOne("SELECT value FROM app_settings WHERE key = 'last_backup_time'")?.value || '';

  return res.json({
    status: 'success',
    linkedSheetId,
    linkedSheetUrl,
    lastBackupTime
  });
});

apiRouter.post('/google-drive/unlink', (_req: Request, res: Response) => {
  runSql("DELETE FROM app_settings WHERE key IN ('linked_spreadsheet_id', 'linked_spreadsheet_url', 'last_backup_time')");
  saveDatabase();
  return res.json({ status: 'success', message: 'Google Sheet unlinked successfully' });
});

// ---------------- DATABASE MANAGEMENT (CLEAR ALL DATA) ----------------
apiRouter.post('/database/clear-all', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const db = getDb();

    // Wipe all transactional, inventory and customer records
    db.run(`
      DELETE FROM sales;
      DELETE FROM sale_items;
      DELETE FROM due_ledger;
      DELETE FROM expenses;
      DELETE FROM purchases;
      DELETE FROM cash_closings;
      DELETE FROM customers;
      DELETE FROM products;
      DELETE FROM sqlite_sequence WHERE name IN ('sales', 'sale_items', 'due_ledger', 'expenses', 'purchases', 'cash_closings', 'customers', 'products');
    `);
    saveDatabase();

    // Also clear linked Google Sheet rows if connected
    const linkedSetting = queryOne("SELECT value FROM app_settings WHERE key = 'linked_spreadsheet_id'");
    if (linkedSetting?.value && token) {
      try {
        const { clearSpreadsheetData } = await import('./googleDriveService.js');
        await clearSpreadsheetData(linkedSetting.value, token);
      } catch (sheetClearErr) {
        console.warn('Clearing Google Sheet warning:', sheetClearErr);
      }
    }

    return res.json({
      status: 'success',
      message: 'All site data and linked sheet records have been completely cleared.'
    });
  } catch (err: any) {
    console.error('Clear all error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Failed to clear database' });
  }
});

// ---------------- APPS SCRIPT PERMANENT SYNC ----------------
apiRouter.get('/apps-script/info', (_req: Request, res: Response) => {
  return res.json({
    status: 'success',
    scriptUrl: PERMANENT_APPS_SCRIPT_URL
  });
});

apiRouter.post('/apps-script/sync', async (_req: Request, res: Response) => {
  try {
    const sales = queryAll('SELECT * FROM sales ORDER BY id DESC');
    const dues = queryAll('SELECT * FROM due_ledger ORDER BY id DESC');
    const products = queryAll('SELECT * FROM products ORDER BY id ASC');
    const customers = queryAll('SELECT * FROM customers ORDER BY id ASC');
    const expenses = queryAll('SELECT * FROM expenses ORDER BY id DESC');
    const cashClosings = queryAll('SELECT * FROM cash_closings ORDER BY id DESC');

    const result = await sendToAppsScript({
      action: 'sync_all',
      sales,
      dues,
      products,
      customers,
      expenses,
      cashClosings
    });

    return res.json({
      status: 'success',
      message: 'All records synced to permanent Google Apps Script web app successfully!',
      result
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});


