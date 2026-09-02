import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AuthLayout, Campo } from "./index";
import { auth, sendVerification } from "@/lib/firebase";
import { asegurarPerfilUsuario } from "@/lib/access-control";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta docente - SENATI Gestion Docente" },
      { name: "description", content: "Registro de docentes con aprobacion del administrador para el CRM academico SENATI." },
      { property: "og:title", content: "Crear cuenta docente - SENATI Gestion Docente" },
      { property: "og:description", content: "Solicitud de acceso docente sincronizada en red." },
    ],
  }),
  component: Registro,
});

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (password !== confirmar) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credencial.user, { displayName: nombre });
      const perfil = await asegurarPerfilUsuario(credencial.user, nombre);
      await sendVerification();

      if (perfil.estado === "aprobado") {
        await navigate({ to: "/admin" });
        return;
      }

      setExito("Tu solicitud fue enviada. El administrador debe aprobar tu acceso para entrar al sistema compartido.");
    } catch (err: any) {
      console.error("Error al registrar:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya esta registrado.");
      } else if (err.code === "auth/weak-password") {
        setError("La contrasena debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "No se pudo crear la cuenta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout titulo="Crear cuenta" descripcion="Solicita acceso para trabajar en la red academica sincronizada.">
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {exito && (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Solicitud registrada</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{exito}</p>
            </div>
          </div>
        )}
        <Campo label="Nombres y apellidos" placeholder="Josue Ramirez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Campo label="Correo institucional" type="email" placeholder="docente@senati.pe" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo label="Contrasena" type="password" placeholder="Minimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Campo label="Repetir contrasena" type="password" placeholder="Confirma tu contrasena" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enviando solicitud..." : "Solicitar acceso"}
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
