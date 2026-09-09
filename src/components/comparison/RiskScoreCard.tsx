import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ScoreRiesgo } from '@/lib/comparison/academicAnalysis';

interface RiskScoreCardProps {
  scoreRiesgo: ScoreRiesgo;
}

export function RiskScoreCard({ scoreRiesgo }: RiskScoreCardProps) {
  const getRiskColor = () => {
    switch (scoreRiesgo.nivel) {
      case 'alto':
        return {
          bg: 'bg-red-500/10 border-red-500/20',
          icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
          textScore: 'text-red-400',
          textLabel: 'text-red-400',
          badge: 'bg-red-500/15 text-red-400',
        };
      case 'medio':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          icon: <AlertCircle className="h-6 w-6 text-yellow-400" />,
          textScore: 'text-yellow-400',
          textLabel: 'text-yellow-400',
          badge: 'bg-yellow-500/15 text-yellow-400',
        };
      default:
        return {
          bg: 'bg-green-500/10 border-green-500/20',
          icon: <CheckCircle className="h-6 w-6 text-green-400" />,
          textScore: 'text-green-400',
          textLabel: 'text-green-400',
          badge: 'bg-green-500/15 text-green-400',
        };
    }
  };

  const colors = getRiskColor();
  const levelLabel = scoreRiesgo.nivel.charAt(0).toUpperCase() + scoreRiesgo.nivel.slice(1);

  return (
    <Card className={`p-6 border ${colors.bg}`}>
      <div className="space-y-4">
        {/* Header con icono y título */}
        <div className="flex items-start gap-3">
          {colors.icon}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">
              Score de Riesgo Académico
            </h3>
            <p className={`text-xs mt-1 ${colors.textLabel}`}>{scoreRiesgo.razon}</p>
          </div>
        </div>

        {/* Score visual */}
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Score</p>
            <p className={`text-3xl font-bold ${colors.textScore}`}>
              {scoreRiesgo.score}
            </p>
            <p className="text-xs text-muted-foreground mt-1">/100</p>
          </div>

          {/* Barra de progreso */}
          <div className="flex-1">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  scoreRiesgo.nivel === 'alto'
                    ? 'bg-red-500'
                    : scoreRiesgo.nivel === 'medio'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${scoreRiesgo.score}%` }}
              />
            </div>
          </div>

          {/* Badge de nivel */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors.badge}`}>
            {levelLabel}
          </span>
        </div>

        {/* Factores considerados */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
          <div>
            <p className="text-xs text-muted-foreground">Estado Académico</p>
            <p className="text-sm font-semibold text-foreground">
              {scoreRiesgo.factores.estadoAcademico}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Asistencia</p>
            <p className="text-sm font-semibold text-foreground">
              {scoreRiesgo.factores.asistenciaActual.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className="text-sm font-semibold text-foreground">
              {scoreRiesgo.factores.promedio.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tend. Asistencia</p>
            <p className="text-sm font-semibold text-foreground capitalize">
              {scoreRiesgo.factores.tendenciaAsistencia}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tend. Notas</p>
            <p className="text-sm font-semibold text-foreground capitalize">
              {scoreRiesgo.factores.tendenciaNotas}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
