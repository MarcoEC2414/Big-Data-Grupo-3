import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card, Shell } from "@/components/Shell";
import { ALUMNOS, esApto } from "@/lib/mock-data";

export const Route = createFileRoute("/alumnos/$id")({
  loader: ({ params }) => {
    const alumno = ALUMNOS.find((a) => a.id === params.id);
    if (!alumno) throw notFound();
    return { alumno };
  },
  head: ({ loaderData }) => {
    const nombre = loaderData?.alumno.nombre ?? "Alumno";
    return {
      meta: [
        { title: `${nombre} — SENATI Gestión Docente` },
        {
          name: "description",
          content: `Ficha académica de ${nombre}: notas por curso, historial de asistencia y aptitud para examen.`,
        },
        { property: "og:title", content: `${nombre} — SENATI Gestión Docente` },
        { property: "og:description", content: "Detalle académico de solo lectura." },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: Detalle,
});

function Detalle() {
  const { alumno } = Route.useLoaderData();
  const apto = esApto(alumno);

  const porCursoNotas = [...new Set(alumno.notas.map((n) => n.curso))].map((curso) => {
    const notas = alumno.notas.filter((n) => n.curso === curso);
    return {
      curso: curso.length > 18 ? `${curso.slice(0, 18)}…` : curso,
      promedio: Number((notas.reduce((s, n) => s + n.nota, 0) / notas.length).toFixed(1)),
    };
  });

  const evolucion = ["Unidad I", "Unidad II", "Unidad III", "Unidad IV"].map((u) => {
    const notas = alumno.notas.filter((n) => n.unidad === u);
    return { unidad: u.replace("Unidad ", "U"), nota: Number((notas.reduce((s, n) => s + n.nota, 0) / notas.length).toFixed(1)) };
  });

  return (
    <Shell title={alumno.nombre} subtitle={`${alumno.curso} · Sección ${alumno.seccion} · DNI ${alumno.dni}`}>
      <Link to="/alumnos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a alumnos
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Promedio general</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{alumno.promedio}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Asistencia</p>
          <p className={`mt-1 text-3xl font-bold ${apto ? "text-success" : "text-primary"}`}>{alumno.asistencia}%</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Aptitud de examen</p>
          <div className="mt-2">
            <Badge apto={apto} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Regla: se requiere 80% de asistencia mínima.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-bold text-foreground">Promedio por curso</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCursoNotas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="curso" tick={{ fontSize: 11, fill: "#425b76" }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#425b76" }} />
                <Tooltip />
                <Bar dataKey="promedio" fill="#fa345e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-foreground">Asistencia por semana (%)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alumno.historialAsistencia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#425b76" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#425b76" }} />
                <Tooltip />
                <Bar dataKey="porcentaje" fill="#45c1ad" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground">Evolución de notas por unidad</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f5" />
                <XAxis dataKey="unidad" tick={{ fontSize: 11, fill: "#425b76" }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#425b76" }} />
                <Tooltip />
                <Line type="monotone" dataKey="nota" stroke="#fa345e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-x-auto">
          <h2 className="text-sm font-bold text-foreground">Notas registradas</h2>
          <table className="mt-4 w-full min-w-[520px] text-left">
            <thead className="text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Curso</th>
                <th className="py-2">Unidad</th>
                <th className="py-2">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alumno.notas.map((n, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-sm text-muted-foreground">{n.curso}</td>
                  <td className="py-2.5 text-sm text-muted-foreground">{n.unidad}</td>
                  <td className={`py-2.5 text-sm font-bold ${n.nota >= 13 ? "text-success" : "text-primary"}`}>{n.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Shell>
  );
}
