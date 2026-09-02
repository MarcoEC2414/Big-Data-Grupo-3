import { doc, getDoc, getDocs, collection, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export type RolUsuario = "admin" | "docente";
export type EstadoUsuario = "pendiente" | "aprobado" | "rechazado";

export type PerfilUsuario = {
  uid: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  creadoEn?: unknown;
  actualizadoEn?: unknown;
  aprobadoPor?: string;
};

const CORREOS_ADMINISTRADORES = ["victorvargas2609@gmail.com"];
const usuariosRef = collection(db, "usuarios");

async function esPrimerUsuario() {
  const snapshot = await getDocs(query(usuariosRef, limit(1)));
  return snapshot.empty;
}

async function esPrimerUsuarioRegistrado(uid: string) {
  const snapshot = await getDocs(query(usuariosRef, orderBy("creadoEn", "asc"), limit(1)));
  return snapshot.docs[0]?.id === uid;
}

async function noExisteAdministrador() {
  const snapshot = await getDocs(query(usuariosRef, limit(20)));
  return !snapshot.docs.some((item) => item.data().rol === "admin");
}

export async function asegurarPerfilUsuario(user: User, nombre?: string) {
  const ref = doc(db, "usuarios", user.uid);
  const actual = await getDoc(ref);

  if (actual.exists()) {
    const perfilActual = actual.data() as PerfilUsuario;
    // Permite recuperar el administrador inicial si la cuenta se creó antes
    // de activar el control de acceso.
    const esCuentaGoogle = user.providerData.some((provider) => provider.providerId === "google.com");
    const esAdministradorConfigurado = CORREOS_ADMINISTRADORES.includes(
      (user.email || "").toLowerCase()
    );
    if (
      perfilActual.rol !== "admin" &&
      (esAdministradorConfigurado || await esPrimerUsuarioRegistrado(user.uid) || (esCuentaGoogle && await noExisteAdministrador()))
    ) {
      const perfilAdmin: PerfilUsuario = {
        ...perfilActual,
        rol: "admin",
        estado: "aprobado",
        actualizadoEn: serverTimestamp(),
      };
      await setDoc(ref, perfilAdmin, { merge: true });
      return perfilAdmin;
    }
    return perfilActual;
  }

  const primerUsuario = await esPrimerUsuario();
  const perfil: PerfilUsuario = {
    uid: user.uid,
    nombre: nombre || user.displayName || "Usuario docente",
    correo: user.email || "correo-no-registrado@senati.pe",
    rol: primerUsuario || CORREOS_ADMINISTRADORES.includes((user.email || "").toLowerCase()) ? "admin" : "docente",
    estado: primerUsuario || CORREOS_ADMINISTRADORES.includes((user.email || "").toLowerCase()) ? "aprobado" : "pendiente",
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  };

  await setDoc(ref, perfil);
  return perfil;
}

export function escucharPerfilUsuario(uid: string, callback: (perfil: PerfilUsuario | null) => void) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as PerfilUsuario) : null);
  });
}

export function escucharUsuarios(callback: (usuarios: PerfilUsuario[]) => void) {
  return onSnapshot(query(usuariosRef, orderBy("creadoEn", "desc")), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as PerfilUsuario));
  });
}

export async function aprobarUsuario(uid: string, adminUid: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "aprobado",
    aprobadoPor: adminUid,
    actualizadoEn: serverTimestamp(),
  });
}

export async function rechazarUsuario(uid: string, adminUid: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "rechazado",
    aprobadoPor: adminUid,
    actualizadoEn: serverTimestamp(),
  });
}

export async function revocarAcceso(uid: string, adminUid: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "pendiente",
    aprobadoPor: adminUid,
    actualizadoEn: serverTimestamp(),
  });
}

export async function cambiarRol(uid: string, rol: RolUsuario) {
  await updateDoc(doc(db, "usuarios", uid), {
    rol,
    actualizadoEn: serverTimestamp(),
  });
}
