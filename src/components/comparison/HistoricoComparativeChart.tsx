import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ComparativaInstitucional } from '@/lib/historico/historicoService';

interface HistoricoComparativeChartProps {
  comparativa: ComparativaInstitucional;
  periodoBase: string;
  periodoComparado: string;
}

export function HistoricoComparativeChart({
  comparativa,
  periodoBase,
  periodoComparado,
}: HistoricoComparativeChartProps) {
  const data = useMemo(
    () => [
      {
        metrica: 'Tasa de Aptitud (%)',
        Base: Number(comparativa.tasaAptitud.base.toFixed(1)),
        Comparado: Number(comparativa.tasaAptitud.comparado.toFixed(1)),
      },
      {
        metrica: 'Asistencia Promedio (%)',
        Base: Number(comparativa.asistenciaPromedio.base.toFixed(1)),
        Comparado: Number(comparativa.asistenciaPromedio.comparado.toFixed(1)),
      },
      {
        metrica: 'Alumnos en Riesgo (%)',
        Base: Number(comparativa.alumnosRiesgoPct.base.toFixed(1)),
        Comparado: Number(comparativa.alumnosRiesgoPct.comparado.toFixed(1)),
      },
    ],
    [comparativa]
  );

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Comparativa de Métricas Clave
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {periodoBase} frente a {periodoComparado}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="metrica"
            tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
            interval={0}
          />
          <YAxis tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => `${value}%`}
            contentStyle={{
              backgroundColor: 'rgba(15, 17, 26, 0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="Base" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={periodoBase} />
          <Bar
            dataKey="Comparado"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name={periodoComparado}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
