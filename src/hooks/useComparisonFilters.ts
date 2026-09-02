// src/hooks/useComparisonFilters.ts

import { useState, useMemo, useCallback } from 'react';
import {
  ComparisonItem,
  FilterState,
  RecordType,
} from '../lib/comparison/types';

const DEFAULT_FILTERS: FilterState = {
  recordTypes: [
    'coincidencia',
    'diferencia',
    'faltante_csv',
    'faltante_firebase',
  ],
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

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

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
