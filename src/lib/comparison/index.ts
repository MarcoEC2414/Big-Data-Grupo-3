// src/lib/comparison/index.ts

// Re-export types
export * from './types';

// Re-export services
export { parseCSV, normalizeCSVRecord, getFieldType } from './csvParser';
export { fieldComparator } from './fieldComparator';
export { compareData } from './comparisonService';
export { exportToCSV } from './exportService';
