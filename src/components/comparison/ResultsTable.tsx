import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ComparisonItem, RECORD_TYPE_LABELS } from '@/lib/comparison/types';

interface ResultsTableProps {
  results: ComparisonItem[];
  isLoading?: boolean;
  expandedRows?: Set<string>;
  onRowExpand?: (itemId: string) => void;
}

type PageSize = 25 | 50 | 100;

const BADGE_COLORS: Record<string, string> = {
  coincidencia: 'bg-green-100 text-green-800 hover:bg-green-100',
  diferencia: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  faltante_csv: 'bg-red-100 text-red-800 hover:bg-red-100',
  faltante_firebase: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
};

export function ResultsTable({
  results,
  isLoading,
  expandedRows = new Set(),
  onRowExpand,
}: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  // Calcular paginación
  const totalPages = useMemo(() => {
    return Math.ceil(results.length / pageSize);
  }, [results.length, pageSize]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return results.slice(startIndex, startIndex + pageSize);
  }, [results, currentPage, pageSize]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value) as PageSize);
    setCurrentPage(1);
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, results.length);

  if (results.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No hay registros que mostrar. Aplica una comparación primero.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de paginación superior */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startRecord} a {endRecord} de {results.length} registros
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted-foreground">
            Registros por página:
          </label>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10 text-center">Expandir</TableHead>
                <TableHead className="min-w-[100px]">ID</TableHead>
                <TableHead className="min-w-[120px]">Tipo</TableHead>
                <TableHead className="min-w-[200px]">Campos Diferentes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell className="text-center w-10">
                      {item.differenceFields.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRowExpand?.(item.id)}
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {item.id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={BADGE_COLORS[item.type]}
                        variant="outline"
                      >
                        {RECORD_TYPE_LABELS[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.differenceFields.length > 0 ? (
                        <span>
                          {item.differenceFields
                            .map((d) => d.fieldName)
                            .join(', ')}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Sin diferencias
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowExpand?.(item.id)}
                        disabled={item.differenceFields.length === 0}
                      >
                        Detalles
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Fila expandida */}
                  {expandedRows.has(item.id) && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="p-6">
                        <div className="space-y-4">
                          {/* Detalles de diferencias */}
                          {item.differenceFields.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-foreground">
                                Campos con Diferencias:
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.differenceFields.map((diff) => (
                                  <Card
                                    key={diff.fieldName}
                                    className="p-4 bg-background border border-border"
                                  >
                                    <p className="text-sm font-medium text-foreground mb-3">
                                      {diff.fieldName}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                          Firebase:
                                        </p>
                                        <p className="text-sm font-mono bg-blue-50 p-2 rounded text-blue-900">
                                          {JSON.stringify(diff.firebaseValue)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                          CSV:
                                        </p>
                                        <p className="text-sm font-mono bg-amber-50 p-2 rounded text-amber-900">
                                          {JSON.stringify(diff.csvValue)}
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Datos completos si aplica */}
                          {item.firebaseRecord && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3">
                                Registro en Firebase:
                              </h4>
                              <div className="bg-blue-50 p-4 rounded border border-blue-200 overflow-auto max-h-48">
                                <pre className="text-xs font-mono text-blue-900">
                                  {JSON.stringify(item.firebaseRecord, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {item.csvRecord && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3">
                                Registro en CSV:
                              </h4>
                              <div className="bg-amber-50 p-4 rounded border border-amber-200 overflow-auto max-h-48">
                                <pre className="text-xs font-mono text-amber-900">
                                  {JSON.stringify(item.csvRecord, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Controles de paginación inferior */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Anterior
          </Button>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
