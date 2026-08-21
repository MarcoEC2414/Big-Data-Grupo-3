# SENATI Gestión Docente

CRM académico interno para **docentes**: visualiza alumnos, notas, asistencia y determina automáticamente quién está **apto para rendir examen** (regla: asistencia ≥ 80%).

- Solo lectura: **no existe CRUD** (no se crea, edita ni elimina información desde la interfaz).
- Todos los datos son **mock** (falsos) generados de forma determinista.
- No depende de ningún servicio en la nube: corre 100% en local.

## Stack

- Frontend: React 19 + TanStack Start (Vite) + Tailwind CSS + Recharts
- Backend mock: servidor Node.js nativo (`server/mock-server.mjs`) que sirve JSON

## Requisitos

- Node.js 20 o superior

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:8080

### Servidor Node.js con datos mock (opcional)

```bash
npm run mock:server
```

Endpoints disponibles en http://localhost:4000

| Método | Ruta                | Descripción                     |
| ------ | ------------------- | ------------------------------- |
| GET    | `/api/alumnos`      | Lista de alumnos                |
| GET    | `/api/alumnos/:id`  | Detalle de un alumno            |
| GET    | `/api/resumen`      | Estadísticas generales del aula |

> La app funciona sin este servidor: el frontend usa los mocks de `src/lib/mock-data.ts`. El servidor Node existe para demostrar la capa backend.

## Acceso (login simulado)

La pantalla de inicio de sesión acepta **cualquier usuario y contraseña**. También hay pantallas de *Crear cuenta* y *¿Olvidaste tu contraseña?* con flujo visual completo, sin validación real.

## Pantallas

- `/` Iniciar sesión · `/registro` · `/recuperar`
- `/dashboard` KPIs, dona de aptos vs no aptos y alumnos con menor asistencia
- `/alumnos` listado con búsqueda (nombre/DNI) y filtros por curso y aptitud
- `/alumnos/:id` ficha de solo lectura con notas, historial de asistencia y gráficos
- `/cursos` indicadores por curso
- `/reportes` estadísticas generales y alumnos en riesgo

## Regla de negocio

```
asistencia >= 80%  ->  Apto para rendir examen      (verde #45c1ad)
asistencia <  80%  ->  No apto para rendir examen   (rosa  #fa345e)
```

## Build de producción

```bash
npm run build
npm run preview
```
