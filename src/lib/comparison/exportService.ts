// src/lib/comparison/exportService.ts

import {
  ComparisonItem,
  ComparisonType,
  RECORD_TYPE_LABELS,
} from './types';

/**
 * Exporta resultados a CSV
 */
export function exportToCSV(
  results: ComparisonItem[],
  type: ComparisonType,
  comparisonsAt: Date
): void {
  const headers = [
    'ID',
    'Tipo',
    'Campos_con_Diferencia',
    'Firebase_Valor',
    'CSV_Valor',
  ];

  const rows = results.map((item) => [
    item.id,
    RECORD_TYPE_LABELS[item.type],
    item.differenceFields.map((d) => d.fieldName).join('; ') || 'N/A',
    item.firebaseRecord ? formatValue(item.firebaseRecord) : 'N/A',
    item.csvRecord ? formatValue(item.csvRecord) : 'N/A',
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      row.map((v) => `"${escapeCSV(String(v))}"`).join(',')
    ),
  ].join('\n');

  downloadFile(
    csvContent,
    `data-comparison-${type}-${formatDate(comparisonsAt)}.csv`,
    'text/csv'
  );
}

/**
 * Descarga archivo en navegador
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formatea valor para CSV
 */
function formatValue(obj: any): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'boolean') return obj ? 'Sí' : 'No';
  if (obj === null || obj === undefined) return '';

  return JSON.stringify(obj);
}

/**
 * Escapa caracteres especiales en CSV
 */
function escapeCSV(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return value.replace(/"/g, '""');
  }
  return value;
}

/**
 * Formatea fecha para nombre de archivo
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}${minutes}`;
}
