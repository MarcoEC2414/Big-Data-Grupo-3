import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Card, Shell, FadeIn } from "@/components/Shell";
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

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

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
    "rounded-lg border border-white/10 bg-[#0d0f16] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-purple-500/50";

  if (loading) {
    return (
      <Shell title="Alumnos" subtitle="Cargando listado completo desde Firebase...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">
            Cargando 3,998 registros desde Firestore...
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Alumnos" subtitle="Consulta de solo lectura. Usa los filtros para segmentar tu aula.">
      <FadeIn>
        <Card>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o DNI…"
                className="w-full rounded-lg border border-white/10 bg-[#0d0f16] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-purple-500/50"
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
      </FadeIn>

      <p className="mt-4 text-sm text-slate-400">{filtrados.length} alumnos encontrados</p>

      <FadeIn delay={0.08}>
        <Card className="mt-3 overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-white/5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Alumno</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Promedio</th>
                <th className="px-5 py-3">Asistencia</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {filtrados.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-purple-500/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-slate-300">
                        {iniciales(a.nombre)}
                      </span>
                      <div>
                        <Link
                          to="/alumnos/$id"
                          params={{ id: a.id }}
                          className="text-sm font-semibold text-white hover:text-purple-400"
                        >
                          {a.nombre}
                        </Link>
                        <p className="text-xs text-slate-500">
                          DNI {a.dni} · Sección {a.seccion}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{a.curso}</td>
                  <td className="px-5 py-4 text-sm font-bold text-white">{a.promedio}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-white/5">
                        <div
                          className={`h-1.5 rounded-full ${esApto(a) ? "bg-emerald-400" : "bg-rose-400"}`}
                          style={{ width: `${Math.min(a.asistencia, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">{a.asistencia}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge apto={esApto(a)} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/alumnos/$id"
                      params={{ id: a.id }}
                      className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400 transition-colors hover:bg-purple-500/20"
                    >
                      Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </FadeIn>
    </Shell>
  );
}
