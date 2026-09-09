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
    if (typeof fb === 'boolean' && typeof csv === 'string') {
      return (
        fb ===
        (csv.toLowerCase() === 'si' || csv.toLowerCase() === 'true')
      );
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
  getFieldType(
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
  },
};
