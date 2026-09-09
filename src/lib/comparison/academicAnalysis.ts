/**
 * Servicio de Análisis Académico Comparativo
 * Calcula y analiza:
 * 1. Tendencia de asistencia y proyección próxima semana
 * 2. Tendencia de notas por unidad
 * 3. Score de riesgo académico combinado (estadoAcademico + tendencia asistencia + tendencia notas)
 * 4. Estadísticas agrupadas por conectividad, situacionLaboral y rangoEtario (detectando peor desempeño)
 * 5. Diferencias entre CSV y Firestore por estudiante (promedio, asistencia, estadoAcademico)
 */

import { Alumno } from "../mock-data";
import { ComparisonItem } from "./types";

export type TendenciaType = "subiendo" | "bajando" | "estable";
export type NivelRiesgo = "bajo" | "medio" | "alto";

export interface TendenciaAsistencia {
  tendencia: TendenciaType;
  promedioActual: number;
  promedioAnterior: number;
  variacion: number; // Porcentaje de cambio
  proyeccionProximaSemana: number; // Predicción lineal próxima semana (0-100%)
  semanas: number;
}

export interface TendenciaNotas {
  tendencia: TendenciaType;
  promedioActual: number;
  promedioAnterior: number;
  variacion: number;
  unidades: number;
  proyeccionProximaUnidad: number; // Predicción lineal próxima unidad (0-20)
}

export interface ScoreRiesgo {
  nivel: NivelRiesgo;
  score: number; // 0-100 (salud académica)
  razon: string;
  factores: {
    estadoAcademico: string;
    tendenciaAsistencia: TendenciaType;
    tendenciaNotas: TendenciaType;
    asistenciaActual: number;
    promedio: number;
  };
}

export interface EstadisticasGrupo {
  asistenciaPromedio: number;
  notaPromedia: number;
  cantidadAlumnos: number;
  alumnosConRiesgo: number;
  pctRiesgo: number;
  esPeorAsistencia?: boolean;
  esPeorNota?: boolean;
  esMayorRiesgo?: boolean;
}

export interface AnalisisAcademico {
  alumnoId: string;
  nombre: string;
  tendenciaAsistencia: TendenciaAsistencia;
  tendenciaNotas: TendenciaNotas;
  scoreRiesgo: ScoreRiesgo;
  cambiosDesdeCSV: {
    promedio?: { anterior: number; actual: number; diferencia: number };
    asistencia?: { anterior: number; actual: number; diferencia: number };
    estadoAcademico?: { anterior: string; actual: string };
  };
}

export interface GrupoResumen {
  stats: Record<string, EstadisticasGrupo>;
  peorGrupoAsistencia?: { nombre: string; valor: number };
  peorGrupoNota?: { nombre: string; valor: number };
  peorGrupoRiesgo?: { nombre: string; valor: number };
}

export interface AnalisisGrupoDemografico {
  conectividad: Record<string, EstadisticasGrupo>;
  situacionLaboral: Record<string, EstadisticasGrupo>;
  rangoEtario: Record<string, EstadisticasGrupo>;
  resumenPeorDesempeno: {
    conectividadMasCritica?: string;
    situacionLaboralMasCritica?: string;
    rangoEtarioMasCritico?: string;
  };
}

/**
 * Regresión lineal simple: y = mx + b
 * Retorna m (pendiente) y b (intercepto)
 */
export function regresionLinealSimple(puntosY: number[]): { m: number; b: number } {
  const n = puntosY.length;
  if (n < 2) {
    return { m: 0, b: puntosY[0] || 0 };
  }

  const sumX = (n * (n + 1)) / 2; // 1 + 2 + ... + n
  const sumY = puntosY.reduce((a, b) => a + b, 0);
  const sumXY = puntosY.reduce((sum, y, i) => sum + y * (i + 1), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { m: 0, b: sumY / n };
  }

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

/**
 * 1. Calcula tendencia de asistencia y proyección de próxima semana
 */
export function calcularTendenciaAsistencia(alumno: Alumno): TendenciaAsistencia {
  const historial = alumno.historialAsistencia || [];
  const asistenciaActual = typeof alumno.asistencia === "number" ? alumno.asistencia : 0;

  if (historial.length === 0) {
    return {
      tendencia: "estable",
      promedioActual: asistenciaActual,
      promedioAnterior: asistenciaActual,
      variacion: 0,
      proyeccionProximaSemana: asistenciaActual,
      semanas: 0,
    };
  }

  const valores = historial.map((h) => Number(h.porcentaje) || 0);
  const n = valores.length;

  if (n === 1) {
    return {
      tendencia: "estable",
      promedioActual: valores[0],
      promedioAnterior: valores[0],
      variacion: 0,
      proyeccionProximaSemana: valores[0],
      semanas: 1,
    };
  }

  const { m, b } = regresionLinealSimple(valores);

  // Tendencia basada en la pendiente de la regresión
  let tendencia: TendenciaType = "estable";
  if (m > 0.4) {
    tendencia = "subiendo";
  } else if (m < -0.4) {
    tendencia = "bajando";
  }

  // Proyección semana siguiente (x = n + 1)
  const proyeccion = m * (n + 1) + b;
  const proyeccionClamped = Math.max(0, Math.min(100, Math.round(proyeccion * 10) / 10));

  // Comparación entre la primera mitad y la segunda mitad
  const mitad = Math.floor(n / 2);
  const anterior = valores.slice(0, mitad);
  const actual = valores.slice(mitad);
  const promAnterior = anterior.reduce((s, v) => s + v, 0) / (anterior.length || 1);
  const promActual = actual.reduce((s, v) => s + v, 0) / (actual.length || 1);
  const variacion = promAnterior > 0 ? ((promActual - promAnterior) / promAnterior) * 100 : 0;

  return {
    tendencia,
    promedioActual: Math.round(promActual * 10) / 10,
    promedioAnterior: Math.round(promAnterior * 10) / 10,
    variacion: Math.round(variacion * 10) / 10,
    proyeccionProximaSemana: proyeccionClamped,
    semanas: n,
  };
}

/**
 * 2. Calcula tendencia de notas por estudiante y proyección de próxima unidad
 */
export function calcularTendenciaNotas(alumno: Alumno): TendenciaNotas {
  const notas = alumno.notas || [];
  const promedioActual = typeof alumno.promedio === "number" ? alumno.promedio : 0;

  if (notas.length === 0) {
    return {
      tendencia: "estable",
      promedioActual,
      promedioAnterior: promedioActual,
      variacion: 0,
      unidades: 0,
      proyeccionProximaUnidad: promedioActual,
    };
  }

  // Agrupar notas por unidad
  const unidadesMap = new Map<string, number[]>();
  for (const item of notas) {
    const unidadKey = item.unidad || "Unidad I";
    if (!unidadesMap.has(unidadKey)) {
      unidadesMap.set(unidadKey, []);
    }
    unidadesMap.get(unidadKey)!.push(Number(item.nota) || 0);
  }

  // Ordenar unidades cronológicamente si tienen números romanos o dígitos
  const ordenRomanos: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
  };

  const unidadesKeys = Array.from(unidadesMap.keys()).sort((a, b) => {
    const matchA = a.toLowerCase().replace("unidad", "").trim();
    const matchB = b.toLowerCase().replace("unidad", "").trim();
    const valA = ordenRomanos[matchA] ?? 99;
    const valB = ordenRomanos[matchB] ?? 99;
    return valA - valB;
  });

  const promediosPorUnidad = unidadesKeys.map((u) => {
    const list = unidadesMap.get(u)!;
    return list.reduce((s, v) => s + v, 0) / list.length;
  });

  const k = promediosPorUnidad.length;
  if (k < 2) {
    const notaUnica = promediosPorUnidad[0] ?? promedioActual;
    return {
      tendencia: "estable",
      promedioActual: Math.round(notaUnica * 10) / 10,
      promedioAnterior: Math.round(notaUnica * 10) / 10,
      variacion: 0,
      unidades: k,
      proyeccionProximaUnidad: Math.round(notaUnica * 10) / 10,
    };
  }

  const { m, b } = regresionLinealSimple(promediosPorUnidad);

  // Pendiente m en escala 0-20
  let tendencia: TendenciaType = "estable";
  if (m > 0.2) {
    tendencia = "subiendo";
  } else if (m < -0.2) {
    tendencia = "bajando";
  }

  // Proyección de la próxima unidad (x = k + 1)
  const proyeccion = m * (k + 1) + b;
  const proyeccionClamped = Math.max(0, Math.min(20, Math.round(proyeccion * 10) / 10));

  const mitad = Math.floor(k / 2);
  const anterior = promediosPorUnidad.slice(0, mitad);
  const actual = promediosPorUnidad.slice(mitad);
  const promAnterior = anterior.reduce((s, v) => s + v, 0) / (anterior.length || 1);
  const promActual = actual.reduce((s, v) => s + v, 0) / (actual.length || 1);
  const variacion = promAnterior > 0 ? ((promActual - promAnterior) / promAnterior) * 100 : 0;

  return {
    tendencia,
    promedioActual: Math.round(promActual * 10) / 10,
    promedioAnterior: Math.round(promAnterior * 10) / 10,
    variacion: Math.round(variacion * 10) / 10,
    unidades: k,
    proyeccionProximaUnidad: proyeccionClamped,
  };
}

/**
 * 3. Score de riesgo académico (bajo/medio/alto)
 * Combina: estadoAcademico + tendenciaAsistencia + tendenciaNotas + métricas actuales
 */
export function calcularScoreRiesgo(
  alumno: Alumno,
  tendenciaAsistencia: TendenciaAsistencia,
  tendenciaNotas: TendenciaNotas
): ScoreRiesgo {
  const estado = (alumno.estadoAcademico || "Aprobado").trim();
  const asistencia = Number(alumno.asistencia) || 0;
  const promedio = Number(alumno.promedio) || 0;

  let puntosRiesgo = 0;
  const estadoLower = estado.toLowerCase();

  // Factor 1: Estado académico (0 a 40 puntos de riesgo)
  if (
    estadoLower.includes("reprobado") ||
    estadoLower.includes("desaprobado") ||
    estadoLower.includes("suspendido")
  ) {
    puntosRiesgo += 40;
  } else if (
    estadoLower.includes("riesgo") ||
    estadoLower.includes("observado")
  ) {
    puntosRiesgo += 25;
  } else if (
    estadoLower.includes("destacado") ||
    estadoLower.includes("excelente")
  ) {
    puntosRiesgo += 0;
  } else {
    puntosRiesgo += 8; // Aprobado / Regular
  }

  // Factor 2: Tendencia de asistencia (-8 a +15 puntos de riesgo)
  if (tendenciaAsistencia.tendencia === "bajando") {
    puntosRiesgo += 15;
  } else if (tendenciaAsistencia.tendencia === "subiendo") {
    puntosRiesgo = Math.max(0, puntosRiesgo - 8);
  }

  // Factor 3: Tendencia de notas (-8 a +15 puntos de riesgo)
  if (tendenciaNotas.tendencia === "bajando") {
    puntosRiesgo += 15;
  } else if (tendenciaNotas.tendencia === "subiendo") {
    puntosRiesgo = Math.max(0, puntosRiesgo - 8);
  }

  // Factor 4: Asistencia actual (umbral SENATI es 80%)
  if (asistencia < 70) {
    puntosRiesgo += 20;
  } else if (asistencia < 80) {
    puntosRiesgo += 10;
  }

  // Factor 5: Promedio actual (<10.5 es desaprobatorio)
  if (promedio < 10.5) {
    puntosRiesgo += 20;
  } else if (promedio < 12) {
    puntosRiesgo += 10;
  }

  // Acotar puntos de riesgo a [0, 100]
  puntosRiesgo = Math.max(0, Math.min(100, puntosRiesgo));

  // Score de salud académica (0-100)
  const score = 100 - puntosRiesgo;

  // Nivel de riesgo académico
  let nivel: NivelRiesgo = "bajo";
  let razon = "";

  if (puntosRiesgo >= 45 || score <= 55) {
    nivel = "alto";
    razon = `Riesgo alto: Estado "${estado}" combinado con asistencia ${tendenciaAsistencia.tendencia} y notas ${tendenciaNotas.tendencia}.`;
  } else if (puntosRiesgo >= 25 || score <= 75) {
    nivel = "medio";
    razon = `Riesgo medio: Estado "${estado}" con tendencia de asistencia ${tendenciaAsistencia.tendencia} y notas ${tendenciaNotas.tendencia}.`;
  } else {
    nivel = "bajo";
    razon = `Riesgo bajo: Desempeño favorable con estado "${estado}" y tendencias estables o positivas.`;
  }

  return {
    nivel,
    score,
    razon,
    factores: {
      estadoAcademico: estado,
      tendenciaAsistencia: tendenciaAsistencia.tendencia,
      tendenciaNotas: tendenciaNotas.tendencia,
      asistenciaActual: asistencia,
      promedio,
    },
  };
}

/**
 * Función auxiliar para parsear números con coma decimal
 */
function parseNumeroFlexible(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor === "number") return Number.isNaN(valor) ? null : valor;
  const str = String(valor).trim().replace(",", ".");
  const num = parseFloat(str);
  return Number.isNaN(num) ? null : num;
}

/**
 * 5. Analiza un alumno individual y extrae diferencias exactas entre CSV y Firestore
 */
export function analizarAlumno(alumno: Alumno, csvRecord?: Record<string, any>): AnalisisAcademico {
  const tendenciaAsistencia = calcularTendenciaAsistencia(alumno);
  const tendenciaNotas = calcularTendenciaNotas(alumno);
  const scoreRiesgo = calcularScoreRiesgo(alumno, tendenciaAsistencia, tendenciaNotas);

  const cambiosDesdeCSV: AnalisisAcademico["cambiosDesdeCSV"] = {};

  if (csvRecord) {
    // Comparar promedio (Nota_Final en CSV vs promedio en Firestore)
    const rawCSVNota = csvRecord.Nota_Final || csvRecord.nota_final || csvRecord.promedio;
    const promedioCSV = parseNumeroFlexible(rawCSVNota);
    const promedioFS = Number(alumno.promedio) || 0;

    if (promedioCSV !== null && Math.abs(promedioCSV - promedioFS) >= 0.05) {
      cambiosDesdeCSV.promedio = {
        anterior: Math.round(promedioCSV * 10) / 10,
        actual: Math.round(promedioFS * 10) / 10,
        diferencia: Math.round((promedioFS - promedioCSV) * 100) / 100,
      };
    }

    // Comparar asistencia (Asistencia en CSV vs asistencia en Firestore)
    const rawCSVAsis = csvRecord.Asistencia || csvRecord.asistencia;
    const asistenciaCSV = parseNumeroFlexible(rawCSVAsis);
    const asistenciaFS = Number(alumno.asistencia) || 0;

    if (asistenciaCSV !== null && Math.abs(asistenciaCSV - asistenciaFS) >= 0.1) {
      cambiosDesdeCSV.asistencia = {
        anterior: Math.round(asistenciaCSV * 10) / 10,
        actual: Math.round(asistenciaFS * 10) / 10,
        diferencia: Math.round((asistenciaFS - asistenciaCSV) * 10) / 10,
      };
    }

    // Comparar estado académico (Estado_Académico en CSV vs estadoAcademico en Firestore)
    const estadoCSV = (
      csvRecord.Estado_Académico ||
      csvRecord.Estado_Academico ||
      csvRecord.estadoAcademico ||
      ""
    ).trim();
    const estadoFS = (alumno.estadoAcademico || "").trim();

    if (estadoCSV && estadoFS && estadoCSV.toLowerCase() !== estadoFS.toLowerCase()) {
      cambiosDesdeCSV.estadoAcademico = {
        anterior: estadoCSV,
        actual: estadoFS,
      };
    }
  }

  return {
    alumnoId: alumno.id,
    nombre: alumno.nombre,
    tendenciaAsistencia,
    tendenciaNotas,
    scoreRiesgo,
    cambiosDesdeCSV,
  };
}

/**
 * 4. Analiza grupos demográficos por conectividad, situacionLaboral y rangoEtario
 * y detecta qué grupos tienen peor desempeño.
 */
export function analizarGruposDemograficos(alumnos: Alumno[]): AnalisisGrupoDemografico {
  const conectividadStats: Record<string, EstadisticasGrupo> = {};
  const situacionStats: Record<string, EstadisticasGrupo> = {};
  const etarioStats: Record<string, EstadisticasGrupo> = {};

  for (const alumno of alumnos) {
    const asistencia = Number(alumno.asistencia) || 0;
    const promedio = Number(alumno.promedio) || 0;

    const tendenciaAsistencia = calcularTendenciaAsistencia(alumno);
    const tendenciaNotas = calcularTendenciaNotas(alumno);
    const scoreRiesgo = calcularScoreRiesgo(alumno, tendenciaAsistencia, tendenciaNotas);
    const tieneRiesgo = scoreRiesgo.nivel !== "bajo" ? 1 : 0;

    // Conectividad
    const rawCon = alumno.conectividad || alumno.Conectividad_Hogar || "No especificada";
    const conectividad =
      rawCon === "Si" || rawCon === "true" || rawCon === "Alta"
        ? "Con Conectividad"
        : rawCon === "No" || rawCon === "false" || rawCon === "Baja"
        ? "Sin Conectividad"
        : rawCon;

    if (!conectividadStats[conectividad]) {
      conectividadStats[conectividad] = {
        asistenciaPromedio: 0,
        notaPromedia: 0,
        cantidadAlumnos: 0,
        alumnosConRiesgo: 0,
        pctRiesgo: 0,
      };
    }
    conectividadStats[conectividad].asistenciaPromedio += asistencia;
    conectividadStats[conectividad].notaPromedia += promedio;
    conectividadStats[conectividad].cantidadAlumnos++;
    conectividadStats[conectividad].alumnosConRiesgo += tieneRiesgo;

    // Situación laboral
    const situacion = (alumno.situacionLaboral || "No especificada").trim() || "No especificada";
    if (!situacionStats[situacion]) {
      situacionStats[situacion] = {
        asistenciaPromedio: 0,
        notaPromedia: 0,
        cantidadAlumnos: 0,
        alumnosConRiesgo: 0,
        pctRiesgo: 0,
      };
    }
    situacionStats[situacion].asistenciaPromedio += asistencia;
    situacionStats[situacion].notaPromedia += promedio;
    situacionStats[situacion].cantidadAlumnos++;
    situacionStats[situacion].alumnosConRiesgo += tieneRiesgo;

    // Rango etario
    const etario = (alumno.rangoEtario || alumno.Rango_Etario || "No especificado").trim() || "No especificado";
    if (!etarioStats[etario]) {
      etarioStats[etario] = {
        asistenciaPromedio: 0,
        notaPromedia: 0,
        cantidadAlumnos: 0,
        alumnosConRiesgo: 0,
        pctRiesgo: 0,
      };
    }
    etarioStats[etario].asistenciaPromedio += asistencia;
    etarioStats[etario].notaPromedia += promedio;
    etarioStats[etario].cantidadAlumnos++;
    etarioStats[etario].alumnosConRiesgo += tieneRiesgo;
  }

  // Calcular promedios e identificar los peores grupos
  const procesarStats = (
    stats: Record<string, EstadisticasGrupo>
  ): { peorAsistenciaKey?: string; peorNotaKey?: string; peorRiesgoKey?: string } => {
    let minAsistencia = Infinity;
    let minNota = Infinity;
    let maxRiesgo = -1;
    let peorAsistenciaKey: string | undefined;
    let peorNotaKey: string | undefined;
    let peorRiesgoKey: string | undefined;

    for (const key in stats) {
      const g = stats[key];
      if (g.cantidadAlumnos > 0) {
        g.asistenciaPromedio = Math.round((g.asistenciaPromedio / g.cantidadAlumnos) * 10) / 10;
        g.notaPromedia = Math.round((g.notaPromedia / g.cantidadAlumnos) * 10) / 10;
        g.pctRiesgo = Math.round((g.alumnosConRiesgo / g.cantidadAlumnos) * 100);

        if (g.asistenciaPromedio < minAsistencia) {
          minAsistencia = g.asistenciaPromedio;
          peorAsistenciaKey = key;
        }
        if (g.notaPromedia < minNota) {
          minNota = g.notaPromedia;
          peorNotaKey = key;
        }
        if (g.pctRiesgo > maxRiesgo) {
          maxRiesgo = g.pctRiesgo;
          peorRiesgoKey = key;
        }
      }
    }

    if (peorAsistenciaKey && stats[peorAsistenciaKey]) stats[peorAsistenciaKey].esPeorAsistencia = true;
    if (peorNotaKey && stats[peorNotaKey]) stats[peorNotaKey].esPeorNota = true;
    if (peorRiesgoKey && stats[peorRiesgoKey]) stats[peorRiesgoKey].esMayorRiesgo = true;

    return { peorAsistenciaKey, peorNotaKey, peorRiesgoKey };
  };

  const peorCon = procesarStats(conectividadStats);
  const peorSit = procesarStats(situacionStats);
  const peorEt = procesarStats(etarioStats);

  return {
    conectividad: conectividadStats,
    situacionLaboral: situacionStats,
    rangoEtario: etarioStats,
    resumenPeorDesempeno: {
      conectividadMasCritica: peorCon.peorRiesgoKey || peorCon.peorNotaKey,
      situacionLaboralMasCritica: peorSit.peorRiesgoKey || peorSit.peorNotaKey,
      rangoEtarioMasCritico: peorEt.peorRiesgoKey || peorEt.peorNotaKey,
    },
  };
}

/**
 * Procesa resultados de comparación con análisis académico
 */
export function procesarComparacionConAnalisis(
  items: ComparisonItem[],
  alumnos: Alumno[]
): {
  analisisIndividual: AnalisisAcademico[];
  analisisGrupos: AnalisisGrupoDemografico;
  resumenRiesgo: {
    totalAlumnos: number;
    riesgoAlto: number;
    riesgoMedio: number;
    riesgoBajo: number;
    pctRiesgoAlto: number;
  };
} {
  const analisisIndividual: AnalisisAcademico[] = [];

  for (const item of items) {
    if (item.firebaseRecord) {
      const analisis = analizarAlumno(item.firebaseRecord as Alumno, item.csvRecord || undefined);
      analisisIndividual.push(analisis);
    }
  }

  const analisisGrupos = analizarGruposDemograficos(alumnos);

  const riesgoAlto = analisisIndividual.filter((a) => a.scoreRiesgo.nivel === "alto").length;
  const riesgoMedio = analisisIndividual.filter((a) => a.scoreRiesgo.nivel === "medio").length;
  const riesgoBajo = analisisIndividual.filter((a) => a.scoreRiesgo.nivel === "bajo").length;
  const totalAlumnos = analisisIndividual.length;

  return {
    analisisIndividual,
    analisisGrupos,
    resumenRiesgo: {
      totalAlumnos,
      riesgoAlto,
      riesgoMedio,
      riesgoBajo,
      pctRiesgoAlto: totalAlumnos > 0 ? Math.round((riesgoAlto / totalAlumnos) * 100) : 0,
    },
  };
}
