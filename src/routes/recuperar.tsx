import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { AlertCircle, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { esCorreoInstitucional, INSTITUTIONAL_EMAIL_DOMAIN } from "@/lib/auth-config";
import { AuthLayout, Campo } from "./index";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — SENATI Gestión Docente" },
      { name: "description", content: "Recuperación de contraseña para docentes SENATI mediante Firebase." },
      { property: "og:title", content: "Recuperar contraseña — SENATI Gestión Docente" },
      { property: "og:description", content: "Recupera el acceso a tu panel docente." },
    ],
  }),
  component: Recuperar,
});

function Recuperar() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!esCorreoInstitucional(correo)) {
      setError(`Solo se permite recuperar cuentas con correo institucional ${INSTITUTIONAL_EMAIL_DOMAIN}.`);
      return;
    }

    setEnviando(true);
    try {
      await sendPasswordResetEmail(auth, correo.trim().toLowerCase());
      setEnviado(true);
    } catch (err: any) {
      console.error("Error al enviar el correo de recuperación:", err);
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setError("No existe una cuenta registrada con ese correo institucional.");
      } else if (code === "auth/invalid-email") {
        setError("El formato del correo electrónico no es válido.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos. Intenta nuevamente más tarde.");
      } else {
        setError(err?.message || "Ocurrió un error al enviar el enlace de recuperación.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      titulo="¿Olvidaste tu contraseña?"
      descripcion="Te enviaremos un enlace de recuperación a tu correo institucional."
    >
      {enviado ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-xl bg-success-soft p-4 text-sm font-semibold text-success">
            Enlace de recuperación enviado. Revisa tu bandeja institucional.
          </div>
          <Link
            to="/"
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}
          <Campo
            label="Correo institucional"
            type="email"
            placeholder="docente@senati.pe"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando enlace...
              </>
            ) : (
              "Enviar enlace"
            )}
          </button>
          <Link
            to="/"
            className="block w-full rounded-lg border border-foreground bg-card px-4 py-2.5 text-center text-sm font-bold text-foreground transition hover:bg-surface"
          >
            Cancelar
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
