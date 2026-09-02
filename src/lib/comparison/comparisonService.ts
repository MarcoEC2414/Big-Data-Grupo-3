// src/lib/comparison/comparisonService.ts

import { Alumno } from '../../lib/mock-data';
import {
  ComparisonResult,
  ComparisonItem,
  ComparisonType,
  ProgressState,
} from './types';
import { normalizeCSVRecord } from './csvParser';
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
  const csvMapById = new Map(
    normalizedCSVData.map((r) => [r['ID'], r])
  );

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
      estimatedTimeMs: estimateRemainingTime(progress, total, startTime),
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
      ? [
          'id',
          'nombre',
          'asistencia',
          'promedio',
          'rangoEtario',
          'sexo',
          'Ciudad',
          'Conectividad_Hogar',
        ]
      : ['id', 'nombre', 'curso'];

  const differences: ComparisonItem['differenceFields'] = [];

  for (const field of fieldsToCompare) {
    const fbValue = fbRecord[field as keyof Alumno];

    // Intentar obtener valor del CSV con diferentes variaciones de nombre
    const csvValue =
      csvRecord[field] ||
      csvRecord[field.charAt(0).toUpperCase() + field.slice(1)] ||
      csvRecord[field.toUpperCase()];

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
    coincidencias: results.filter((r) => r.type === 'coincidencia')
      .length,
    diferencias: results.filter((r) => r.type === 'diferencia').length,
    faltantesEnCSV: results.filter((r) => r.type === 'faltante_csv')
      .length,
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
