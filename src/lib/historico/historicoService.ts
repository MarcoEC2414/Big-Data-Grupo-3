// src/lib/historico/historicoService.ts
//
// Capa de acceso y agregación para el dataset histórico institucional
// pre-calculado (rollups por periodo, sede y carrera). Este dataset se
// carga una única vez desde src/data/historico_sedes.json (~27 KB) y toda
// la analítica de la pestaña "Histórico Institucional" se resuelve en
// memoria con simples reducciones, sin sobrecargar al cliente ni requerir
// que el usuario suba ningún archivo.

import historicoRaw from '@/data/historico_sedes.json';

export const TODAS_LAS_SEDES = 'Todas las Sedes';
export const TODAS_LAS_CARRERAS = 'Todas las Carreras';

export interface HistoricoRegistro {
  periodo: string;
  sede: string;
  carrera: string;
  totalAlumnos: number;
  tasaAptitud: number;
  alumnosRiesgoPct: number;
  asistenciaPromedio: number;
}

export interface HistoricoDataset {
  meta: {
    titulo: string;
    institucion: string;
    rangoPeriodos: string;
    generadoDescripcion: string;
  };
  periodos: string[];
  sedes: string[];
  carreras: string[];
  registros: HistoricoRegistro[];
}

export const historicoDataset = historicoRaw as HistoricoDataset;

export const SEDES_FILTRO = [TODAS_LAS_SEDES, ...historicoDataset.sedes];
export const CARRERAS_FILTRO = [TODAS_LAS_CARRERAS, ...historicoDataset.carreras];
export const PERIODOS_DISPONIBLES = historicoDataset.periodos;

export interface MetricasAgregadas {
  totalAlumnos: number;
  tasaAptitud: number;
  alumnosRiesgoPct: number;
  alumnosEnRiesgo: number;
  asistenciaPromedio: number;
}

const METRICAS_VACIAS: MetricasAgregadas = {
  totalAlumnos: 0,
  tasaAptitud: 0,
  alumnosRiesgoPct: 0,
  alumnosEnRiesgo: 0,
  asistenciaPromedio: 0,
};

/**
 * Agrega las métricas del dataset para un periodo dado, respetando los
 * filtros de sede/carrera. Si el filtro es "Todas las Sedes" o "Todas las
 * Carreras", promedia de forma ponderada por cantidad de alumnos.
 */
export function aggregateMetrics(
  periodo: string,
  sede: string,
  carrera: string,
  registros: HistoricoRegistro[] = historicoDataset.registros
): MetricasAgregadas {
  const filtrados = registros.filter(
    (r) =>
      r.periodo === periodo &&
      (sede === TODAS_LAS_SEDES || r.sede === sede) &&
      (carrera === TODAS_LAS_CARRERAS || r.carrera === carrera)
  );

  const totalAlumnos = filtrados.reduce((acc, r) => acc + r.totalAlumnos, 0);
  if (totalAlumnos === 0 || filtrados.length === 0) {
    return { ...METRICAS_VACIAS };
  }

  const weightedAvg = (selector: (r: HistoricoRegistro) => number) =>
    filtrados.reduce((acc, r) => acc + selector(r) * r.totalAlumnos, 0) / totalAlumnos;

  const tasaAptitud = weightedAvg((r) => r.tasaAptitud);
  const alumnosRiesgoPct = weightedAvg((r) => r.alumnosRiesgoPct);
  const asistenciaPromedio = weightedAvg((r) => r.asistenciaPromedio);

  return {
    totalAlumnos,
    tasaAptitud,
    alumnosRiesgoPct,
    alumnosEnRiesgo: Math.round((alumnosRiesgoPct / 100) * totalAlumnos),
    asistenciaPromedio,
  };
}

export interface VariacionKPI {
  base: number;
  comparado: number;
  variacion: number;
  variacionPositiva: boolean;
}

function buildVariacion(base: number, comparado: number, mejorSiSube: boolean): VariacionKPI {
  const variacion = comparado - base;
  const variacionPositiva = mejorSiSube ? variacion >= 0 : variacion <= 0;
  return { base, comparado, variacion, variacionPositiva };
}

export interface ComparativaInstitucional {
  base: MetricasAgregadas;
  comparado: MetricasAgregadas;
  tasaAptitud: VariacionKPI;
  alumnosRiesgoPct: VariacionKPI;
  asistenciaPromedio: VariacionKPI;
}

export function compararPeriodos(
  periodoBase: string,
  periodoComparado: string,
  sede: string,
  carrera: string
): ComparativaInstitucional {
  const base = aggregateMetrics(periodoBase, sede, carrera);
  const comparado = aggregateMetrics(periodoComparado, sede, carrera);

  return {
    base,
    comparado,
    tasaAptitud: buildVariacion(base.tasaAptitud, comparado.tasaAptitud, true),
    alumnosRiesgoPct: buildVariacion(base.alumnosRiesgoPct, comparado.alumnosRiesgoPct, false),
    asistenciaPromedio: buildVariacion(base.asistenciaPromedio, comparado.asistenciaPromedio, true),
  };
}

export interface FilaTablaEjecutiva {
  sede: string;
  carrera: string;
  base: MetricasAgregadas;
  comparado: MetricasAgregadas;
}

/**
 * Construye las filas de la tabla ejecutiva para el informe de impresión.
 * Desglosa por la dimensión que esté en "Todas..." para dar contexto
 * granular; si ambos filtros son específicos, retorna una única fila.
 */
export function buildFilasTablaEjecutiva(
  periodoBase: string,
  periodoComparado: string,
  sede: string,
  carrera: string
): FilaTablaEjecutiva[] {
  const sedesDesglose = sede === TODAS_LAS_SEDES ? historicoDataset.sedes : [sede];
  const carrerasDesglose = carrera === TODAS_LAS_CARRERAS ? historicoDataset.carreras : [carrera];

  const filas: FilaTablaEjecutiva[] = [];
  for (const s of sedesDesglose) {
    for (const c of carrerasDesglose) {
      filas.push({
        sede: s,
        carrera: c,
        base: aggregateMetrics(periodoBase, s, c),
        comparado: aggregateMetrics(periodoComparado, s, c),
      });
    }
  }
  return filas;
}
