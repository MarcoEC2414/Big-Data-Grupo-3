// src/lib/comparison/types.ts

export type ComparisonType = 'alumnos' | 'cursos';
export type ComparisonStatus =
  | 'idle'
  | 'loading'
  | 'comparing'
  | 'complete'
  | 'error'
  | 'cancelled';
export type RecordType =
  | 'coincidencia'
  | 'diferencia'
  | 'faltante_csv'
  | 'faltante_firebase';

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

/**
 * Resultado del parsing de CSV
 */
export interface ParseResult {
  data: Record<string, string>[];
  headers: string[];
  errors: any[];
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
