import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  GraduationCap,
  Menu,
  LogOut,
  X,
} from "lucide-react";

// Menú de navegación lateral
const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
] as const;

// Componente para etiquetas de estado (Apto / No Apto)
export function Badge({ apto }: { apto: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        apto ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          apto ? "bg-emerald-500" : "bg-primary"
        }`}
      />
      {apto ? "Apto para rendir examen" : "No apto para rendir examen"}
    </span>
  );
}

// Componente Tarjeta genérico
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// Estructura principal (Shell)
export function Shell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      {/* Sidebar Lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-5 transition-transform lg:static lg:translate-x-0 flex flex-col justify-between ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo y Encabezado */}
          <div className="flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-bold text-lg">Big Data G3</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Enlaces de Navegación */}
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.to}
                  href={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Botón de Cerrar Sesión */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar Superior */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            {title && <h1 className="text-lg font-bold">{title}</h1>}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </header>

        {/* Área de Trabajo */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}