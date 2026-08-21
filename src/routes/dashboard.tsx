import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, CheckCircle2, AlertTriangle, GaugeCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge, Card, Shell } from "@/components/Shell";
import { ALUMNOS, esApto, resumen } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard docente — SENATI Gestión Docente" },
      {
        name: "description",
        content:
          "Resumen de alumnos, promedios y asistencia con detección automática de aptitud para rendir examen.",
      },
      { property: "og:title", content: "Dashboard docente — SENATI Gestión Docente" },
      { property: "og:description", content: "Estadísticas de aptitud, notas y asistencia por alumno." },
    ],
  }),
  component: Dashboard,
});

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function Dashboard() {
  const r = resumen();
  const data = [
    { name: "Aptos", value: r.aptos, color: "#45c1ad" },
    { name: "No aptos", value: r.noAptos, color: "#fa345e" },
  ];
  const recientes = [...ALUMNOS].sort((a, b) => a.asistencia - b.asistencia).slice(0, 8);

  return (
    <Shell title="Dashboard" subtitle="Estado académico general de tus alumnos en el periodo 2026-I.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Total alumnos" value={String(r.total)} hint="Matriculados en tus secciones" />
        <Kpi icon={CheckCircle2} label="Aptos" value={`${r.pctAptos}%`} hint={`${r.aptos} alumnos con 80% o más de asistencia`} />
        <Kpi icon={AlertTriangle} label="No aptos" value={String(r.noAptos)} hint="Requieren recuperar asistencia" />
        <Kpi icon={GaugeCircle} label="Promedio general" value={String(r.promedioGeneral)} hint="Escala vigesimal (0 - 20)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="text-sm font-bold text-foreground">Aptos vs no aptos</h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} isAnimationActive={false}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Asistencia promedio del aula: {r.asistenciaPromedio}%
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Alumnos con menor asistencia</h2>
            <Link to="/alumnos" className="text-sm font-semibold text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {recientes.map((a) => (
              <Link
                key={a.id}
                to="/alumnos/$id"
                params={{ id: a.id }}
                className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.curso} · Promedio {a.promedio} · Asistencia {a.asistencia}%
                  </p>
                </div>
                <Badge apto={esApto(a)} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
