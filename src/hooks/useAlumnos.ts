import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { type Alumno } from "../lib/mock-data";

export const useAlumnos = () => {
  const { user, perfil, isAdmin, isProfesor, loading: authLoading } = useAuth();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Esperar a que Firebase Auth resuelva la sesión
    if (authLoading) return;

    if (!user || !perfil) {
      setAlumnos([]);
      setLoading(false);
      return;
    }

    let q;

    if (isAdmin) {
      // Administrador: consulta global sin filtros
      q = collection(db, "alumnos");
    } else if (isProfesor) {
      // Profesor: filtra por los cursos asignados a su perfil
      const cursosValidos =
        perfil.cursosAsignados && perfil.cursosAsignados.length > 0
          ? perfil.cursosAsignados
          : ["Análisis de Datos / Big Data"];

      q = query(collection(db, "alumnos"), where("curso", "in", cursosValidos));
    } else {
      // Alumno: consulta filtrada por su correo institucional
      q = query(collection(db, "alumnos"), where("correo", "==", user.email));
    }

    // Escucha en tiempo real de Firestore
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data() as Record<string, any>;
          return {
            id: docSnap.id,
            dni: raw["dni"] || docSnap.id,
            nombre: raw["nombre"] || "Estudiante",
            correo: raw["correo"] || "",
            curso: raw["curso"] || "Análisis de Datos / Big Data",
            ciudad: raw["ciudad"] || "",
            conectividad: raw["conectividad"] || "No",
            nivelEducativo: raw["nivelEducativo"] || "Secundario completo",
            estadoAcademico: raw["estadoAcademico"] || "Aprobado",
            asistencia: Number(raw["asistencia"] ?? 0),
            promedio: Number(raw["promedio"] ?? 14),
            historialAsistencia: raw["historialAsistencia"] || [],
          } as unknown as Alumno;
        });

        setAlumnos(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al consultar alumnos en Firestore:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, perfil, isAdmin, isProfesor, authLoading]);

  return { alumnos, loading };
};