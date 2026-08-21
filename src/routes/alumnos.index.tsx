import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Card, Shell } from "@/components/Shell";
import { LISTA_CURSOS, esApto } from "@/lib/mock-data";
import { useAlumnos } from "../hooks/useAlumnos";

export const Route = createFileRoute("/alumnos/")({
  head: () => ({
    meta: [
      { title: "Alumnos — SENATI Gestión Docente" },
      {
        name: "description",
        content: "Listado de alumnos con búsqueda y filtros por curso y aptitud para rendir examen.",
      },
      { property: "og:title", content: "Alumnos — SENATI Gestión Docente" },
      { property: "og:description", content: "Filtra alumnos por nombre, curso y estado de aptitud." },
    ],
  }),
  component: Alumnos,
});

function Alumnos() {
  const { alumnos, loading } = useAlumnos();
  const [q, setQ] = useState("");
  const [curso, setCurso] = useState("todos");
  const [estado, setEstado] = useState("todos");

  const filtrados = useMemo(
    () =>
      alumnos.filter((a) => {
        const coincide = `${a.nombre} ${a.dni}`.toLowerCase().includes(q.toLowerCase());
        const cursoOk = curso === "todos" || a.curso === curso;
        const estadoOk =
          estado === "todos" || (estado === "aptos" ? esApto(a) : !esApto(a));
        return coincide && cursoOk && estadoOk;
      }),
    [alumnos, q, curso, estado],
  );

  const select =
    "rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-primary";

  if (loading) {
    return (
      <Shell title="Alumnos" subtitle="Cargando listado completo desde Firebase...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-muted-foreground">
            Cargando 3,998 registros desde Firestore...
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Alumnos" subtitle="Consulta de solo lectura. Usa los filtros para segmentar tu aula.">
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o DNI…"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select value={curso} onChange={(e) => setCurso(e.target.value)} className={select}>
            <option value="todos">Todos los cursos</option>
            {LISTA_CURSOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={select}>
            <option value="todos">Toda aptitud</option>
            <option value="aptos">Solo aptos</option>
            <option value="noaptos">Solo no aptos</option>
          </select>
        </div>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">{filtrados.length} alumnos encontrados</p>

      <Card className="mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-surface text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Alumno</th>
              <th className="px-5 py-3">Curso</th>
              <th className="px-5 py-3">Promedio</th>
              <th className="px-5 py-3">Asistencia</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((a) => (
              <tr key={a.id} className="transition hover:bg-surface">
                <td className="px-5 py-4">
                  <Link to="/alumnos/$id" params={{ id: a.id }} className="text-sm font-semibold text-foreground hover:text-primary">
                    {a.nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">DNI {a.dni} · Sección {a.seccion}</p>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{a.curso}</td>
                <td className="px-5 py-4 text-sm font-bold text-foreground">{a.promedio}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-surface">
                      <div
                        className={`h-1.5 rounded-full ${esApto(a) ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${Math.min(a.asistencia, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{a.asistencia}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge apto={esApto(a)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}