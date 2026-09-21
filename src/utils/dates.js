function formatRentMonth(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseRentMonth(rentMonth) {
  const [y, m] = rentMonth.split('-').map(Number);
  return { year: y, month: m };
}

function getDueDate(rentMonth, dueDay = 1) {
  const { year, month } = parseRentMonth(rentMonth);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(Math.max(dueDay || 1, 1), lastDay);
  return new Date(year, month - 1, day);
}

function monthLabel(rentMonth) {
  const { year, month } = parseRentMonth(rentMonth);
  return new Date(year, month - 1, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function dayOfMonth(date = new Date()) {
  return date.getDate();
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return lines.join('\n');
}

module.exports = {
  formatRentMonth,
  parseRentMonth,
  getDueDate,
  monthLabel,
  dayOfMonth,
  toCsv,
};
