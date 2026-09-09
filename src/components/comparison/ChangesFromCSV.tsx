import React from 'react';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { AnalisisAcademico } from '@/lib/comparison/academicAnalysis';

interface ChangesFromCSVProps {
  cambios: AnalisisAcademico['cambiosDesdeCSV'];
}

function DifferenceIndicator({
  label,
  anterior,
  actual,
  diferencia,
  tipo,
}: {
  label: string;
  anterior: number | string;
  actual: number | string;
  diferencia: number | string;
  tipo: 'estado' | 'numero';
}) {
  if (tipo === 'estado') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{anterior}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-sm font-bold text-primary">{actual}</span>
          </div>
        </div>
        <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
      </div>
    );
  }

  const diff = Number(diferencia);
  const isPositive = diff >= 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;
  const color = isPositive
    ? 'bg-green-500/10 border-green-500/20'
    : 'bg-red-500/10 border-red-500/20';
  const textColor = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground line-through">
            {Number(anterior).toFixed(1)}
          </span>
          <span className="text-sm font-bold text-foreground">
            {Number(actual).toFixed(1)}
          </span>
        </div>
      </div>
      <div className={`flex items-center gap-1 ${textColor}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-bold">
          {isPositive ? '+' : ''}
          {Number(diferencia).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export function ChangesFromCSV({ cambios }: ChangesFromCSVProps) {
  const hasChanges = Object.keys(cambios).length > 0;

  if (!hasChanges) {
    return (
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <p className="text-sm text-green-400 font-semibold">
            Sin cambios detectados desde el CSV
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">
          Diferencias desde CSV
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Campos que han cambiado en Firestore desde el CSV
        </p>
      </div>

      <div className="space-y-2">
        {cambios.promedio && (
          <DifferenceIndicator
            label="Promedio"
            anterior={cambios.promedio.anterior}
            actual={cambios.promedio.actual}
            diferencia={cambios.promedio.diferencia}
            tipo="numero"
          />
        )}

        {cambios.asistencia && (
          <DifferenceIndicator
            label="Asistencia (%)"
            anterior={cambios.asistencia.anterior}
            actual={cambios.asistencia.actual}
            diferencia={cambios.asistencia.diferencia}
            tipo="numero"
          />
        )}

        {cambios.estadoAcademico && (
          <DifferenceIndicator
            label="Estado Académico"
            anterior={cambios.estadoAcademico.anterior}
            actual={cambios.estadoAcademico.actual}
            diferencia=""
            tipo="estado"
          />
        )}
      </div>
    </Card>
  );
}
