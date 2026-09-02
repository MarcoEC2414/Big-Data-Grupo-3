# Requisitos: Pestaña Comparativa de Datos

## Introducción

La pestaña "Comparativa" es una nueva funcionalidad de la aplicación SRM que permite a los docentes comparar datos académicos entre dos fuentes: la base de datos en Firebase (datos en producción) y archivos CSV locales (datos de prueba, importación o auditoría). Esta capacidad simula un entorno big data permitiendo identificar diferencias, discrepancias, datos faltantes y cambios entre versiones de datos, facilitando tareas de validación, migración y análisis comparativo.

## Glosario

- **Firebase**: Sistema de base de datos en tiempo real donde se almacenan los datos de alumnos en producción
- **CSV_Local**: Archivo de formato separado por comas (CSV) cargado localmente en el navegador del usuario
- **Alumno**: Entidad que representa un estudiante con atributos como ID, nombre, nota, ciudad, etc.
- **Curso**: Entidad que agrupa a múltiples alumnos bajo una unidad académica
- **Comparativa**: Análisis lado a lado de dos conjuntos de datos para identificar diferencias
- **Coincidencia**: Registro que existe en ambas fuentes con valores idénticos
- **Diferencia**: Registro que existe en ambas fuentes pero con valores distintos en uno o más campos
- **Dato_Faltante**: Registro que existe en una fuente pero no en la otra
- **Carga_CSV**: Proceso de importar un archivo CSV desde el sistema de archivos local
- **Visualización_Comparativa**: Panel gráfico que muestra resultados de la comparación
- **Filtro**: Criterio de búsqueda aplicado a los datos comparativos
- **Columna**: Campo individual de datos (ej: Nota_Final, Ciudad, Asistencia)
- **Fila**: Registro completo de un alumno o curso
- **Performance**: Medida de velocidad y eficiencia en el procesamiento de datos

## Requisitos

### Requisito 1: Carga de Archivos CSV

**Historia de Usuario**: Como docente, quiero cargar archivos CSV locales, para poder compararlos con los datos en Firebase.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al usuario seleccionar archivos CSV desde el disco local mediante un diálogo estándar de selección de archivos
2. THE Sistema SHALL aceptar archivos con extensión .csv únicamente
3. WHEN un archivo CSV es cargado, THE Sistema SHALL validar que el archivo tenga un tamaño menor a 50MB
4. WHEN un archivo CSV es cargado, THE Sistema SHALL validar que el archivo contenga la columna "ID" como identificador único
5. WHEN un archivo CSV es cargado, THE Sistema SHALL validar que los encabezados de columnas coincidan con los esperados para Alumnos (ID, Sexo, Ciudad, Asistencia, Nota_Final, Situación_Laboral, Nivel_Educativo_Prev, Conectividad_Hogar, Rango_Etario, Estado_Académico) o Cursos
6. IF un archivo no cumple con los requisitos de validación, THEN THE Sistema SHALL mostrar un mensaje de error específico indicando el problema
7. THE Sistema SHALL procesar el CSV en el navegador sin enviar datos a servidores externos
8. WHERE el usuario carga múltiples archivos, THE Sistema SHALL permitir la gestión de hasta 5 archivos simultáneamente
9. WHEN la carga se completa exitosamente, THE Sistema SHALL mostrar una notificación de éxito con el nombre del archivo y cantidad de registros

### Requisito 2: Selección de Fuentes de Comparación

**Historia de Usuario**: Como docente, quiero seleccionar qué datos deseo comparar (Alumnos o Cursos), para poder realizar análisis específicos según mis necesidades.

#### Criterios de Aceptación

1. THE Sistema SHALL presentar opciones de selección para comparar datos de Alumnos o Cursos
2. WHEN Alumnos es seleccionado, THE Sistema SHALL recuperar todos los registros de alumnos desde Firebase
3. WHEN Cursos es seleccionado, THE Sistema SHALL recuperar todos los registros de cursos desde Firebase
4. THE Sistema SHALL mostrar la cantidad de registros disponibles en Firebase para la categoría seleccionada
5. THE Sistema SHALL mostrar la cantidad de registros en el archivo CSV cargado
6. IF no hay archivo CSV cargado, THEN THE Sistema SHALL mostrar un mensaje indicando que debe cargar un archivo primero
7. THE Sistema SHALL permitir cambiar la selección de fuentes en cualquier momento

### Requisito 3: Comparación de Datos Alumnos

**Historia de Usuario**: Como docente, quiero comparar registros de alumnos entre Firebase y CSV, para identificar coincidencias, diferencias y datos faltantes.

#### Criterios de Aceptación

1. WHEN la comparación de Alumnos es iniciada, THE Sistema SHALL comparar cada registro en Firebase con su equivalente en el CSV usando el ID como clave
2. WHEN un alumno existe en ambas fuentes con valores idénticos, THE Sistema SHALL clasificarlo como Coincidencia
3. WHEN un alumno existe en ambas fuentes pero con al menos un campo diferente, THE Sistema SHALL clasificarlo como Diferencia y registrar qué campos difieren
4. WHEN un alumno existe en Firebase pero no en el CSV, THE Sistema SHALL clasificarlo como Alumno_Faltante_en_CSV
5. WHEN un alumno existe en el CSV pero no en Firebase, THE Sistema SHALL clasificarlo como Alumno_Faltante_en_Firebase
6. THE Sistema SHALL completar la comparación en menos de 5 segundos para un conjunto de hasta 5000 registros
7. THE Sistema SHALL generar un reporte de la comparación que incluya conteos de coincidencias, diferencias y faltantes
8. WHERE múltiples campos difieren, THE Sistema SHALL mostrar claramente cuáles son y sus valores en ambas fuentes

### Requisito 4: Comparación de Datos Cursos

**Historia de Usuario**: Como docente, quiero comparar registros de cursos entre Firebase y CSV, para verificar que la información de cursos está sincronizada correctamente.

#### Criterios de Aceptación

1. WHEN la comparación de Cursos es iniciada, THE Sistema SHALL comparar cada registro en Firebase con su equivalente en el CSV usando el ID como clave
2. WHEN un curso existe en ambas fuentes con valores idénticos, THE Sistema SHALL clasificarlo como Coincidencia
3. WHEN un curso existe en ambas fuentes pero con al menos un campo diferente, THE Sistema SHALL clasificarlo como Diferencia
4. WHEN un curso existe en Firebase pero no en el CSV, THE Sistema SHALL clasificarlo como Curso_Faltante_en_CSV
5. WHEN un curso existe en el CSV pero no en Firebase, THE Sistema SHALL clasificarlo como Curso_Faltante_en_Firebase
6. THE Sistema SHALL completar la comparación en menos de 3 segundos para un conjunto de hasta 1000 registros
7. THE Sistema SHALL generar un reporte con resumen de coincidencias, diferencias y faltantes

### Requisito 5: Visualización de Resultados

**Historia de Usuario**: Como docente, quiero ver los resultados de la comparación de forma clara y organizada, para entender rápidamente el estado de sincronización entre las fuentes.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar un resumen ejecutivo con los conteos de: Coincidencias, Diferencias y Registros_Faltantes
2. THE Sistema SHALL usar gráficos (torta o barras) para visualizar la proporción de coincidencias vs diferencias vs faltantes
3. WHEN un registro es clasificado como Diferencia, THE Sistema SHALL mostrar una tabla que compare lado a lado los valores de Firebase y CSV
4. THE Sistema SHALL destacar visualmente las celdas que contienen valores diferentes
5. THE Sistema SHALL mostrar todos los registros en una tabla interactiva con capacidad de ordenamiento y búsqueda
6. WHERE hay muchos registros, THE Sistema SHALL implementar paginación mostrando 25, 50 o 100 registros por página
7. THE Sistema SHALL permitir al usuario expandir detalles de cada registro para ver todos los campos
8. THE Sistema SHALL indicar claramente la clasificación de cada registro (Coincidencia, Diferencia, Faltante_en_CSV, Faltante_en_Firebase)

### Requisito 6: Filtrado de Resultados

**Historia de Usuario**: Como docente, quiero filtrar los resultados de la comparación, para enfocarme en los registros que me interesan.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir filtrar por tipo de clasificación (Coincidencias, Diferencias, Faltantes_en_CSV, Faltantes_en_Firebase)
2. THE Sistema SHALL permitir búsqueda por ID de registro
3. WHEN un filtro es aplicado, THE Sistema SHALL actualizar instantáneamente la tabla de resultados
4. THE Sistema SHALL mostrar la cantidad de registros que coinciden con el filtro actual
5. WHERE múltiples filtros son aplicados, THE Sistema SHALL combinarlos usando lógica AND (solo registros que cumplan TODAS las condiciones)
6. THE Sistema SHALL permitir limpiar todos los filtros con un botón "Limpiar Filtros"
7. THE Sistema SHALL guardar el último conjunto de filtros en sesión (no persistir entre navegador cerrado)

### Requisito 7: Exportación de Resultados

**Historia de Usuario**: Como docente, quiero exportar los resultados de la comparación, para documentarlos o compartirlos con otros.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir exportar los resultados de la comparación como archivo CSV
2. WHEN se exporta a CSV, THE Sistema SHALL incluir todas las columnas de ambas fuentes más una columna indicando la clasificación
3. WHEN se exporta a CSV, THE Sistema SHALL incluir solo los registros visibles según los filtros aplicados
4. WHERE el usuario desea un reporte visual, THE Sistema SHALL permitir exportar como PDF (opcional)
5. WHEN se exporta, THE Sistema SHALL generar un archivo con nombre que incluya la fecha y tipo de comparación realizada
6. THE Sistema SHALL mostrar un mensaje de confirmación cuando la exportación se completa

### Requisito 8: Gestión de Rendimiento para Big Data

**Historia de Usuario**: Como desarrollador/administrador, quiero que la comparativa maneje eficientemente grandes volúmenes de datos, para simular un entorno big data sin degradación de rendimiento.

#### Criterios de Aceptación

1. WHEN la comparación se realiza con más de 1000 registros, THE Sistema SHALL implementar procesamiento en chunks para evitar bloqueos de UI
2. THE Sistema SHALL mostrar una barra de progreso mientras se realiza la comparación
3. WHEN la comparación es procesada, THE Sistema SHALL almacenar resultados en memoria del navegador (IndexedDB si es necesario)
4. WHEN el usuario navega lejos de la pestaña Comparativa, THE Sistema SHALL liberar recursos de memoria utilizados por la comparación anterior
5. THE Sistema SHALL permitir cancelar una comparación en progreso
6. WHERE la comparación toma más de 10 segundos, THE Sistema SHALL mostrar advertencia indicando el tamaño de datos
7. THE Sistema SHALL implementar virtualización de tabla para mostrar eficientemente miles de registros sin ralentizar el renderizado

### Requisito 9: Independencia del Navegador

**Historia de Usuario**: Como usuario, quiero que la comparativa funcione completamente en el navegador sin dependencias de servidor, para garantizar privacidad y funcionamiento offline.

#### Criterios de Aceptación

1. THE Sistema SHALL procesar toda la lógica de comparación en JavaScript del lado del cliente
2. THE Sistema SHALL recuperar datos de Firebase usando conexión directa, sin servidores intermedios
3. THE Sistema SHALL leer archivos CSV sin enviar datos a ningún servidor externo
4. IF el usuario pierde conexión a Firebase durante la comparación, THEN THE Sistema SHALL mostrar error pero conservar datos ya cargados
5. THE Sistema SHALL permitir visualizar resultados previamente cargados incluso sin conexión (con limitaciones)
6. THE Sistema SHALL no realizar llamadas HTTP a servidores backend excepto para Firebase

### Requisito 10: Manejo de Errores y Validaciones

**Historia de Usuario**: Como docente, quiero que el sistema maneje errores de forma clara, para entender qué salió mal y cómo proceder.

#### Criterios de Aceptación

1. WHEN un archivo CSV tiene formato inválido, THE Sistema SHALL mostrar un mensaje específico indicando el problema
2. WHEN Firebase no responde, THE Sistema SHALL mostrar un mensaje de error y sugerir reintentar
3. WHEN hay datos incompletos en el CSV, THE Sistema SHALL registrarlo como falta de dato específica
4. IF falta la conexión a internet, THEN THE Sistema SHALL mostrar advertencia clara
5. THE Sistema SHALL validar que los valores en campos numéricos sean válidos (ej: Asistencia debe ser número entre 0-100)
6. WHERE hay errores de tipo en los datos, THE Sistema SHALL advertir pero permitir continuar con la comparación
7. THE Sistema SHALL mostrar un resumen de errores encontrados durante la carga y comparación

### Requisito 11: Comparación Inteligente de Campos

**Historia de Usuario**: Como docente, quiero que el sistema compare campos de forma inteligente considerando variaciones menores, para evitar falsos positivos por diferencias insignificantes.

#### Criterios de Aceptación

1. WHEN se comparan campos de tipo texto, THE Sistema SHALL usar comparación case-insensitive (mayúsculas/minúsculas no importan)
2. WHEN se comparan campos numéricos con decimales, THE Sistema SHALL permitir una tolerancia de 0.01 antes de marcar como diferencia
3. WHEN se comparan campos de fecha, THE Sistema SHALL normalizar formatos antes de comparar
4. WHERE hay espacios en blanco extras, THE Sistema SHALL ignorarlos en la comparación
5. THE Sistema SHALL documentar las reglas de comparación usadas para cada tipo de campo
6. WHERE los valores usan separadores diferentes (ej: coma vs punto en decimales), THE Sistema SHALL normalizar antes de comparar

### Requisito 12: Interfaz Independiente en Pestañas del Navegador

**Historia de Usuario**: Como usuario, quiero que la pestaña Comparativa funcione independientemente en diferentes ventanas del navegador, para poder trabajar en paralelo sin interferencias.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener estado separado de la comparación en cada pestaña del navegador
2. WHEN el usuario abre la Comparativa en una nueva pestaña, THE Sistema SHALL iniciar una sesión nueva independiente
3. WHEN el usuario cierra una pestaña, THE Sistema SHALL limpiar recursos usados por esa sesión
4. WHERE múltiples pestañas están abiertas, THE Sistema SHALL asegurar que cambios en una no afecten a las otras
5. THE Sistema SHALL usar localStorage de forma específica de cada pestaña (no compartir estado entre tabs)

## Patrones de Aceptación Comunes (Propiedades para Testing)

### Invariantes
- El total de coincidencias + diferencias + faltantes debe igualar el total de registros únicos
- La cantidad de registros cargados desde Firebase debe ser constante durante una comparación
- La cantidad de registros en el CSV debe ser constante durante una comparación

### Propiedades Round-Trip (Críticas para CSV Parser)
- `parse(rawCSV).length == exportToCSV(parse(rawCSV)).length` (cantidad de registros preservada)
- `parse(rawCSV) == parse(exportToCSV(parse(rawCSV)))` (round-trip CSV debe ser idéntico)
- Campos con comillas y caracteres especiales debe preservarse: `parse('"value1","value2"') == exportToCSV(...)`

### Idempotencia
- Ejecutar la misma comparación dos veces con los mismos datos debe producir resultados idénticos
- Aplicar el mismo filtro dos veces consecutivas debe producir el mismo resultado

### Metamórficas
- `len(filteredResults) <= len(allResults)` (filtrado no puede aumentar cantidad de registros)
- `coincidences + differences + faltantes == totalRegistros` (suma debe ser exacta)

### Error Conditions
- Archivo vacío → debe rechazarse con mensaje claro
- Archivo sin encabezados → debe rechazarse
- CSV malformado (comillas sin cerrar) → debe rechazarse
- Firebase unavailable → debe mostrar error sin causar crash
- Cambio de tipo de dato en archivo (string en número) → debe registrarse como diferencia

