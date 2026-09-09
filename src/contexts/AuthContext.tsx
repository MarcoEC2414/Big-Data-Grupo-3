import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { esAdministradorUnico } from "@/lib/auth-config";

export type RolUsuario = "administrador" | "profesor" | "analista";
export type EstadoUsuario = "aprobado" | "suspendido" | "revocado" | "pendiente" | "rechazado";

export interface UsuarioPerfil {
  uid: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  creadoEn?: unknown;
  actualizadoEn?: unknown;
}

interface AuthContextType {
  user: User | null;
  rol: RolUsuario | null;
  perfil: UsuarioPerfil | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isProfesor: boolean;
  isAnalista: boolean;
  isAccesoPermitido: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizarRol(rolRaw?: string): RolUsuario {
  if (!rolRaw) return "profesor";
  const r = rolRaw.toLowerCase().trim();
  if (r === "administrador" || r === "admin") return "administrador";
  if (r === "analista") return "analista";
  return "profesor";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setUser(currentUser);

      if (!currentUser) {
        setRol(null);
        setPerfil(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const esAdminPorDefecto = esAdministradorUnico(currentUser.email);
          const rolAsignado: RolUsuario = esAdminPorDefecto ? "administrador" : "profesor";

          const nuevoPerfil: UsuarioPerfil = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            nombre: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuario",
            rol: rolAsignado,
            estado: "aprobado",
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          };

          await setDoc(userDocRef, nuevoPerfil, { merge: true });
        }

        // Escucha en tiempo real cambios en el rol o estado de acceso
        unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const rolNorm = normalizarRol(data.rol);
            const est = (data.estado as EstadoUsuario) || "aprobado";
            const perf: UsuarioPerfil = {
              uid: currentUser.uid,
              email: currentUser.email || data.correo || data.email || "",
              nombre: data.nombre || currentUser.displayName || "Usuario",
              rol: rolNorm,
              estado: est,
              creadoEn: data.creadoEn,
              actualizadoEn: data.actualizadoEn,
            };
            setRol(rolNorm);
            setPerfil(perf);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error al sincronizar perfil de usuario:", error);
        setRol("profesor");
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeAuth();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      // El onAuthStateChanged se encarga de cargar el perfil y setLoading(false)
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setRol(null);
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  };

  const isAccesoPermitido = perfil?.estado === "aprobado";

  const value: AuthContextType = {
    user,
    rol,
    perfil,
    loading,
    login,
    logout,
    isAdmin: rol === "administrador",
    isProfesor: rol === "profesor",
    isAnalista: rol === "analista",
    isAccesoPermitido,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
