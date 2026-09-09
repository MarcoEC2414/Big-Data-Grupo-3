import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, type ReactNode, type ChangeEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginPage } from "./login";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SENATI Gestión Docente" },
      {
        name: "description",
        content:
          "Acceso docente al CRM académico SENATI: consulta notas, asistencia y aptitud de examen de tus alumnos.",
      },
      { property: "og:title", content: "SENATI Gestión Docente" },
      {
        property: "og:description",
        content: "CRM académico interno para personal de SENATI.",
      },
    ],
  }),
  component: IndexPage,
});

export function AuthLayout({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen font-sans lg:grid-cols-2">
      <ThemeToggle className="fixed right-5 top-5 z-10" />
      <div className="hidden flex-col justify-between bg-primary-soft p-12 lg:flex">
        <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-background/40 py-1.5 pl-1.5 pr-4 w-fit">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground">SENATI Gestión Docente</span>
        </div>
        <div>
          <h2 className="max-w-sm text-4xl font-bold leading-tight text-foreground">
            Decide quién está habilitado para rendir examen.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            El sistema evalúa automáticamente la asistencia de cada alumno y marca su aptitud
            cuando supera el 80% requerido.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Entorno académico institucional SENATI.</p>
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

export function Campo({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function IndexPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    }
  }, [user, loading, navigate]);

  return <LoginPage />;
}
