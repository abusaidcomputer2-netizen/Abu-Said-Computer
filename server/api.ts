import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from './db.js';

export const apiRouter = Router();

// Helper to execute SQL with parameters and return array of objects
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
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
  db.run(sql, params);
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

  if (!user || user.password_hash !== password.trim()) {
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
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- PRODUCTS ----------------
apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { sl, category, name, price, costPrice, stockQty, lowStockLimit } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Product name required' });

    let finalSl = parseInt(sl, 10);
    if (!finalSl || finalSl <= 0) {
      const maxSlObj = queryOne('SELECT MAX(sl) as m FROM products WHERE category = ?', [category]);
      finalSl = (maxSlObj?.m || 0) + 1;
    } else {
      const existing = queryOne('SELECT id FROM products WHERE category = ? AND sl = ?', [category, finalSl]);
      if (existing) {
        return res.status(400).json({ status: 'error', message: `Serial No (${finalSl}) already exists in ${category}` });
      }
    }

    runSql(
      'INSERT INTO products (sl, category, name, selling_price, cost_price, stock_qty, low_stock_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalSl, category, name.trim(), parseFloat(price) || 0, parseFloat(costPrice) || 0, stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null, parseFloat(lowStockLimit) || 5]
    );

    return res.json({ status: 'success', message: 'Product added successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { sl, category, name, price, costPrice, stockQty, lowStockLimit } = req.body;

    const existing = queryOne('SELECT id FROM products WHERE category = ? AND sl = ? AND id != ?', [category, sl, id]);
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Serial No (${sl}) already exists in ${category}` });
    }

    runSql(
      'UPDATE products SET sl = ?, category = ?, name = ?, selling_price = ?, cost_price = ?, stock_qty = ?, low_stock_limit = ? WHERE id = ?',
      [sl, category, name.trim(), parseFloat(price) || 0, parseFloat(costPrice) || 0, stockQty !== '' && stockQty !== null && stockQty !== undefined ? parseFloat(stockQty) : null, parseFloat(lowStockLimit) || 5, id]
    );

    return res.json({ status: 'success', message: 'Product updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'Product deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- CUSTOMERS ----------------
apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const { sl, name, phone, address } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Customer name required' });

    let finalSl = parseInt(sl, 10);
    if (!finalSl || finalSl <= 0) {
      const maxSlObj = queryOne('SELECT MAX(sl) as m FROM customers');
      finalSl = (maxSlObj?.m || 0) + 1;
    }

    runSql(
      'INSERT INTO customers (sl, name, phone, address) VALUES (?, ?, ?, ?)',
      [finalSl, name.trim(), phone ? phone.trim() : '', address ? address.trim() : '']
    );

    return res.json({ status: 'success', message: 'Customer saved successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.put('/customers/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { sl, name, phone, address } = req.body;

    runSql(
      'UPDATE customers SET sl = ?, name = ?, phone = ?, address = ? WHERE id = ?',
      [sl, name.trim(), phone ? phone.trim() : '', address ? address.trim() : '', id]
    );

    return res.json({ status: 'success', message: 'Customer updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM customers WHERE id = ?', [id]);
    return res.json({ status: 'success', message: 'Customer deleted successfully' });
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

      // Deduct stationery stock
      if (it.category === 'Stationery Products') {
        const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = LOWER(?)', [it.name]);
        if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
          const newStock = Math.max(0, (prod.stock_qty || 0) - (parseFloat(it.qty) || 0));
          runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
        }
      }
    }

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

apiRouter.post('/photocopy-paper', (req: Request, res: Response) => {
  try {
    const { productName, qty, unitCost, totalCost, date, notes, user } = req.body;
    const pName = (productName || '').trim();
    if (!pName) return res.status(400).json({ status: 'error', message: 'Product name required' });

    const qVal = parseFloat(qty) || 1;
    const uCost = parseFloat(unitCost) || 0;
    const tCost = parseFloat(totalCost) || (qVal * uCost);

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timestampStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;

    // Deduct stock
    const prod = queryOne('SELECT id, stock_qty FROM products WHERE LOWER(name) = LOWER(?)', [pName]);
    if (prod && prod.stock_qty !== null && prod.stock_qty !== undefined) {
      const newStock = Math.max(0, (prod.stock_qty || 0) - qVal);
      runSql('UPDATE products SET stock_qty = ? WHERE id = ?', [newStock, prod.id]);
    }

    // Log expense
    const expCount = queryOne('SELECT COUNT(*) as c FROM expenses')?.c || 0;
    const expId = `EXP-${expCount + 1001}`;
    const expDesc = `Photocopy paper usage: ${pName} (${qVal} Reams/Pcs)${notes ? ` [${notes.trim()}]` : ''}`;
    runSql(`
      INSERT INTO expenses (expense_id, timestamp, date, category, description, amount, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [expId, timestampStr, dateStr, 'Photocopy Paper & Toner Purchase', expDesc, tCost, user || 'Staff']);

    return res.json({ status: 'success', message: `Paper usage recorded and ৳${tCost} logged as expense` });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

apiRouter.delete('/purchases/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    runSql('DELETE FROM purchases WHERE id = ?', [id]);
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

    runSql(`
      INSERT INTO expenses (expense_id, timestamp, date, category, description, amount, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [expId, timestampStr, dateStr, category.trim(), description ? description.trim() : '', amt, user || 'Staff']);

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

    runSql(`
      UPDATE expenses SET category = ?, description = ?, amount = ?, date = ? WHERE id = ?
    `, [category.trim(), description ? description.trim() : '', amt, date, id]);

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
      return res.json({ status: 'success', message: `Cash closing saved for ${dateStr}!` });
    }
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------------- USERS & PERMISSIONS ----------------
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
