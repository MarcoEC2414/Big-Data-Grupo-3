import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  GraduationCap,
  Menu,
  GitCompare,
  ShieldCheck,
  Wifi,
  Loader2,
  UserCheck,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alumnos", label: "Alumnos", icon: Users },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/comparativa", label: "Comparativa", icon: GitCompare },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/admin", label: "Administrador", icon: ShieldCheck, adminOnly: true },
] as const;

export function Badge({ apto }: { apto: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        apto
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-rose-500/20 bg-rose-500/10 text-rose-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${apto ? "bg-emerald-400" : "bg-rose-400"}`} />
      {apto ? "Apto para rendir examen" : "No apto para rendir examen"}
    </span>
  );
}

export function Card({
  children,
  className = "",
  interactive = false,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Aplica hover elevado + realce de borde morado, para tarjetas clicables/interactivas. */
  interactive?: boolean;
  as?: any;
}) {
  const Comp: any = Component;
  return (
    <Comp
      className={`rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 ${
        interactive ? "hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-glow" : ""
      } ${className}`}
    >
      {children}
    </Comp>
  );
}

/** Envoltorio de entrada suave para vistas y tarjetas (fade + slide-up). */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor con stagger sutil para grupos de tarjetas (p. ej. KPIs). */
export function StaggerGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
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
  const { user, rol, loading, logout, isAdmin, isAccesoPermitido } = useAuth();
  const [open, setOpen] = useState(false);

  // Redirigir a /login si no hay sesión activa una vez que terminó de cargar
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  const handleCerrarSesion = async () => {
    try {
      await logout();
      navigate({ to: "/login" });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      navigate({ to: "/login" });
    }
  };

  // Mientras Firebase valida la sesión, mostrar un loading simple (evita parpadeo)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface font-sans">
        <div className="app-aura" aria-hidden="true" />
        <ThemeToggle className="fixed right-5 top-5 z-10" />
        <div className="relative z-[1] flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">SENATI Gestión Docente</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Validando credenciales y permisos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario y no está cargando, retornar null mientras el useEffect redirige
  if (!user) {
    return null;
  }

  // Si el acceso fue revocado o suspendido por el Administrador
  if (!isAccesoPermitido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6 font-sans">
        <div className="app-aura" aria-hidden="true" />
        <ThemeToggle className="fixed right-5 top-5 z-10" />
        <div className="relative z-[1] max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 shadow-soft text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldCheck className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Acceso al sistema restringido</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu cuenta está suspendida, revocada o aún no ha sido verificada/aprobada por el
              Administrador institucional de SENATI. Comunícate con soporte para regularizar tus permisos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Filtrar el menú: la sección 'Administrador' solo es visible si rol === 'administrador'
  const navItems = NAV.filter((item) => {
    if ("adminOnly" in item && item.adminOnly) {
      return rol === "administrador";
    }
    return true;
  });

  const rolLabel =
    rol === "administrador"
      ? "Administrador"
      : rol === "analista"
      ? "Analista de Datos"
      : "Profesor";

  return (
    <div className="min-h-screen bg-surface font-sans">
      <div className="app-aura" aria-hidden="true" />
      <div className="relative z-[1] flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5 rounded-full border border-purple-500/20 bg-purple-500/10 py-1.5 pl-1.5 pr-4 w-fit">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-glow">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold tracking-tight text-white">SENATI</span>
            </div>
            <p className="mt-1.5 ml-1.5 text-[11px] text-slate-400">Gestión Docente</p>

            {/* Perfil del usuario autenticado */}
            <div className="mt-5 rounded-2xl border border-white/6 bg-[#0d0f16] p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
                  <UserCheck className="h-3.5 w-3.5" />
                </span>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-bold text-white">
                    {user.displayName || user.email?.split("@")[0] || "Usuario"}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  {rolLabel}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Activo
                </span>
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold text-slate-400 transition-all duration-200 hover:bg-purple-500/10 hover:text-purple-300"
                  activeProps={{
                    className:
                      "bg-purple-500/15 !text-white shadow-[inset_0_0_0_1px_rgba(168,85,247,0.35)]",
                  }}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3 pt-4">
            <div className="rounded-2xl border border-white/6 bg-[#0d0f16] p-3.5">
              <p className="text-xs font-semibold text-white">Red académica sincronizada</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Wifi className="h-3.5 w-3.5 text-emerald-400" /> Firestore en tiempo real
              </p>
            </div>
            <button
              onClick={handleCerrarSesion}
              type="button"
              className="flex w-full items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="min-h-screen w-full lg:pl-64">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/6 bg-card px-6 py-5">
            <div className="flex items-start gap-3">
              <button
                className="mt-1 lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menú"
              >
                <Menu className="h-5 w-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
                {subtitle && <p className="mt-1 text-sm font-medium text-slate-400">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                <Wifi className="h-3.5 w-3.5" /> Sincronizado en red
              </span>
              <ThemeToggle />
            </div>
          </header>
          <div className="relative p-6">
            <FadeIn key={title}>{children}</FadeIn>
          </div>
        </main>
      </div>
    </div>
  );
}
