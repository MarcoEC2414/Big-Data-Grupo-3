@import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ComparisonType } from '@/lib/comparison/types';

interface ComparisonSelectorProps {
  selectedType: ComparisonType;
  onTypeChange: (type: ComparisonType) => void;
  csvRecordCount: number;
  firebaseRecordCount: number;
  isLoading?: boolean;
  csvLoaded: boolean;
  onStartComparison?: (() => void) | undefined;
  comparisonInProgress?: boolean;
}

export function ComparisonSelector({
  selectedType,
  onTypeChange,
  csvRecordCount,
  firebaseRecordCount,
  isLoading,
  csvLoaded,
  onStartComparison,
  comparisonInProgress,
}: ComparisonSelectorProps) {
  if (!csvLoaded) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Por favor, carga un archivo CSV primero para poder seleccionar el tipo de
          comparación.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">¿Qué deseas comparar?</h3>

        <RadioGroup value={selectedType} onValueChange={(value) => onTypeChange(value as ComparisonType)}>
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
            <RadioGroupItem value="alumnos" id="alumnos" />
            <Label htmlFor="alumnos" className="cursor-pointer flex-1 font-medium">
              Comparar Alumnos
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
            <RadioGroupItem value="cursos" id="cursos" />
            <Label htmlFor="cursos" className="cursor-pointer flex-1 font-medium">
              Comparar Cursos
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-accent p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">FIREBASE</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm font-semibold">Cargando...</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-foreground">{firebaseRecordCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">registros en {selectedType}</p>
        </Card>

        <Card className="bg-accent p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">CSV</p>
          <p className="text-2xl font-bold text-foreground">{csvRecordCount}</p>
          <p className="text-xs text-muted-foreground mt-1">registros cargados</p>
        </Card>
      </div>

      {onStartComparison && (
        <Button
          onClick={onStartComparison}
          disabled={firebaseRecordCount === 0 || isLoading || comparisonInProgress}
          size="lg"
          className="w-full"
        >
          {comparisonInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comparando...
            </>
          ) : (
            'Iniciar Comparación'
          )}
        </Button>
      )}
    </Card>
  );
}

