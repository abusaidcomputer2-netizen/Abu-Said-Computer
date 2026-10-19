import { Database } from 'sql.js';

export interface SyncReport {
  spreadsheetId: string;
  spreadsheetUrl: string;
  salesCount: number;
  duesCount: number;
  productsCount: number;
  usersCount: number;
  customersCount: number;
  expensesCount: number;
  syncedAt: string;
}

export const REQUIRED_SHEETS = [
  'Sales Record',
  'Due Ledger',
  'Stock Inventory',
  'Customers',
  'Staff Users',
  'Expenses'
];

export const PERMANENT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxpPzExy1dxtfFNivYU4rVuNGQLCSD8DQEnMGFYugplvK_i4NCZ4GuGYuIUZtbjhUyp4g/exec';

/**
 * Dispatches an event or record update to the permanent Google Apps Script web app
 */
export async function sendToAppsScript(
  payload: Record<string, any>,
  scriptUrl: string = PERMANENT_APPS_SCRIPT_URL
): Promise<{ status: string; message?: string; raw?: string }> {
  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch {
      return { status: res.ok ? 'success' : 'error', raw: text };
    }
  } catch (err: any) {
    console.error('Apps Script webhook error:', err?.message || err);
    return { status: 'error', message: err?.message || 'Apps Script network error' };
  }
}

/**
 * Extracts Google Spreadsheet ID from raw ID or full Google Sheets URL
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Creates or synchronizes all shop data to Google Spreadsheet with spacious row heights
 */
export async function createAndSyncSpreadsheet(
  db: Database,
  token: string,
  existingInputId?: string
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
  const expenses = queryAll('SELECT * FROM expenses ORDER BY id ASC');

  let spreadsheetId = existingInputId ? extractSpreadsheetId(existingInputId) : undefined;
  let spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '';
  let sheetMetaList: any[] = [];

  // 2. If existingSpreadsheetId provided, verify if accessible
  if (spreadsheetId) {
    try {
      const checkResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!checkResp.ok) {
        spreadsheetId = undefined;
      } else {
        const existingData = await checkResp.json();
        sheetMetaList = existingData.sheets || [];
        const existingSheets: string[] = sheetMetaList.map((s: any) => s.properties?.title);
        const missingSheets = REQUIRED_SHEETS.filter(t => !existingSheets.includes(t));
        if (missingSheets.length > 0) {
          const addResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
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
          if (addResp.ok) {
            // refresh meta list
            const refreshResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (refreshResp.ok) {
              const refreshed = await refreshResp.json();
              sheetMetaList = refreshed.sheets || [];
            }
          }
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
          title: `Abu Said Computer - Shop Master Database`
        },
        sheets: REQUIRED_SHEETS.map(title => ({
          properties: { title, gridProperties: { frozenRowCount: 1 } }
        }))
      })
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      throw new Error(`Failed to create Google Spreadsheet (${createResp.status}): ${errText}`);
    }

    const sheetData = await createResp.json();
    spreadsheetId = sheetData.spreadsheetId;
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    sheetMetaList = sheetData.sheets || [];
  }

  // 3. Prepare Tab Headers and Rows (Pure English)
  const salesHeaders = [
    'Invoice No', 'Timestamp', 'Date', 'Staff / User', 'Customer Name',
    'Customer Mobile', 'Category', 'Description', 'Subtotal (Tk)',
    'Discount (Tk)', 'Grand Total (Tk)', 'Paid Amount (Tk)', 'Due Amount (Tk)', 'Items Data'
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

  const dueHeaders = [
    'Entry ID', 'Date', 'Customer Name', 'Customer Mobile',
    'Transaction Type', 'Description', 'Due Billed (Tk)', 'Paid Received (Tk)', 'Staff / User', 'Timestamp'
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

  const stockHeaders = [
    'SL', 'Category', 'Product Name', 'Selling Price (Tk)', 'Cost Price (Tk)', 'Stock Qty', 'Low Stock Limit'
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

  const custHeaders = ['SL', 'Customer Name', 'Mobile Number', 'Address'];
  const custRows = customers.map(c => [
    c.sl,
    c.name,
    c.phone || '',
    c.address || ''
  ]);

  const userHeaders = ['Username', 'Role', 'Mobile', 'Permissions'];
  const userRows = users.map(u => [
    u.username,
    u.role,
    u.phone || '',
    u.permissions || ''
  ]);

  const expenseHeaders = ['Expense ID', 'Timestamp', 'Date', 'Expense Category', 'Description', 'Amount (Tk)', 'Staff / User'];
  const expenseRows = expenses.map(e => [
    e.expense_id,
    e.timestamp,
    e.date,
    e.category, // Expense category can be Bengali
    e.description || '',
    e.amount,
    e.user_name || ''
  ]);

  // 4. Batch clear existing data if desired, then write values
  // First clear ranges from A2 downwards so old rows are wiped
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: [
          "'Sales Record'!A1:Z5000",
          "'Due Ledger'!A1:Z5000",
          "'Stock Inventory'!A1:Z5000",
          "'Customers'!A1:Z5000",
          "'Staff Users'!A1:Z5000",
          "'Expenses'!A1:Z5000"
        ]
      })
    });
  } catch (clearErr) {
    console.warn('Batch clear warning:', clearErr);
  }

  // Write new headers + rows
  const updateData = [
    { range: "'Sales Record'!A1", values: [salesHeaders, ...salesRows] },
    { range: "'Due Ledger'!A1", values: [dueHeaders, ...dueRows] },
    { range: "'Stock Inventory'!A1", values: [stockHeaders, ...stockRows] },
    { range: "'Customers'!A1", values: [custHeaders, ...custRows] },
    { range: "'Staff Users'!A1", values: [userHeaders, ...userRows] },
    { range: "'Expenses'!A1", values: [expenseHeaders, ...expenseRows] }
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

  // 5. Format row heights, alignment, and styling!
  // Setting row height to 38px (taller/larger as requested) and header to 44px
  try {
    const formatRequests: any[] = [];
    for (const sheet of sheetMetaList) {
      const sheetId = sheet.properties?.sheetId;
      if (sheetId !== undefined && sheetId !== null) {
        // Set Header row height = 44px
        formatRequests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 0,
              endIndex: 1
            },
            properties: {
              pixelSize: 44
            },
            fields: 'pixelSize'
          }
        });

        // Set Data rows height = 36px (Spacious and large, instead of cramped 21px)
        formatRequests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2000
            },
            properties: {
              pixelSize: 36
            },
            fields: 'pixelSize'
          }
        });

        // Format header row style (Navy background, bold white text, middle aligned)
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                  fontSize: 11
                },
                verticalAlignment: 'MIDDLE',
                padding: { top: 6, bottom: 6, left: 8, right: 8 }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,padding)'
          }
        });

        // Format data rows: verticalAlignment = MIDDLE, padding = 6px
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              endRowIndex: 2000
            },
            cell: {
              userEnteredFormat: {
                verticalAlignment: 'MIDDLE',
                textFormat: {
                  fontSize: 10
                },
                padding: { top: 6, bottom: 6, left: 8, right: 8 }
              }
            },
            fields: 'userEnteredFormat(verticalAlignment,textFormat.fontSize,padding)'
          }
        });
      }
    }

    if (formatRequests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: formatRequests })
      });
    }
  } catch (formatErr) {
    console.warn('Formatting spreadsheet rows failed (ignoring):', formatErr);
  }

  // 6. Save linked spreadsheet in database settings
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
    expensesCount: expenses.length,
    syncedAt: now
  };
}

/**
 * Appends a newly created sale record to Google Sheet
 */
export async function appendSaleToSpreadsheet(
  spreadsheetId: string,
  token: string,
  sale: any
): Promise<void> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);
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

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'Sales Record'!A:A:append?valueInputOption=USER_ENTERED`, {
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
        'Sales Memo',
        `Memo #${sale.invoiceNo}${sale.desc ? ` [${sale.desc}]` : ''}`,
        sale.due,
        0,
        sale.user,
        sale.timestamp
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'Due Ledger'!A:A:append?valueInputOption=USER_ENTERED`, {
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

/**
 * Appends a due payment record to Google Sheet
 */
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
    const cleanId = extractSpreadsheetId(spreadsheetId);
    const dueRow = [
      payment.entryId,
      payment.date,
      payment.customer,
      payment.phone || '',
      'Payment Received',
      payment.desc || 'Cash / bKash Payment',
      0,
      payment.amount,
      payment.user,
      payment.timestamp
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'Due Ledger'!A:A:append?valueInputOption=USER_ENTERED`, {
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

/**
 * Clears all data rows from Google Sheet, leaving only headers
 */
export async function clearSpreadsheetData(
  spreadsheetId: string,
  token: string
): Promise<void> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    const rangesToClear = REQUIRED_SHEETS.map(sheet => `'${sheet}'!A2:Z5000`);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values:batchClear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ranges: rangesToClear
      })
    });
  } catch (err) {
    console.error('Failed to clear spreadsheet data:', err);
  }
}
