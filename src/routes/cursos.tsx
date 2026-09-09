import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Shell, StaggerGroup, StaggerItem, FadeIn } from "@/components/Shell";
import { porCurso } from "@/lib/mock-data";
import { useAlumnos } from "../hooks/useAlumnos";

export const Route = createFileRoute("/cursos")({
  head: () => ({
    meta: [
      { title: "Cursos — SENATI Gestión Docente" },
      { name: "description", content: "Indicadores por curso: alumnos, aptitud, promedio y asistencia media." },
      { property: "og:title", content: "Cursos — SENATI Gestión Docente" },
      { property: "og:description", content: "Comparativa académica entre tus cursos asignados." },
    ],
  }),
  component: Cursos,
});

function Cursos() {
  const { alumnos, loading } = useAlumnos();

  if (loading) {
    return (
      <Shell title="Cursos" subtitle="Cargando datos en tiempo real...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">
            Cargando registros desde Firebase Firestore...
          </p>
        </div>
      </Shell>
    );
  }

  const cursos = porCurso(alumnos).map((c) => ({ ...c, corto: c.curso.split(" ")[0] }));

  return (
    <Shell title="Cursos" subtitle="Comparativa de rendimiento entre los cursos que dictas.">
      <FadeIn>
        <Card className="mb-6">
          <h2 className="text-sm font-semibold tracking-tight text-white">Promedio y asistencia por curso</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cursos}>
                <defs>
                  <linearGradient id="gradAsistenciaCursos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPromedioCursos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="corto" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#181b26",
                    border: "1px solid rgba(51,65,85,0.6)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff", marginBottom: 4, fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="asistencia"
                  name="Asistencia %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gradAsistenciaCursos)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="promedio"
                  name="Promedio"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#gradPromedioCursos)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </FadeIn>

      <StaggerGroup className="grid gap-4 md:grid-cols-2">
        {cursos.map((c) => {
          const pct = Math.round((c.aptos / c.alumnos) * 100);
          return (
            <StaggerItem key={c.curso}>
              <Card interactive className="h-full">
                <h2 className="text-base font-semibold tracking-tight text-white">{c.curso}</h2>
                <p className="mt-1 text-xs text-slate-400">{c.alumnos} alumnos matriculados</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/6 bg-white/5 p-3">
                    <p className="text-xs text-slate-400">Promedio</p>
                    <p className="text-lg font-bold text-white">{c.promedio}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                    <p className="text-xs text-cyan-400">Asistencia</p>
                    <p className="text-lg font-bold text-cyan-400">{c.asistencia}%</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-400">Aptos</p>
                    <p className="text-lg font-bold text-emerald-400">{pct}%</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {c.aptos} aptos · {c.alumnos - c.aptos} no aptos para rendir examen
                </p>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </Shell>
  );
}
