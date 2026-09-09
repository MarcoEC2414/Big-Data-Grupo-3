import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCog,
  UserPlus,
  Loader2,
  CheckCircle2,
  Ban,
  UserCheck,
  Lock,
  BookOpen,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, Shell } from "@/components/Shell";
import { useAuth, type RolUsuario, type EstadoUsuario } from "@/contexts/AuthContext";
import { useUsuarios } from "@/hooks/useUsuarios";
import {
  cambiarRol,
  crearUsuarioPorAdmin,
  darAccesoUsuario,
  suspenderAccesoUsuario,
  revocarAccesoUsuario,
  type PerfilUsuario,
} from "@/lib/access-control";
import {
  compartirDataset,
  escucharTodosLosDatasets,
  type SharedDataset,
} from "@/lib/comparison/datasetService";
import { esCorreoInstitucional, INSTITUTIONAL_EMAIL_DOMAIN } from "@/lib/auth-config";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Control de Acceso y Usuarios — SENATI Gestión Docente" }],
  }),
  component: AdminPanel,
});

const CURSOS_DISPONIBLES = [
  "Análisis de Datos / Big Data",
  "Inteligencia Artificial Aplicada",
  "Ciberseguridad y Redes",
  "Desarrollo de Software",
];

function EstadoBadge({ estado }: { estado?: EstadoUsuario }) {
  const est = estado || "aprobado";
  const estilos: Record<string, string> = {
    aprobado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    suspendido: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    revocado: "bg-red-500/15 text-red-400 border-red-500/20",
    pendiente: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    rechazado: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  const etiquetas: Record<string, string> = {
    aprobado: "Acceso Permitido",
    suspendido: "Suspendido",
    revocado: "Revocado",
    pendiente: "Pendiente",
    rechazado: "Rechazado",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
        estilos[est] || estilos["aprobado"]
      }`}
    >
      {etiquetas[est] || "Acceso Permitido"}
    </span>
  );
}

function FilaUsuario({
  usuario,
  miUid,
}: {
  usuario: PerfilUsuario;
  miUid: string | undefined;
}) {
  const [procesando, setProcesando] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(
    usuario.cursosAsignados?.[0] || "Análisis de Datos / Big Data"
  );

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setProcesando(true);
    try {
      await accion();
    } catch (error) {
      console.error("Error al ejecutar la acción:", error);
    } finally {
      setProcesando(false);
    }
  };

  const handleCambiarCurso = async (nuevoCurso: string) => {
    setCursoSeleccionado(nuevoCurso);
    await ejecutar(async () => {
      const userRef = doc(db, "usuarios", usuario.uid);
      await updateDoc(userRef, {
        cursosAsignados: [nuevoCurso],
      });
    });
  };

  if (!miUid) return null;
  const esMiPropioUsuario = usuario.uid === miUid;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="py-3.5 pr-4">
        <p className="text-sm font-bold text-foreground">{usuario.nombre}</p>
        <p className="text-xs text-muted-foreground">{usuario.correo || usuario.email}</p>
        {esMiPropioUsuario && (
          <span className="inline-block mt-0.5 text-[10px] font-semibold text-primary">
            (Tu sesión actual)
          </span>
        )}
      </td>

      <td className="py-3.5 pr-4">
        {usuario.rol === "administrador" ? (
          <span className="inline-flex items-center rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            Administrador (Acceso Total)
          </span>
        ) : (
          <select
            value={usuario.rol}
            disabled={procesando || esMiPropioUsuario}
            onChange={(e) =>
              ejecutar(() =>
                cambiarRol(usuario.uid, e.target.value as "profesor" | "analista")
              )
            }
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <option value="profesor">Profesor (Docente)</option>
            <option value="analista">Analista de Datos</option>
          </select>
        )}
      </td>

      <td className="py-3.5 pr-4">
        {usuario.rol === "administrador" ? (
          <span className="text-xs text-muted-foreground italic">Todas las sedes</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={cursoSeleccionado}
              disabled={procesando || esMiPropioUsuario}
              onChange={(e) => handleCambiarCurso(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground disabled:opacity-50 max-w-[180px] truncate"
            >
              {CURSOS_DISPONIBLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </td>

      <td className="py-3.5 pr-4">
        <EstadoBadge estado={usuario.estado} />
      </td>

      <td className="py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {usuario.estado !== "aprobado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => ejecutar(() => darAccesoUsuario(usuario.uid, miUid))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Dar acceso
            </button>
          )}

          {usuario.estado === "aprobado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => ejecutar(() => suspenderAccesoUsuario(usuario.uid, miUid))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5 text-amber-400" />
              Suspender
            </button>
          )}

          {usuario.estado !== "revocado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => ejecutar(() => revocarAccesoUsuario(usuario.uid, miUid))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              <ShieldX className="h-3.5 w-3.5" />
              Revocar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function FormularioNuevoUsuario() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"profesor" | "analista">("profesor");
  const [curso, setCurso] = useState("Análisis de Datos / Big Data");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    if (!esCorreoInstitucional(correo)) {
      setMensaje({
        tipo: "error",
        texto: `Solo se pueden crear cuentas con correo institucional ${INSTITUTIONAL_EMAIL_DOMAIN}.`,
      });
      setGuardando(false);
      return;
    }

    if (password.length < 6) {
      setMensaje({
        tipo: "error",
        texto: "La contraseña debe tener al menos 6 caracteres.",
      });
      setGuardando(false);
      return;
    }

    try {
      await crearUsuarioPorAdmin({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password,
        rol,
        cursosAsignados: [curso],
      });

      setMensaje({
        tipo: "exito",
        texto: `Usuario "${nombre}" creado exitosamente con credenciales activas, rol de ${rol} y curso asignado: ${curso}.`,
      });

      setNombre("");
      setCorreo("");
      setPassword("");
      setRol("profesor");
    } catch (err: any) {
      console.error("Error al dar de alta al usuario:", err);
      let errorMsg = err?.message || "No se pudo registrar al usuario.";
      if (err?.code === "auth/email-already-in-use") {
        errorMsg = "Este correo electrónico ya está registrado en el sistema.";
      } else if (err?.code === "auth/invalid-email") {
        errorMsg = "El formato del correo electrónico no es válido.";
      }
      setMensaje({ tipo: "error", texto: errorMsg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card className="mt-6 border-primary/20 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <UserPlus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Crear Nuevo Usuario</h2>
          <p className="text-xs text-muted-foreground">
            Crea la cuenta institucional directamente y asigna su curso de monitoreo.
          </p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-xs font-semibold ${
            mensaje.tipo === "exito"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {mensaje.tipo === "exito" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{mensaje.texto}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="text-xs font-semibold text-foreground">Nombres y Apellidos</label>
          <input
            type="text"
            required
            placeholder="Ej: Ing. Marco Ramírez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">Correo Institucional</label>
          <input
            type="email"
            required
            placeholder="usuario@senati.pe"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            Contraseña Inicial
          </label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">Curso Asignado</label>
          <select
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            {CURSOS_DISPONIBLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground">Rol Asignado</label>
          <div className="flex gap-2 mt-1">
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as "profesor" | "analista")}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="profesor">Profesor</option>
              <option value="analista">Analista</option>
            </select>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Crear
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function TablaUsuarios({
  titulo,
  usuarios,
  miUid,
}: {
  titulo: string;
  usuarios: PerfilUsuario[];
  miUid: string | undefined;
}) {
  if (usuarios.length === 0) return null;

  return (
    <Card className="mt-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">{titulo}</h2>
        <span className="text-xs text-muted-foreground">
          Total: {usuarios.length} cuentas registradas
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
              <th className="py-2.5 px-3 font-semibold">Usuario</th>
              <th className="py-2.5 px-3 font-semibold">Rol Asignado</th>
              <th className="py-2.5 px-3 font-semibold">Cursos Asignados</th>
              <th className="py-2.5 px-3 font-semibold">Estado de Acceso</th>
              <th className="py-2.5 px-3 font-semibold">Acciones Administrativas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <FilaUsuario key={usuario.uid} usuario={usuario} miUid={miUid} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GestionDatasets({ usuarios }: { usuarios: PerfilUsuario[] }) {
  const [datasets, setDatasets] = useState<SharedDataset[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => escucharTodosLosDatasets(setDatasets), []);

  const usuariosAprobados = usuarios.filter((usuario) => usuario.estado === "aprobado");

  const cambiarAcceso = async (dataset: SharedDataset, uid: string) => {
    const permitir = !dataset.compartidoCon?.includes(uid);
    setProcesando(`${dataset.id}-${uid}`);
    try {
      await compartirDataset(dataset.id, uid, permitir, dataset.compartidoCon);
    } finally {
      setProcesando(null);
    }
  };

  if (datasets.length === 0) return null;

  return (
    <Card className="mt-6 shadow-soft">
      <h2 className="text-sm font-bold text-foreground">Datasets Compartidos en la Red</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Concede o retira permisos de visualización a cada usuario activo.
      </p>
      <div className="mt-4 space-y-4">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="rounded-lg border border-border p-4 bg-surface">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{dataset.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {dataset.recordCount} registros · Propietario: {dataset.propietarioCorreo}
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-md">
                Sincronizado
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {usuariosAprobados.map((usuario) => {
                const permitido = dataset.compartidoCon?.includes(usuario.uid);
                const clave = `${dataset.id}-${usuario.uid}`;
                return (
                  <button
                    key={usuario.uid}
                    type="button"
                    disabled={procesando === clave}
                    onClick={() => cambiarAcceso(dataset, usuario.uid)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                      permitido
                        ? "border-primary/40 bg-primary/5 font-semibold text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div>
                      <strong className="block text-foreground">{usuario.nombre}</strong>
                      <span className="text-[11px] text-muted-foreground">
                        {usuario.correo || usuario.email}
                      </span>
                    </div>
                    <span className={permitido ? "text-primary font-bold" : "text-muted-foreground"}>
                      {permitido ? "Con acceso" : "Dar acceso"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminPanel() {
  const { user, rol, isAdmin, loading } = useAuth();
  const { usuarios, loading: cargandoUsuarios } = useUsuarios();

  if (loading) {
    return (
      <Shell title="Administración de Accesos" esAdmin={false}>
        <p className="text-sm text-muted-foreground">Verificando permisos institucionales…</p>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell title="Administración de Accesos" esAdmin={false}>
        <Card>
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-bold text-foreground">Acceso Restringido</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta sección es exclusiva para el rol de <strong>Administrador</strong>. Tu rol actual es{" "}
                <strong>{rol ?? "sin definir"}</strong>.
              </p>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  const activos = usuarios.filter((u) => u.estado === "aprobado");
  const suspendidos = usuarios.filter((u) => u.estado === "suspendido" || u.estado === "revocado");

  return (
    <Shell
      title="Administración de Accesos y Usuarios"
      subtitle="Crea usuarios, asigna roles y cursos, modifica permisos y suspende o revoca el acceso al sistema."
      esAdmin={true}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">
            {usuarios.length} usuarios registrados en la red
          </p>
          <p className="text-xs text-muted-foreground">
            {activos.length} activos con acceso · {suspendidos.length} suspendidos/revocados
          </p>
        </div>
      </div>

      <FormularioNuevoUsuario />

      {cargandoUsuarios && (
        <p className="mt-4 text-sm text-muted-foreground">Cargando directorio de usuarios…</p>
      )}

      <TablaUsuarios
        titulo="Directorio Central de Usuarios y Permisos"
        usuarios={usuarios}
        miUid={user?.uid}
      />

      <GestionDatasets usuarios={usuarios} />
    </Shell>
  );
}