import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card, Shell } from "@/components/Shell";
import { ALUMNOS, esApto, porCurso, resumen } from "@/lib/mock-data";

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

function Reportes() {
  const r = resumen();
  const cursos = porCurso().map((c) => ({ ...c, corto: c.curso.split(" ")[0] }));
  const pie = [
    { name: "Aptos", value: r.aptos, color: "#45c1ad" },
    { name: "No aptos", value: r.noAptos, color: "#fa345e" },
  ];
  const enRiesgo = ALUMNOS.filter((a) => !esApto(a)).sort((a, b) => a.asistencia - b.asistencia);

  return (
    <Shell title="Reportes" subtitle="Resumen general del periodo y alumnos en riesgo académico.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total alumnos", String(r.total)],
          ["% Aptos", `${r.pctAptos}%`],
          ["% No aptos", `${100 - r.pctAptos}%`],
          ["Promedio general", String(r.promedioGeneral)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-bold text-foreground">Distribución de aptitud</h2>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} isAnimationActive={false}>
                  {pie.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground">Promedio y asistencia por curso</h2>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cursos}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="corto" tick={{ fontSize: 11, fill: "#425b76" }} />
                <YAxis tick={{ fontSize: 11, fill: "#425b76" }} />
                <Tooltip />
                <Bar dataKey="asistencia" name="Asistencia %" fill="#425b76" radius={[6, 6, 0, 0]} />
                <Bar dataKey="promedio" name="Promedio" fill="#fa345e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-sm font-bold text-foreground">Alumnos no aptos para rendir examen</h2>
        <div className="mt-3 divide-y divide-border">
          {enRiesgo.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{a.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {a.curso} · Asistencia {a.asistencia}% (faltan {80 - a.asistencia} puntos)
                </p>
              </div>
              <Badge apto={false} />
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
