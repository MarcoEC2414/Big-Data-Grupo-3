import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { AuthLayout } from "./index";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registro deshabilitado — SENATI Gestión Docente" },
      {
        name: "description",
        content: "El registro público está deshabilitado. Las cuentas se crean desde el panel Administrador.",
      },
    ],
  }),
  component: RegistroDeshabilitado,
});

function RegistroDeshabilitado() {
  return (
    <AuthLayout
      titulo="Registro no disponible"
      descripcion="El registro público de usuarios ha sido restringido por políticas institucionales."
    >
      <div className="mt-8 space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="space-y-1">
            <p className="font-bold">Acceso Centralizado</p>
            <p className="text-xs text-amber-400 leading-relaxed">
              Las cuentas docentes y administrativas solo pueden ser dadas de alta por el Administrador de la plataforma o directamente desde Firebase Console.
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir a Iniciar Sesión
        </Link>
      </div>
    </AuthLayout>
  );
}
