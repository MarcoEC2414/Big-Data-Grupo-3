import { useEffect, useState } from "react";
import { escucharUsuarios, type PerfilUsuario } from "@/lib/access-control";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detener = escucharUsuarios((usuariosActuales) => {
      setUsuarios(usuariosActuales);
      setLoading(false);
    });

    return detener;
  }, []);

  return { usuarios, loading };
}
