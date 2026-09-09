import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, WifiOff, Briefcase, Users, AlertCircle } from 'lucide-react';
import type { AnalisisGrupoDemografico, EstadisticasGrupo } from '@/lib/comparison/academicAnalysis';

interface DemographicAnalysisProps {
  analisisGrupos: AnalisisGrupoDemografico;
}

interface GrupoRowProps {
  label: string;
  icon: React.ReactNode;
  grupo: Record<string, EstadisticasGrupo>;
}

function GrupoTable({ label, icon, grupo }: GrupoRowProps) {
  if (Object.keys(grupo).length === 0) {
    return null;
  }

  const gruposArray = Object.entries(grupo).sort((a, b) => b[1].pctRiesgo - a[1].pctRiesgo);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-foreground">{label}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase tracking-wide">
              <th className="text-left py-2.5 px-3 font-semibold">Grupo</th>
              <th className="text-center py-2.5 px-3 font-semibold">Estudiantes</th>
              <th className="text-center py-2.5 px-3 font-semibold">Asistencia Promedio</th>
              <th className="text-center py-2.5 px-3 font-semibold">Nota Promedio</th>
              <th className="text-center py-2.5 px-3 font-semibold">% en Riesgo</th>
              <th className="text-center py-2.5 px-3 font-semibold">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {gruposArray.map(([nombre, stats]) => {
              const esCritico = stats.esMayorRiesgo || stats.esPeorAsistencia || stats.esPeorNota;

              return (
                <tr
                  key={nombre}
                  className={`border-b border-border transition-colors ${
                    stats.pctRiesgo > 50 || esCritico
                      ? 'bg-red-500/10 hover:bg-red-500/10'
                      : stats.pctRiesgo > 25
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/10'
                      : 'bg-green-500/10 hover:bg-green-500/10'
                  }`}
                >
                  <td className="py-2.5 px-3 text-foreground font-semibold">
                    <div className="flex items-center gap-2">
                      {esCritico && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className="truncate">{nombre || 'Sin especificar'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium text-foreground">
                    {stats.cantidadAlumnos}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-semibold ${
                        stats.asistenciaPromedio >= 80
                          ? 'text-green-400'
                          : stats.asistenciaPromedio >= 70
                          ? 'text-yellow-400'
                          : 'text-red-400 font-bold'
                      }`}
                    >
                      {stats.asistenciaPromedio.toFixed(1)}%
                    </span>
                    {stats.esPeorAsistencia && (
                      <span className="ml-1 text-[10px] text-destructive font-bold">(Mín.)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-semibold ${
                        stats.notaPromedia >= 13
                          ? 'text-green-400'
                          : stats.notaPromedia >= 10.5
                          ? 'text-yellow-400'
                          : 'text-red-400 font-bold'
                      }`}
                    >
                      {stats.notaPromedia.toFixed(1)}
                    </span>
                    {stats.esPeorNota && (
                      <span className="ml-1 text-[10px] text-destructive font-bold">(Mín.)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        stats.pctRiesgo > 50
                          ? 'bg-red-500/15 text-red-400'
                          : stats.pctRiesgo > 25
                          ? 'bg-yellow-500/15 text-yellow-400'
                          : 'bg-green-500/15 text-green-400'
                      }`}
                    >
                      {stats.pctRiesgo}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {stats.esMayorRiesgo ? (
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        Peor Desempeño
                      </span>
                    ) : stats.pctRiesgo > 40 ? (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        Atención Prioritaria
                      </span>
                    ) : (
                      <span className="rounded bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">
                        Regular / Estable
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemographicAnalysis({ analisisGrupos }: DemographicAnalysisProps) {
  const { conectividadMasCritica, situacionLaboralMasCritica, rangoEtarioMasCritico } =
    analisisGrupos.resumenPeorDesempeno || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Análisis por Grupos Demográficos
        </h2>
        <p className="text-sm text-muted-foreground">
          Promedios de asistencia y notas agrupados por conectividad, situación laboral y rango etario para detectar los grupos con peor desempeño.
        </p>
      </div>

      {/* Tarjeta destacada de peor desempeño */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-l-4 border-l-destructive bg-destructive/5 space-y-1">
          <div className="flex items-center gap-2 text-destructive font-bold text-xs">
            <WifiOff className="h-4 w-4" />
            CONECTIVIDAD CRÍTICA
          </div>
          <p className="text-base font-extrabold text-foreground">
            {conectividadMasCritica || "Sin datos"}
          </p>
          <p className="text-xs text-muted-foreground">
            Registra el mayor índice de riesgo académico y menor asistencia.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-500/10 space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Briefcase className="h-4 w-4" />
            SITUACIÓN LABORAL CRÍTICA
          </div>
          <p className="text-base font-extrabold text-foreground">
            {situacionLaboralMasCritica || "Sin datos"}
          </p>
          <p className="text-xs text-muted-foreground">
            Requiere flexibilidad horaria y seguimiento tutorial reforzado.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary bg-primary-soft space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Users className="h-4 w-4" />
            RANGO ETARIO CRÍTICO
          </div>
          <p className="text-base font-extrabold text-foreground">
            {rangoEtarioMasCritico || "Sin datos"}
          </p>
          <p className="text-xs text-muted-foreground">
            Segmento con menor promedio acumulado de notas.
          </p>
        </Card>
      </div>

      {/* Tablas por categoría */}
      <Card className="p-5">
        <GrupoTable
          label="Agrupado por Conectividad"
          icon={<WifiOff className="h-4 w-4 text-primary" />}
          grupo={analisisGrupos.conectividad}
        />
      </Card>

      <Card className="p-5">
        <GrupoTable
          label="Agrupado por Situación Laboral"
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          grupo={analisisGrupos.situacionLaboral}
        />
      </Card>

      <Card className="p-5">
        <GrupoTable
          label="Agrupado por Rango Etario"
          icon={<Users className="h-4 w-4 text-primary" />}
          grupo={analisisGrupos.rangoEtario}
        />
      </Card>

      {/* Recomendaciones pedagógicas */}
      <Card className="p-4 bg-primary-soft/50 border border-primary/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-foreground">Interpretación institucional SENATI</p>
            <p className="text-muted-foreground">
              Los estudiantes de grupos marcados con <strong>Peor Desempeño</strong> deben ser canalizados con consejería estudiantil. Se prioriza a aquellos con asistencia menor a 80% (umbral de aptitud para examen) o promedio menor a 10.5.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
