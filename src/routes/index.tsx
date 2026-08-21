import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import type { FormEvent } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — SENATI Gestión Docente" },
      {
        name: "description",
        content:
          "Acceso docente al CRM académico SENATI: consulta notas, asistencia y aptitud de examen de tus alumnos.",
      },
      { property: "og:title", content: "Iniciar sesión — SENATI Gestión Docente" },
      {
        property: "og:description",
        content: "CRM académico interno para docentes SENATI.",
      },
    ],
  }),
  component: Login,
});

export function AuthLayout({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen font-sans lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary-soft p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-foreground">SENATI Gestión Docente</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl font-bold leading-tight text-foreground">
            Decide quién está habilitado para rendir examen.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            El sistema evalúa automáticamente la asistencia de cada alumno y marca su aptitud
            cuando supera el 70% requerido.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Entorno de demostración con datos simulados.</p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-foreground">{titulo}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Campo({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Login() {
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout titulo="Iniciar sesión" descripcion="Ingresa con tu usuario docente para ver a tus alumnos.">
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Campo label="Usuario" placeholder="docente@senati.pe" />
        <Campo label="Contraseña" type="password" placeholder="••••••••" />
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm font-semibold text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Entrar al panel
        </button>
        <Link
          to="/registro"
          className="block w-full rounded-lg border border-foreground bg-card px-4 py-2.5 text-center text-sm font-bold text-foreground transition hover:bg-surface"
        >
          Crear cuenta
        </Link>
      </form>
    </AuthLayout>
  );
}
