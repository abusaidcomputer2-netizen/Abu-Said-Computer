const fs = require('fs');
const path = require('path');

const csvPath = path.resolve('public/assets/aistudio/AS_Computer_Shop_Management_System_40d860e8');
const text = fs.readFileSync(csvPath, 'utf8');

// Parse raw CSV lines properly handling quotes and commas inside JSON items
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

const lines = parseCSVLines(text);
const header = lines[0];
console.log('Header:', header);
const dataRows = lines.slice(1);
console.log('Total raw rows:', dataRows.length);

// Columns:
// 0: Invoice No
// 1: Timestamp
// 2: User
// 3: Customer
// 4: Phone
// 5: Category
// 6: Description
// 7: Subtotal
// 8: Discount
// 9: Grand Total
// 10: Paid
// 11: Due
// 12: Items

const octRows = dataRows.filter(r => {
  const ts = r[1] || '';
  return ts.startsWith('2026-10') || ts.includes('/10/2026') || ts.includes('-10-2026');
});

console.log('October rows count:', octRows.length);
if (octRows.length > 0) {
  console.log('First Oct row:', octRows[0]);
  console.log('Last Oct row:', octRows[octRows.length - 1]);
}

const dueRows = octRows.filter(r => {
  const due = parseFloat((r[11] || '0').replace(/,/g, '')) || 0;
  return due > 0;
});

console.log('October due rows count:', dueRows.length);
let totalDue = 0;
dueRows.forEach(r => {
  const due = parseFloat((r[11] || '0').replace(/,/g, '')) || 0;
  totalDue += due;
  console.log(`Invoice ${r[0]}: ${r[3]} | Due: Tk ${due} | Date: ${r[1]}`);
});
console.log('Total October Due:', totalDue);
