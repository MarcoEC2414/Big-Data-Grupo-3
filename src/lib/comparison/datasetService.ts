import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CSVFile } from "./types";

export type SharedDataset = {
  id: string;
  nombre: string;
  propietarioUid: string;
  propietarioCorreo: string;
  datos: CSVFile["data"];
  headers: string[];
  recordCount: number;
  compartidoCon: string[];
  creadoEn?: unknown;
  actualizadoEn?: unknown;
};

const datasetsRef = collection(db, "datasets");

export async function publicarDataset(
  csvFile: CSVFile,
  propietarioUid: string,
  propietarioCorreo: string
) {
  return addDoc(datasetsRef, {
    nombre: csvFile.name,
    propietarioUid,
    propietarioCorreo,
    datos: csvFile.data,
    headers: csvFile.headers,
    recordCount: csvFile.recordCount,
    compartidoCon: [propietarioUid],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
}

export function escucharDatasetsDisponibles(
  uid: string,
  callback: (datasets: SharedDataset[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(datasetsRef, orderBy("actualizadoEn", "desc")),
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as SharedDataset))
          .filter(
            (dataset) =>
              dataset.propietarioUid === uid ||
              dataset.compartidoCon?.includes(uid)
          )
      );
    },
    (error) => onError?.(error)
  );
}

export function escucharTodosLosDatasets(
  callback: (datasets: SharedDataset[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(datasetsRef, orderBy("actualizadoEn", "desc")),
    (snapshot) =>
      callback(
        snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as SharedDataset))
      ),
    (error) => onError?.(error)
  );
}

export async function compartirDataset(datasetId: string, uid: string, permitir: boolean, usuariosActuales: string[] = []) {
  const dataset = doc(db, "datasets", datasetId);
  const usuarios = new Set(usuariosActuales);
  if (permitir) usuarios.add(uid);
  else usuarios.delete(uid);
  return updateDoc(dataset, {
    compartidoCon: [...usuarios],
    actualizadoEn: serverTimestamp(),
  });
}