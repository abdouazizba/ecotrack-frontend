/**
 * Export data to a CSV file with BOM for Excel UTF-8 compatibility.
 *
 * @param {string} filename - Name of the downloaded file (e.g. "signalements.csv")
 * @param {Array<{key: string, label: string}>} headers - Column definitions
 * @param {Array<Object>} rows - Array of data objects
 */
export function exportToCsv(filename, headers, rows) {
  const separator = ';';
  const headerLine = headers.map((h) => escapeField(h.label)).join(separator);

  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        return escapeField(value == null ? '' : String(value));
      })
      .join(separator)
  );

  const csvContent = [headerLine, ...dataLines].join('\r\n');

  // BOM for proper UTF-8 display in Excel
  const bom = '﻿';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeField(value) {
  if (value.includes('"') || value.includes(';') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
