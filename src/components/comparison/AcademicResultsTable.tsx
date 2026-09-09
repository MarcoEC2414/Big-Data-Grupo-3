import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendencyAnalysis } from './TrendencyAnalysis';
import { RiskScoreCard } from './RiskScoreCard';
import { ChangesFromCSV } from './ChangesFromCSV';
import type { AnalisisAcademico, TendenciaType } from '@/lib/comparison/academicAnalysis';

interface AcademicResultsTableProps {
  analisisData: AnalisisAcademico[];
  isLoading?: boolean;
}

function getRiskBadgeColor(nivel: string) {
  switch (nivel) {
    case 'alto':
      return 'bg-red-500/15 text-red-400 hover:bg-red-500/15 border-red-500/20';
    case 'medio':
      return 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/15 border-yellow-500/20';
    default:
      return 'bg-green-500/15 text-green-400 hover:bg-green-500/15 border-green-500/20';
  }
}

function TendenciaBadge({
  tendencia,
  proyeccion,
  esPorcentaje = true,
}: {
  tendencia: TendenciaType;
  proyeccion: number;
  esPorcentaje?: boolean;
}) {
  const config = {
    subiendo: {
      icon: <TrendingUp className="h-3 w-3 text-emerald-400" />,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Subiendo',
    },
    bajando: {
      icon: <TrendingDown className="h-3 w-3 text-red-400" />,
      color: 'bg-red-500/10 text-red-400 border-red-500/20',
      label: 'Bajando',
    },
    estable: {
      icon: <Minus className="h-3 w-3 text-slate-500" />,
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      label: 'Estable',
    },
  }[tendencia];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium">
        Proy: {proyeccion.toFixed(1)}
        {esPorcentaje ? '%' : ''}
      </span>
    </div>
  );
}

export function AcademicResultsTable({
  analisisData,
  isLoading,
}: AcademicResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRiesgo, setFiltroRiesgo] = useState<string>('todos');

  const filteredData = useMemo(() => {
    return analisisData.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alumnoId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRiesgo =
        filtroRiesgo === 'todos' || item.scoreRiesgo.nivel === filtroRiesgo;

      return matchSearch && matchRiesgo;
    });
  }, [analisisData, searchTerm, filtroRiesgo]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Analizando expediente de estudiantes...</div>;
  }

  if (analisisData.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No hay datos de análisis disponibles para los registros comparados.</p>
      </Card>
    );
  }

  // Métricas generales
  const riesgoAlto = analisisData.filter((a) => a.scoreRiesgo.nivel === 'alto').length;
  const riesgoMedio = analisisData.filter((a) => a.scoreRiesgo.nivel === 'medio').length;
  const riesgoBajo = analisisData.filter((a) => a.scoreRiesgo.nivel === 'bajo').length;
  const conCambiosCSV = analisisData.filter(
    (a) => Object.keys(a.cambiosDesdeCSV).length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-red-400">RIESGO ALTO</p>
          <p className="text-2xl font-black text-red-400">{riesgoAlto}</p>
          <p className="text-[11px] text-muted-foreground">
            {((riesgoAlto / analisisData.length) * 100).toFixed(0)}% del total
          </p>
        </Card>

        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-xs font-bold text-yellow-400">RIESGO MEDIO</p>
          <p className="text-2xl font-black text-yellow-400">{riesgoMedio}</p>
          <p className="text-[11px] text-muted-foreground">
            {((riesgoMedio / analisisData.length) * 100).toFixed(0)}% del total
          </p>
        </Card>

        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xs font-bold text-green-400">RIESGO BAJO</p>
          <p className="text-2xl font-black text-green-400">{riesgoBajo}</p>
          <p className="text-[11px] text-muted-foreground">
            {((riesgoBajo / analisisData.length) * 100).toFixed(0)}% del total
          </p>
        </Card>

        <Card className="p-4 text-center border-l-4 border-l-primary">
          <p className="text-xs font-bold text-primary">DIFERENCIAS CSV</p>
          <p className="text-2xl font-black text-foreground">{conCambiosCSV}</p>
          <p className="text-[11px] text-muted-foreground">
            alumnos con cambios detectados
          </p>
        </Card>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID o nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filtroRiesgo}
            onChange={(e) => {
              setFiltroRiesgo(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
          >
            <option value="todos">Todos los niveles de riesgo</option>
            <option value="alto">Solo Riesgo Alto</option>
            <option value="medio">Solo Riesgo Medio</option>
            <option value="bajo">Solo Riesgo Bajo</option>
          </select>
        </div>
      </div>

      {/* Tabla de resultados */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase tracking-wide">
                <th className="text-center w-10 py-3 px-3"></th>
                <th className="text-left py-3 px-3 font-semibold">Estudiante / ID</th>
                <th className="text-center py-3 px-3 font-semibold">Asistencia Actual</th>
                <th className="text-center py-3 px-3 font-semibold">Promedio Actual</th>
                <th className="text-center py-3 px-3 font-semibold">Tendencia Asistencia</th>
                <th className="text-center py-3 px-3 font-semibold">Tendencia Notas</th>
                <th className="text-center py-3 px-3 font-semibold">Score Riesgo</th>
                <th className="text-center py-3 px-3 font-semibold">Nivel</th>
                <th className="text-center py-3 px-3 font-semibold">Cambios CSV</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((analisis) => {
                const tieneCambios = Object.keys(analisis.cambiosDesdeCSV).length > 0;
                const esFilaExpandida = expandedRows.has(analisis.alumnoId);

                return (
                  <React.Fragment key={analisis.alumnoId}>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="text-center py-3 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleExpandRow(analisis.alumnoId)}
                        >
                          {esFilaExpandida ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground text-xs">
                          {analisis.nombre}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {analisis.alumnoId}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        <span
                          className={
                            analisis.scoreRiesgo.factores.asistenciaActual >= 80
                              ? 'text-emerald-400'
                              : 'text-red-400 font-bold'
                          }
                        >
                          {analisis.scoreRiesgo.factores.asistenciaActual.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        <span
                          className={
                            analisis.scoreRiesgo.factores.promedio >= 10.5
                              ? 'text-emerald-400'
                              : 'text-red-400 font-bold'
                          }
                        >
                          {analisis.scoreRiesgo.factores.promedio.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <TendenciaBadge
                          tendencia={analisis.tendenciaAsistencia.tendencia}
                          proyeccion={analisis.tendenciaAsistencia.proyeccionProximaSemana}
                          esPorcentaje={true}
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <TendenciaBadge
                          tendencia={analisis.tendenciaNotas.tendencia}
                          proyeccion={analisis.tendenciaNotas.proyeccionProximaUnidad}
                          esPorcentaje={false}
                        />
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-foreground">
                        {analisis.scoreRiesgo.score}/100
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={getRiskBadgeColor(analisis.scoreRiesgo.nivel)}
                        >
                          {analisis.scoreRiesgo.nivel.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tieneCambios ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            {Object.keys(analisis.cambiosDesdeCSV).length} cambio(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Sin cambios</span>
                        )}
                      </td>
                    </tr>

                    {/* Fila expandida con análisis detallado */}
                    {esFilaExpandida && (
                      <tr className="border-b border-border bg-surface/50">
                        <td colSpan={9} className="p-5">
                          <div className="space-y-5">
                            {/* Tendencias detalladas */}
                            <TrendencyAnalysis
                              tendenciaAsistencia={analisis.tendenciaAsistencia}
                              tendenciaNotas={analisis.tendenciaNotas}
                            />

                            {/* Score de riesgo y factores considerados */}
                            <RiskScoreCard scoreRiesgo={analisis.scoreRiesgo} />

                            {/* Diferencias específicas entre CSV y Firestore */}
                            <ChangesFromCSV cambios={analisis.cambiosDesdeCSV} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          Mostrando {filteredData.length === 0 ? 0 : startIndex + 1} a{' '}
          {Math.min(startIndex + pageSize, filteredData.length)} de{' '}
          {filteredData.length} estudiantes
        </p>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            Anterior
          </Button>
          <span className="text-muted-foreground px-2">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
