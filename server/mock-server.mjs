// Servidor Node.js de datos mock (sin base de datos real, solo lectura/memoria).
// Ejecutar con: npm run mock:server  ->  http://localhost:4000/api/alumnos
import { createServer } from "node:http";

// --- BASE DE DATOS FICTICIA PARA AUTENTICACIÓN ---
const USUARIOS = [
  {
    id: "usr-1",
    nombre: "Usuario Demo",
    email: "admin@senati.pe",
    password: "123", // En un entorno real debe ir encriptada
    rol: "Administrador",
  },
];

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

// Helper para responder en JSON y habilitar CORS
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data, null, 2));
};

// Helper para parsear el cuerpo JSON de peticiones POST
const getRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
};

const PORT = process.env.PORT || 4000;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Manejar Pre-flight CORS (Navegador)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  // --- RUTAS DE AUTENTICACIÓN ---

  // POST /api/login -> Iniciar sesión
  if (req.method === "POST" && url.pathname === "/api/login") {
    try {
      const { email, password } = await getRequestBody(req);

      if (!email || !password) {
        return json(res, 400, { error: "Correo y contraseña son obligatorios." });
      }

      const usuario = USUARIOS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!usuario) {
        return json(res, 401, { error: "Credenciales incorrectas." });
      }

      const { password: _, ...userData } = usuario;
      return json(res, 200, {
        message: "Inicio de sesión exitoso",
        token: `mock-jwt-token-${usuario.id}-${Date.now()}`,
        user: userData,
      });
    } catch {
      return json(res, 400, { error: "Formato JSON inválido." });
    }
  }

  // POST /api/register -> Registrar nuevo usuario
  if (req.method === "POST" && url.pathname === "/api/register") {
    try {
      const { nombre, email, password } = await getRequestBody(req);

      if (!nombre || !email || !password) {
        return json(res, 400, { error: "Todos los campos (nombre, email, password) son obligatorios." });
      }

      const existe = USUARIOS.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existe) {
        return json(res, 400, { error: "El correo electrónico ya se encuentra registrado." });
      }

      const nuevoUsuario = {
        id: `usr-${USUARIOS.length + 1}`,
        nombre,
        email,
        password,
        rol: "Estudiante",
      };

      USUARIOS.push(nuevoUsuario);

      const { password: _, ...userData } = nuevoUsuario;
      return json(res, 201, {
        message: "Registro exitoso.",
        token: `mock-jwt-token-${nuevoUsuario.id}-${Date.now()}`,
        user: userData,
      });
    } catch {
      return json(res, 400, { error: "Formato JSON inválido." });
    }
  }

  // GET /api/me -> Verificar sesión actual
  if (req.method === "GET" && url.pathname === "/api/me") {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json(res, 401, { error: "No autorizado. Token no proporcionado." });
    }
    return json(res, 200, { message: "Token válido", user: USUARIOS[0] });
  }

  // --- RUTAS DE ALUMNOS Y RESUMEN ---

  if (req.method === "GET" && url.pathname === "/api/alumnos") {
    return json(res, 200, ALUMNOS);
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/alumnos/")) {
    const alumno = ALUMNOS.find((a) => a.id === url.pathname.split("/").pop());
    return alumno ? json(res, 200, alumno) : json(res, 404, { error: "Alumno no encontrado" });
  }

  if (req.method === "GET" && url.pathname === "/api/resumen") {
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
}).listen(PORT, () => console.log(`Mock API corriendo en http://localhost:${PORT}/api/alumnos`));