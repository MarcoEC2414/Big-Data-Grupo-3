# CSV Upload - Best Practices & Reference

## El Problema que Se Corrigió

Error típico en React al subir archivos:
```
Failed to execute 'readAsText' on 'FileReader': parameter 1 is not of type 'Blob'
```

## Causas Comunes

| Causa | Síntoma | Solución |
|-------|---------|----------|
| `e` pasado directamente | Evento DOM en vez de File | Extraer con `e.target.files[0]` |
| `FileList` sin validación | Error al acceder index | Validar `files.length > 0` |
| `null` o `undefined` | Tipo incorrecto | Validar con `if (!file)` |
| Sin `instanceof File` | Blob genérico | Usar `file instanceof File` |

## Arquitectura de Validación

```
CSVUploader Component
    ↓
handleFileInput / handleDrop
    ↓ [Extrae archivo correctamente]
validateFile (Componente)
    ↓ [Verifica null, instanceof File]
handleFile (useCallback)
    ↓ [Validaciones previas]
parseCSV (Service)
    ↓ [Validaciones exhaustivas con mensajes]
Papa.parse
    ↓
Success / Error
```

## Checklist de Validación

### En el Handler (handleFileInput/handleDrop)

```typescript
// ✅ CORRECTO
const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.currentTarget?.files;      // 1. Usar optional chaining
  
  if (!files || files.length === 0) {        // 2. Verificar existencia
    onError(error);
    return;
  }
  
  const file = files[0];                      // 3. Obtener único archivo
  
  if (!(file instanceof File)) {              // 4. Validar tipo
    onError(error);
    return;
  }
  
  handleFile(file);                           // 5. Procesar
};

// ❌ INCORRECTO
const handleFileInput = (e: any) => {
  handleFile(e);  // Pasando evento en lugar de archivo
};
```

### En la Función de Procesamiento

```typescript
export async function parseCSV(file: File | Blob): Promise<ParseResult> {
  // ✅ Validaciones en orden
  
  // 1. Verificar que existe
  if (!file) throw new Error('No file');
  
  // 2. Verificar que es Blob
  if (!(file instanceof Blob)) throw new Error('Not a Blob');
  
  // 3. Validar extensión
  const fileName = file instanceof File ? file.name : 'file.csv';
  if (!fileName.endsWith('.csv')) throw new Error('Not CSV');
  
  // 4. Validar tamaño
  if (file.size > MAX_SIZE) throw new Error('Too large');
  
  // 5. Validar no vacío
  if (file.size === 0) throw new Error('Empty file');
  
  // 6. Procesar con Papa.parse
  return new Promise((resolve, reject) => {
    const fileToProcess = file instanceof File 
      ? file 
      : new File([file], fileName);
    
    Papa.parse(fileToProcess, { ... });
  });
}
```

## Manejo de Errores

```typescript
// Estructura recomendada
try {
  const parsed = await parseCSV(file);
  // Éxito
  toast.success(`✓ ${file.name} cargado`);
} catch (error: any) {
  // Error esperado
  const message = error.message || 'Error desconocido';
  toast.error(`✗ ${message}`);
  
  // Registrar error para debugging
  console.warn('[CSV Upload Error]', {
    message,
    file: file?.name,
    size: file?.size,
  });
}
```

## Testing Manual

### Caso 1: Archivo Válido
```
1. Seleccionar archivo CSV válido
2. Debe mostrar: "✓ Archivo cargado: nombre.csv (X registros)"
3. Interfaz muestra detalles del archivo
```

### Caso 2: Archivo Vacío
```
1. Crear CSV vacío (sin datos)
2. Debe mostrar: "✗ Error: El archivo CSV está vacío"
```

### Caso 3: Sin Columna ID
```
1. CSV sin columna "ID"
2. Debe mostrar: "✗ Error: CSV debe contener columna 'ID'"
```

### Caso 4: Archivo Muy Grande
```
1. CSV > 50MB
2. Debe mostrar: "✗ Error: Archivo mayor a 50MB"
```

### Caso 5: Drag & Drop
```
1. Arrastrar archivo CSV válido
2. Debe procesar igual que selección manual
3. Zona de drop cambia color mientras se arrastra
```

## Performance Tips

| Acción | Tiempo | Optimización |
|--------|--------|--------------|
| Parse CSV 1000 registros | ~200ms | Chunked processing |
| Parse CSV 5000 registros | ~1s | Mostrar progreso |
| UI responsivo | Siempre | `setTimeout(..., 0)` |

## Debugging

### Si sigue fallando

```typescript
// Agregar en handleFileInput para debugging
console.log('Event:', e);
console.log('Files:', e.currentTarget.files);
console.log('File[0]:', e.currentTarget.files?.[0]);
console.log('Is File?:', e.currentTarget.files?.[0] instanceof File);
console.log('Type:', typeof e.currentTarget.files?.[0]);
```

### Verificar Papa.parse

```typescript
// Asegurar que Papa está importado correctamente
import Papa from 'papaparse';

// Verificar en console
console.log('Papa:', Papa);
console.log('Papa.parse:', Papa.parse);
```

## Referencias Útiles

- [MDN FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [React onChange Event](https://react.dev/reference/react-dom/components/input#files)
- [PapaParse Documentation](https://www.papaparse.com/)

## Changelog

### v1.0 - Corrección Principal
- ✅ Validación correcta de archivos en handleFileInput
- ✅ Validación correcta de archivos en handleDrop
- ✅ Manejo de null/undefined mejorado
- ✅ Mensajes de error descriptivos
- ✅ Limpieza de recursos en handleRemoveFile
