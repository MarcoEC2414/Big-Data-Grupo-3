import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { esCorreoInstitucional, INSTITUTIONAL_EMAIL_DOMAIN } from "@/lib/auth-config";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — SENATI Gestión Docente" },
      {
        name: "description",
        content:
          "Acceso a la plataforma SENATI Gestión Docente: seguimiento académico, asistencias y notas.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay usuario autenticado, redirigir a dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!esCorreoInstitucional(email)) {
      setError(`Solo se permite el acceso con correos institucionales ${INSTITUTIONAL_EMAIL_DOMAIN}.`);
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      await navigate({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      const code = err?.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else if (code === "auth/invalid-email") {
        setError("El formato del correo electrónico no es válido.");
      } else if (code === "auth/user-disabled") {
        setError("Esta cuenta ha sido inhabilitada. Contacta al administrador.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde.");
      } else {
        setError(err?.message || "Ocurrió un error al iniciar sesión.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            Validando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid min-h-screen font-sans lg:grid-cols-2">
      <div className="app-aura" aria-hidden="true" />
      {/* Panel lateral izquierdo - Identidad visual SENATI */}
      <div className="hidden flex-col justify-between bg-primary-soft p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-glow">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">SENATI</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Gestión Docente
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Portal Institucional Académico
          </span>
          <h2 className="text-3xl font-extrabold leading-tight text-foreground">
            Gestión y Seguimiento Académico Centralizado
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Acceso seguro para administradores, profesores y analistas de SENATI.
            Supervisa asistencias, notas, riesgo académico y aptitud de examen
            en tiempo real.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Sistema interno SENATI</span>
          <span>Acceso restringido a personal autorizado</span>
        </div>
      </div>

      {/* Formulario de Login */}
      <div className="relative z-[1] flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-foreground">
                SENATI Gestión Docente
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales institucionales para acceder a la plataforma.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@senati.pe"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando credenciales...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs text-muted-foreground">
              ¿No tienes una cuenta o perdiste acceso?
            </p>
            <p className="mt-1 text-xs font-medium text-foreground">
              Comunícate con el Administrador de SENATI para la creación o restablecimiento de tu usuario.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
