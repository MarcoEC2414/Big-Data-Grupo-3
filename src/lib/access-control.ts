import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { db, firebaseConfig } from "./firebase";
import {
  esAdministradorUnico,
  esCorreoInstitucional,
  normalizarCorreo,
  INSTITUTIONAL_EMAIL_DOMAIN,
} from "./auth-config";

export type RolUsuario = "administrador" | "profesor" | "analista" | "admin" | "docente";
export type EstadoUsuario = "aprobado" | "suspendido" | "revocado" | "pendiente" | "rechazado";

export interface PerfilUsuario {
  uid: string;
  nombre: string;
  correo: string;
  email?: string;
  rol: "administrador" | "profesor" | "analista";
  estado: EstadoUsuario;
  cursosAsignados?: string[];
  sede?: string;
  creadoEn?: unknown;
  actualizadoEn?: unknown;
  aprobadoPor?: string;
  suspendidoPor?: string;
}

const usuariosRef = collection(db, "usuarios");

export function normalizarRol(rol?: string): "administrador" | "profesor" | "analista" {
  if (!rol) return "profesor";
  const r = rol.toLowerCase().trim();
  if (r === "administrador" || r === "admin") return "administrador";
  if (r === "analista") return "analista";
  return "profesor";
}

/**
 * Obtiene o inicializa la app secundaria para operaciones administrativas sin desloguear al admin
 */
function getSecondaryAuth() {
  const existingApps = getApps();
  const secondaryApp =
    existingApps.find((app) => app.name === "SecondaryAdminApp") ||
    initializeApp(firebaseConfig, "SecondaryAdminApp");
  return getAuth(secondaryApp);
}

/**
 * Crea un usuario en Firebase Authentication y registra su perfil, rol y cursos asignados en Firestore
 */
export async function crearUsuarioPorAdmin({
  nombre,
  correo,
  password,
  rol,
  cursosAsignados = ["Análisis de Datos / Big Data"],
}: {
  nombre: string;
  correo: string;
  password: string;
  rol: "profesor" | "analista";
  cursosAsignados?: string[];
}): Promise<{ uid: string; correo: string }> {
  const secondaryAuth = getSecondaryAuth();
  const correoLimpio = normalizarCorreo(correo);

  if (!esCorreoInstitucional(correoLimpio)) {
    throw new Error(
      `Solo se pueden registrar correos institucionales (${INSTITUTIONAL_EMAIL_DOMAIN}).`
    );
  }

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, correoLimpio, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "usuarios", uid), {
      uid,
      nombre: nombre.trim(),
      correo: correoLimpio,
      email: correoLimpio,
      rol,
      estado: "aprobado",
      cursosAsignados,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });

    await secondarySignOut(secondaryAuth);
    return { uid, correo: correoLimpio };
  } catch (error: any) {
    await secondarySignOut(secondaryAuth);
    throw error;
  }
}

export async function asegurarPerfilUsuario(user: User, nombre?: string) {
  const ref = doc(db, "usuarios", user.uid);
  const actual = await getDoc(ref);

  if (actual.exists()) {
    const perfilActual = actual.data() as PerfilUsuario;
    const esAdministradorConfigurado = esAdministradorUnico(user.email);
    if (
      normalizarRol(perfilActual.rol) !== "administrador" &&
      esAdministradorConfigurado
    ) {
      const perfilAdmin: PerfilUsuario = {
        ...perfilActual,
        rol: "administrador",
        estado: "aprobado",
        actualizadoEn: serverTimestamp(),
      };
      await setDoc(ref, perfilAdmin, { merge: true });
      return perfilAdmin;
    }
    return {
      ...perfilActual,
      rol: normalizarRol(perfilActual.rol),
      estado: perfilActual.estado || "aprobado",
      cursosAsignados: perfilActual.cursosAsignados || ["Análisis de Datos / Big Data"],
    };
  }

  const esAdmin = esAdministradorUnico(user.email);
  const perfil: PerfilUsuario = {
    uid: user.uid,
    nombre: nombre || user.displayName || user.email?.split("@")[0] || "Usuario",
    correo: normalizarCorreo(user.email) || "correo-no-registrado@senati.pe",
    email: user.email || "",
    rol: esAdmin ? "administrador" : "profesor",
    estado: "aprobado",
    cursosAsignados: ["Análisis de Datos / Big Data"],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  };

  await setDoc(ref, perfil);
  return perfil;
}

export function escucharPerfilUsuario(uid: string, callback: (perfil: PerfilUsuario | null) => void) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data() as PerfilUsuario;
    callback({
      ...data,
      rol: normalizarRol(data.rol),
      estado: data.estado || "aprobado",
      cursosAsignados: data.cursosAsignados || ["Análisis de Datos / Big Data"],
    });
  });
}

export function escucharUsuarios(callback: (usuarios: PerfilUsuario[]) => void) {
  return onSnapshot(usuariosRef, (snapshot) => {
    const list = snapshot.docs.map((item) => {
      const d = item.data() as PerfilUsuario;
      return {
        ...d,
        uid: item.id,
        correo: d.correo || d.email || "",
        nombre: d.nombre || "Usuario",
        rol: normalizarRol(d.rol),
        estado: d.estado || "aprobado",
        cursosAsignados: d.cursosAsignados || ["Análisis de Datos / Big Data"],
      };
    });
    callback(list);
  });
}

/**
 * Modificar rol de un usuario
 */
export async function cambiarRol(uid: string, rol: "profesor" | "analista") {
  await updateDoc(doc(db, "usuarios", uid), {
    rol,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Dar o reactivar acceso al sistema (estado: "aprobado")
 */
export async function darAccesoUsuario(uid: string, adminUid?: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "aprobado",
    aprobadoPor: adminUid || "admin",
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Suspender acceso de un usuario (estado: "suspendido")
 */
export async function suspenderAccesoUsuario(uid: string, adminUid?: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "suspendido",
    suspendidoPor: adminUid || "admin",
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Revocar permanentemente el acceso (estado: "revocado")
 */
export async function revocarAccesoUsuario(uid: string, adminUid?: string) {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "revocado",
    actualizadoEn: serverTimestamp(),
  });
}