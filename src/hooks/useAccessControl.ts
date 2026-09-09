import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { asegurarPerfilUsuario, escucharPerfilUsuario, type PerfilUsuario } from "@/lib/access-control";

export function useAccessControl() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let detenerPerfil: (() => void) | undefined;

    const detenerAuth = onAuthStateChanged(auth, async (user) => {
      detenerPerfil?.();
      setFirebaseUser(user);
      setPerfil(null);

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await asegurarPerfilUsuario(user);
        detenerPerfil = escucharPerfilUsuario(user.uid, (perfilActual) => {
          setPerfil(perfilActual);
          setLoading(false);
        });
      } catch (error) {
        console.error("No se pudo sincronizar el perfil:", error);
        setLoading(false);
      }
    });

    return () => {
      detenerPerfil?.();
      detenerAuth();
    };
  }, []);

  return {
    firebaseUser,
    perfil,
    loading,
    esAdmin: perfil?.rol === "admin" && perfil.estado === "aprobado",
    accesoAprobado: perfil?.estado === "aprobado",
    accesoPendiente: perfil?.estado === "pendiente",
    accesoRechazado: perfil?.estado === "rechazado",
  };
}
