import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { AuthLayout, Campo } from "./index";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta docente — SENATI Gestión Docente" },
      { name: "description", content: "Registro simulado de docentes para el CRM académico SENATI." },
      { property: "og:title", content: "Crear cuenta docente — SENATI Gestión Docente" },
      { property: "og:description", content: "Registro simulado de docentes SENATI." },
    ],
  }),
  component: Registro,
});

function Registro() {
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout titulo="Crear cuenta" descripcion="Registra tu perfil docente para acceder al panel.">
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Campo label="Nombres y apellidos" placeholder="Josué Ramírez" />
        <Campo label="Correo institucional" type="email" placeholder="docente@senati.pe" />
        <Campo label="Contraseña" type="password" placeholder="••••••••" />
        <Campo label="Repetir contraseña" type="password" placeholder="••••••••" />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Crear cuenta y entrar
        </button>
        <Link
          to="/"
          className="block w-full rounded-lg border border-foreground bg-card px-4 py-2.5 text-center text-sm font-bold text-foreground transition hover:bg-surface"
        >
          Ya tengo cuenta
        </Link>
      </form>
    </AuthLayout>
  );
}
