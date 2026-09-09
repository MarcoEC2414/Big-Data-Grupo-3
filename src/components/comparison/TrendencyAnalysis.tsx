import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { TendenciaAsistencia, TendenciaNotas } from '@/lib/comparison/academicAnalysis';

interface TrendencyAnalysisProps {
  tendenciaAsistencia: TendenciaAsistencia;
  tendenciaNotas: TendenciaNotas;
}

function getTrendIcon(tendencia: string) {
  switch (tendencia) {
    case 'subiendo':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'bajando':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    default:
      return <Minus className="h-4 w-4 text-slate-500" />;
  }
}

function getTrendColor(tendencia: string) {
  switch (tendencia) {
    case 'subiendo':
      return 'text-green-400 bg-green-500/10';
    case 'bajando':
      return 'text-red-400 bg-red-500/10';
    default:
      return 'text-slate-400 bg-white/5';
  }
}

export function TrendencyAnalysis({
  tendenciaAsistencia,
  tendenciaNotas,
}: TrendencyAnalysisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tendencia de Asistencia */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Tendencia de Asistencia
            </h3>
            {getTrendIcon(tendenciaAsistencia.tendencia)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTrendColor(
                  tendenciaAsistencia.tendencia
                )}`}
              >
                {tendenciaAsistencia.tendencia.charAt(0).toUpperCase() +
                  tendenciaAsistencia.tendencia.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {tendenciaAsistencia.variacion > 0 ? '+' : ''}
                {tendenciaAsistencia.variacion.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Promedio anterior</p>
                <p className="text-sm font-semibold text-foreground">
                  {tendenciaAsistencia.promedioAnterior.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promedio actual</p>
                <p className="text-sm font-semibold text-foreground">
                  {tendenciaAsistencia.promedioActual.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Proyección próxima semana
              </p>
              <p className="text-sm font-bold text-primary">
                {tendenciaAsistencia.proyeccionProximaSemana.toFixed(1)}%
              </p>
              {tendenciaAsistencia.semanas > 0 && (
                <p className="text-xs text-muted-foreground">
                  Basado en {tendenciaAsistencia.semanas} semanas de datos
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tendencia de Notas */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Tendencia de Notas
            </h3>
            {getTrendIcon(tendenciaNotas.tendencia)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTrendColor(
                  tendenciaNotas.tendencia
                )}`}
              >
                {tendenciaNotas.tendencia.charAt(0).toUpperCase() +
                  tendenciaNotas.tendencia.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {tendenciaNotas.variacion > 0 ? '+' : ''}
                {tendenciaNotas.variacion.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Promedio anterior</p>
                <p className="text-sm font-semibold text-foreground">
                  {tendenciaNotas.promedioAnterior.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promedio actual</p>
                <p className="text-sm font-semibold text-foreground">
                  {tendenciaNotas.promedioActual.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Proyección próxima unidad
              </p>
              <p className="text-sm font-bold text-primary">
                {tendenciaNotas.proyeccionProximaUnidad.toFixed(1)}
              </p>
              {tendenciaNotas.unidades > 0 && (
                <p className="text-xs text-muted-foreground">
                  Basado en {tendenciaNotas.unidades} unidades
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
