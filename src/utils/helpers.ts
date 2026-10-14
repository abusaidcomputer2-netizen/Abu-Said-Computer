export function formatCurrency(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '' || isNaN(Number(val))) return '0';
  const n = Math.round(Number(val));
  const isNeg = n < 0;
  const s = String(Math.abs(n));
  let formatted = '';
  if (s.length > 3) {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const chunks: string[] = [];
    while (rest.length > 2) {
      chunks.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length > 0) chunks.unshift(rest);
    formatted = chunks.join(',') + ',' + last3;
  } else {
    formatted = s;
  }
  return (isNeg ? '-' : '') + formatted;
}

export function formatDateDisplay(dStr: string | undefined | null): string {
  if (!dStr) return '--';
  let str = String(dStr).trim();
  if (str.includes('T')) str = str.split('T')[0];
  if (str.includes(' ') && str.length > 10) str = str.split(' ')[0];
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(str)) return str;

  const parts = str.split(/[-\/]/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    let yr: number, mo: number, da: number;
    if (p0 > 1000) {
      yr = p0;
      mo = p1;
      da = p2;
    } else {
      da = p0;
      mo = p1;
      yr = p2;
    }
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mName = mo >= 1 && mo <= 12 ? shortMonths[mo - 1] : '';
    const daStr = da < 10 ? `0${da}` : String(da);
    return `${daStr}-${mName}-${yr}`;
  }
  return str;
}

export function formatPeriodHeader(fromD?: string, toD?: string, monthStr?: string): string {
  if (fromD && toD) {
    if (fromD === toD) return formatDateDisplay(fromD);
    return `${formatDateDisplay(fromD)} to ${formatDateDisplay(toD)}`;
  }
  if (fromD) return `From ${formatDateDisplay(fromD)}`;
  if (toD) return `Up to ${formatDateDisplay(toD)}`;
  if (monthStr) {
    const pM = monthStr.split(/[-\/]/);
    if (pM.length >= 2) {
      const yM = pM[0];
      const mM = parseInt(pM[1], 10);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${mM >= 1 && mM <= 12 ? monthNames[mM - 1] : ''}-${yM}`;
    }
    return monthStr;
  }
  return 'All Records';
}

export function formatInvoicePrintTimestamp(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(d.getMinutes()).padStart(2, '0');
  const secondsStr = String(d.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hoursStr}:${minutesStr}:${secondsStr} ${ampm}`;
}

export function generateBarcodeSvg(text: string): string {
  const cleanText = String(text || 'AS-4001').trim();
  const barWidths: number[] = [];
  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i);
    barWidths.push((code % 3) + 1.6);
    barWidths.push(1.2);
    barWidths.push(((code * 2) % 3) + 1.3);
    barWidths.push(1.1);
    barWidths.push(((code * 5) % 2) + 1.5);
    barWidths.push(1.3);
  }
  let totalW = 0;
  for (let b = 0; b < barWidths.length; b++) totalW += barWidths[b];

  let svg = `<svg class="w-32 h-6 block ml-auto" viewBox="0 0 ${totalW.toFixed(1)} 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${totalW.toFixed(1)}" height="20" fill="#ffffff"/>`;
  let curX = 0;
  for (let k = 0; k < barWidths.length; k += 2) {
    const barW = barWidths[k];
    const spaceW = k + 1 < barWidths.length ? barWidths[k + 1] : 0;
    svg += `<rect x="${curX.toFixed(2)}" y="1" width="${barW.toFixed(2)}" height="18" fill="#0f172a"/>`;
    curX += barW + spaceW;
  }
  svg += '</svg>';
  return svg;
}

export function normalizeCategory(cat?: string): 'Photocopy' | 'Online Application' | 'Stationery Products' {
  const c = (cat || '').toString().trim().toLowerCase();
  if (c.includes('photocopy') || c.includes('ফটোকপি')) return 'Photocopy';
  if (c.includes('stationery') || c.includes('স্টেশনারি')) return 'Stationery Products';
  return 'Online Application';
}

export function resolveCustomerAddress(custName?: string, savedAddress?: string): string {
  const addr = (savedAddress || '').trim();
  if (addr && addr !== '--' && addr !== 'N/A' && addr !== 'Cumilla') return addr;
  return 'Paduar Bazar, Cumilla';
}
