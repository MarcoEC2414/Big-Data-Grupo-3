import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Database } from 'lucide-react';
import { HistoricoFiltros, type HistoricoFiltrosState } from './HistoricoFiltros';
import { HistoricoKpiCards } from './HistoricoKpiCards';
import { HistoricoComparativeChart } from './HistoricoComparativeChart';
import { HistoricoInformeImpresion } from './HistoricoInformeImpresion';
import {
  compararPeriodos,
  TODAS_LAS_SEDES,
  TODAS_LAS_CARRERAS,
  PERIODOS_DISPONIBLES,
} from '@/lib/historico/historicoService';

const DEFAULT_FILTROS: HistoricoFiltrosState = {
  periodoBase: PERIODOS_DISPONIBLES[0] ?? '2023-I',
  periodoComparado: PERIODOS_DISPONIBLES[PERIODOS_DISPONIBLES.length - 1] ?? '2026-I',
  sede: TODAS_LAS_SEDES,
  carrera: TODAS_LAS_CARRERAS,
};

export function HistoricoInstitucional() {
  const [filtros, setFiltros] = useState<HistoricoFiltrosState>(DEFAULT_FILTROS);

  const comparativa = useMemo(
    () =>
      compararPeriodos(
        filtros.periodoBase,
        filtros.periodoComparado,
        filtros.sede,
        filtros.carrera
      ),
    [filtros]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Aviso de fuente de datos + acción de impresión (oculto al imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5 text-purple-400" />
          Analítica multianual precargada ({PERIODOS_DISPONIBLES[0]} — {PERIODOS_DISPONIBLES[PERIODOS_DISPONIBLES.length - 1]}). No requiere subir archivos.
        </div>
        <Button onClick={handlePrint} className="gap-2" size="sm">
          <Printer className="h-4 w-4" />
          Generar Informe Institucional
        </Button>
      </div>

      {/* Filtros interactivos */}
      <HistoricoFiltros value={filtros} onChange={setFiltros} />

      {/* KPI cards de balance neto */}
      <div className="print:hidden">
        <HistoricoKpiCards comparativa={comparativa} />
      </div>

      {/* Gráfico comparativo */}
      <div className="print:hidden">
        <HistoricoComparativeChart
          comparativa={comparativa}
          periodoBase={filtros.periodoBase}
          periodoComparado={filtros.periodoComparado}
        />
      </div>

      {/* Informe formal — solo visible al imprimir / exportar a PDF */}
      <HistoricoInformeImpresion
        periodoBase={filtros.periodoBase}
        periodoComparado={filtros.periodoComparado}
        sede={filtros.sede}
        carrera={filtros.carrera}
        comparativa={comparativa}
      />
    </div>
  );
}
