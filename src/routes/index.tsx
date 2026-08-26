import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { loginWithEmail, loginWithGoogle, sendVerification, auth } from "@/lib/firebase";

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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectToDashboard = async () => {
    try {
      await navigate({ to: "/dashboard" });
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const userCred = await loginWithEmail(email, password);
      
      // Si el correo no está verificado, envía el correo de verificación
      if (!userCred.user.emailVerified) {
        await sendVerification();
        setInfoMessage(
          `Hemos enviado un correo de verificación a ${userCred.user.email}. Por favor revisa tu bandeja de entrada o spam.`
        );
      } else {
        await redirectToDashboard();
      }
    } catch (err: any) {
      console.error("Error al autenticar:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo es inválido.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const userCred = await loginWithGoogle();
      
      // Las cuentas de Google vienen verificadas automáticamente por defecto
      if (!userCred.user.emailVerified) {
        await sendVerification();
        setInfoMessage(
          `Se envió un correo de verificación a ${userCred.user.email}.`
        );
      } else {
        await redirectToDashboard();
      }
    } catch (err: any) {
      console.error("Error con Google:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Se cerró la ventana de autenticación de Google.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado en Firebase Console.");
      } else {
        setError(err.message || "No se pudo iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout titulo="Iniciar sesión" descripcion="Ingresa con tu usuario docente para ver a tus alumnos.">
      <div className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
            <MailCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Verificación requerida</p>
              <p className="text-xs text-muted-foreground mt-0.5">{infoMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Campo
            label="Usuario"
            type="email"
            placeholder="docente@senati.pe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Campo
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Link to="/recuperar" className="text-sm font-semibold text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <div className="relative my-2 flex items-center justify-center">
          <div className="w-full border-t border-border"></div>
          <span className="absolute bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
            o
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Ingresar con Google
        </button>

        <Link
          to="/registro"
          className="block w-full rounded-lg border border-foreground bg-card px-4 py-2.5 text-center text-sm font-bold text-foreground transition hover:bg-surface"
        >
          Crear cuenta
        </Link>
      </div>
    </AuthLayout>
  );
}