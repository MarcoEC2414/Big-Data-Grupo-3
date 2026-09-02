import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FilterState, RecordType, RECORD_TYPE_LABELS } from '@/lib/comparison/types';
import { Search, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  recordCount: number;
  matchingCount: number;
}

const ALL_RECORD_TYPES: RecordType[] = [
  'coincidencia',
  'diferencia',
  'faltante_csv',
  'faltante_firebase',
];

const FILTER_DESCRIPTIONS: Record<RecordType, string> = {
  coincidencia: 'Registros idénticos en ambas fuentes',
  diferencia: 'Registros con campos diferentes',
  faltante_csv: 'Registros en Firebase pero no en CSV',
  faltante_firebase: 'Registros en CSV pero no en Firebase',
};

export function FilterPanel({
  filters,
  onFiltersChange,
  recordCount,
  matchingCount,
}: FilterPanelProps) {
  const handleTypeToggle = (type: RecordType) => {
    const newTypes = filters.recordTypes.includes(type)
      ? filters.recordTypes.filter((t) => t !== type)
      : [...filters.recordTypes, type];

    onFiltersChange({
      ...filters,
      recordTypes: newTypes,
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchId: value,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      recordTypes: ALL_RECORD_TYPES,
      searchId: '',
      expandedRows: new Set(),
    });
  };

  const activeFilters =
    filters.recordTypes.length < ALL_RECORD_TYPES.length ||
    filters.searchId !== '';

  return (
    <Card className="p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">Filtros</h3>
        <p className="text-sm text-muted-foreground">
          {matchingCount} de {recordCount} registros
          {activeFilters && ' (filtrados)'}
        </p>
      </div>

      {/* Búsqueda por ID */}
      <div className="space-y-3">
        <Label htmlFor="search-id" className="text-sm font-medium">
          Buscar por ID
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-id"
            placeholder="Buscar ID..."
            value={filters.searchId}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Separador */}
      <div className="border-t" />

      {/* Filtro por tipo */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tipo de Registro</Label>
        <div className="space-y-3">
          {ALL_RECORD_TYPES.map((type) => (
            <div key={type} className="flex items-start space-x-3">
              <Checkbox
                id={`filter-${type}`}
                checked={filters.recordTypes.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
                className="mt-1"
              />
              <Label
                htmlFor={`filter-${type}`}
                className="cursor-pointer flex-1 text-sm font-normal"
              >
                <div className="flex items-center gap-2">
                  <span>{RECORD_TYPE_LABELS[type]}</span>
                  <span className="text-xs text-muted-foreground">
                    ({FILTER_DESCRIPTIONS[type]})
                  </span>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Separador */}
      <div className="border-t" />

      {/* Botón limpiar */}
      {activeFilters && (
        <Button
          onClick={handleClearAll}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpiar Filtros
        </Button>
      )}
    </Card>
  );
}
