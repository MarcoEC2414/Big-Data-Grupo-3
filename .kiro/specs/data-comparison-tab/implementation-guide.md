# Guía de Implementación - Comparativa de Datos

## 1. Orden de Implementación Recomendado

```
Fase 1: Tipos e Interfaces (1-2 horas)
├─ types.ts - Definir todas las interfaces TypeScript
└─ ✓ Punto de referencia para todo el proyecto

Fase 2: Servicios Core (4-6 horas)
├─ csvParser.ts - Parseo y validación de CSV
├─ fieldComparator.ts - Lógica de comparación
├─ comparisonService.ts - Motor de comparación
└─ exportService.ts - Exportación de resultados

Fase 3: Hooks (3-4 horas)
├─ useComparison.ts - Orquestación principal
├─ useComparisonFilters.ts - Filtrado y búsqueda
└─ useCSVFile.ts - Gestión de archivo CSV

Fase 4: Componentes (6-8 horas)
├─ CSVUploader.tsx - Carga de archivos
├─ ComparisonSelector.tsx - Selección de tipo
├─ ResultsVisualization.tsx - Gráficos y resumen
├─ ResultsTable.tsx - Tabla de resultados
├─ FilterPanel.tsx - Panel de filtros
└─ ExportButton.tsx - Exportación

Fase 5: Integración (3-4 horas)
├─ comparativa.tsx - Ruta y layout
├─ Shell.tsx - Agregar navegación
└─ router.tsx - Registrar ruta

Fase 6: Testing (4-6 horas)
├─ Unit tests para servicios
├─ Integration tests para flujos
└─ Manual testing y ajustes

Total Estimado: 21-30 horas
```

---

## 2. Fase 1: Tipos e Interfaces

### 2.1 src/lib/comparison/types.ts

```typescript
// src/lib/comparison/types.ts

export type ComparisonType = 'alumnos' | 'cursos';
export type ComparisonStatus = 'idle' | 'loading' | 'comparing' | 'complete' | 'error' | 'cancelled';
export type RecordType = 'coincidencia' | 'diferencia' | 'faltante_csv' | 'faltante_firebase';

/**
 * Representa un archivo CSV cargado
 */
export interface CSVFile {
  name: string;
  data: Record<string, string>[];
  headers: string[];
  recordCount: number;
  loadedAt: Date;
  size: number; // en bytes
}

/**
 * Un item individual en el resultado de la comparación
 */
export interface ComparisonItem {
  id: string;
  type: RecordType;
  firebaseRecord: Record<string, any> | null;
  csvRecord: Record<string, string> | null;
  differenceFields: {
    fieldName: string;
    firebaseValue: any;
    csvValue: any;
  }[];
}

/**
 * Resultado completo de una comparación
 */
export interface ComparisonResult {
  type: ComparisonType;
  totalRecords: number;
  results: ComparisonItem[];
  summary: {
    coincidencias: number;
    diferencias: number;
    faltantesEnCSV: number;
    faltantesEnFirebase: number;
  };
  comparisonsAt: Date;
  processingTimeMs: number;
}

/**
 * Estado del filtrado
 */
export interface FilterState {
  recordTypes: RecordType[];
  searchId: string;
  expandedRows: Set<string>;
}

/**
 * Estado del progreso de comparación
 */
export interface ProgressState {
  current: number;
  total: number;
  status: ComparisonStatus;
  message?: string;
  estimatedTimeMs?: number;
}

/**
 * Error específico de comparación
 */
export interface ComparisonError {
  code: string;
  message: string;
  field?: string;
  recordId?: string;
}

/**
 * Error de validación de archivo
 */
export interface ValidationError {
  type:
    | 'file_size'
    | 'file_type'
    | 'missing_id'
    | 'missing_headers'
    | 'format_error'
    | 'empty_file';
  message: string;
  details?: any;
}

// Headers esperados por tipo
export const EXPECTED_HEADERS = {
  alumnos: [
    'ID',
    'Sexo',
    'Ciudad',
    'Asistencia',
    'Nota_Final',
    'Situación_Laboral',
    'Nivel_Educativo_Prev',
    'Conectividad_Hogar',
    'Rango_Etario',
    'Estado_Académico',
  ],
  cursos: ['ID', 'Nombre', 'Descripción', 'Docente'],
} as const;

// Traducciones de tipos de registro
export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  coincidencia: 'Coincidencia',
  diferencia: 'Diferencia',
  faltante_csv: 'Faltante en CSV',
  faltante_firebase: 'Faltante en Firebase',
};
```

---

## 3. Fase 2: Servicios Core

### 3.1 src/lib/comparison/csvParser.ts

```typescript
// src/lib/comparison/csvParser.ts

import Papa from 'papaparse';
import { ValidationError, ParseResult, EXPECTED_HEADERS } from './types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_EXTENSIONS = ['.csv'];

/**
 * Parsea un archivo CSV y valida su estructura
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  // Validación 1: Extensión
  if (!VALID_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    throw {
      type: 'file_type',
      message: 'Solo se aceptan archivos CSV (.csv)',
    } as ValidationError;
  }

  // Validación 2: Tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw {
      type: 'file_size',
      message: `Archivo mayor a ${MAX_FILE_SIZE / 1024 / 1024}MB (tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    } as ValidationError;
  }

  // Validación 3: Archivo vacío
  if (file.size === 0) {
    throw {
      type: 'empty_file',
      message: 'El archivo CSV está vacío',
    } as ValidationError;
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      error: (error: any) => {
        reject({
          type: 'format_error',
          message: 'Error al parsear CSV: Formato inválido o caracteres especiales',
          details: error,
        } as ValidationError);
      },
      complete: (results: Papa.ParseResult<any>) => {
        try {
          const headers = results.meta.fields || [];

          // Validación 4: Columna ID
          const hasIdColumn = headers.some(
            (h) => h?.toLowerCase().trim() === 'id'
          );
          if (!hasIdColumn) {
            throw {
              type: 'missing_id',
              message: 'CSV debe contener columna "ID" como identificador único',
              details: { receivedHeaders: headers },
            } as ValidationError;
          }

          // Validación 5: Headers completos
          validateHeaders(headers);

          // Validación 6: No está vacío
          if (!results.data || results.data.length === 0) {
            throw {
              type: 'empty_file',
              message: 'El archivo CSV no contiene datos (solo headers)',
            } as ValidationError;
          }

          resolve({
            data: results.data as Record<string, string>[],
            headers,
            errors: results.errors || [],
          });
        } catch (error) {
          reject(error);
        }
      },
    });
  });
}

/**
 * Valida que los headers coincidan con estructura esperada
 */
function validateHeaders(headers: string[]): void {
  const normalizedHeaders = headers.map((h) =>
    h?.trim().toUpperCase().replace(/\s+/g, '_')
  );

  // Verificar headers mínimos requeridos para Alumnos
  const expectedAlumnos = EXPECTED_HEADERS.alumnos.map((h) =>
    h.toUpperCase().replace(/\s+/g, '_')
  );

  const missingHeaders = expectedAlumnos.filter(
    (expected) => !normalizedHeaders.includes(expected)
  );

  if (missingHeaders.length > 0) {
    throw {
      type: 'missing_headers',
      message: `Headers faltantes: ${missingHeaders.join(', ')}`,
      details: {
        expected: expectedAlumnos,
        received: normalizedHeaders,
        missing: missingHeaders,
      },
    } as ValidationError;
  }
}

/**
 * Normaliza un registro del CSV para comparación
 */
export function normalizeCSVRecord(
  record: Record<string, string>
): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(record)) {
    // Trimear espacios
    let trimmedValue = value?.trim() ?? '';

    // Parsear números (convertir coma a punto)
    if (
      ['asistencia', 'nota_final', 'promedio'].includes(key.toLowerCase())
    ) {
      const numValue = parseFloat(trimmedValue.replace(',', '.'));
      normalized[key] = !Number.isNaN(numValue) ? numValue : 0;
    }
    // Booleanos
    else if (['conectividad', 'si', 'no'].includes(trimmedValue.toLowerCase())) {
      normalized[key] = trimmedValue.toLowerCase() === 'si' ? true : false;
    }
    // Todo lo demás como string
    else {
      normalized[key] = trimmedValue;
    }
  }

  return normalized;
}

/**
 * Obtiene el tipo de un campo para comparación
 */
export function getFieldType(
  fieldName: string
): 'number' | 'string' | 'date' | 'boolean' {
  const nameLower = fieldName.toLowerCase();

  if (
    ['asistencia', 'promedio', 'nota_final', 'cantidad'].includes(nameLower)
  ) {
    return 'number';
  }
  if (['fecha', 'date', 'fechanacimiento'].includes(nameLower)) {
    return 'date';
  }
  if (
    ['activo', 'conectividad', 'si', 'no', 'true', 'false'].includes(nameLower)
  ) {
    return 'boolean';
  }

  return 'string';
}
```

### 3.2 src/lib/comparison/fieldComparator.ts

```typescript
// src/lib/comparison/fieldComparator.ts

/**
 * Compara dos valores de forma inteligente según su tipo
 */
export const fieldComparator = {
  compare(fbValue: any, csvValue: any, fieldName: string): boolean {
    // Normalizar valores nulos/undefined
    const fb = fbValue ?? null;
    const csv = csvValue ?? null;

    if (fb === null && csv === null) {
      return true; // Ambos vacíos es igual
    }
    if (fb === null || csv === null) {
      return false; // Uno vacío, otro no
    }

    // Comparación case-insensitive para strings
    if (typeof fb === 'string' && typeof csv === 'string') {
      return (
        fb.toLowerCase().trim() === csv.toLowerCase().trim()
      );
    }

    // Comparación con tolerancia para decimales (0.01)
    if (typeof fb === 'number' && typeof csv === 'number') {
      return Math.abs(fb - csv) < 0.01;
    }

    // Intentar parsear string a número
    if (typeof csv === 'string' && !Number.isNaN(parseFloat(csv))) {
      const parsed = parseFloat(csv.replace(',', '.'));
      if (typeof fb === 'number') {
        return Math.abs(fb - parsed) < 0.01;
      }
    }

    // Conversión de string numérico Firebase
    if (typeof fb === 'string' && !Number.isNaN(parseFloat(fb))) {
      const parsed = parseFloat(fb.replace(',', '.'));
      if (typeof csv === 'number') {
        return Math.abs(parsed - csv) < 0.01;
      }
    }

    // Comparación booleana
    if (typeof fb === 'boolean' && typeof csv === 'boolean') {
      return fb === csv;
    }

    // Si un valor es booleano y otro string
    if (
      typeof fb === 'boolean' &&
      typeof csv === 'string'
    ) {
      return fb === (csv.toLowerCase() === 'si' || csv.toLowerCase() === 'true');
    }

    // Comparación exacta para otros tipos
    return fb === csv;
  },

  /**
   * Obtiene descripción humana de la diferencia
   */
  getDifferenceDescription(
    fbValue: any,
    csvValue: any,
    fieldName: string
  ): string {
    const fb = String(fbValue ?? 'N/A');
    const csv = String(csvValue ?? 'N/A');

    if (fb === csv) {
      return 'Sin diferencia';
    }

    return `Firebase: "${fb}" vs CSV: "${csv}"`;
  },

  /**
   * Retorna el tipo de campo para lógica específica
   */
  getFieldType(fieldName: string): 'number' | 'string' | 'date' | 'boolean' {
    const nameLower = fieldName.toLowerCase();

    if (
      ['asistencia', 'promedio', 'nota_final', 'cantidad'].includes(
        nameLower
      )
    ) {
      return 'number';
    }
    if (['fecha', 'date', 'fechanacimiento'].includes(nameLower)) {
      return 'date';
    }
    if (
      ['activo', 'conectividad', 'si', 'no', 'true', 'false'].includes(
        nameLower
      )
    ) {
      return 'boolean';
    }

    return 'string';
  },
};
```

### 3.3 src/lib/comparison/comparisonService.ts

```typescript
// src/lib/comparison/comparisonService.ts

import { Alumno } from '../../lib/mock-data';
import {
  ComparisonResult,
  ComparisonItem,
  ComparisonType,
  ProgressState,
} from './types';
import { normalizeCSVRecord, getFieldType } from './csvParser';
import { fieldComparator } from './fieldComparator';

const CHUNK_SIZE_ALUMNOS = 500;
const CHUNK_SIZE_CURSOS = 200;

/**
 * Compara datos de Firebase con CSV en chunks
 */
export async function compareData(
  firebaseData: Alumno[],
  csvData: Record<string, string>[],
  type: ComparisonType,
  onProgress?: (progress: ProgressState) => void
): Promise<ComparisonResult> {
  const startTime = Date.now();
  const chunkSize =
    type === 'alumnos' ? CHUNK_SIZE_ALUMNOS : CHUNK_SIZE_CURSOS;

  // Normalizar datos CSV
  const normalizedCSVData = csvData.map(normalizeCSVRecord);
  const csvMapById = new Map(normalizedCSVData.map((r) => [r.ID, r]));

  const results: ComparisonItem[] = [];
  const total = firebaseData.length;

  // Procesar Firebase data en chunks
  for (let i = 0; i < firebaseData.length; i += chunkSize) {
    const chunk = firebaseData.slice(i, i + chunkSize);

    for (const fbRecord of chunk) {
      const csvRecord = csvMapById.get(fbRecord.id);
      const item = compareRecords(fbRecord, csvRecord, type);
      results.push(item);
      csvMapById.delete(fbRecord.id); // Evitar procesar dos veces
    }

    // Notificar progreso
    const progress = i + chunk.length;
    onProgress?.({
      current: progress,
      total,
      status: 'comparing',
      message: `Comparados ${progress} de ${total} registros`,
      estimatedTimeMs: estimateRemainingTime(
        progress,
        total,
        startTime
      ),
    });

    // Permitir que React actualice la UI
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Procesar registros solo en CSV (faltantes en Firebase)
  for (const [id, csvRecord] of csvMapById) {
    results.push({
      id,
      type: 'faltante_firebase',
      firebaseRecord: null,
      csvRecord,
      differenceFields: [],
    });
  }

  const processingTime = Date.now() - startTime;

  return {
    type,
    totalRecords: results.length,
    results,
    summary: calculateSummary(results),
    comparisonsAt: new Date(),
    processingTimeMs: processingTime,
  };
}

/**
 * Compara un registro de Firebase con su equivalente en CSV
 */
function compareRecords(
  fbRecord: Alumno,
  csvRecord: Record<string, any> | undefined,
  type: ComparisonType
): ComparisonItem {
  if (!csvRecord) {
    return {
      id: fbRecord.id,
      type: 'faltante_csv',
      firebaseRecord: fbRecord,
      csvRecord: null,
      differenceFields: [],
    };
  }

  const differenceFields = findDifferences(fbRecord, csvRecord, type);

  return {
    id: fbRecord.id,
    type: differenceFields.length > 0 ? 'diferencia' : 'coincidencia',
    firebaseRecord: fbRecord,
    csvRecord,
    differenceFields,
  };
}

/**
 * Encuentra diferencias entre dos registros
 */
function findDifferences(
  fbRecord: Alumno,
  csvRecord: Record<string, any>,
  type: ComparisonType
): ComparisonItem['differenceFields'] {
  // Campos a comparar por tipo
  const fieldsToCompare =
    type === 'alumnos'
      ? ['id', 'nombre', 'asistencia', 'promedio', 'rangoEtario']
      : ['id', 'nombre', 'curso'];

  const differences: ComparisonItem['differenceFields'] = [];

  for (const field of fieldsToCompare) {
    const fbValue = fbRecord[field as keyof Alumno];

    // Intentar obtener valor del CSV con diferentes variaciones de nombre
    const csvValue =
      csvRecord[field] ||
      csvRecord[field.charAt(0).toUpperCase() + field.slice(1)] ||
      csvRecord[field.replace(/_/g, '').toUpperCase()];

    if (!fieldComparator.compare(fbValue, csvValue, field)) {
      differences.push({
        fieldName: field,
        firebaseValue: fbValue,
        csvValue,
      });
    }
  }

  return differences;
}

/**
 * Calcula resumen de resultados
 */
function calculateSummary(results: ComparisonItem[]) {
  return {
    coincidencias: results.filter((r) => r.type === 'coincidencia').length,
    diferencias: results.filter((r) => r.type === 'diferencia').length,
    faltantesEnCSV: results.filter((r) => r.type === 'faltante_csv').length,
    faltantesEnFirebase: results.filter(
      (r) => r.type === 'faltante_firebase'
    ).length,
  };
}

/**
 * Estima tiempo restante de procesamiento
 */
function estimateRemainingTime(
  processed: number,
  total: number,
  startTime: number
): number {
  if (processed === 0) return 0;

  const elapsed = Date.now() - startTime;
  const rate = elapsed / processed;
  const remaining = (total - processed) * rate;

  return Math.max(0, Math.ceil(remaining));
}
```

### 3.4 src/lib/comparison/exportService.ts

```typescript
// src/lib/comparison/exportService.ts

import { ComparisonItem, ComparisonType, RECORD_TYPE_LABELS } from './types';

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
```

---

## 4. Fase 3: Hooks

### 4.1 src/hooks/useComparison.ts

```typescript
// src/hooks/useComparison.ts

import { useState, useEffect, useCallback } from 'react';
import { Alumno, getAlumnosFirebase } from '../lib/mock-data';
import {
  CSVFile,
  ComparisonResult,
  ComparisonType,
  ProgressState,
} from '../lib/comparison/types';
import { parseCSV } from '../lib/comparison/csvParser';
import { compareData } from '../lib/comparison/comparisonService';

export function useComparison() {
  const [csvFile, setCSVFile] = useState<CSVFile | null>(null);
  const [firebaseData, setFirebaseData] = useState<Alumno[]>([]);
  const [selectedType, setSelectedType] = useState<ComparisonType>('alumnos');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      setResult(null);
      setCSVFile(null);
      setFirebaseData([]);
    };
  }, []);

  const handleLoadCSV = useCallback(async (file: File) => {
    try {
      setError(null);
      setProgress({ current: 0, total: 0, status: 'loading' });

      const parsed = await parseCSV(file);

      setCSVFile({
        name: file.name,
        data: parsed.data,
        headers: parsed.headers,
        recordCount: parsed.data.length,
        loadedAt: new Date(),
        size: file.size,
      });

      setProgress({ current: 0, total: 0, status: 'idle' });
    } catch (err: any) {
      setError(err.message || 'Error al cargar CSV');
      setProgress({ current: 0, total: 0, status: 'error' });
    }
  }, []);

  const handleLoadFirebaseData = useCallback(
    async (type: ComparisonType) => {
      try {
        setError(null);
        setProgress({ current: 0, total: 0, status: 'loading' });

        const data =
          type === 'alumnos' ? await getAlumnosFirebase() : [];

        setFirebaseData(data);
        setSelectedType(type);
        setProgress({ current: 0, total: 0, status: 'idle' });
      } catch (err) {
        setError('Error al cargar datos de Firebase');
        setProgress({ current: 0, total: 0, status: 'error' });
      }
    },
    []
  );

  const handleStartComparison = useCallback(async () => {
    if (!csvFile || firebaseData.length === 0) {
      setError('Faltan datos para comparar');
      return;
    }

    try {
      setError(null);
      setProgress({
        current: 0,
        total: firebaseData.length,
        status: 'comparing',
      });

      const comparisonResult = await compareData(
        firebaseData,
        csvFile.data,
        selectedType,
        (prog) => setProgress({ ...prog, status: 'comparing' })
      );

      setResult(comparisonResult);
      setProgress({ ...progress, status: 'complete' });
    } catch (err: any) {
      setError(err.message || 'Error durante la comparación');
      setProgress({ ...progress, status: 'error' });
    }
  }, [csvFile, firebaseData, selectedType, progress]);

  const handleCancel = useCallback(() => {
    setProgress({ current: 0, total: 0, status: 'cancelled' });
    // Implementar lógica de cancelación si es necesario
  }, []);

  return {
    csvFile,
    firebaseData,
    selectedType,
    result,
    progress,
    error,
    handleLoadCSV,
    handleLoadFirebaseData,
    handleStartComparison,
    handleCancel,
    setError,
  };
}
```

### 4.2 src/hooks/useComparisonFilters.ts

```typescript
// src/hooks/useComparisonFilters.ts

import { useState, useMemo, useCallback } from 'react';
import { ComparisonItem, FilterState, RecordType } from '../lib/comparison/types';

const DEFAULT_FILTERS: FilterState = {
  recordTypes: ['coincidencia', 'diferencia', 'faltante_csv', 'faltante_firebase'],
  searchId: '',
  expandedRows: new Set(),
};

export function useComparisonFilters(results: ComparisonItem[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Filtrar por tipo
      if (!filters.recordTypes.includes(item.type)) {
        return false;
      }

      // Filtrar por ID de búsqueda
      if (
        filters.searchId &&
        !item.id.toLowerCase().includes(filters.searchId.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [results, filters]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleToggleRecordType = useCallback((type: RecordType) => {
    setFilters((prev) => {
      const types = new Set(prev.recordTypes);
      if (types.has(type)) {
        types.delete(type);
      } else {
        types.add(type);
      }
      return { ...prev, recordTypes: Array.from(types) };
    });
  }, []);

  const handleSearchIdChange = useCallback((searchId: string) => {
    setFilters((prev) => ({ ...prev, searchId }));
  }, []);

  const handleToggleRowExpanded = useCallback((rowId: string) => {
    setFilters((prev) => {
      const newExpanded = new Set(prev.expandedRows);
      if (newExpanded.has(rowId)) {
        newExpanded.delete(rowId);
      } else {
        newExpanded.add(rowId);
      }
      return { ...prev, expandedRows: newExpanded };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    filteredResults,
    handleFilterChange,
    handleToggleRecordType,
    handleSearchIdChange,
    handleToggleRowExpanded,
    handleClearFilters,
  };
}
```

---

## 5. Primeros Pasos

1. **Crear estructura de carpetas:**
   ```bash
   mkdir -p src/components/comparison
   mkdir -p src/lib/comparison
   touch src/lib/comparison/types.ts
   touch src/lib/comparison/csvParser.ts
   touch src/lib/comparison/fieldComparator.ts
   touch src/lib/comparison/comparisonService.ts
   touch src/lib/comparison/exportService.ts
   ```

2. **Copiar tipos e interfaces** de la sección 2 → `types.ts`

3. **Copiar servicios** de la sección 3 en sus respectivos archivos

4. **Copiar hooks** de la sección 4 en sus respectivos archivos

5. **Validar compilación:**
   ```bash
   npm run build
   ```

6. **Proceder con componentes** (Fase 4)

