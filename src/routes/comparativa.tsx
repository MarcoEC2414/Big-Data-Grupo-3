import React, { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Shell } from '@/components/Shell';
import {
  CSVUploader,
  ComparisonSelector,
  ResultsVisualization,
  ResultsTable,
  FilterPanel,
  ExportButton,
  AcademicResultsTable,
  DemographicAnalysis,
  DatasetVsDatasetPanel,
  HistoricoInstitucional,
} from '@/components/comparison';
import { useComparison } from '@/hooks/useComparison';
import { useComparisonFilters } from '@/hooks/useComparisonFilters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, History, UploadCloud } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/comparativa')({
  head: () => ({
    meta: [
      { title: 'Comparativa de Datos — SENATI Gestión Docente' },
      {
        name: 'description',
        content:
          'Analítica histórica institucional precargada y auditoría externa mediante carga de CSV para comparar registros académicos.',
      },
      { property: 'og:title', content: 'Comparativa de Datos — SENATI Gestión Docente' },
      {
        property: 'og:description',
        content:
          'Herramienta de análisis comparativo de datos con exportación a CSV e informes institucionales.',
      },
    ],
  }),
  component: ComparativaPage,
});

/**
 * Módulo Comparativa — arquitectura híbrida en 2 pestañas:
 *
 * 1) "Histórico Institucional (Precargado)" — activa por defecto. Analítica
 *    multianual (2023-I a 2026-I) instantánea a partir de datos
 *    pre-agregados (rollups), sin subir archivos ni sobrecargar al cliente.
 *    Incluye modo de impresión formal tipo informe institucional.
 *
 * 2) "Auditoría Externa (Cargar CSV)" — conserva la funcionalidad existente
 *    de ingesta manual (CSV vs Firebase y Dataset vs Dataset) para auditar
 *    datasets nuevos o externos bajo demanda.
 */
function ComparativaPage() {
  const {
    csvFile,
    firebaseData,
    selectedType,
    result,
    progress,
    error,
    handleLoadCSV,
    handlePublishDataset,
    handleLoadDataset,
    datasets,
    handleLoadFirebaseData,
    handleStartComparison,
  } = useComparison();

  const {
    filters,
    filteredResults,
    handleFilterChange,
    handleToggleRowExpanded,
    handleClearFilters,
  } = useComparisonFilters(result?.results || []);

  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  const showComparison = csvFile && firebaseData.length > 0;
  const showResults = result && result.results.length > 0;
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Shell
      title="Comparativa de Datos"
      subtitle="Histórico institucional precargado y auditoría externa mediante CSV"
    >
      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:inline-grid sm:grid-cols-2 print:hidden">
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico Institucional (Precargado)
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Auditoría Externa (Cargar CSV)
          </TabsTrigger>
        </TabsList>

        {/* ================= Pestaña 1: Histórico Institucional ================= */}
        <TabsContent value="historico" className="mt-6">
          <HistoricoInstitucional />
        </TabsContent>

        {/* ================= Pestaña 2: Auditoría Externa (CSV) ================= */}
        <TabsContent value="auditoria" className="mt-6">
          <Tabs defaultValue="csv-firebase" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
              <TabsTrigger value="csv-firebase">CSV vs Firebase</TabsTrigger>
              <TabsTrigger value="dataset-vs-dataset">Dataset A vs Dataset B</TabsTrigger>
            </TabsList>

            <TabsContent value="csv-firebase" className="mt-6">
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Sección 1: Carga de CSV */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      1
                    </div>
                    <h2 className="text-lg font-semibold">Cargar Archivo CSV</h2>
                    {csvFile && (
                      <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground ml-10">
                    Selecciona un archivo CSV con los datos que deseas comparar
                  </p>
                  <div className="ml-10">
                    <CSVUploader
                      onFileLoaded={handleLoadCSV}
                      onError={() => {}}
                      csvFile={csvFile}
                      datasets={datasets}
                      onDatasetSelected={handleLoadDataset}
                      onPublish={handlePublishDataset}
                    />
                  </div>
                </div>

                <Separator />

                {/* Sección 2: Selección de tipo de comparación */}
                {csvFile && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        2
                      </div>
                      <h2 className="text-lg font-semibold">Seleccionar Tipo</h2>
                      {firebaseData.length > 0 && (
                        <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Elige si deseas comparar Alumnos o Cursos
                    </p>
                    <div className="ml-10">
                      <ComparisonSelector
                        selectedType={selectedType}
                        onTypeChange={handleLoadFirebaseData}
                        csvRecordCount={csvFile.recordCount}
                        firebaseRecordCount={firebaseData.length}
                        isLoading={progress.status === 'loading'}
                        csvLoaded={!!csvFile}
                        onStartComparison={
                          showComparison ? handleStartComparison : undefined
                        }
                        comparisonInProgress={progress.status === 'comparing'}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Sección 3: Progreso de comparación */}
                {progress.status === 'comparing' && (
                  <Card className="p-6 bg-blue-500/10 border-blue-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        3
                      </div>
                      <h3 className="font-semibold text-foreground">Comparando datos...</h3>
                    </div>

                    <div className="ml-11 space-y-3">
                      {/* Barra de progreso con Tailwind puro */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-in-out"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">
                          Procesados {progress.current} de {progress.total} registros
                        </p>
                        {progress.estimatedTimeMs && (
                          <p className="text-muted-foreground">
                            Tiempo estimado:{' '}
                            {(progress.estimatedTimeMs / 1000).toFixed(1)}s
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Sección 4: Resultados */}
                {showResults && (
                  <div className="space-y-6">
                    <Separator />
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        4
                      </div>
                      <h2 className="text-lg font-semibold">Resultados</h2>
                      <CheckCircle2 className="h-5 w-5 text-green-400 ml-auto" />
                    </div>

                    <div className="ml-10">
                      <ResultsVisualization result={result} />
                    </div>

                    <div className="ml-10">
                      <Tabs defaultValue={result.analisisAcademico ? "academico" : "comparacion"} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          {result.analisisAcademico ? (
                            <>
                              <TabsTrigger value="academico">Análisis Académico y Riesgo</TabsTrigger>
                              <TabsTrigger value="demografico">Grupos Demográficos</TabsTrigger>
                              <TabsTrigger value="comparacion">Registros y Diferencias</TabsTrigger>
                            </>
                          ) : (
                            <TabsTrigger value="comparacion">Comparación de Datos</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="comparacion" className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-1">
                              <FilterPanel
                                filters={filters}
                                onFiltersChange={handleFilterChange}
                                recordCount={result.totalRecords}
                                matchingCount={filteredResults.length}
                              />
                              <button
                                onClick={handleClearFilters}
                                className="mt-4 w-full px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
                              >
                                Limpiar Filtros
                              </button>
                            </div>

                            <div className="lg:col-span-3">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-foreground">
                                    Resultados ({filteredResults.length})
                                  </h3>
                                  <ExportButton
                                    results={result.results}
                                    filteredResults={filteredResults}
                                    comparisonType={selectedType}
                                    comparisonsAt={result.comparisonsAt}
                                  />
                                </div>
                                <ResultsTable
                                  results={filteredResults}
                                  expandedRows={filters.expandedRows}
                                  onRowExpand={handleToggleRowExpanded}
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {result.analisisAcademico && (
                          <TabsContent value="academico" className="space-y-4 mt-4">
                            <AcademicResultsTable
                              analisisData={result.analisisAcademico.analisisIndividual}
                            />
                          </TabsContent>
                        )}

                        {result.analisisAcademico && (
                          <TabsContent value="demografico" className="space-y-4 mt-4">
                            <DemographicAnalysis
                              analisisGrupos={result.analisisAcademico.analisisGrupos}
                            />
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* Estado vacío */}
                {!showComparison && (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      Carga un archivo CSV para comenzar la comparación
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dataset-vs-dataset" className="mt-6">
              <DatasetVsDatasetPanel datasets={datasets} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}