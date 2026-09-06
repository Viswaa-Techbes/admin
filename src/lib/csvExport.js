/**
 * Secure CSV export helper with protection against CSV Formula Injection.
 * Prefixes any field starting with =, +, -, @, \t, \r with a single quote.
 */

export function sanitizeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If starts with dangerous spreadsheet formula character, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export function generateCsv(headers, rows) {
  const headerLine = headers.map(sanitizeCsvField).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => sanitizeCsvField(row[h] !== undefined ? row[h] : '')).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
