import { createFileRoute } from "@tanstack/react-router";
import { Card, Shell } from "@/components/Shell";
import { porCurso } from "@/lib/mock-data";

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
  const cursos = porCurso();
  return (
    <Shell title="Cursos" subtitle="Comparativa de rendimiento entre los cursos que dictas.">
      <div className="grid gap-4 md:grid-cols-2">
        {cursos.map((c) => {
          const pct = Math.round((c.aptos / c.alumnos) * 100);
          return (
            <Card key={c.curso}>
              <h2 className="text-base font-bold text-foreground">{c.curso}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{c.alumnos} alumnos matriculados</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-muted-foreground">Promedio</p>
                  <p className="text-lg font-bold text-foreground">{c.promedio}</p>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-muted-foreground">Asistencia</p>
                  <p className="text-lg font-bold text-foreground">{c.asistencia}%</p>
                </div>
                <div className="rounded-lg bg-success-soft p-3">
                  <p className="text-xs text-success">Aptos</p>
                  <p className="text-lg font-bold text-success">{pct}%</p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-primary-soft">
                <div className="h-2 rounded-full bg-success" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.aptos} aptos · {c.alumnos - c.aptos} no aptos para rendir examen
              </p>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
