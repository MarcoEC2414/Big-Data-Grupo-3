import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, ShieldAlert, CalendarCheck2 } from 'lucide-react';
import type { ComparativaInstitucional } from '@/lib/historico/historicoService';

interface HistoricoKpiCardsProps {
  comparativa: ComparativaInstitucional;
}

function formatSigned(value: number, decimals = 1) {
  const sign = value > 0 ? '+' : value < 0 ? '' : '±';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function HistoricoKpiCards({ comparativa }: HistoricoKpiCardsProps) {
  const { tasaAptitud, alumnosRiesgoPct, asistenciaPromedio } = comparativa;

  const cards = [
    {
      label: 'Variación en Tasa de Aptitud',
      variacion: tasaAptitud,
      icon: TrendingUp,
      colorClass: (positiva: boolean) =>
        positiva
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400',
      iconBg: (positiva: boolean) => (positiva ? 'bg-emerald-500/20' : 'bg-red-500/20'),
    },
    {
      label: 'Reducción de Alumnos en Riesgo',
      variacion: alumnosRiesgoPct,
      icon: ShieldAlert,
      colorClass: (positiva: boolean) =>
        positiva
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400',
      iconBg: (positiva: boolean) => (positiva ? 'bg-emerald-500/20' : 'bg-red-500/20'),
    },
    {
      label: 'Incremento de Asistencia Promedio',
      variacion: asistenciaPromedio,
      icon: CalendarCheck2,
      colorClass: (positiva: boolean) =>
        positiva
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400',
      iconBg: (positiva: boolean) => (positiva ? 'bg-emerald-500/20' : 'bg-red-500/20'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map(({ label, variacion, icon: Icon, colorClass, iconBg }) => (
        <Card
          key={label}
          className={`p-6 border ${colorClass(variacion.variacionPositiva)}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              <p className={`text-3xl font-bold ${colorClass(variacion.variacionPositiva).split(' ').pop()}`}>
                {formatSigned(variacion.variacion)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {variacion.base.toFixed(1)}% → {variacion.comparado.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${iconBg(variacion.variacionPositiva)}`}>
              <Icon className={`h-6 w-6 ${colorClass(variacion.variacionPositiva).split(' ').pop()}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
