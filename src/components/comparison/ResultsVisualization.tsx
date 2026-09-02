import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ComparisonResult, RECORD_TYPE_LABELS } from '@/lib/comparison/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Check, AlertCircle, Trash2, Plus, Clock } from 'lucide-react';

interface ResultsVisualizationProps {
  result: ComparisonResult | null;
  isLoading?: boolean;
}

const COLORS = {
  coincidencia: '#10b981',
  diferencia: '#f59e0b',
  faltante_csv: '#ef4444',
  faltante_firebase: '#8b5cf6',
};

export function ResultsVisualization({
  result,
  isLoading,
}: ResultsVisualizationProps) {
  if (!result) {
    return null;
  }

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    const data: Array<{ name: string; value: number; fill: string }> = [];

    if (result.summary.coincidencias > 0) {
      data.push({
        name: RECORD_TYPE_LABELS.coincidencia,
        value: result.summary.coincidencias,
        fill: COLORS.coincidencia,
      });
    }

    if (result.summary.diferencias > 0) {
      data.push({
        name: RECORD_TYPE_LABELS.diferencia,
        value: result.summary.diferencias,
        fill: COLORS.diferencia,
      });
    }

    if (result.summary.faltantesEnCSV > 0) {
      data.push({
        name: RECORD_TYPE_LABELS.faltante_csv,
        value: result.summary.faltantesEnCSV,
        fill: COLORS.faltante_csv,
      });
    }

    if (result.summary.faltantesEnFirebase > 0) {
      data.push({
        name: RECORD_TYPE_LABELS.faltante_firebase,
        value: result.summary.faltantesEnFirebase,
        fill: COLORS.faltante_firebase,
      });
    }

    return data;
  }, [result]);

  const concordanceRate = useMemo(() => {
    if (result.totalRecords === 0) return 0;
    return ((result.summary.coincidencias / result.totalRecords) * 100).toFixed(1);
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coincidencias */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Coincidencias
              </p>
              <p className="text-3xl font-bold text-green-700">
                {result.summary.coincidencias}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {concordanceRate}% concordancia
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </Card>

        {/* Diferencias */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Diferencias
              </p>
              <p className="text-3xl font-bold text-amber-700">
                {result.summary.diferencias}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {((result.summary.diferencias / result.totalRecords) * 100).toFixed(1)}% registros
              </p>
            </div>
            <div className="bg-amber-200 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-700" />
            </div>
          </div>
        </Card>

        {/* Faltantes en CSV */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Faltantes en CSV
              </p>
              <p className="text-3xl font-bold text-red-700">
                {result.summary.faltantesEnCSV}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {((result.summary.faltantesEnCSV / result.totalRecords) * 100).toFixed(1)}% registros
              </p>
            </div>
            <div className="bg-red-200 p-3 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-700" />
            </div>
          </div>
        </Card>

        {/* Faltantes en Firebase */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Faltantes en Firebase
              </p>
              <p className="text-3xl font-bold text-purple-700">
                {result.summary.faltantesEnFirebase}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {((result.summary.faltantesEnFirebase / result.totalRecords) * 100).toFixed(1)}% registros
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg">
              <Plus className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico y Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de torta */}
        <Card className="lg:col-span-2 p-6 flex items-center justify-center">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} registros`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>No hay datos para mostrar</p>
            </div>
          )}
        </Card>

        {/* Info adicional */}
        <Card className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Resumen de Comparación
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total de registros:</span>
                <span className="font-semibold">{result.totalRecords}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-semibold capitalize">{result.type}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Rendimiento
            </p>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Tiempo de procesamiento
                </p>
                <p className="font-semibold text-foreground">
                  {(result.processingTimeMs / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Comparación realizada
            </p>
            <p className="text-sm font-semibold">
              {new Date(result.comparisonsAt).toLocaleString('es-ES')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
