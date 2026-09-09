import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Minus,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SharedDataset } from "@/lib/comparison/datasetService";

const CAMPO_ID_CANDIDATOS = ["ID", "Id", "id", "id_estudiante", "ID_Estudiante", "DNI", "dni"];

function obtenerIdRegistro(registro: Record<string, string>): string | null {
  for (const campo of CAMPO_ID_CANDIDATOS) {
    const valor = registro[campo];
    if (valor && valor.trim().length > 0) return valor.trim();
  }
  return null;
}

function obtenerCamposComparables(a: SharedDataset | undefined, b: SharedDataset | undefined): string[] {
  const headersA = a?.headers || [];
  const headersB = b?.headers || [];
  const set = new Set<string>([...headersA, ...headersB]);
  CAMPO_ID_CANDIDATOS.forEach((campo) => set.delete(campo));
  return Array.from(set);
}

type FilaComparada = {
  idEstudiante: string;
  registroA: Record<string, string> | null;
  registroB: Record<string, string> | null;
  diferencias: string[];
};

function compararDatasets(
  datasetA: SharedDataset | undefined,
  datasetB: SharedDataset | undefined
): { filas: FilaComparada[]; campos: string[] } {
  const campos = obtenerCamposComparables(datasetA, datasetB);

  if (!datasetA || !datasetB) {
    return { filas: [], campos };
  }

  const mapaA = new Map<string, Record<string, string>>();
  for (const registro of datasetA.datos) {
    const id = obtenerIdRegistro(registro);
    if (id) mapaA.set(id, registro);
  }

  const mapaB = new Map<string, Record<string, string>>();
  for (const registro of datasetB.datos) {
    const id = obtenerIdRegistro(registro);
    if (id) mapaB.set(id, registro);
  }

  const idsUnicos = new Set<string>([...mapaA.keys(), ...mapaB.keys()]);

  const filas: FilaComparada[] = Array.from(idsUnicos)
    .sort()
    .map((idEstudiante) => {
      const registroA = mapaA.get(idEstudiante) || null;
      const registroB = mapaB.get(idEstudiante) || null;
      const diferencias = campos.filter((campo) => {
        const valorA = registroA?.[campo] ?? "";
        const valorB = registroB?.[campo] ?? "";
        return valorA !== valorB;
      });
      return { idEstudiante, registroA, registroB, diferencias };
    });

  return { filas, campos };
}

function EstadoFila({ fila }: { fila: FilaComparada }) {
  if (!fila.registroA) {
    return (
      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400">
        Solo en Dataset B
      </Badge>
    );
  }
  if (!fila.registroB) {
    return (
      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400">
        Solo en Dataset A
      </Badge>
    );
  }
  if (fila.diferencias.length === 0) {
    return (
      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Coincide
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-400">
      <XCircle className="mr-1 h-3 w-3" />
      {fila.diferencias.length} diferencia{fila.diferencias.length > 1 ? "s" : ""}
    </Badge>
  );
}

export function DatasetVsDatasetPanel({ datasets }: { datasets: SharedDataset[] }) {
  const [idDatasetA, setIdDatasetA] = useState<string>(datasets[0]?.id || "");
  const [idDatasetB, setIdDatasetB] = useState<string>(datasets[1]?.id || datasets[0]?.id || "");
  const [soloDiferencias, setSoloDiferencias] = useState(false);

  const datasetA = datasets.find((d) => d.id === idDatasetA);
  const datasetB = datasets.find((d) => d.id === idDatasetB);

  const { filas, campos } = useMemo(
    () => compararDatasets(datasetA, datasetB),
    [datasetA, datasetB]
  );

  const filasVisibles = soloDiferencias
    ? filas.filter((f) => f.diferencias.length > 0 || !f.registroA || !f.registroB)
    : filas;

  const resumen = useMemo(() => {
    const coincidencias = filas.filter(
      (f) => f.registroA && f.registroB && f.diferencias.length === 0
    ).length;
    const conDiferencias = filas.filter(
      (f) => f.registroA && f.registroB && f.diferencias.length > 0
    ).length;
    const soloA = filas.filter((f) => f.registroA && !f.registroB).length;
    const soloB = filas.filter((f) => !f.registroA && f.registroB).length;
    return { coincidencias, conDiferencias, soloA, soloB, total: filas.length };
  }, [filas]);

  if (datasets.length < 2) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Necesitas al menos dos datasets cargados o compartidos para comparar A vs B.
        Publica un dataset desde el paso 1 y pide al Administrador que comparta al menos
        otro más.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dataset A
          </label>
          <Select value={idDatasetA} onValueChange={setIdDatasetA}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el Dataset A" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.nombre} ({dataset.recordCount} registros)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dataset B
          </label>
          <Select value={idDatasetB} onValueChange={setIdDatasetB}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el Dataset B" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.nombre} ({dataset.recordCount} registros)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {datasetA && datasetB && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {datasetA.nombre}
            </span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-semibold text-foreground">{datasetB.nombre}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Comparación por ID de estudiante · {campos.length} campos evaluados
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{resumen.total}</p>
              <p className="text-xs text-muted-foreground">Estudiantes totales</p>
            </Card>
            <Card className="p-3 text-center border-emerald-500/20 bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-400">{resumen.coincidencias}</p>
              <p className="text-xs text-emerald-400">Coinciden</p>
            </Card>
            <Card className="p-3 text-center border-red-500/20 bg-red-500/10">
              <p className="text-2xl font-bold text-red-400">{resumen.conDiferencias}</p>
              <p className="text-xs text-red-400">Con diferencias</p>
            </Card>
            <Card className="p-3 text-center border-amber-500/20 bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-400">
                {resumen.soloA + resumen.soloB}
              </p>
              <p className="text-xs text-amber-400">Solo en A o B</p>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Registros ({filasVisibles.length})
            </h3>
            <button
              type="button"
              onClick={() => setSoloDiferencias((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                soloDiferencias
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {soloDiferencias ? "Mostrando solo diferencias" : "Mostrar solo diferencias"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Estudiante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Campos con diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filasVisibles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      <Minus className="mx-auto mb-2 h-5 w-5" />
                      No hay registros que mostrar con el filtro actual.
                    </TableCell>
                  </TableRow>
                ) : (
                  filasVisibles.map((fila) => (
                    <TableRow key={fila.idEstudiante}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {fila.idEstudiante}
                      </TableCell>
                      <TableCell>
                        <EstadoFila fila={fila} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fila.diferencias.length > 0
                          ? fila.diferencias.join(", ")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
