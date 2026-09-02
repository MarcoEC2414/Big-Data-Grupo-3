# Diagramas de Arquitectura - Comparativa de Datos

## 1. Diagrama de Componentes

```mermaid
graph TB
    subgraph "Pestaña Comparativa"
        Route["comparativa.tsx<br/>(Route/Layout)"]
    end
    
    subgraph "Componentes UI"
        Uploader["CSVUploader"]
        Selector["ComparisonSelector"]
        Viz["ResultsVisualization"]
        Table["ResultsTable"]
        Filter["FilterPanel"]
        Export["ExportButton"]
    end
    
    subgraph "Hooks"
        UseComp["useComparison"]
        UseFilter["useComparisonFilters"]
        UseCSV["useCSVFile"]
    end
    
    subgraph "Servicios"
        Parser["csvParser"]
        CompService["comparisonService"]
        FieldComp["fieldComparator"]
        ExpService["exportService"]
    end
    
    subgraph "Datos Externos"
        Firebase["Firebase<br/>(Firestore)"]
        LocalFile["Archivo CSV<br/>(Local)"]
    end
    
    Route --> Uploader
    Route --> Selector
    Route --> Viz
    Route --> Table
    Route --> Filter
    Route --> Export
    
    Route --> UseComp
    Route --> UseFilter
    
    Uploader --> UseCSV
    Uploader --> Parser
    
    UseComp --> CompService
    UseComp --> Firebase
    
    Selector --> Firebase
    
    Table --> UseFilter
    
    CompService --> FieldComp
    Export --> ExpService
    
    Parser --> LocalFile
    
    style Route fill:#3b82f6,color:#fff
    style Firebase fill:#f97316,color:#fff
    style LocalFile fill:#8b5cf6,color:#fff
```

## 2. Flujo de Datos Completo

```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as Componentes
    participant Hook as useComparison Hook
    participant Service as Servicios
    participant FB as Firebase
    participant Local as Local Storage
    
    User->>UI: 1. Selecciona CSV
    UI->>UI: Abre dialog de archivos
    User->>Local: Selecciona alumnos.csv
    Local-->>UI: Retorna File object
    UI->>Hook: onFileLoaded(file)
    Hook->>Service: parseCSV(file)
    Service->>Service: Validar tamaño, headers, ID
    Service->>Service: Parsear con PapaParse
    Service-->>Hook: Retorna CSVFile { data, headers, ... }
    Hook-->>UI: setCSVFile(csvFile)
    
    UI->>UI: Muestra "CSV cargado"
    
    User->>UI: 2. Selecciona "Alumnos"
    UI->>Hook: onTypeChange('alumnos')
    Hook->>FB: getAlumnosFirebase()
    FB-->>Hook: Retorna Alumno[]
    Hook-->>UI: setSelectedType, setFirebaseData
    
    UI->>UI: Muestra selección
    
    User->>UI: 3. Clic "Iniciar Comparación"
    UI->>Hook: handleStartComparison()
    Hook->>Service: compareData(firebaseData, csvData, 'alumnos', onProgress)
    
    loop Procesamiento en chunks
        Service->>Service: Procesar 500 alumnos
        Service->>Service: Comparar vs CSV
        Service->>Hook: onProgress({ current, total, status })
        Hook-->>UI: setProgress()
        UI->>UI: Actualizar barra progreso
        Service->>Service: await setTimeout(0)
    end
    
    Service->>Service: Calcular resumen
    Service-->>Hook: Retorna ComparisonResult
    Hook-->>UI: setResult(comparisonResult)
    
    UI->>UI: Renderiza ResultsVisualization
    UI->>UI: Renderiza ResultsTable
    
    User->>UI: 4. Aplica filtros
    UI->>Hook: useComparisonFilters(results)
    Hook->>Hook: Filtra por tipo, ID
    Hook-->>UI: Retorna filteredResults
    
    UI->>UI: Actualiza tabla
    
    User->>UI: 5. Exporta CSV
    UI->>Service: exportToCSV(filteredResults, type, date)
    Service->>Service: Generar contenido CSV
    Service->>Service: Crear Blob
    Service->>Service: downloadFile()
    Service->>Local: Descarga archivo
    
    User->>Local: ✓ data-comparison-alumnos-2024-01-15.csv
```

## 3. Estructura de Estado en useComparison

```mermaid
graph TD
    A["useComparison Hook"] --> B["State Variables"]
    
    B --> B1["csvFile: CSVFile | null"]
    B --> B2["firebaseData: Alumno[]"]
    B --> B3["selectedType: ComparisonType"]
    B --> B4["result: ComparisonResult | null"]
    B --> B5["progress: ProgressState"]
    B --> B6["error: string | null"]
    
    A --> C["Handlers"]
    
    C --> C1["handleLoadCSV"]
    C --> C2["handleLoadFirebaseData"]
    C --> C3["handleStartComparison"]
    C --> C4["handleCancel"]
    
    C1 --> D1["parseCSV → CSVFile"]
    C2 --> D2["getAlumnosFirebase → Alumno[]"]
    C3 --> D3["compareData → ComparisonResult"]
    C4 --> D4["Limpia state"]
    
    style A fill:#3b82f6,color:#fff
    style B fill:#10b981,color:#fff
    style C fill:#f97316,color:#fff
```

## 4. Procesamiento de Comparación en Chunks

```mermaid
graph LR
    A["Firebase Data<br/>n=5000"] -->|Chunk 1<br/>500 registros| B["compareRecords"]
    A -->|Chunk 2<br/>500 registros| B
    A -->|Chunk 3<br/>500 registros| B
    A -->|...| B
    
    B --> C["findDifferences<br/>fieldComparator.compare"]
    
    C --> D["ComparisonItem<br/>{id, type, differences}"]
    
    D --> E["Array&lt;ComparisonItem&gt;"]
    
    E --> F["calculateSummary"]
    
    F --> G["ComparisonResult<br/>{summary, results, timing}"]
    
    style A fill:#f97316,color:#fff
    style B fill:#3b82f6,color:#fff
    style C fill:#8b5cf6,color:#fff
    style G fill:#10b981,color:#fff
```

## 5. Tabla de Comparación de Campos

```mermaid
graph TB
    A["ComparisonItem"] --> B["Firebase Record"]
    A --> C["CSV Record"]
    
    B --> B1["ID: L-2025-1001"]
    B --> B2["nombre: Juan Pérez"]
    B --> B3["asistencia: 85.5"]
    B --> B4["promedio: 8.25"]
    
    C --> C1["ID: L-2025-1001"]
    C --> C2["Nombre: juan perez"]
    C --> C3["Asistencia: 85,5"]
    C --> C4["Nota_Final: 8.25"]
    
    B1 --> D1["✓ COINCIDENCIA"]
    B2 --> D2["✗ DIFERENCIA<br/>Capitalización"]
    B3 --> D3["✓ COINCIDENCIA<br/>Normalizado"]
    B4 --> D4["✓ COINCIDENCIA"]
    
    style A fill:#3b82f6,color:#fff
    style D1 fill:#10b981,color:#fff
    style D2 fill:#ef4444,color:#fff
    style D3 fill:#10b981,color:#fff
    style D4 fill:#10b981,color:#fff
```

## 6. Flujo de Filtrado

```mermaid
graph LR
    A["ComparisonResult<br/>totalRecords=5000"] --> B["FilterPanel<br/>filters: {<br/>  recordTypes: [coincidencia, diferencia],<br/>  searchId: 'L-2025-1',<br/>  expandedRows: Set<br/>}"]
    
    B --> C["useComparisonFilters<br/>useMemo"]
    
    C --> C1["Filtro 1:<br/>Tipo de Registro"]
    C --> C2["Filtro 2:<br/>ID Search"]
    C --> C3["Filtro 3:<br/>Expanded rows"]
    
    C1 --> D["Aplicar AND Logic"]
    C2 --> D
    C3 --> D
    
    D --> E["filteredResults<br/>n=245"]
    
    E --> F["ResultsTable<br/>Virtual Scroll"]
    
    style A fill:#f97316,color:#fff
    style B fill:#3b82f6,color:#fff
    style E fill:#10b981,color:#fff
    style F fill:#8b5cf6,color:#fff
```

## 7. Validación y Manejo de Errores

```mermaid
graph TD
    A["User Carga CSV"] --> B{¿Válido?}
    
    B -->|Tamaño > 50MB| C["❌ ValidationError<br/>file_size"]
    B -->|No es .csv| D["❌ ValidationError<br/>file_type"]
    B -->|Sin columna ID| E["❌ ValidationError<br/>missing_id"]
    B -->|Headers incompletos| F["❌ ValidationError<br/>missing_headers"]
    B -->|CSV vacío| G["❌ ValidationError<br/>empty_file"]
    B -->|✓ Válido| H["✓ Procesar"]
    
    C --> I["ErrorAlert Component<br/>Mostrar mensaje específico"]
    D --> I
    E --> I
    F --> I
    G --> I
    
    H --> J["Continuar Flujo"]
    
    style A fill:#3b82f6,color:#fff
    style B fill:#f97316,color:#fff
    style C fill:#ef4444,color:#fff
    style D fill:#ef4444,color:#fff
    style E fill:#ef4444,color:#fff
    style F fill:#ef4444,color:#fff
    style G fill:#ef4444,color:#fff
    style H fill:#10b981,color:#fff
    style I fill:#f97316,color:#fff
```

## 8. Ciclo de Vida de Componente

```mermaid
graph TD
    A["ComparativaPage<br/>Monta"] --> B["useEffect Cleanup"]
    
    A --> C["useComparison()"]
    A --> D["useComparisonFilters()"]
    
    C --> C1["Estado inicial<br/>csvFile: null<br/>firebaseData: []"]
    
    D --> D1["Estado inicial<br/>filters: defaultFilters"]
    
    B --> B1["Cleanup al desmontar"]
    B1 --> B2["setResult(null)"]
    B1 --> B3["setCSVFile(null)"]
    B1 --> B4["setFirebaseData([])"]
    B1 --> B5["Libera memoria"]
    
    style A fill:#3b82f6,color:#fff
    style B1 fill:#ef4444,color:#fff
    style C fill:#10b981,color:#fff
    style D fill:#10b981,color:#fff
```

## 9. Matriz de Decisión: Comparación Inteligente

```mermaid
graph TD
    A["¿Comparar campos?"] --> B{¿Tipo?}
    
    B -->|String| C["case-insensitive +<br/>trim espacios"]
    B -->|Number| D["Tolerancia ±0.01"]
    B -->|String num| E["Parse + Tolerancia"]
    B -->|Date| F["Normalizar formato"]
    B -->|Boolean| G["Comparación exacta"]
    
    C --> H["¿Son iguales?"]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H -->|Sí| I["✓ COINCIDENCIA"]
    H -->|No| J["✗ DIFERENCIA"]
    
    style A fill:#3b82f6,color:#fff
    style I fill:#10b981,color:#fff
    style J fill:#ef4444,color:#fff
```

## 10. Timeline de Procesamiento

```
CSV Cargado: 0ms
├─ Parse: 50ms
├─ Validación: 20ms
└─ Listo: 70ms

Firebase Data Cargado: 100ms
├─ Query: 80ms
├─ Mapeo: 20ms
└─ Listo: 100ms

Comparación Iniciada: 200ms
├─ Chunk 1 (0-500): 250ms ▓▓░░░░░░░░ (10%)
├─ Chunk 2 (500-1000): 250ms ▓▓▓▓░░░░░░ (20%)
├─ Chunk 3 (1000-1500): 250ms ▓▓▓▓▓▓░░░░ (30%)
├─ Chunk 4 (1500-2000): 250ms ▓▓▓▓▓▓▓▓░░ (40%)
├─ Chunk 5 (2000-2500): 250ms ▓▓▓▓▓▓▓▓▓░ (50%)
├─ ...
├─ Chunk 10 (4500-5000): 250ms ▓▓▓▓▓▓▓▓▓▓ (100%)
└─ Total: ~2500ms (2.5s)

Resumen Calculado: 2700ms
Export CSV: 2800ms

Total: ~2.8s para 5000 registros
```

## 11. Decisiones de Diseño

```mermaid
graph TD
    A["Diseño Técnico<br/>Comparativa de Datos"]
    
    A --> B["Cliente-Side Processing"]
    B --> B1["✓ Privacidad de datos"]
    B --> B2["✓ Funciona sin servidor"]
    B --> B3["✓ Offline capabilities"]
    
    A --> C["Chunked Processing"]
    C --> C1["✓ No bloquea UI"]
    C --> C2["✓ Progreso visible"]
    C --> C3["✓ Cancelable"]
    
    A --> D["Virtual Scrolling"]
    D --> D1["✓ Rendimiento >1000 items"]
    D --> D2["✓ Memoria eficiente"]
    
    A --> E["Comparación Inteligente"]
    E --> E1["✓ Evita falsos positivos"]
    E --> E2["✓ Normaliza datos"]
    
    A --> F["Separación de Responsabilidades"]
    F --> F1["✓ Servicios: lógica pura"]
    F --> F2["✓ Componentes: presentación"]
    F --> F3["✓ Hooks: estado y efectos"]
    
    style A fill:#3b82f6,color:#fff
    style B1 fill:#10b981,color:#fff
    style C1 fill:#10b981,color:#fff
    style D1 fill:#10b981,color:#fff
    style E1 fill:#10b981,color:#fff
    style F1 fill:#10b981,color:#fff
```

