import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCog,
  Undo2,
} from "lucide-react";
import { Card, Shell } from "@/components/Shell";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useUsuarios } from "@/hooks/useUsuarios";
import {
  aprobarUsuario,
  rechazarUsuario,
  revocarAcceso,
  cambiarRol,
  type PerfilUsuario,
  type RolUsuario,
} from "@/lib/access-control";
import {
  compartirDataset,
  escucharTodosLosDatasets,
  type SharedDataset,
} from "@/lib/comparison/datasetService";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Control de acceso — SENATI Gestión Docente" }],
  }),
  component: AdminPanel,
});

function EstadoBadge({
  estado,
}: {
  estado: PerfilUsuario["estado"];
}) {
  const estilos: Record<PerfilUsuario["estado"], string> = {
    pendiente: "bg-amber-100 text-amber-700",
    aprobado: "bg-success-soft text-success",
    rechazado: "bg-destructive/10 text-destructive",
  };

  const etiquetas: Record<PerfilUsuario["estado"], string> = {
    pendiente: "Pendiente",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${estilos[estado]}`}
    >
      {etiquetas[estado]}
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

  if (!miUid) return null;

  const esMiPropioUsuario = usuario.uid === miUid;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <p className="text-sm font-semibold text-foreground">
          {usuario.nombre}
        </p>

        <p className="text-xs text-muted-foreground">
          {usuario.correo}
        </p>
      </td>

      <td className="py-3 pr-4">
        <select
          value={usuario.rol}
          disabled={procesando || esMiPropioUsuario}
          onChange={(e) =>
            ejecutar(() =>
              cambiarRol(
                usuario.uid,
                e.target.value as RolUsuario
              )
            )
          }
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
        >
          <option value="docente">Docente</option>
          <option value="admin">Admin</option>
        </select>
      </td>

      <td className="py-3 pr-4">
        <EstadoBadge estado={usuario.estado} />
      </td>

      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          {usuario.estado !== "aprobado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() =>
                ejecutar(() =>
                  aprobarUsuario(usuario.uid, miUid)
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Aprobar
            </button>
          )}

          {usuario.estado !== "rechazado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() =>
                ejecutar(() =>
                  rechazarUsuario(usuario.uid, miUid)
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              <ShieldX className="h-3.5 w-3.5" />
              Rechazar
            </button>
          )}

          {usuario.estado === "aprobado" && !esMiPropioUsuario && (
            <button
              type="button"
              disabled={procesando}
              onClick={() =>
                ejecutar(() =>
                  revocarAcceso(usuario.uid, miUid)
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-surface disabled:opacity-50"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Revocar acceso
            </button>
          )}
        </div>
      </td>
    </tr>
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
    <Card className="mt-6">
      <h2 className="text-sm font-bold text-foreground">
        {titulo}
      </h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 pr-4 font-semibold">
                Usuario
              </th>

              <th className="pb-2 pr-4 font-semibold">
                Rol
              </th>

              <th className="pb-2 pr-4 font-semibold">
                Estado
              </th>

              <th className="pb-2 font-semibold">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <FilaUsuario
                key={usuario.uid}
                usuario={usuario}
                miUid={miUid}
              />
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
    <Card className="mt-6">
      <h2 className="text-sm font-bold text-foreground">Datasets compartidos en la red</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Concede o retira acceso a cada usuario aprobado.
      </p>
      <div className="mt-4 space-y-4">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{dataset.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {dataset.recordCount} registros · propietario: {dataset.propietarioCorreo}
                </p>
              </div>
              <span className="text-xs font-semibold text-primary">Sincronizado</span>
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
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${permitido ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}
                  >
                    <span>
                      <strong className="block text-foreground">{usuario.nombre}</strong>
                      <span className="text-muted-foreground">{usuario.correo}</span>
                    </span>
                    <span className={permitido ? "text-primary" : "text-muted-foreground"}>
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
  const {
    perfil,
    firebaseUser,
    esAdmin,
    loading,
  } = useAccessControl();

  const {
    usuarios,
    loading: cargandoUsuarios,
  } = useUsuarios();

  if (loading) {
    return (
      <Shell
        title="Control de acceso"
        esAdmin={esAdmin}
      >
        <p className="text-sm text-muted-foreground">
          Verificando permisos…
        </p>
      </Shell>
    );
  }

  if (!esAdmin) {
    return (
      <Shell
        title="Control de acceso"
        esAdmin={esAdmin}
      >
        <Card>
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 text-destructive" />

            <div>
              <p className="text-sm font-bold text-foreground">
                Acceso denegado
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Esta sección es solo para administradores. Tu rol
                actual es{" "}
                <strong>
                  {perfil?.rol ?? "sin definir"}
                </strong>
                .
              </p>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  const pendientes = usuarios.filter(
    (u) => u.estado === "pendiente"
  );

  const aprobados = usuarios.filter(
    (u) => u.estado === "aprobado"
  );

  const rechazados = usuarios.filter(
    (u) => u.estado === "rechazado"
  );

  return (
    <Shell
      title="Control de acceso"
      subtitle="Aprueba, rechaza o gestiona los roles de quienes usan el sistema."
      esAdmin={esAdmin}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <UserCog className="h-5 w-5" />
        </span>

        <div>
          <p className="text-sm font-bold text-foreground">
            {usuarios.length} usuarios registrados
          </p>

          <p className="text-xs text-muted-foreground">
            {pendientes.length} pendientes ·{" "}
            {aprobados.length} aprobados ·{" "}
            {rechazados.length} rechazados
          </p>
        </div>
      </div>

      {cargandoUsuarios && (
        <p className="mt-4 text-sm text-muted-foreground">
          Cargando usuarios…
        </p>
      )}

      <TablaUsuarios
        titulo="Solicitudes pendientes"
        usuarios={pendientes}
        miUid={firebaseUser?.uid}
      />

      <TablaUsuarios
        titulo="Usuarios con acceso aprobado"
        usuarios={aprobados}
        miUid={firebaseUser?.uid}
      />

      <TablaUsuarios
        titulo="Usuarios rechazados"
        usuarios={rechazados}
        miUid={firebaseUser?.uid}
      />

      <GestionDatasets usuarios={usuarios} />
    </Shell>
  );
}
