# Diseño Técnico: Pestaña Comparativa de Datos

## 1. Overview

La pestaña "Comparativa de Datos" es un módulo de análisis que permite a docentes comparar registros académicos entre dos fuentes: Firebase (datos en producción) y archivos CSV locales (datos de prueba, importación o auditoría). El sistema procesa completamente en el navegador, sin comunicación con servidores backend excepto Firebase, garantizando privacidad y funcionamiento offline.

**Objetivos Clave:**
- Comparación eficiente de hasta 5000 registros
- Procesamiento 100% en navegador sin servidor intermediario
- Identificación de coincidencias, diferencias y registros faltantes
- Visualización clara y exportación de resultados
- Manejo robusto de errores y validaciones

**Stack Tecnológico:**
- React 19.2.0 con TypeScript
- TanStack Router para navegación
- Firebase Firestore para datos en producción
- PapaParse 5.6.0 para parsing CSV
- Recharts 2.15.4 para gráficos
- Shadcn/ui para componentes UI
- TanStack React Query para estado async

---

## 2. Arquitectura General

### 2.1 Estructura de Componentes

```
src/routes/comparativa.tsx (Layout principal)
├── src/components/comparison/
│   ├── CSVUploader.tsx
│   ├── ComparisonSelector.tsx
│   ├── ComparisonEngine.tsx (no renderiza, solo lógica)
│   ├── ResultsVisualization.tsx
│   ├── ResultsTable.tsx
│   ├── FilterPanel.tsx
│   └── ExportButton.tsx
├── src/lib/comparison/
│   ├── csvParser.ts
│   ├── comparisonService.ts
│   ├── fieldComparator.ts
│   ├── exportService.ts
│   └── types.ts
├── src/hooks/
│   ├── useComparison.ts
│   ├── useCSVFile.ts
│   └── useComparisonFilters.ts
└── src/utils/
    └── comparisonUtils.ts
```

### 2.2 Flujo de Datos

```
Usuario Carga CSV
    ↓
[CSVUploader] → csvParser.parseCSV()
    ↓
Estado: { csvData, csvHeaders, recordCount }
    ↓
Usuario Selecciona Tipo (Alumnos/Cursos)
    ↓
[ComparisonSelector] → Firebase: getDocs()
    ↓
Estado: { firebaseData, selectedType, firebaseRecordCount }
    ↓
Usuario Inicia Comparación
    ↓
[ComparisonEngine] → comparisonService.compare()
    ↓
Procesamiento en chunks (si >1000 registros)
    ↓
Estado: { comparisonResults, progress, status }
    ↓
[ResultsVisualization] + [ResultsTable]
    ↓
Usuario Aplica Filtros
    ↓
[FilterPanel] → useComparisonFilters()
    ↓
Estado: { filteredResults, filterState }
    ↓
Usuario Exporta
    ↓
[ExportButton] → exportService.toCSV/PDF()
```

### 2.3 Gestión de Estado

Usar estructura similar a la aplicación existente con hooks React:

```typescript
// En src/routes/comparativa.tsx (componente principal)
const [csvFile, setCSVFile] = useState<CSVFile | null>(null);
const [firebaseData, setFirebaseData] = useState<Alumno[]>([]);
const [selectedType, setSelectedType] = useState<ComparisonType>('alumnos');
const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
const [filters, setFilters] = useState<FilterState>(defaultFilters);
const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, status: 'idle' });
const [error, setError] = useState<string | null>(null);
```

---

## 3. Tipos de Datos (TypeScript Interfaces)

### 3.1 Tipos Principales

```typescript
// src/lib/comparison/types.ts

export type ComparisonType = 'alumnos' | 'cursos';
export type ComparisonStatus = 'idle' | 'loading' | 'comparing' | 'complete' | 'error' | 'cancelled';
export type RecordType = 'coincidencia' | 'diferencia' | 'faltante_csv' | 'faltante_firebase';

export interface CSVFile {
  name: string;
  data: Record<string, string>[];
  headers: string[];
  recordCount: number;
  loadedAt: Date;
  size: number; // en bytes
}

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

export interface FilterState {
  recordTypes: RecordType[];
  searchId: string;
  expandedRows: Set<string>;
}

export interface ProgressState {
  current: number;
  total: number;
  status: ComparisonStatus;
  message?: string;
  estimatedTimeMs?: number;
}

export interface ComparisonError {
  code: string;
  message: string;
  field?: string;
  recordId?: string;
}

export interface ValidationError {
  type: 'file_size' | 'file_type' | 'missing_id' | 'missing_headers' | 'format_error' | 'empty_file';
  message: string;
  details?: any;
}
```

---

## 4. Componentes Principales

### 4.1 CSVUploader Component

```typescript
// src/components/comparison/CSVUploader.tsx

interface CSVUploaderProps {
  onFileLoaded: (csvFile: CSVFile) => void;
  onError: (error: ValidationError) => void;
  isLoading?: boolean;
}

export function CSVUploader({ onFileLoaded, onError, isLoading }: CSVUploaderProps) {
  // Funcionalidades:
  // - Aceptar solo archivos .csv
  // - Validar tamaño máximo 50MB
  // - Validar que contenga columna "ID"
  // - Validar headers para Alumnos o Cursos
  // - Mostrar progreso de carga
  // - Manejo de errores específicos
  // - Soporte múltiples archivos (hasta 5)
  // - Mostrar notificación de éxito con conteo de registros
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        {/* Zona de drop y botón upload */}
      </div>
      {/* Vista previa de archivos cargados */}
    </div>
  );
}
```

**Validaciones:**
- Tamaño máximo 50MB (validar antes de parsear)
- Formato .csv únicamente
- Columna "ID" obligatoria (case-insensitive)
- Headers esperados para Alumnos: `ID, Sexo, Ciudad, Asistencia, Nota_Final, Situación_Laboral, Nivel_Educativo_Prev, Conectividad_Hogar, Rango_Etario, Estado_Académico`
- Archivo no puede estar vacío
- Máximo 5 archivos simultáneos

### 4.2 ComparisonSelector Component

```typescript
// src/components/comparison/ComparisonSelector.tsx

interface ComparisonSelectorProps {
  selectedType: ComparisonType;
  onTypeChange: (type: ComparisonType) => void;
  csvRecordCount: number;
  firebaseRecordCount: number;
  isLoading?: boolean;
  csvLoaded: boolean;
}

export function ComparisonSelector({
  selectedType,
  onTypeChange,
  csvRecordCount,
  firebaseRecordCount,
  isLoading,
  csvLoaded,
}: ComparisonSelectorProps) {
  // Funcionalidades:
  // - Radio buttons para Alumnos/Cursos
  // - Mostrar cantidad de registros en Firebase
  // - Mostrar cantidad de registros en CSV
  // - Mensaje si no hay CSV cargado
  // - Permitir cambiar selección en cualquier momento
  // - Botón para iniciar comparación
  
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      {/* Selector tipo comparación */}
    </div>
  );
}
```

### 4.3 ResultsVisualization Component

```typescript
// src/components/comparison/ResultsVisualization.tsx

interface ResultsVisualizationProps {
  result: ComparisonResult | null;
  isLoading?: boolean;
}

export function ResultsVisualization({ result, isLoading }: ResultsVisualizationProps) {
  // Funcionalidades:
  // - Card con resumen: Coincidencias | Diferencias | Faltantes
  // - Gráfico de torta o barras (Recharts)
  // - Tiempo de procesamiento
  // - Estadísticas por tipo
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Cards de resumen */}
      {/* Gráfico visual */}
    </div>
  );
}
```

### 4.4 ResultsTable Component

```typescript
// src/components/comparison/ResultsTable.tsx

interface ResultsTableProps {
  results: ComparisonItem[];
  isLoading?: boolean;
  pageSize?: 25 | 50 | 100;
  onRowExpand?: (itemId: string) => void;
  expandedRows?: Set<string>;
}

export function ResultsTable({
  results,
  isLoading,
  pageSize = 25,
  onRowExpand,
  expandedRows = new Set(),
}: ResultsTableProps) {
  // Funcionalidades:
  // - Tabla interactiva con virtualización (react-window o similar)
  // - Columnnas: ID | Type | Diferencias | Ver Detalles
  // - Ordenamiento por columnas
  // - Paginación: 25/50/100 registros
  // - Expandir detalles de cada fila
  // - Highlight de celdas con diferencias
  // - Scroll horizontal si hay muchas columnas
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Tabla con virtualización */}
    </div>
  );
}
```

### 4.5 FilterPanel Component

```typescript
// src/components/comparison/FilterPanel.tsx

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  recordCount: number;
  matchingCount: number;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  recordCount,
  matchingCount,
}: FilterPanelProps) {
  // Funcionalidades:
  // - Checkboxes para tipos: Coincidencias | Diferencias | Faltantes_CSV | Faltantes_Firebase
  // - Input de búsqueda por ID
  // - Botón "Limpiar Filtros"
  // - Mostrar cantidad de registros que coinciden
  // - Combinación de filtros con lógica AND
  // - Actualización instantánea de resultados
  
  return (
    <div className="bg-card rounded-lg p-6 border border-border space-y-4">
      {/* Filtros */}
    </div>
  );
}
```

### 4.6 ExportButton Component

```typescript
// src/components/comparison/ExportButton.tsx

interface ExportButtonProps {
  results: ComparisonItem[] | null;
  filteredResults: ComparisonItem[];
  comparisonType: ComparisonType;
  comparisonsAt: Date;
}

export function ExportButton({
  results,
  filteredResults,
  comparisonType,
  comparisonsAt,
}: ExportButtonProps) {
  // Funcionalidades:
  // - Botones: Exportar CSV | Exportar PDF (opcional)
  // - Incluir solo registros visibles (filtrados)
  // - Nombre archivo: data-comparison-{type}-{date}.csv
  // - Confirmación tras exportación
  // - Incluir columnas: ID | Tipo | Campos_Firebase | Campos_CSV | Clasificación
  
  return (
    <div className="flex gap-2">
      {/* Botones de exportación */}
    </div>
  );
}
```

---

## 5. Servicios y Utilidades

### 5.1 csvParser Service

```typescript
// src/lib/comparison/csvParser.ts

export interface ParseResult {
  data: Record<string, string>[];
  headers: string[];
  errors: ComparisonError[];
}

export async function parseCSV(file: File): Promise<ParseResult> {
  // Validaciones previas
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Archivo mayor a 50MB');
  }
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Solo se aceptan archivos CSV');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      error: (error) => {
        reject({
          type: 'format_error',
          message: 'Error al parsear CSV',
          details: error,
        });
      },
      complete: (results) => {
        // Validar ID column
        const headers = results.meta.fields || [];
        
        if (!headers.some(h => h?.toLowerCase() === 'id')) {
          reject({
            type: 'missing_id',
            message: 'CSV debe contener columna "ID"',
          });
          return;
        }

        // Validar headers según tipo
        validateHeaders(headers);

        if (results.data.length === 0) {
          reject({
            type: 'empty_file',
            message: 'El archivo CSV está vacío',
          });
          return;
        }

        resolve({
          data: results.data as Record<string, string>[],
          headers,
          errors: results.errors || [],
        });
      },
    });
  });
}

function validateHeaders(headers: string[]): void {
  const expectedAlumnosHeaders = [
    'ID', 'Sexo', 'Ciudad', 'Asistencia', 'Nota_Final',
    'Situación_Laboral', 'Nivel_Educativo_Prev',
    'Conectividad_Hogar', 'Rango_Etario', 'Estado_Académico'
  ];

  const normalizedHeaders = headers.map(h => h?.trim().toUpperCase());
  const expectedNormalized = expectedAlumnosHeaders.map(h => h.toUpperCase());

  const hasAllHeaders = expectedNormalized.every(expected =>
    normalizedHeaders.some(h => h === expected)
  );

  if (!hasAllHeaders) {
    throw {
      type: 'missing_headers',
      message: 'Headers del CSV no coinciden con estructura esperada',
      details: { expected: expectedAlumnosHeaders, received: headers },
    };
  }
}

export function normalizeCSVRecord(record: Record<string, string>): Record<string, any> {
  // Normalizar decimales: coma a punto
  // Trimear espacios
  // Normalizar booleanos
  // Parsear números
  return {
    ...record,
    Nota_Final: parseFloat(record.Nota_Final?.replace(',', '.') || '0') || 0,
    Asistencia: parseFloat(record.Asistencia?.replace(',', '.') || '0') || 0,
    // ... más normalizaciones
  };
}
```

### 5.2 comparisonService

```typescript
// src/lib/comparison/comparisonService.ts

export async function compareData(
  firebaseData: Alumno[],
  csvData: Record<string, string>[],
  type: ComparisonType,
  onProgress?: (progress: ProgressState) => void
): Promise<ComparisonResult> {
  const startTime = Date.now();
  const CHUNK_SIZE = type === 'alumnos' ? 500 : 200;
  
  const normalizedCSVData = csvData.map(normalizeCSVRecord);
  const csvMapById = new Map(normalizedCSVData.map(r => [r.ID, r]));
  
  const results: ComparisonItem[] = [];
  const total = firebaseData.length + normalizedCSVData.length;

  // Procesar en chunks para evitar bloqueos UI
  for (let i = 0; i < firebaseData.length; i += CHUNK_SIZE) {
    const chunk = firebaseData.slice(i, i + CHUNK_SIZE);
    
    for (const fbRecord of chunk) {
      const csvRecord = csvMapById.get(fbRecord.id);
      const item = compareRecords(fbRecord, csvRecord, type);
      results.push(item);
    }

    // Notificar progreso
    onProgress?.({
      current: i + chunk.length,
      total,
      status: 'comparing',
      estimatedTimeMs: estimateRemainingTime(i, total, startTime),
    });

    // Permitir UI update
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Procesar registros solo en CSV (faltantes en Firebase)
  const fbIds = new Set(firebaseData.map(r => r.id));
  for (const csvRecord of normalizedCSVData) {
    if (!fbIds.has(csvRecord.ID)) {
      results.push({
        id: csvRecord.ID,
        type: 'faltante_firebase',
        firebaseRecord: null,
        csvRecord,
        differenceFields: [],
      });
    }
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

function findDifferences(
  fbRecord: Alumno,
  csvRecord: Record<string, any>,
  type: ComparisonType
): ComparisonItem['differenceFields'] {
  const fieldsToCompare = type === 'alumnos' 
    ? ['id', 'nombre', 'asistencia', 'promedio', 'ciudad', 'rangoEtario']
    : ['id', 'nombre', 'curso'];

  const differences = [];

  for (const field of fieldsToCompare) {
    const fbValue = fbRecord[field as keyof Alumno];
    const csvValue = csvRecord[field.charAt(0).toUpperCase() + field.slice(1)] || csvRecord[field];

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

function calculateSummary(results: ComparisonItem[]) {
  return {
    coincidencias: results.filter(r => r.type === 'coincidencia').length,
    diferencias: results.filter(r => r.type === 'diferencia').length,
    faltantesEnCSV: results.filter(r => r.type === 'faltante_csv').length,
    faltantesEnFirebase: results.filter(r => r.type === 'faltante_firebase').length,
  };
}
```

### 5.3 fieldComparator

```typescript
// src/lib/comparison/fieldComparator.ts

export const fieldComparator = {
  compare(fbValue: any, csvValue: any, fieldName: string): boolean {
    // Comparación case-insensitive para strings
    if (typeof fbValue === 'string' && typeof csvValue === 'string') {
      return fbValue.toLowerCase().trim() === csvValue.toLowerCase().trim();
    }

    // Comparación con tolerancia para decimales (0.01)
    if (typeof fbValue === 'number' && typeof csvValue === 'number') {
      return Math.abs(fbValue - csvValue) < 0.01;
    }

    // Normalizar y comparar números parseados de strings
    if (typeof csvValue === 'string' && !Number.isNaN(parseFloat(csvValue))) {
      const parsed = parseFloat(csvValue.replace(',', '.'));
      if (typeof fbValue === 'number') {
        return Math.abs(fbValue - parsed) < 0.01;
      }
    }

    // Comparación exacta para otros tipos
    return fbValue === csvValue;
  },

  getFieldType(fieldName: string): 'number' | 'string' | 'date' | 'boolean' {
    if (['asistencia', 'promedio', 'nota_final'].includes(fieldName.toLowerCase())) {
      return 'number';
    }
    if (['fecha', 'date'].includes(fieldName.toLowerCase())) {
      return 'date';
    }
    return 'string';
  },
};
```

### 5.4 exportService

```typescript
// src/lib/comparison/exportService.ts

export async function exportToCSV(
  results: ComparisonItem[],
  type: ComparisonType,
  comparisonsAt: Date
): Promise<void> {
  const headers = [
    'ID',
    'Tipo',
    'Campos_con_Diferencia',
    'Firebase_Valor',
    'CSV_Valor',
    ...getAllFieldNames(type),
  ];

  const rows = results.map(item => [
    item.id,
    translateRecordType(item.type),
    item.differenceFields.map(d => d.fieldName).join('; '),
    item.firebaseRecord ? JSON.stringify(item.firebaseRecord) : 'N/A',
    item.csvRecord ? JSON.stringify(item.csvRecord) : 'N/A',
    ...getFieldValues(item, type),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(v => `"${v}"`).join(',')),
  ].join('\n');

  downloadFile(
    csvContent,
    `data-comparison-${type}-${formatDate(comparisonsAt)}.csv`,
    'text/csv'
  );
}

export async function exportToPDF(
  results: ComparisonItem[],
  type: ComparisonType,
  summary: any
): Promise<void> {
  // Implementación con library como jsPDF (opcional)
  // Por ahora, solo CSV es obligatorio
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## 6. Hooks Custom

### 6.1 useComparison Hook

```typescript
// src/hooks/useComparison.ts

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

  const handleLoadCSV = async (file: File) => {
    try {
      setError(null);
      const parsed = await parseCSV(file);
      setCSVFile({
        name: file.name,
        data: parsed.data,
        headers: parsed.headers,
        recordCount: parsed.data.length,
        loadedAt: new Date(),
        size: file.size,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleLoadFirebaseData = async (type: ComparisonType) => {
    try {
      setProgress({ current: 0, total: 0, status: 'loading' });
      const data = type === 'alumnos' ? await getAlumnosFirebase() : [];
      setFirebaseData(data);
      setSelectedType(type);
    } catch (err) {
      setError('Error al cargar datos de Firebase');
    }
  };

  const handleStartComparison = async () => {
    if (!csvFile || firebaseData.length === 0) {
      setError('Faltan datos para comparar');
      return;
    }

    try {
      setProgress({ current: 0, total: firebaseData.length, status: 'comparing' });
      setError(null);

      const comparisonResult = await compareData(
        firebaseData,
        csvFile.data,
        selectedType,
        (prog) => setProgress({ ...prog, status: 'comparing' })
      );

      setResult(comparisonResult);
      setProgress({ ...progress, status: 'complete' });
    } catch (err) {
      setError('Error durante la comparación');
      setProgress({ ...progress, status: 'error' });
    }
  };

  const handleCancel = () => {
    setProgress({ current: 0, total: 0, status: 'cancelled' });
    // Implementar lógica de cancelación si es necesario
  };

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
  };
}
```

### 6.2 useComparisonFilters Hook

```typescript
// src/hooks/useComparisonFilters.ts

export function useComparisonFilters(results: ComparisonItem[]) {
  const [filters, setFilters] = useState<FilterState>({
    recordTypes: ['coincidencia', 'diferencia', 'faltante_csv', 'faltante_firebase'],
    searchId: '',
    expandedRows: new Set(),
  });

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // Filtrar por tipo
      if (!filters.recordTypes.includes(item.type)) {
        return false;
      }

      // Filtrar por ID de búsqueda
      if (filters.searchId && !item.id.toLowerCase().includes(filters.searchId.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [results, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleToggleRowExpanded = (rowId: string) => {
    const newExpanded = new Set(filters.expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setFilters({ ...filters, expandedRows: newExpanded });
  };

  const handleClearFilters = () => {
    setFilters({
      recordTypes: ['coincidencia', 'diferencia', 'faltante_csv', 'faltante_firebase'],
      searchId: '',
      expandedRows: new Set(),
    });
  };

  return {
    filters,
    filteredResults,
    handleFilterChange,
    handleToggleRowExpanded,
    handleClearFilters,
  };
}
```

---

## 7. Ruta y Integración en Router

### 7.1 Nueva Ruta

```typescript
// src/routes/comparativa.tsx

import { Shell } from '../components/Shell';
import { CSVUploader } from '../components/comparison/CSVUploader';
import { ComparisonSelector } from '../components/comparison/ComparisonSelector';
import { ResultsVisualization } from '../components/comparison/ResultsVisualization';
import { ResultsTable } from '../components/comparison/ResultsTable';
import { FilterPanel } from '../components/comparison/FilterPanel';
import { ExportButton } from '../components/comparison/ExportButton';
import { useComparison } from '../hooks/useComparison';
import { useComparisonFilters } from '../hooks/useComparisonFilters';

export function ComparativaPage() {
  const {
    csvFile,
    firebaseData,
    selectedType,
    result,
    progress,
    error,
    handleLoadCSV,
    handleLoadFirebaseData,
    handleStartComparison,
  } = useComparison();

  const {
    filters,
    filteredResults,
    handleFilterChange,
    handleToggleRowExpanded,
    handleClearFilters,
  } = useComparisonFilters(result?.results || []);

  return (
    <Shell title="Comparativa de Datos" subtitle="Compara datos entre Firebase y archivos CSV">
      <div className="space-y-6">
        {error && <ErrorAlert message={error} />}

        {/* Sección 1: Carga de CSV */}
        <div>
          <h2 className="text-lg font-semibold mb-4">1. Cargar Archivo CSV</h2>
          <CSVUploader
            onFileLoaded={handleLoadCSV}
            onError={(error) => setError(error.message)}
            isLoading={progress.status === 'loading'}
          />
          {csvFile && (
            <p className="text-sm text-muted-foreground mt-2">
              ✓ Archivo cargado: {csvFile.name} ({csvFile.recordCount} registros)
            </p>
          )}
        </div>

        {/* Sección 2: Selección de tipo */}
        {csvFile && (
          <div>
            <h2 className="text-lg font-semibold mb-4">2. Seleccionar Tipo de Comparación</h2>
            <ComparisonSelector
              selectedType={selectedType}
              onTypeChange={handleLoadFirebaseData}
              csvRecordCount={csvFile.recordCount}
              firebaseRecordCount={firebaseData.length}
              csvLoaded={!!csvFile}
            />
          </div>
        )}

        {/* Sección 3: Iniciar comparación */}
        {csvFile && firebaseData.length > 0 && (
          <div>
            <button
              onClick={handleStartComparison}
              disabled={progress.status === 'comparing'}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold"
            >
              {progress.status === 'comparing' ? 'Comparando...' : 'Iniciar Comparación'}
            </button>
            
            {progress.status === 'comparing' && (
              <div className="mt-4 space-y-2">
                <Progress value={(progress.current / progress.total) * 100} />
                <p className="text-sm text-muted-foreground">
                  Procesados {progress.current} de {progress.total} registros
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sección 4: Resultados */}
        {result && (
          <>
            <ResultsVisualization result={result} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  recordCount={result.totalRecords}
                  matchingCount={filteredResults.length}
                />
                <button
                  onClick={handleClearFilters}
                  className="mt-4 w-full px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-surface"
                >
                  Limpiar Filtros
                </button>
              </div>

              <div className="lg:col-span-3">
                <h2 className="text-lg font-semibold mb-4">Resultados ({filteredResults.length})</h2>
                <ResultsTable
                  results={filteredResults}
                  pageSize={25}
                  expandedRows={filters.expandedRows}
                  onRowExpand={handleToggleRowExpanded}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <ExportButton
                results={result.results}
                filteredResults={filteredResults}
                comparisonType={selectedType}
                comparisonsAt={result.comparisonsAt}
              />
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
```

### 7.2 Actualizar navegación en Shell

```typescript
// src/components/Shell.tsx - Actualizar NAV

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/comparativa", label: "Comparativa", icon: GitCompare }, // Agregar
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
] as const;
```

---

## 8. Consideraciones de Rendimiento

### 8.1 Procesamiento en Chunks

Para datasets >1000 registros:
- Dividir en chunks de 500 (alumnos) o 200 (cursos)
- Procesar un chunk por iteración
- Usar `setTimeout(..., 0)` para permitir UI updates
- Mostrar progreso en tiempo real

### 8.2 Virtual Scrolling

Para tablas con >1000 registros:
- Usar `react-window` o similar para virtualización
- Solo renderizar filas visibles en viewport
- Estimado: <50ms por scroll

### 8.3 Memory Management

- Limpiar resultados al abandonar la pestaña
- Usar `useEffect` cleanup
- Liberar referencias de datos grandes cuando no se usen

```typescript
useEffect(() => {
  return () => {
    // Cleanup al desmontar componente
    setResult(null);
    setCSVFile(null);
    setFirebaseData([]);
  };
}, []);
```

### 8.4 IndexedDB (Opcional)

Para datasets muy grandes (>10000 registros):
- Almacenar resultados en IndexedDB
- Referencia en memoria solo a ventana visible
- Implementar después si es necesario

---

## 9. Manejo de Errores

### 9.1 Errores de Validación CSV

| Error | Mensaje | Acción |
|-------|---------|--------|
| `file_size` | "Archivo mayor a 50MB" | Rechazar archivo |
| `file_type` | "Solo se aceptan archivos CSV" | Mostrar input file |
| `missing_id` | "CSV debe contener columna 'ID'" | Mostrar headers detectados |
| `missing_headers` | "Headers no coinciden con estructura esperada" | Listar headers requeridos |
| `format_error` | "Error al parsear CSV: [detalles]" | Sugerir validar formato |
| `empty_file` | "El archivo CSV está vacío" | Solicitar nuevo archivo |

### 9.2 Errores de Firebase

| Evento | Manejo |
|--------|--------|
| Conexión perdida | Mostrar alert, mantener datos cargados |
| Timeout (>30s) | Reintentar automático x3, luego error |
| Documento incompleto | Registrar como falta de dato específica |

### 9.3 Errores de Comparación

| Error | Manejo |
|-------|--------|
| Tipo de dato incorrecto | Convertir si es posible, registrar warning |
| Falta valor en CSV | Marcar como faltante |
| Falta valor en Firebase | Marcar como faltante |

---

## 10. Testing Strategy

### 10.1 Unit Tests

**csvParser.ts:**
- Parse CSV válido → retorna Record[]
- CSV con headers inválidos → lanza error
- CSV vacío → lanza error
- Normalizacion de decimales (coma/punto)
- Trimeo de espacios

**fieldComparator.ts:**
- Comparación case-insensitive strings
- Tolerancia 0.01 en números
- Parseo de números desde strings

**exportService.ts:**
- Exportación contiene todos los campos
- Nombre archivo incluye fecha
- Blob creado correctamente

### 10.2 Integration Tests

- Carga CSV + comparación + exportación
- Filtrados aplican correctamente
- Progreso se actualiza en tiempo real
- Cancelación limpia recursos

### 10.3 Property-Based Tests (PBT)

**Nota:** Este módulo NO es adecuado para PBT debido a:
- Interacción con archivos (entrada manual del usuario)
- Dependencia en Firebase (servicio externo)
- UI-heavy (no lógica pura)

Se recomienda:
- Unit tests con mocks para funciones puras
- Integration tests para flujos completos
- Manual testing para UI/UX

---

## 11. Estructura de Carpetas Final

```
src/
├── components/
│   └── comparison/
│       ├── CSVUploader.tsx
│       ├── ComparisonSelector.tsx
│       ├── ResultsVisualization.tsx
│       ├── ResultsTable.tsx
│       ├── FilterPanel.tsx
│       ├── ExportButton.tsx
│       └── index.ts
├── lib/
│   └── comparison/
│       ├── types.ts
│       ├── csvParser.ts
│       ├── comparisonService.ts
│       ├── fieldComparator.ts
│       ├── exportService.ts
│       └── index.ts
├── hooks/
│   ├── useComparison.ts
│   ├── useCSVFile.ts
│   ├── useComparisonFilters.ts
│   └── index.ts
├── routes/
│   └── comparativa.tsx
└── utils/
    └── comparisonUtils.ts
```

---

## 12. Próximos Pasos de Implementación

1. **Crear tipos e interfaces** (`types.ts`)
2. **Implementar csvParser** con validaciones
3. **Implementar fieldComparator** con lógicas de comparación
4. **Implementar comparisonService** con procesamiento en chunks
5. **Crear hook useComparison**
6. **Crear componentes UI** (CSVUploader, ResultsTable, etc.)
7. **Integrar ruta en router**
8. **Agregar navegación en Shell**
9. **Implementar exportService**
10. **Testing e iteraciones**

