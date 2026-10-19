import { Database } from 'sql.js';

interface SyncReport {
  spreadsheetId: string;
  spreadsheetUrl: string;
  salesCount: number;
  duesCount: number;
  productsCount: number;
  usersCount: number;
  customersCount: number;
  syncedAt: string;
}

export async function createAndSyncSpreadsheet(
  db: Database,
  token: string,
  existingSpreadsheetId?: string
): Promise<SyncReport> {
  const queryAll = (sql: string, params: any[] = []): any[] => {
    try {
      const res = db.exec(sql, params);
      if (!res || res.length === 0) return [];
      const cols = res[0].columns;
      return res[0].values.map(row => {
        const obj: any = {};
        cols.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (e) {
      console.error('SQL query error:', e);
      return [];
    }
  };

  const runSql = (sql: string, params: any[] = []): void => {
    db.run(sql, params);
  };

  // 1. Gather all data from database
  const sales = queryAll('SELECT * FROM sales ORDER BY invoice_no ASC');
  const dues = queryAll('SELECT * FROM due_ledger ORDER BY id ASC');
  const products = queryAll('SELECT * FROM products ORDER BY category ASC, sl ASC');
  const users = queryAll('SELECT username, role, phone, permissions FROM users ORDER BY id ASC');
  const customers = queryAll('SELECT sl, name, phone, address FROM customers ORDER BY sl ASC, name ASC');

  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '';

  // 2. If existingSpreadsheetId provided, verify if accessible
  if (spreadsheetId) {
    try {
      const checkResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!checkResp.ok) {
        spreadsheetId = undefined; // Need to create a new one
      } else {
        const existingData = await checkResp.json();
        // Check if required sheets exist, if not add them
        const existingSheets: string[] = (existingData.sheets || []).map((s: any) => s.properties?.title);
        const requiredSheets = [
          'বিক্রয় খাতা (Sales)',
          'বাকির খাতা (Due Ledger)',
          'স্টক ও পণ্য তালিকা (Stock)',
          'ইউজার তালিকা (Staff Users)',
          'কাস্টমার তালিকা (Customers)'
        ];
        const missingSheets = requiredSheets.filter(t => !existingSheets.includes(t));
        if (missingSheets.length > 0) {
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: missingSheets.map(title => ({
                addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } }
              }))
            })
          });
        }
      }
    } catch (e) {
      console.warn('Failed to verify existing spreadsheet, creating fresh one:', e);
      spreadsheetId = undefined;
    }
  }

  // If no valid existing spreadsheet, create a new one
  if (!spreadsheetId) {
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `AS Computer - Shop Master Database`
        },
        sheets: [
          { properties: { title: 'বিক্রয় খাতা (Sales)', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'বাকির খাতা (Due Ledger)', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'স্টক ও পণ্য তালিকা (Stock)', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'ইউজার তালিকা (Staff Users)', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'কাস্টমার তালিকা (Customers)', gridProperties: { frozenRowCount: 1 } } }
        ]
      })
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      throw new Error(`গুগল শিট তৈরি করা যায়নি (${createResp.status}): ${errText}`);
    }

    const sheetData = await createResp.json();
    spreadsheetId = sheetData.spreadsheetId;
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 3. Prepare Tab Data
  // Tab 1: Sales
  const salesHeaders = [
    'Invoice No', 'Timestamp', 'Date', 'User / Staff', 'Customer Name',
    'Customer Mobile', 'Category', 'Description', 'Subtotal (৳)',
    'Discount (৳)', 'Grand Total (৳)', 'Paid Amount (৳)', 'Due Amount (৳)', 'Items Data'
  ];
  const salesRows = sales.map(s => [
    s.invoice_no,
    s.timestamp,
    s.date,
    s.user_name,
    s.customer_name,
    s.customer_phone || '',
    s.category_summary,
    s.description || '',
    s.subtotal,
    s.discount,
    s.grand_total,
    s.paid,
    s.due,
    s.items_json || ''
  ]);

  // Tab 2: Due Ledger
  const dueHeaders = [
    'Entry ID', 'Date', 'Customer Name', 'Customer Mobile',
    'Transaction Type', 'Description', 'Due Billed (৳)', 'Paid Received (৳)', 'User / Staff', 'Timestamp'
  ];
  const dueRows = dues.map(d => [
    d.entry_id,
    d.date,
    d.customer_name,
    d.customer_phone || '',
    d.transaction_type,
    d.description || '',
    d.due_dr,
    d.paid_cr,
    d.user_name || '',
    d.timestamp
  ]);

  // Tab 3: Products & Stock
  const stockHeaders = [
    'SL', 'Category', 'Product Name', 'Selling Price (৳)', 'Cost Price (৳)', 'Stock Qty', 'Low Stock Limit'
  ];
  const stockRows = products.map(p => [
    p.sl,
    p.category,
    p.name,
    p.selling_price,
    p.cost_price,
    p.stock_qty !== null && p.stock_qty !== undefined ? p.stock_qty : '',
    p.low_stock_limit || 5
  ]);

  // Tab 4: Staff Users
  const userHeaders = ['Username', 'Role', 'Phone', 'Permissions'];
  const userRows = users.map(u => [
    u.username,
    u.role,
    u.phone || '',
    u.permissions || ''
  ]);

  // Tab 5: Customers
  const custHeaders = ['SL', 'Customer Name', 'Mobile Number', 'Address'];
  const custRows = customers.map(c => [
    c.sl,
    c.name,
    c.phone || '',
    c.address || ''
  ]);

  // 4. Batch update values into the Spreadsheet
  const updateData = [
    { range: "'বিক্রয় খাতা (Sales)'!A1", values: [salesHeaders, ...salesRows] },
    { range: "'বাকির খাতা (Due Ledger)'!A1", values: [dueHeaders, ...dueRows] },
    { range: "'স্টক ও পণ্য তালিকা (Stock)'!A1", values: [stockHeaders, ...stockRows] },
    { range: "'ইউজার তালিকা (Staff Users)'!A1", values: [userHeaders, ...userRows] },
    { range: "'কাস্টমার তালিকা (Customers)'!A1", values: [custHeaders, ...custRows] }
  ];

  const batchResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData
    })
  });

  if (!batchResp.ok) {
    const errText = await batchResp.text();
    console.error('Batch update values failed:', errText);
  }

  // 5. Save linked spreadsheet in database settings
  const now = new Date().toISOString();
  runSql("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('linked_spreadsheet_id', ?, ?)", [spreadsheetId, now]);
  runSql("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('linked_spreadsheet_url', ?, ?)", [spreadsheetUrl, now]);
  runSql("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('last_backup_time', ?, ?)", [now, now]);

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl: spreadsheetUrl!,
    salesCount: sales.length,
    duesCount: dues.length,
    productsCount: products.length,
    usersCount: users.length,
    customersCount: customers.length,
    syncedAt: now
  };
}

export async function appendSaleToSpreadsheet(
  spreadsheetId: string,
  token: string,
  sale: any
): Promise<void> {
  try {
    const row = [
      sale.invoiceNo,
      sale.timestamp,
      sale.date,
      sale.user,
      sale.customer || 'General Customer',
      sale.phone || '',
      sale.category || 'Photocopy',
      sale.desc || '',
      sale.subtotal,
      sale.discount || 0,
      sale.grandTotal,
      sale.paid,
      sale.due,
      JSON.stringify(sale.items || [])
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'বিক্রয় খাতা (Sales)'!A:A:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });

    // If sale had due, append to Due Ledger
    if (sale.due > 0) {
      const dueRow = [
        `INV-${sale.invoiceNo}`,
        sale.date,
        sale.customer || 'General Customer',
        sale.phone || '',
        'মেমো / বিল',
        `Memo #${sale.invoiceNo}${sale.desc ? ` [${sale.desc}]` : ''}`,
        sale.due,
        0,
        sale.user,
        sale.timestamp
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'বাকির খাতা (Due Ledger)'!A:A:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [dueRow]
        })
      });
    }
  } catch (err) {
    console.error('Failed to append sale to Google Sheet:', err);
  }
}

export async function appendPaymentToSpreadsheet(
  spreadsheetId: string,
  token: string,
  payment: {
    entryId: string;
    date: string;
    customer: string;
    phone: string;
    desc: string;
    amount: number;
    user: string;
    timestamp: string;
  }
): Promise<void> {
  try {
    const dueRow = [
      payment.entryId,
      payment.date,
      payment.customer,
      payment.phone || '',
      'পেমেন্ট জমা / পরিশোধ',
      payment.desc || 'Cash / bKash Payment',
      0,
      payment.amount,
      payment.user,
      payment.timestamp
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'বাকির খাতা (Due Ledger)'!A:A:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [dueRow]
      })
    });
  } catch (err) {
    console.error('Failed to append payment to Google Sheet:', err);
  }
}
