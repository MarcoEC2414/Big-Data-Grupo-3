import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, CheckCircle2, XCircle, GaugeCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge, Card, Shell, StaggerGroup, StaggerItem, FadeIn } from "@/components/Shell";
import { esApto, porCurso, calcularResumen } from "@/lib/mock-data";
import { useAlumnos } from "../hooks/useAlumnos";

export const Route = createFileRoute("/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes — SENATI Gestión Docente" },
      { name: "description", content: "Panel de estadísticas: aptitud de examen, promedios y asistencia por curso." },
      { property: "og:title", content: "Reportes — SENATI Gestión Docente" },
      { property: "og:description", content: "Estadísticas consolidadas del aula docente." },
    ],
  }),
  component: Reportes,
});

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#181b26",
    border: "1px solid rgba(51,65,85,0.6)",
    borderRadius: "12px",
    color: "#fff",
  },
  itemStyle: { color: "#fff" },
  labelStyle: { color: "#fff", marginBottom: 4, fontWeight: 600 },
};

function TrendPill({ delta }: { delta: number }) {
  const positivo = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        positivo ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
      }`}
    >
      {positivo ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positivo ? "+" : ""}
      {delta}%
    </span>
  );
}

function Reportes() {
  const { alumnos, loading } = useAlumnos();

  if (loading) {
    return (
      <Shell title="Reportes" subtitle="Cargando reportes en tiempo real...">
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">
            Cargando registros desde Firebase Firestore...
          </p>
        </div>
      </Shell>
    );
  }

  const r = calcularResumen(alumnos);
  const cursos = porCurso(alumnos).map((c) => ({ ...c, corto: c.curso.split(" ")[0] }));
  const pie = [
    { name: "Aptos", value: r.aptos, color: "#a855f7" },
    { name: "No aptos", value: r.noAptos, color: "#334155" },
  ];
  const enRiesgo = alumnos.filter((a) => !esApto(a)).sort((a, b) => a.asistencia - b.asistencia);

  const kpis = [
    { icon: Users, label: "Total alumnos", value: String(r.total), delta: r.total > 0 ? 100 : 0, hint: "Matriculados" },
    { icon: CheckCircle2, label: "% Aptos", value: `${r.pctAptos}%`, delta: r.pctAptos - 75, hint: "vs. objetivo 75%" },
    { icon: XCircle, label: "% No aptos", value: `${100 - r.pctAptos}%`, delta: -(100 - r.pctAptos - 25), hint: "vs. objetivo 25%" },
    { icon: GaugeCircle, label: "Promedio general", value: String(r.promedioGeneral), delta: Number((r.promedioGeneral - 10.5).toFixed(1)), hint: "vs. nota mínima" },
  ];

  return (
    <Shell title="Reportes" subtitle="Resumen general del periodo y alumnos en riesgo académico.">
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <StaggerItem key={k.label}>
            <Card interactive>
              <div className="flex items-start justify-between">
                <span className="flex items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-purple-400">
                  <k.icon className="h-5 w-5" />
                </span>
                <TrendPill delta={k.delta} />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-white">{k.value}</p>
              <p className="mt-2 text-xs text-slate-500">{k.hint}</p>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <h2 className="text-sm font-semibold tracking-tight text-white">Distribución de aptitud</h2>
            <div className="mt-4 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    isAnimationActive={true}
                    animationDuration={1000}
                    stroke="none"
                  >
                    {pie.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.16} className="lg:col-span-2">
          <Card className="h-full">
            <h2 className="text-sm font-semibold tracking-tight text-white">Promedio y asistencia por curso</h2>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cursos}>
                  <defs>
                    <linearGradient id="gradAsistencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPromedio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="corto" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="asistencia"
                    name="Asistencia %"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#gradAsistencia)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    dataKey="promedio"
                    name="Promedio"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#gradPromedio)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.22}>
        <Card className="mt-6">
          <h2 className="text-sm font-semibold tracking-tight text-white">Alumnos no aptos para rendir examen</h2>
          <div className="mt-3 divide-y divide-white/6">
            {enRiesgo.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-slate-300">
                    {a.nombre
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {a.curso} · Asistencia {a.asistencia}% (faltan {80 - a.asistencia} puntos)
                    </p>
                  </div>
                </div>
                <Badge apto={false} />
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </Shell>
  );
}
