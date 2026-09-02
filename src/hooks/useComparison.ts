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

  const handleLoadCSV = useCallback(async (csvFile: CSVFile) => {
    try {
      setError(null);
      setProgress({ current: 0, total: 0, status: 'idle' });
      setCSVFile(csvFile);
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
