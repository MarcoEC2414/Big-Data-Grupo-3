import { useState, useEffect } from "react";
import { getAlumnosFirebase, Alumno } from "../lib/mock-data";

export const useAlumnos = () => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getAlumnosFirebase().then((data) => {
      setAlumnos(data);
      setLoading(false);
    });
  }, []);

  return { alumnos, loading };
};