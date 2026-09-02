import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, BookOpen, BarChart3, LogOut, GraduationCap, Menu, GitCompare, ShieldCheck, Wifi } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/comparativa", label: "Comparativa", icon: GitCompare },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/admin", label: "Administrador", icon: ShieldCheck },
] as const;

export function Badge({ apto }: { apto: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        apto ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${apto ? "bg-success" : "bg-primary"}`} />
      {apto ? "Apto para rendir examen" : "No apto para rendir examen"}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 shadow-soft ${className}`}>{children}</div>;
}

export function Shell({
  title,
  subtitle,
  children,
  esAdmin = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  esAdmin?: boolean;
}) {
  const navigate = useNavigate();
  const { firebaseUser, loading, accesoAprobado } = useAccessControl();
  const [open, setOpen] = useState(false);
  const navItems = NAV;

  if (!loading && (!firebaseUser || !accesoAprobado)) {
    return (
      <div className="min-h-screen bg-surface p-6 font-sans">
        <div className="rounded-xl border border-destructive/20 bg-card p-6 shadow-soft">
          <p className="text-sm font-bold text-destructive">Acceso restringido</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo los usuarios aprobados por el administrador pueden ingresar al sistema.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">SENATI</p>
              <p className="text-xs text-muted-foreground">Gestión Docente</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                activeProps={{ className: "bg-primary-soft !text-primary" }}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="absolute inset-x-5 bottom-5">
            <div className="rounded-xl bg-surface p-3">
              <p className="text-sm font-semibold text-foreground">Red académica sincronizada</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wifi className="h-3.5 w-3.5 text-success" /> Firestore en tiempo real
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="min-h-screen w-full lg:pl-64">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-card px-6 py-5">
            <div className="flex items-start gap-3">
              <button className="mt-1 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menú">
                <Menu className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs font-bold text-success">
              <Wifi className="h-4 w-4" /> Sincronizado en red
            </span>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}


