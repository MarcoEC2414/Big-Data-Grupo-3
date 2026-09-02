# Plan de Implementación: Pestaña Comparativa de Datos

## Overview

Plan detallado de implementación para la pestaña "Comparativa de Datos" que permite comparar registros académicos entre Firebase y archivos CSV. Se estructura en 6 fases que van desde definición de tipos hasta testing, respetando dependencias y acumulando funcionalidad incremental.

**Enfoque:** Procesamiento 100% en navegador, sin servidor intermediario excepto Firebase, con manejo eficiente de hasta 5000 registros y visualización clara de resultados.

---

## Fase 1: Tipos e Interfaces (types.ts)

- [ ] 1.1 Crear archivo types.ts con tipos base
  - Definir `ComparisonType = 'alumnos' | 'cursos'`
  - Definir `ComparisonStatus = 'idle' | 'loading' | 'comparing' | 'complete' | 'error' | 'cancelled'`
  - Definir `RecordType = 'coincidencia' | 'diferencia' | 'faltante_csv' | 'faltante_firebase'`
  - _Requisitos: 2.1, 3.1, 5.1_
  - **Tiempo estimado:** 30 min

- [ ] 1.2 Definir interfaces CSVFile y ComparisonItem
  - Interfaz `CSVFile` con propiedades: name, data, headers, recordCount, loadedAt, size
  - Interfaz `ComparisonItem` con: id, type, firebaseRecord, csvRecord, differenceFields
  - Interfaz `DifferenceField` con: fieldName, firebaseValue, csvValue
  - _Requisitos: 1.1, 3.1, 5.1_
  - **Tiempo estimado:** 20 min

- [ ] 1.3 Definir interfaces ComparisonResult y resumen
  - Interfaz `ComparisonResult` con: type, totalRecords, results, summary, comparisonsAt, processingTimeMs
  - Interfaz `ComparisonSummary` con conteos: coincidencias, diferencias, faltantesEnCSV, faltantesEnFirebase
  - Validar que suma de conteos = totalRecords
  - _Requisitos: 3.1, 5.1_
  - **Tiempo estimado:** 20 min

- [ ] 1.4 Definir interfaces de estado y filtros
  - Interfaz `FilterState` con: recordTypes[], searchId, expandedRows
  - Interfaz `ProgressState` con: current, total, status, message, estimatedTimeMs
  - Interfaz `ValidationError` con tipos específicos: file_size, file_type, missing_id, missing_headers, format_error, empty_file
  - Interfaz `ComparisonError` con: code, message, field, recordId
  - _Requisitos: 6.1, 8.1, 10.1_
  - **Tiempo estimado:** 20 min

- [ ] 1.5 Crear types.ts completo y verificar exportación
  - Exportar todas las interfaces desde types.ts
  - Crear archivo src/lib/comparison/index.ts para re-exportaciones
  - Verificar que TypeScript no reporta errores de compilación
  - _Requisitos: 1.1, 2.1_
  - **Tiempo estimado:** 15 min

---

## Fase 2: Servicios Core

### 2.1 CSV Parser Service

- [x] 2.1 Crear csvParser.ts con función parseCSV
  - Implementar validación de tamaño de archivo (máximo 50MB)
  - Implementar validación de extensión .csv
  - Validar que archivo no esté vacío
  - Usar PapaParse para parsear CSV con opciones: header: true, skipEmptyLines: true
  - _Requisitos: 1.1, 1.2, 1.3, 1.4_
  - **Tiempo estimado:** 30 min

- [ ] 2.2 Implementar validación de columna ID en parseCSV
  - Verificar que existe columna "ID" (case-insensitive)
  - Lanzar error específico si falta
  - Retornar headers parseados en resultado
  - _Requisitos: 1.1, 1.5_
  - **Tiempo estimado:** 20 min

- [ ] 2.3 Implementar validateHeaders para tipo Alumnos/Cursos
  - Validar headers esperados para Alumnos: ID, Sexo, Ciudad, Asistencia, Nota_Final, Situación_Laboral, Nivel_Educativo_Prev, Conectividad_Hogar, Rango_Etario, Estado_Académico
  - Validar headers esperados para Cursos (definir estructura)
  - Lanzar error con headers detectados vs esperados
  - _Requisitos: 1.5, 1.6_
  - **Tiempo estimado:** 20 min

- [ ] 2.4 Implementar normalizeCSVRecord function
  - Normalizar decimales: reemplazar comas por puntos
  - Trimear espacios en blanco
  - Parsear números desde strings
  - Normalizar valores booleanos
  - Aplicar a campos: Asistencia, Nota_Final, etc.
  - _Requisitos: 11.1, 11.3, 11.4_
  - **Tiempo estimado:** 25 min

- [ ] 2.5 Escribir unit tests para csvParser
  - Test: parseCSV válido retorna Record[]
  - Test: CSV sin columna ID lanza error
  - Test: Archivo vacío lanza error
  - Test: Archivo >50MB lanza error
  - Test: Normalización de decimales funciona (coma → punto)
  - Test: Trimeo de espacios en normalización
  - _Requisitos: 1.1, 1.2, 1.3_
  - **Tiempo estimado:** 40 min

### 2.2 Field Comparator Service

- [ ] 2.6 Crear fieldComparator.ts con lógica de comparación
  - Implementar `compare()`: compara dos valores con reglas específicas por tipo
  - Comparación case-insensitive para strings
  - Tolerancia 0.01 para números decimales
  - Normalizar y comparar números parseados desde strings
  - _Requisitos: 11.1, 11.2, 11.3_
  - **Tiempo estimado:** 25 min

- [ ] 2.7 Implementar getFieldType helper
  - Detectar tipo de campo basado en nombre: 'number', 'string', 'date', 'boolean'
  - Mapear campos numéricos: asistencia, promedio, nota_final
  - Mapear campos de fecha
  - _Requisitos: 11.1_
  - **Tiempo estimado:** 15 min

- [ ] 2.8 Escribir unit tests para fieldComparator
  - Test: Comparación case-insensitive strings
  - Test: Tolerancia 0.01 en números (1.005 vs 1.015)
  - Test: Parseo de números desde strings con punto/coma
  - Test: Comparación exacta para otros tipos
  - _Requisitos: 11.1, 11.2_
  - **Tiempo estimado:** 30 min

### 2.3 Comparison Service

- [ ] 2.9 Crear comparisonService.ts con función compareData
  - Implementar procesamiento en chunks: 500 para alumnos, 200 para cursos
  - Crear Map CSV by ID para búsqueda O(1)
  - Iterar Firebase data, comparar con CSV
  - Usar setTimeout(..., 0) para permitir UI updates entre chunks
  - Manejar progreso con callback
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2_
  - **Tiempo estimado:** 40 min

- [ ] 2.10 Implementar compareRecords function
  - Comparar registro Firebase con registro CSV por ID
  - Retornar ComparisonItem con clasificación
  - Detectar campos que difieren usando fieldComparator
  - Manejar casos: coincidencia, diferencia, faltante_csv
  - _Requisitos: 3.3, 3.4_
  - **Tiempo estimado:** 25 min

- [ ] 2.11 Implementar findDifferences helper
  - Iterar campos esperados según tipo (alumnos vs cursos)
  - Comparar cada campo usando fieldComparator.compare()
  - Registrar diferencias encontradas
  - Retornar array de DifferenceField
  - _Requisitos: 3.3, 3.4_
  - **Tiempo estimado:** 20 min

- [ ] 2.12 Implementar calculateSummary function
  - Contar registros por tipo: coincidencias, diferencias, faltantesEnCSV, faltantesEnFirebase
  - Validar invariante: suma de todos = totalRecords
  - Retornar ComparisonSummary
  - _Requisitos: 3.1, 5.1_
  - **Tiempo estimado:** 15 min

- [ ] 2.13 Implementar processRegistrosOnlyInCSV
  - Crear Set de IDs en Firebase para búsqueda rápida
  - Iterar CSV, buscar registros no en Firebase
  - Marcar como 'faltante_firebase'
  - Agregar a results
  - _Requisitos: 3.4, 3.5_
  - **Tiempo estimado:** 20 min

- [ ] 2.14 Implementar estimateRemainingTime helper
  - Calcular velocidad de procesamiento (registros/ms)
  - Estimar tiempo restante basado en registros pendientes
  - Retornar estimatedTimeMs en progreso
  - _Requisitos: 8.1_
  - **Tiempo estimado:** 15 min

- [ ] 2.15 Escribir unit tests para comparisonService
  - Test: Compare data idénticos retorna coincidencias
  - Test: Compare con diferencias detecta campos específicos
  - Test: Registros solo en Firebase marcados correctamente
  - Test: Registros solo en CSV marcados correctamente
  - Test: Procesamiento en chunks no bloquea (async)
  - Test: Summary suma correcta (invariante)
  - _Requisitos: 3.1, 3.2, 3.3_
  - **Tiempo estimado:** 50 min

### 2.4 Export Service

- [ ] 2.16 Crear exportService.ts con función exportToCSV
  - Recibir ComparisonItem[] filtrados
  - Crear CSV con headers: ID, Tipo, Campos_con_Diferencia, Firebase_Valor, CSV_Valor, + campos específicos
  - Incluir solo registros filtrados (respeta filtros aplicados)
  - Generar nombre archivo: data-comparison-{type}-{fecha}.csv
  - _Requisitos: 7.1, 7.2, 7.3_
  - **Tiempo estimado:** 30 min

- [ ] 2.17 Implementar downloadFile helper
  - Crear Blob con contenido CSV
  - Generar URL objetiva
  - Crear elemento <a> y trigger download
  - Limpiar recursos (revokeObjectURL)
  - Mostrar notificación de éxito
  - _Requisitos: 7.1_
  - **Tiempo estimado:** 20 min

- [ ] 2.18 Implementar translateRecordType helper
  - Mapear tipos internos a etiquetas legibles en español
  - coincidencia → "Coincidencia"
  - diferencia → "Diferencia"
  - faltante_csv → "Faltante en CSV"
  - faltante_firebase → "Faltante en Firebase"
  - _Requisitos: 5.1, 7.1_
  - **Tiempo estimado:** 10 min

- [ ] 2.19 Implementar exportToPDF stub (opcional)
  - Crear función documentada para futura implementación
  - Comentar que requiere librería como jsPDF
  - Marcar como TODO para fase futura
  - _Requisitos: 7.4_
  - **Tiempo estimado:** 10 min

- [ ] 2.20 Escribir unit tests para exportService
  - Test: exportToCSV genera CSV válido
  - Test: CSV contiene todos los campos esperados
  - Test: Nombre archivo incluye fecha y tipo
  - Test: Respeta registros filtrados (no incluye todos)
  - Test: Blob se crea correctamente
  - _Requisitos: 7.1, 7.2, 7.3_
  - **Tiempo estimado:** 35 min

---

## Fase 3: Hooks Custom

- [ ] 3.1 Crear useComparison hook
  - Inicializar estado: csvFile, firebaseData, selectedType, result, progress, error
  - Implementar handleLoadCSV: llama parseCSV, actualiza estado
  - Implementar handleLoadFirebaseData: obtiene datos de Firebase según tipo
  - Implementar handleStartComparison: orquesta comparación con progreso
  - Implementar handleCancel: cancela comparación actual
  - _Requisitos: 2.1, 3.1, 6.1, 8.1_
  - **Tiempo estimado:** 40 min

- [ ] 3.2 Implementar cleanup en useComparison
  - Agregar useEffect para limpiar recursos al desmontar
  - Liberar referencias: result, csvFile, firebaseData
  - Limpiar abortController si existe (para cancelación)
  - _Requisitos: 8.1, 9.1_
  - **Tiempo estimado:** 15 min

- [ ] 3.3 Crear useComparisonFilters hook
  - Inicializar FilterState con todos los tipos seleccionados
  - Implementar filteredResults con useMemo
  - Lógica de filtro: tipo AND searchId
  - Implementar handleFilterChange
  - Implementar handleToggleRowExpanded
  - Implementar handleClearFilters
  - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - **Tiempo estimado:** 35 min

- [ ] 3.4 Crear useCSVFile hook (opcional)
  - Encapsular lógica de gestión de múltiples archivos CSV
  - Permitir hasta 5 archivos simultáneos
  - Métodos: addFile, removeFile, getFile, listFiles
  - _Requisitos: 1.8_
  - **Tiempo estimado:** 25 min

- [ ] 3.5 Escribir tests para hooks
  - Test: useComparison inicia con estado correcto
  - Test: handleLoadCSV valida y actualiza estado
  - Test: useComparisonFilters filtra correctamente
  - Test: Filtros AND se aplican correctamente
  - Test: handleClearFilters reseta estado
  - _Requisitos: 3.1, 6.1_
  - **Tiempo estimado:** 40 min

---

## Fase 4: Componentes UI

### 4.1 CSVUploader Component

- [x] 4.1 Crear CSVUploader.tsx con drag-and-drop
  - Zona de drop zone para archivos
  - Input file type="file" accept=".csv"
  - Mostrar nombre y tamaño del archivo
  - Mostrar progreso de carga
  - Mostrar cantidad de registros parseados
  - _Requisitos: 1.1, 1.2, 1.3, 1.9_
  - **Tiempo estimado:** 35 min

- [x] 4.2 Implementar validación visual en CSVUploader
  - Mostrar errores específicos con iconografía
  - Mostrar archivo cargado exitosamente (checkmark)
  - Permitir cargar otro archivo (reemplazar)
  - Mostrar notificación de éxito con toast/sonner
  - _Requisitos: 1.6, 1.9_
  - **Tiempo estimado:** 25 min

- [ ] 4.3 Implementar soporte múltiples archivos en CSVUploader
  - Mostrar lista de archivos cargados
  - Máximo 5 archivos simultáneos
  - Botón para remover archivo individual
  - Mostrar contador "X archivos cargados"
  - _Requisitos: 1.8_
  - **Tiempo estimado:** 30 min

### 4.2 ComparisonSelector Component

- [ ] 4.4 Crear ComparisonSelector.tsx con radio buttons
  - Radio button para Alumnos/Cursos
  - Mostrar cantidad de registros en Firebase
  - Mostrar cantidad de registros en CSV cargado
  - Mensaje si no hay CSV cargado
  - Botón "Iniciar Comparación" habilitado si hay datos
  - _Requisitos: 2.1, 2.2, 2.3_
  - **Tiempo estimado:** 30 min

- [ ] 4.5 Implementar estado de carga en ComparisonSelector
  - Mostrar skeleton/loading mientras se obtienen datos Firebase
  - Mostrar spinner si está comparando
  - Desabilitar cambios mientras se compara
  - _Requisitos: 2.1, 8.1_
  - **Tiempo estimado:** 20 min

### 4.3 ResultsVisualization Component

- [ ] 4.6 Crear ResultsVisualization.tsx con resumen
  - 4 cards: Coincidencias | Diferencias | Faltantes_CSV | Faltantes_Firebase
  - Mostrar números y porcentajes
  - Mostrar tiempo de procesamiento
  - _Requisitos: 5.1, 5.2_
  - **Tiempo estimado:** 30 min

- [ ] 4.7 Implementar gráfico de torta/barras
  - Usar Recharts para visualización
  - Gráfico de torta: proporciones de tipos
  - Leyenda con colores distintivos
  - Hover tooltip con detalles
  - _Requisitos: 5.2_
  - **Tiempo estimado:** 30 min

### 4.4 ResultsTable Component

- [ ] 4.8 Crear ResultsTable.tsx con tabla básica
  - Columnas: ID | Tipo | Campos_Diferentes | Detalles
  - Usar shadcn/ui Table
  - Mostrar icono según tipo de clasificación
  - Highlight visual para diferencias
  - _Requisitos: 5.3, 5.4, 5.5_
  - **Tiempo estimado:** 40 min

- [ ] 4.9 Implementar paginación en ResultsTable
  - Opciones: 25, 50, 100 registros por página
  - Controles previous/next
  - Mostrar "Mostrando X-Y de Z"
  - _Requisitos: 5.6_
  - **Tiempo estimado:** 25 min

- [ ] 4.10 Implementar ordenamiento por columnas
  - Click en header para ordenar
  - Indicador visual de orden (↑/↓)
  - Alternar ASC/DESC
  - _Requisitos: 5.5_
  - **Tiempo estimado:** 20 min

- [ ] 4.11 Implementar expandir detalles de fila
  - Click en fila expande detalles
  - Mostrar todos los campos side-by-side
  - Highlight campos que difieren
  - Botón para colapsar
  - _Requisitos: 5.7_
  - **Tiempo estimado:** 35 min

- [ ] 4.12 Implementar virtualización con react-window
  - Renderizar solo filas visibles
  - Scroll suave para miles de registros
  - Performance acceptable (<50ms por scroll)
  - _Requisitos: 5.6, 8.2_
  - **Tiempo estimado:** 40 min

### 4.5 FilterPanel Component

- [ ] 4.13 Crear FilterPanel.tsx con filtros
  - Checkboxes para tipos: Coincidencias | Diferencias | Faltantes
  - Input búsqueda por ID
  - Mostrar cantidad coincidiendo filtros
  - Botón "Limpiar Filtros"
  - _Requisitos: 6.1, 6.2, 6.3_
  - **Tiempo estimado:** 30 min

- [ ] 4.14 Implementar búsqueda por ID en tiempo real
  - Input con debounce (300ms)
  - Filter case-insensitive
  - Actualizar resultados instantáneamente
  - Mostrar contador de coincidencias
  - _Requisitos: 6.2, 6.3, 6.4_
  - **Tiempo estimado:** 20 min

### 4.6 ExportButton Component

- [ ] 4.15 Crear ExportButton.tsx con botones exportación
  - Botón "Exportar a CSV"
  - Botón "Copiar al Portapapeles" (opcional)
  - Mostrar tooltip con info
  - Desabilitar si no hay resultados
  - _Requisitos: 7.1, 7.5_
  - **Tiempo estimado:** 25 min

- [ ] 4.16 Implementar confirmación y notificación de exportación
  - Mostrar toast de confirmación tras exportar
  - Indicar cantidad de registros exportados
  - Mostrar nombre del archivo
  - _Requisitos: 7.6_
  - **Tiempo estimado:** 15 min

---

## Fase 5: Integración en Router y Navegación

- [ ] 5.1 Crear ruta /comparativa
  - Crear archivo src/routes/comparativa.tsx
  - Exportar componente ComparativaPage
  - Integrar con TanStack Router
  - _Requisitos: 2.1, 12.1_
  - **Tiempo estimado:** 25 min

- [ ] 5.2 Implementar layout principal de ComparativaPage
  - Usar Shell component para consistencia
  - Título: "Comparativa de Datos"
  - Subtítulo descriptivo
  - Secciones numeradas (1-4)
  - _Requisitos: 2.1_
  - **Tiempo estimado:** 20 min

- [ ] 5.3 Orquestar componentes en ComparativaPage
  - Secuencia: CSVUploader → ComparisonSelector → Comparación → Resultados
  - Integrar hooks useComparison y useComparisonFilters
  - Pasar props correctamente entre componentes
  - Mostrar errores con ErrorAlert
  - _Requisitos: 2.1, 10.1_
  - **Tiempo estimado:** 30 min

- [ ] 5.4 Implementar barra de progreso durante comparación
  - Mostrar cuando status === 'comparing'
  - Usar Progress component de shadcn/ui
  - Mostrar "Procesados X de Y registros"
  - Mostrar tiempo estimado restante
  - _Requisitos: 8.1_
  - **Tiempo estimado:** 20 min

- [ ] 5.5 Agregar navegación en Shell.tsx
  - Agregar item "Comparativa" al NAV
  - Usar icono "GitCompare" de lucide-react
  - Ruta: "/comparativa"
  - Verificar orden lógico en menú
  - _Requisitos: 2.1, 12.1_
  - **Tiempo estimado:** 15 min

- [ ] 5.6 Actualizar routeTree.gen.ts
  - Crear ruta en TanStack Router
  - Verificar que genera correctamente
  - Testing de navegación funciona
  - _Requisitos: 2.1_
  - **Tiempo estimado:** 15 min

- [ ] 5.7 Implementar independencia de pestañas
  - Usar sesión/state específico de componente, no localStorage global
  - Cada pestaña mantiene su propio ComparisonResult
  - Cambio de pestaña no afecta a otras
  - _Requisitos: 12.1, 12.2, 12.3_
  - **Tiempo estimado:** 20 min

---

## Fase 6: Testing e Integración

### 6.1 Integration Tests

- [ ] 6.1 Crear test: Flujo completo CSV → Comparación → Exportación
  - Cargar CSV válido
  - Seleccionar tipo Alumnos
  - Iniciar comparación
  - Verificar resultados obtenidos
  - Exportar a CSV
  - Verificar archivo descargado
  - _Requisitos: 3.1, 7.1_
  - **Tiempo estimado:** 50 min

- [ ] 6.2 Crear test: Filtrados aplican correctamente
  - Cargar resultados de comparación
  - Aplicar filtro: solo "Diferencias"
  - Verificar que tabla muestra solo diferencias
  - Aplicar búsqueda por ID
  - Verificar resultado filtra correctamente
  - _Requisitos: 6.1, 6.3, 6.4_
  - **Tiempo estimado:** 35 min

- [ ] 6.3 Crear test: Paginación funciona
  - Cargar resultados (>50 registros)
  - Cambiar tamaño página: 25 → 50 → 100
  - Verificar cantidad de filas renderizadas
  - Navegar entre páginas
  - _Requisitos: 5.6_
  - **Tiempo estimado:** 30 min

- [ ] 6.4 Crear test: Manejo de errores CSV
  - Intentar cargar archivo >50MB
  - Intentar cargar archivo sin columna ID
  - Intentar cargar archivo vacío
  - Verificar que se muestran mensajes de error específicos
  - _Requisitos: 1.3, 1.4, 1.5, 10.1_
  - **Tiempo estimado:** 30 min

- [ ] 6.5 Crear test: Manejo de errores Firebase
  - Simular timeout de Firebase (>30s)
  - Simular desconexión durante comparación
  - Verificar que se muestran mensajes de error
  - Verificar que datos ya cargados se mantienen
  - _Requisitos: 9.2, 9.6_
  - **Tiempo estimado:** 35 min

- [ ] 6.6 Crear test: Performance con múltiples registros
  - Cargar 5000 registros (mock)
  - Verificar que comparación termina en <5s
  - Verificar que UI no se bloquea (progreso se actualiza)
  - Verificar virtualización funciona (tabla scroll fluido)
  - _Requisitos: 3.6, 8.1, 8.2_
  - **Tiempo estimado:** 40 min

### 6.2 Validación de Invariantes

- [ ] 6.7 Validar invariante: Suma de conteos = totalRecords
  - Para cada comparación, verificar: coincidencias + diferencias + faltantes == totalRecords
  - Ejecutar para múltiples datasets
  - Documentar resultados
  - _Requisitos: Invariante crítica_
  - **Tiempo estimado:** 25 min

- [ ] 6.8 Validar invariante: Round-trip CSV
  - Cargar CSV → Parsear → Exportar → Parsear nuevamente
  - Verificar que data es idéntica
  - Verificar cantidad de registros preservada
  - _Requisitos: Propiedad de CSV parser_
  - **Tiempo estimado:** 25 min

- [ ] 6.9 Validar invariante: Idempotencia de comparación
  - Ejecutar comparación 2 veces con mismos datos
  - Verificar que resultados son idénticos
  - Comparar timestamps y processingTime
  - _Requisitos: Propiedad idempotencia_
  - **Tiempo estimado:** 20 min

### 6.3 Testing Manual y Verificación

- [ ] 6.10 Verificar visualización de resultados
  - Comparación con 100% coincidencias
  - Comparación con 100% diferencias
  - Comparación con 100% faltantes
  - Comparación mixta (50% coincidencias, 30% diferencias, 20% faltantes)
  - Verificar gráfico se actualiza correctamente
  - _Requisitos: 5.1, 5.2_
  - **Tiempo estimado:** 30 min

- [ ] 6.11 Verificar componentes de UI
  - Verificar CSVUploader: drag-and-drop funciona
  - Verificar ComparisonSelector: cambio de tipo funciona
  - Verificar ResultsTable: expandir detalles funciona
  - Verificar FilterPanel: filtros se aplican
  - Verificar ExportButton: descarga archivo
  - _Requisitos: 5.1, 6.1, 7.1_
  - **Tiempo estimado:** 40 min

- [ ] 6.12 Testing de edge cases
  - Registros con caracteres especiales (ñ, acentos, símbolos)
  - Registros con comillas sin cerrar en CSV
  - Registros con espacios en blanco extras
  - IDs con ceros a la izquierda (string vs number)
  - Valores numéricos con formato inconsistente
  - _Requisitos: 10.1, 10.2, 11.1_
  - **Tiempo estimado:** 35 min

- [ ] 6.13 Cleanup y documentación
  - Remover código de debug
  - Documentar funciones complejas
  - Crear README para módulo comparison
  - Verificar que no hay console.log en producción
  - _Requisitos: 2.1_
  - **Tiempo estimado:** 25 min

### 6.4 Checkpoint Final

- [ ] 6.14 Checkpoint - Asegurar que todos los tests pasan
  - Ejecutar suite completa de tests
  - Verificar cobertura >80%
  - Verificar no hay warnings en consola
  - Verificar compilación TypeScript sin errores
  - _Requisitos: 3.1_
  - **Tiempo estimado:** 30 min

- [ ] 6.15 Verificación con usuario/docente
  - Demostración de características principales
  - Recolectar feedback sobre UI/UX
  - Verificar que cubre casos de uso del usuario
  - Documentar feedback para iteraciones futuras
  - _Requisitos: 1.1-12.1_
  - **Tiempo estimado:** 45 min

---

## Resumen de Cobertura de Requisitos

| Requisito | Tareas Relacionadas | Estado |
|-----------|-------------------|--------|
| 1 - Carga CSV | 2.1-2.5, 4.1-4.3, 6.4 | Cubierto |
| 2 - Selección Fuentes | 4.4, 4.5, 5.3 | Cubierto |
| 3 - Comparación Alumnos | 2.9-2.15, 5.3, 6.1-6.6 | Cubierto |
| 4 - Comparación Cursos | 2.9-2.15 (adaptado) | Cubierto |
| 5 - Visualización | 4.6, 4.7, 6.10 | Cubierto |
| 6 - Filtrado | 3.3, 4.13, 4.14, 6.2 | Cubierto |
| 7 - Exportación | 2.16-2.20, 4.15, 4.16, 6.1 | Cubierto |
| 8 - Performance | 2.9, 2.14, 4.12, 5.4, 6.6 | Cubierto |
| 9 - Navegador Independiente | 2.1, 3.1, 5.1 | Cubierto |
| 10 - Manejo Errores | 2.1, 2.2, 6.4, 6.5, 6.12 | Cubierto |
| 11 - Comparación Inteligente | 2.6, 2.7, 6.12 | Cubierto |
| 12 - Independencia Pestañas | 5.7 | Cubierto |

---

## Notas Importantes

1. **Orden de Ejecución:** Las fases deben ejecutarse secuencialmente. Cada fase depende de la anterior.

2. **Testing:** Las sub-tareas de testing (marcadas con asterisco en algunas fases) son opcionales para MVP pero recomendadas para calidad.

3. **Performance:** Fase 4.12 (virtualización) es crítica para performance con >1000 registros.

4. **Cleanup:** Usar Task 6.14 como checkpoint final antes de marcar como completo.

5. **Requisitos:** Cada tarea referencia requisitos específicos para trazabilidad.

6. **Tiempo Total Estimado:** ~80-100 horas de desarrollo

7. **Dependencias Externas:** PapaParse (CSV), Recharts (gráficos), shadcn/ui (componentes), Firebase (datos).
