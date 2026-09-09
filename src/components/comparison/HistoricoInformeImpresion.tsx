import React from 'react';
import {
  buildFilasTablaEjecutiva,
  TODAS_LAS_SEDES,
  TODAS_LAS_CARRERAS,
  type ComparativaInstitucional,
} from '@/lib/historico/historicoService';

interface HistoricoInformeImpresionProps {
  periodoBase: string;
  periodoComparado: string;
  sede: string;
  carrera: string;
  comparativa: ComparativaInstitucional;
}

function fmtPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function fmtVar(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} pp`;
}

/**
 * Sección exclusiva para impresión / exportación a PDF: membrete formal,
 * resumen de filtros aplicados y tabla ejecutiva con el desglose de datos
 * comparados, lista para adjuntar a un informe institucional.
 *
 * Oculta en pantalla (hidden) y visible solo al imprimir (print:block),
 * gracias a las utilidades de Tailwind — ver también las reglas
 * @media print en src/styles.css.
 */
export function HistoricoInformeImpresion({
  periodoBase,
  periodoComparado,
  sede,
  carrera,
  comparativa,
}: HistoricoInformeImpresionProps) {
  const filas = buildFilasTablaEjecutiva(periodoBase, periodoComparado, sede, carrera);
  const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="print-report hidden print:block bg-white text-slate-900">
      {/* Membrete formal */}
      <header className="print-avoid-break border-b-2 border-slate-800 pb-4 mb-6">
        <p className="text-base font-bold tracking-tight">
          SENATI - Dirección Zonal Lima Callao{' '}
          <span className="font-medium text-slate-700">
            | Informe Analítico de Retención y Rendimiento Estudiantil (2023 - 2026)
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-1">Generado el {fechaGeneracion}</p>
      </header>

      {/* Resumen de filtros aplicados */}
      <section className="print-avoid-break mb-6 text-sm">
        <table className="w-auto text-left">
          <tbody>
            <tr>
              <td className="pr-4 py-0.5 font-semibold">Periodo Base:</td>
              <td className="py-0.5">{periodoBase}</td>
              <td className="pr-4 pl-8 py-0.5 font-semibold">Periodo Comparado:</td>
              <td className="py-0.5">{periodoComparado}</td>
            </tr>
            <tr>
              <td className="pr-4 py-0.5 font-semibold">Sede:</td>
              <td className="py-0.5">{sede}</td>
              <td className="pr-4 pl-8 py-0.5 font-semibold">Carrera:</td>
              <td className="py-0.5">{carrera}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* KPIs de balance neto */}
      <section className="print-avoid-break mb-6">
        <h2 className="text-sm font-bold mb-2 uppercase tracking-wide">
          Balance Neto del Periodo Analizado
        </h2>
        <table>
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left px-3 py-1.5 text-xs font-bold">Indicador</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">{periodoBase}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">{periodoComparado}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Variación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-1.5 text-xs">Tasa de Aptitud</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.tasaAptitud.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.tasaAptitud.comparado)}</td>
              <td className="px-3 py-1.5 text-xs text-right font-semibold">{fmtVar(comparativa.tasaAptitud.variacion)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1.5 text-xs">% Alumnos en Riesgo</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.alumnosRiesgoPct.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.alumnosRiesgoPct.comparado)}</td>
              <td className="px-3 py-1.5 text-xs text-right font-semibold">{fmtVar(comparativa.alumnosRiesgoPct.variacion)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1.5 text-xs">Asistencia Promedio</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.asistenciaPromedio.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.asistenciaPromedio.comparado)}</td>
              <td className="px-3 py-1.5 text-xs text-right font-semibold">{fmtVar(comparativa.asistenciaPromedio.variacion)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Tabla ejecutiva desglosada */}
      <section>
        <h2 className="text-sm font-bold mb-2 uppercase tracking-wide">
          Detalle por Sede y Carrera
        </h2>
        <table>
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left px-3 py-1.5 text-xs font-bold">Sede</th>
              <th className="text-left px-3 py-1.5 text-xs font-bold">Carrera</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Alumnos ({periodoComparado})</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Aptitud {periodoBase}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Aptitud {periodoComparado}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Riesgo {periodoBase}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Riesgo {periodoComparado}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Asistencia {periodoBase}</th>
              <th className="text-right px-3 py-1.5 text-xs font-bold">Asistencia {periodoComparado}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={`${fila.sede}-${fila.carrera}`}>
                <td className="px-3 py-1 text-xs">{fila.sede}</td>
                <td className="px-3 py-1 text-xs">{fila.carrera}</td>
                <td className="px-3 py-1 text-xs text-right">{fila.comparado.totalAlumnos}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.base.tasaAptitud)}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.comparado.tasaAptitud)}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.base.alumnosRiesgoPct)}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.comparado.alumnosRiesgoPct)}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.base.asistenciaPromedio)}</td>
                <td className="px-3 py-1 text-xs text-right">{fmtPct(fila.comparado.asistenciaPromedio)}</td>
              </tr>
            ))}
            {/* Fila de totales / consolidado general */}
            <tr className="bg-slate-100 font-semibold">
              <td className="px-3 py-1.5 text-xs" colSpan={2}>
                {sede === TODAS_LAS_SEDES ? 'Todas las Sedes' : sede} —{' '}
                {carrera === TODAS_LAS_CARRERAS ? 'Todas las Carreras' : carrera} (Consolidado)
              </td>
              <td className="px-3 py-1.5 text-xs text-right">{comparativa.comparado.totalAlumnos}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.tasaAptitud.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.tasaAptitud.comparado)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.alumnosRiesgoPct.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.alumnosRiesgoPct.comparado)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.asistenciaPromedio.base)}</td>
              <td className="px-3 py-1.5 text-xs text-right">{fmtPct(comparativa.asistenciaPromedio.comparado)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="mt-8 pt-3 border-t border-slate-300 text-[10px] text-slate-500">
        Informe generado automáticamente a partir del histórico institucional pre-agregado
        (rollups por periodo, sede y carrera). Documento de uso interno — SENATI Gestión Docente.
      </footer>
    </div>
  );
}
