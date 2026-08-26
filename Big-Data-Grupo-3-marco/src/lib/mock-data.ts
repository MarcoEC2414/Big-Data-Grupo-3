import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export type Nota = { curso: string; unidad: string; nota: number };
export type Asistencia = { semana: string; porcentaje: number };

export type Alumno = {
  id: string;
  nombre: string;
  dni: string;
  curso: string;
  seccion: string;
  promedio: number;
  asistencia: number;
  notas?: Nota[];
  historialAsistencia?: Asistencia[];
  correo: string;
  
  // Campos del CSV
  Ciudad?: string;
  Rango_Etario?: string;
  Conectividad_Hogar?: string;
  Nivel_Riesgo?: string;
  
  // Campos adicionales en camelCase
  sexo?: string;
  situacionLaboral?: string;
  nivelEducativo?: string;
  conectividad?: string;
  rangoEtario?: string;
  estadoAcademico?: string;
};

export const LISTA_CURSOS = ["Análisis de Datos / Big Data"];

// Función asíncrona para obtener los registros de Firestore
export async function getAlumnosFirebase(): Promise<Alumno[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "alumnos"));
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const docId = doc.id;
      
      const promedio = typeof data.promedio === "number" ? data.promedio : Number(data.promedio) || 0;
      const asistencia = typeof data.asistencia === "number" ? data.asistencia : Number(data.asistencia) || 0;
      const notas = data.notas || [];
      const historialAsistencia = data.historialAsistencia || [];
      
      return {
        id: docId,
        nombre: data.nombre || `Estudiante ${docId}`,
        dni: data.dni || docId,
        curso: data.curso || "Análisis de Datos / Big Data",
        seccion: data.seccion || data.rangoEtario || "General",
        promedio: Number(promedio.toFixed(1)),
        asistencia: Number(asistencia.toFixed(1)),
        correo: data.correo || `estudiante.${docId}@senati.pe`,
        
        // Mapeo flexible para campos originales y formateados
        Ciudad: data.ciudad || data.Ciudad || "Sin especificar",
        Rango_Etario: data.rangoEtario || data.Rango_Etario || "General",
        Conectividad_Hogar: data.conectividad || data.Conectividad_Hogar || "No",
        Nivel_Riesgo: asistencia < 70 ? "Alto" : "Bajo",
        
        sexo: data.sexo || "N/I",
        situacionLaboral: data.situacionLaboral || "N/A",
        nivelEducativo: data.nivelEducativo || "N/A",
        conectividad: data.conectividad || "No",
        rangoEtario: data.rangoEtario || "General",
        estadoAcademico: data.estadoAcademico || "Aprobado",
        
        notas,
        historialAsistencia
      };
    });
  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
    return [];
  }
}

// Nueva regla: Asistencia >= 70% y Promedio >= 10.5
export const esApto = (a: Alumno) => a.asistencia >= 70 && a.promedio >= 10.5;

// Utilidad para recalcular resúmenes con los datos reales
export function calcularResumen(alumnos: Alumno[]) {
  const total = alumnos.length;
  if (total === 0) return { total: 0, aptos: 0, noAptos: 0, pctAptos: 0, promedioGeneral: 0, asistenciaPromedio: 0 };
  
  const aptos = alumnos.filter(esApto).length;
  return {
    total,
    aptos,
    noAptos: total - aptos,
    pctAptos: Math.round((aptos / total) * 100),
    promedioGeneral: Number((alumnos.reduce((s, a) => s + a.promedio, 0) / total).toFixed(1)),
    asistenciaPromedio: Math.round(alumnos.reduce((s, a) => s + a.asistencia, 0) / total),
  };
}

// Compatibilidad temporal con reportes.tsx
export const resumen = () => {
  return {
    total: 0,
    aptos: 0,
    noAptos: 0,
    pctAptos: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0
  };
};

export const ALUMNOS: Alumno[] = [];

// Función para agrupar y promediar métricas por curso
export function porCurso(alumnos: Alumno[] = []): { curso: string; alumnos: number; promedio: number; asistencia: number; aptos: number }[] {
  const map = new Map<string, { curso: string; alumnos: number; promedio: number; asistencia: number; aptos: number }>();
  
  for (const a of alumnos) {
    const cursoName = a.curso || "Análisis de Datos / Big Data";
    if (!map.has(cursoName)) {
      map.set(cursoName, {
        curso: cursoName,
        alumnos: 0,
        promedio: 0,
        asistencia: 0,
        aptos: 0,
      });
    }
    const stats = map.get(cursoName)!;
    stats.alumnos++;
    stats.promedio += a.promedio;
    stats.asistencia += a.asistencia;
    if (esApto(a)) {
      stats.aptos++;
    }
  }
  
  return Array.from(map.values()).map(stats => ({
    ...stats,
    promedio: Number((stats.promedio / stats.alumnos).toFixed(1)),
    asistencia: Number((stats.asistencia / stats.alumnos).toFixed(1)),
  }));
}