import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  GaugeCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Badge, Card, Shell, StaggerGroup, StaggerItem, FadeIn } from "@/components/Shell";
import { esApto, calcularResumen } from "@/lib/mock-data";
import { useAlumnos } from "../hooks/useAlumnos";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard docente — SENATI Gestión Docente" },
      {
        name: "description",
        content:
          "Panel analítico de rendimiento y asistencia docente con sincronización Firestore.",
      },
    ],
  }),
  component: Dashboard,
});

function TrendPill({ delta, suffix = "%" }: { delta: number; suffix?: string }) {
  const positivo = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        positivo 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      }`}
    >
      {positivo ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positivo ? "+" : ""}
      {delta}
      {suffix}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  deltaLabel,
  colorScheme = "purple"
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
  delta: number;
  deltaLabel: string;
  colorScheme?: "purple" | "emerald" | "rose" | "cyan";
}) {
  const schemeClasses = {
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  };

  return (
    <Card className="relative overflow-hidden border border-white/8 bg-[#12151e]/80 backdrop-blur-xl p-5 hover:border-purple-500/30 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`flex items-center justify-center rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-105 ${schemeClasses[colorScheme]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <TrendPill delta={delta} />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
        <span>{hint}</span>
        <span className="font-medium text-slate-500">{deltaLabel}</span>
      </p>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#161a24] p-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-purple-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          Rendimiento: {payload[0].value} pts
        </p>
        {payload[1] && (
          <p className="text-sm font-bold text-cyan-400 flex items-center gap-2 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Asistencia: {payload[1].value}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

function Dashboard() {
  const { alumnos, loading } = useAlumnos();

  if (loading) {
    return (
      <Shell title="Dashboard" subtitle="Cargando métricas analíticas...">
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Sincronizando con Firebase Firestore...
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  const r = calcularResumen(alumnos);

  const timelineData = [
    { periodo: "Sem 01", promedio: 11.2, asistencia: 94 },
    { periodo: "Sem 03", promedio: 12.0, asistencia: 88 },
    { periodo: "Sem 05", promedio: 13.1, asistencia: 85 },
    { periodo: "Sem 07", promedio: 12.8, asistencia: 83 },
    { periodo: "Sem 09", promedio: 13.9, asistencia: 84 },
    { periodo: "Sem 11", promedio: 14.1, asistencia: 81 },
    { periodo: "Sem 13", promedio: 14.3, asistencia: 82 },
  ];

  const pieData = [
    { name: "Aptos", value: r.aptos, color: "#a855f7" },
    { name: "No aptos", value: r.noAptos, color: "#f43f5e" },
  ];

  const estudiantesRiesgo = [...alumnos]
    .sort((a, b) => a.asistencia - b.asistencia)
    .slice(0, 6);

  return (
    <Shell 
      title="Dashboard General" 
      subtitle="Analítica de rendimiento, retención y asistencia del periodo académico 2026-I."
    >
      {/* Barra de Acciones Globales */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">Modo Big Data Activo</span>
          <span>·</span>
          <span>{r.total} registros procesados</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-[#12151e] px-3 py-1.5 text-xs font-medium text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-purple-400" />
            <span>Ciclo 2026-I</span>
          </div>
          <button 
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Métricas</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs */}
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <Kpi
            icon={Users}
            label="Total Matriculados"
            value={String(r.total)}
            hint="Alumnos procesados"
            delta={100}
            deltaLabel="cobertura"
            colorScheme="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <Kpi
            icon={CheckCircle2}
            label="Alumnos Aptos"
            value={`${r.pctAptos}%`}
            hint={`${r.aptos} aprobados`}
            delta={Number((r.pctAptos - 75).toFixed(1))}
            deltaLabel="meta 75%"
            colorScheme="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <Kpi
            icon={AlertTriangle}
            label="En Riesgo Académico"
            value={String(r.noAptos)}
            hint="Falta de nota/asistencia"
            delta={-Number((100 - r.pctAptos).toFixed(1))}
            deltaLabel="del total"
            colorScheme="rose"
          />
        </StaggerItem>
        <StaggerItem>
          <Kpi
            icon={GaugeCircle}
            label="Promedio General"
            value={String(r.promedioGeneral)}
            hint="Escala vigesimal (0-20)"
            delta={Number((r.promedioGeneral - 10.5).toFixed(1))}
            deltaLabel="base 10.5"
            colorScheme="purple"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Grid Central: Gráfica Principal + Desglose Analítico */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Columna Izquierda/Centro (2 cols): Trend Overview */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card className="h-full border border-white/8 bg-[#12151e]/80 p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-white">Evolución de Rendimiento y Asistencia</h2>
                  <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                    Tiempo Real
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Seguimiento quincenal de promedios vs índice de concurrencia</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> Promedio
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Asistencia
                </span>
              </div>
            </div>

            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="periodo" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="promedio"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#purpleGlow)"
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Area
                    type="monotone"
                    dataKey="asistencia"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#cyanGlow)"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>

        {/* Columna Derecha (1 col): Donut de Aptitud y Resumen Compacto */}
        <FadeIn delay={0.15} className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between border border-white/8 bg-[#12151e]/80 p-6 backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Distribución de Aptitud</h2>
              <p className="text-xs text-slate-400 mt-0.5">Evaluación automática según reglamento</p>

              <div className="relative mt-4 flex h-48 items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={1000}
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Indicador central superpuesto */}
                <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black tracking-tight text-white">{r.pctAptos}%</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Aptitud</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Aptos para rendir
                  </span>
                  <span className="font-bold text-white">{r.aptos}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Inhabilitados
                  </span>
                  <span className="font-bold text-white">{r.noAptos}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/5 bg-white/3 p-3 text-xs text-slate-400">
              <p className="font-medium text-slate-300">Regla institucional:</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mínimo 70% de asistencia acumulada y promedio aprobatorio ≥ 10.5.
              </p>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Sección Inferior: Alumnos Críticos en formato estructurado */}
      <FadeIn delay={0.2} className="mt-6">
        <Card className="border border-white/8 bg-[#12151e]/80 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Alumnos que Requieren Intervención</h2>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                  Prioridad Alta
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Estudiantes con asistencia crítica por debajo del umbral mínimo</p>
            </div>
            <Link
              to="/alumnos"
              className="inline-flex items-center gap-1 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 transition-all"
            >
              Explorar los {r.total} alumnos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {estudiantesRiesgo.map((a) => {
              const apto = esApto(a);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 transition-colors hover:bg-purple-500/4 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-xs font-bold text-purple-300 shadow-inner">
                      {a.nombre
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{a.nombre}</p>
                      <p className="text-xs text-slate-400">{a.curso || "Big Data / Análisis de Datos"}</p>
                    </div>
                  </div>

                  {/* Barra de progreso de asistencia */}
                  <div className="w-48 hidden sm:block">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Asistencia:</span>
                      <span className={a.asistencia < 70 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {a.asistencia}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${a.asistencia < 70 ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(a.asistencia, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Promedio */}
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Promedio</p>
                    <p className={`text-sm font-bold ${a.promedio >= 10.5 ? "text-slate-200" : "text-rose-400"}`}>
                      {a.promedio} <span className="text-[10px] text-slate-500 font-normal">/20</span>
                    </p>
                  </div>

                  {/* Badge y Acción */}
                  <div className="flex items-center gap-3">
                    <Badge apto={apto} />
                    <Link
                      to="/alumnos/$id"
                      params={{ id: a.id }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 px-2.5 text-xs font-medium text-slate-300 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white transition-all"
                    >
                      Ficha
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </FadeIn>
    </Shell>
  );
}