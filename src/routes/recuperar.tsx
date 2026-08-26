import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthLayout, Campo } from "./index";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — SENATI Gestión Docente" },
      { name: "description", content: "Flujo simulado de recuperación de contraseña para docentes SENATI." },
      { property: "og:title", content: "Recuperar contraseña — SENATI Gestión Docente" },
      { property: "og:description", content: "Recupera el acceso a tu panel docente." },
    ],
  }),
  component: Recuperar,
});

function Recuperar() {
  const [enviado, setEnviado] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEnviado(true);
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
          <Campo label="Correo institucional" type="email" placeholder="docente@senati.pe" />
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            Enviar enlace
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
