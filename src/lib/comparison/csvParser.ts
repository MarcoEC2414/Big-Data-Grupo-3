// src/lib/comparison/csvParser.ts

import Papa from 'papaparse';
import {
  ValidationError,
  ParseResult,
  EXPECTED_HEADERS,
} from './types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_EXTENSIONS = ['.csv'];

/**
 * Parsea un archivo CSV y valida su estructura
 */
export async function parseCSV(file: File | Blob): Promise<ParseResult> {
  // Validación 0: Verificar que file sea un Blob válido
  if (!file) {
    throw {
      type: 'format_error',
      message: 'El archivo no es válido: archivo es null o undefined',
    } as ValidationError;
  }

  if (!(file instanceof Blob)) {
    throw {
      type: 'format_error',
      message: `El archivo no es válido: se esperaba Blob, recibido ${typeof file}`,
    } as ValidationError;
  }

  // Obtener nombre del archivo si es un File
  const fileName = file instanceof File ? file.name : 'archivo.csv';

  // Validación 1: Extensión
  if (
    !VALID_EXTENSIONS.some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    )
  ) {
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
    try {
      // Convertir a File si es necesario para PapaParse
      const fileToProcess = file instanceof File 
        ? file 
        : new File([file], fileName, { type: 'text/csv' });

      // Verificar que fileToProcess es válido antes de pasar a Papa.parse
      if (!fileToProcess || !(fileToProcess instanceof File)) {
        throw {
          type: 'format_error',
          message: 'Error al procesar el archivo: no se pudo crear instancia válida de File',
        } as ValidationError;
      }

      Papa.parse(fileToProcess, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        error: (error: any) => {
          reject({
            type: 'format_error',
            message:
              'Error al parsear CSV: Formato inválido o caracteres especiales',
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
                message:
                  'CSV debe contener columna "ID" como identificador único',
                details: { receivedHeaders: headers },
              } as ValidationError;
            }

            // Validación 5: Headers completos
            validateHeaders(headers);

            // Validación 6: No está vacío
            if (!results.data || results.data.length === 0) {
              throw {
                type: 'empty_file',
                message:
                  'El archivo CSV no contiene datos (solo headers)',
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
    } catch (error) {
      reject(error);
    }
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
      [
        'asistencia',
        'nota_final',
        'promedio',
        'Asistencia',
        'Nota_Final',
      ].includes(key)
    ) {
      const numValue = parseFloat(trimmedValue.replace(',', '.'));
      normalized[key] = !Number.isNaN(numValue) ? numValue : 0;
    }
    // Booleanos
    else if (['conectividad', 'si', 'no'].includes(trimmedValue.toLowerCase())) {
      normalized[key] =
        trimmedValue.toLowerCase() === 'si' ||
        trimmedValue.toLowerCase() === 'true'
          ? true
          : false;
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
    [
      'asistencia',
      'promedio',
      'nota_final',
      'cantidad',
      'nota',
    ].includes(nameLower)
  ) {
    return 'number';
  }
  if (['fecha', 'date', 'fechanacimiento'].includes(nameLower)) {
    return 'date';
  }
  if (
    [
      'activo',
      'conectividad',
      'si',
      'no',
      'true',
      'false',
    ].includes(nameLower)
  ) {
    return 'boolean';
  }

  return 'string';
}
