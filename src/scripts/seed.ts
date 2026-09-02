import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

async function ejecutarSeedSincronizado() {
  const rutaCsv = path.resolve(process.cwd(), "alumnos.csv");

  if (!fs.existsSync(rutaCsv)) {
    console.error("❌ No se encontró el archivo 'alumnos.csv' en la raíz.");
    process.exit(1);
  }

  const contenido = fs.readFileSync(rutaCsv, "utf-8");

  Papa.parse(contenido, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const filas = results.data as any[];
      console.log(`🚀 Sincronizando ${filas.length} registros con la interfaz...`);

      const BATCH_SIZE = 500;
      let batch = writeBatch(db);
      let count = 0;

      for (let i = 0; i < filas.length; i++) {
        const item = filas[i];
        const docId = item.ID ? String(item.ID).trim() : `L-2025-${1000 + i}`;
        const alumnoRef = doc(db, "alumnos", docId);

        // Transformaciones según reglas del plan
        const notaRaw = parseFloat(String(item.Nota_Final || "0").replace(",", ".")) || 0;
        const notaFinal = Number((notaRaw * 2).toFixed(1)); // Escala 0-20

        const clasesRaw = parseFloat(item.Asistencia) || 0;
        const asistenciaPct = Number(((clasesRaw / 40) * 100).toFixed(1)); // Escala 0-100%

        const alumnoData = {
          id: docId,
          dni: docId,
          nombre: `Estudiante ${docId}`,
          ciudad: String(item.Ciudad || "Sin especificar"),
          sexo: String(item.Sexo || "N/I"),
          situacionLaboral: String(item.Situación_Laboral || "N/A"),
          nivelEducativo: String(item.Nivel_Educativo_Prev || "N/A"),
          conectividad: String(item.Conectividad_Hogar || "No"),
          rangoEtario: String(item.Rango_Etario || "General"),
          
          // Métricas numéricas estrictas
          asistencia: asistenciaPct,
          promedio: notaFinal,
          estadoAcademico: String(item.Estado_Académico || "Aprobado"),
          
          curso: "Análisis de Datos / Big Data",
          seccion: String(item.Rango_Etario || "General"),
          correo: `estudiante.${docId}@senati.pe`,
          notas: [
            {
              curso: "Análisis de Datos / Big Data",
              unidad: "Unidad I",
              nota: notaFinal,
            },
          ],
          historialAsistencia: [
            { semana: "Semana 1", porcentaje: asistenciaPct },
          ],
        };

        batch.set(alumnoRef, alumnoData, { merge: true });
        count++;

        if (count === BATCH_SIZE || i === filas.length - 1) {
          await batch.commit();
          console.log(`✅ Lote sincronizado: ${i + 1}/${filas.length}`);
          batch = writeBatch(db);
          count = 0;
        }
      }

      console.log("🎉 ¡Poblamiento completado exitosamente!");
      process.exit(0);
    },
  });
}

ejecutarSeedSincronizado();