// Servidor Node.js de datos mock (sin base de datos real, solo lectura).
// Ejecutar con: npm run mock:server  ->  http://localhost:4000/api/alumnos
import { createServer } from "node:http";

const CURSOS = [
  "Diseño y Desarrollo de Software",
  "Electrónica Industrial",
  "Mecánica Automotriz",
  "Administración Industrial",
];

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
];

const UNIDADES = ["Unidad I", "Unidad II", "Unidad III", "Unidad IV"];

function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const ALUMNOS = NOMBRES.map((nombre, i) => {
  const rnd = seeded(i + 7);
  const curso = CURSOS[i % CURSOS.length];
  const notas = [curso, "Comunicación Efectiva", "Matemática Aplicada"].flatMap((c) =>
    UNIDADES.map((u) => ({ curso: c, unidad: u, nota: Math.max(6, Math.min(20, Math.round(10 + rnd() * 10))) })),
  );
  const historialAsistencia = Array.from({ length: 8 }, (_, w) => ({
    semana: `S${w + 1}`,
    porcentaje: Math.max(45, Math.min(100, Math.round(65 + rnd() * 40))),
  }));
  const asistencia = Math.round(
    historialAsistencia.reduce((a, b) => a + b.porcentaje, 0) / historialAsistencia.length,
  );
  return {
    id: String(i + 1),
    nombre,
    dni: String(70000000 + i * 137711).slice(0, 8),
    curso,
    promedio: Number((notas.reduce((a, b) => a + b.nota, 0) / notas.length).toFixed(1)),
    asistencia,
    apto: asistencia >= 80,
    notas,
    historialAsistencia,
  };
});

const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data, null, 2));
};

const PORT = process.env.PORT || 4000;

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/alumnos") return json(res, 200, ALUMNOS);

  if (url.pathname.startsWith("/api/alumnos/")) {
    const alumno = ALUMNOS.find((a) => a.id === url.pathname.split("/").pop());
    return alumno ? json(res, 200, alumno) : json(res, 404, { error: "Alumno no encontrado" });
  }

  if (url.pathname === "/api/resumen") {
    const aptos = ALUMNOS.filter((a) => a.apto).length;
    return json(res, 200, {
      total: ALUMNOS.length,
      aptos,
      noAptos: ALUMNOS.length - aptos,
      promedioGeneral: Number(
        (ALUMNOS.reduce((s, a) => s + a.promedio, 0) / ALUMNOS.length).toFixed(1),
      ),
    });
  }

  json(res, 404, { error: "Ruta no encontrada" });
}).listen(PORT, () => console.log(`Mock API en http://localhost:${PORT}/api/alumnos`));
