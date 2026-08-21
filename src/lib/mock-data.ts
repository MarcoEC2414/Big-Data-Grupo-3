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
  notas: Nota[];
  historialAsistencia: Asistencia[];
  correo: string;
};

const CURSOS = [
  "Diseño y Desarrollo de Software",
  "Electrónica Industrial",
  "Mecánica Automotriz",
  "Administración Industrial",
] as const;

const NOMBRES = [
  "Ana Lucía Quispe Ramos",
  "Carlos Andrés Huamán Ríos",
  "María Fernanda Ccama Soto",
  "Jorge Luis Vargas Medina",
  "Rosa Elena Mamani Flores",
  "Diego Alonso Paredes Cruz",
  "Katherine Rojas Chávez",
  "Luis Enrique Salazar Ponce",
  "Milagros Yataco Espinoza",
  "Renzo Alberto Ticona Peña",
  "Sofía Beatriz Cárdenas Loayza",
  "Brayan Steven Ordoñez Ruiz",
  "Gabriela Nicole Aguirre Tello",
  "Manuel Antonio Zegarra Lipa",
  "Valeria Antonella Bustos Ríos",
  "Kevin Josué Alvarado Núñez",
  "Patricia del Carmen Ríos Ayala",
  "Sebastián Rodrigo Guzmán Melo",
  "Fiorella Milena Castro Yupanqui",
  "Álvaro Nicolás Bravo Ferreyra",
  "Camila Andrea Sánchez Peralta",
  "Nataly Rocío Ccopa Huanca",
  "Marco Antonio Delgado Chirinos",
  "Jean Pierre Cabrera Ascue",
];

const UNIDADES = ["Unidad I", "Unidad II", "Unidad III", "Unidad IV"];

// Generador determinista (mismos datos en servidor y cliente).
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function build(): Alumno[] {
  return NOMBRES.map((nombre, i) => {
    const rnd = seeded(i + 7);
    const curso: string = CURSOS[i % CURSOS.length]!;
    const cursosDelAlumno = [curso, "Comunicación Efectiva", "Matemática Aplicada"];

    const notas: Nota[] = cursosDelAlumno.flatMap((c) =>
      UNIDADES.map((u) => ({
        curso: c,
        unidad: u,
        nota: Math.max(6, Math.min(20, Math.round(10 + rnd() * 10))),
      })),
    );

    const historialAsistencia: Asistencia[] = Array.from({ length: 8 }, (_, w) => ({
      semana: `S${w + 1}`,
      porcentaje: Math.max(45, Math.min(100, Math.round(65 + rnd() * 40))),
    }));

    const asistencia = Math.round(
      historialAsistencia.reduce((a, b) => a + b.porcentaje, 0) / historialAsistencia.length,
    );
    const promedio = Number((notas.reduce((a, b) => a + b.nota, 0) / notas.length).toFixed(1));

    return {
      id: String(i + 1),
      nombre,
      dni: String(70000000 + i * 137711).slice(0, 8),
      curso,
      seccion: `${["A", "B", "C"][i % 3]}-${2026}`,
      promedio,
      asistencia,
      notas,
      historialAsistencia,
      correo: `${nombre.split(" ")[0]!.toLowerCase()}.${nombre.split(" ").pop()!.toLowerCase()}@senati.pe`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    };
  });
}

export const ALUMNOS: Alumno[] = build();
export const LISTA_CURSOS = [...new Set(ALUMNOS.map((a) => a.curso))];

export const esApto = (a: Alumno) => a.asistencia >= 80;

export function resumen() {
  const total = ALUMNOS.length;
  const aptos = ALUMNOS.filter(esApto).length;
  return {
    total,
    aptos,
    noAptos: total - aptos,
    pctAptos: Math.round((aptos / total) * 100),
    promedioGeneral: Number(
      (ALUMNOS.reduce((s, a) => s + a.promedio, 0) / total).toFixed(1),
    ),
    asistenciaPromedio: Math.round(
      ALUMNOS.reduce((s, a) => s + a.asistencia, 0) / total,
    ),
  };
}

export function porCurso() {
  return LISTA_CURSOS.map((curso) => {
    const grupo = ALUMNOS.filter((a) => a.curso === curso);
    return {
      curso,
      alumnos: grupo.length,
      aptos: grupo.filter(esApto).length,
      promedio: Number((grupo.reduce((s, a) => s + a.promedio, 0) / grupo.length).toFixed(1)),
      asistencia: Math.round(grupo.reduce((s, a) => s + a.asistencia, 0) / grupo.length),
    };
  });
}
