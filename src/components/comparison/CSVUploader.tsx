import React, { useCallback, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { parseCSV } from '@/lib/comparison/csvParser';
import { CSVFile, ValidationError } from '@/lib/comparison/types';

interface CSVUploaderProps {
  onFileLoaded: (csvFile: CSVFile) => void;
  onError: (error: ValidationError) => void;
  isLoading?: boolean;
  csvFile?: CSVFile | null;
}

export function CSVUploader({
  onFileLoaded,
  onError,
  isLoading,
  csvFile,
}: CSVUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | Blob | undefined | null) => {
      // Validación previa: verificar que file existe y es válido
      if (!file) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'No se seleccionó ningún archivo',
        };
        onError(error);
        toast.error('Error: No se seleccionó ningún archivo');
        setIsProcessing(false);
        return;
      }

      // Verificar que es un Blob/File válido
      if (!(file instanceof Blob)) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'El archivo no es válido',
        };
        onError(error);
        toast.error('Error: El archivo no es válido');
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      try {
        // Obtener nombre del archivo si está disponible
        const fileName = file instanceof File ? file.name : 'archivo.csv';

        // Validación previa
        if (!fileName.toLowerCase().endsWith('.csv')) {
          const error: ValidationError = {
            type: 'file_type',
            message: 'Solo se aceptan archivos CSV',
          };
          onError(error);
          toast.error('Error: Solo se aceptan archivos CSV');
          setIsProcessing(false);
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          const error: ValidationError = {
            type: 'file_size',
            message: 'Archivo mayor a 50MB',
          };
          onError(error);
          toast.error('Error: Archivo mayor a 50MB');
          setIsProcessing(false);
          return;
        }

        if (file.size === 0) {
          const error: ValidationError = {
            type: 'empty_file',
            message: 'El archivo CSV está vacío',
          };
          onError(error);
          toast.error('Error: El archivo está vacío');
          setIsProcessing(false);
          return;
        }

        // Parsear CSV
        const parseResult = await parseCSV(file);

        // Asegurar que file es un File para obtener el nombre
        const fileObj = file instanceof File ? file : new File([file], fileName);

        const csvFileData: CSVFile = {
          name: fileObj.name,
          data: parseResult.data,
          headers: parseResult.headers,
          recordCount: parseResult.data.length,
          loadedAt: new Date(),
          size: file.size,
        };

        onFileLoaded(csvFileData);
        toast.success(
          `✓ Archivo cargado: ${fileObj.name} (${parseResult.data.length} registros)`
        );
      } catch (error: any) {
        const validationError: ValidationError = {
          type: error.type || 'format_error',
          message: error.message || 'Error al procesar el archivo',
          details: error.details,
        };
        onError(validationError);
        toast.error(`Error: ${validationError.message}`);
      } finally {
        setIsProcessing(false);
        // Limpiar input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onFileLoaded, onError]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      // Extraer archivos del evento de drag-and-drop
      const files = e.dataTransfer?.files;
      
      // Validación: verificar que files existe y tiene al menos un elemento
      if (!files || files.length === 0) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'No se seleccionó ningún archivo',
        };
        onError(error);
        toast.error('Error: No se seleccionó ningún archivo');
        return;
      }

      // Obtener el primer archivo
      const file = files[0];
      
      // Validación final: asegurar que es un File válido
      if (!file || !(file instanceof File)) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'El archivo no es válido',
        };
        onError(error);
        toast.error('Error: El archivo no es válido');
        return;
      }

      // Procesar el archivo
      handleFile(file);
    },
    [handleFile, onError]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Extraer el archivo del evento
      const files = e.currentTarget?.files;
      
      // Validación: verificar que files existe y tiene al menos un elemento
      if (!files || files.length === 0) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'No se seleccionó ningún archivo',
        };
        onError(error);
        toast.error('Error: No se seleccionó ningún archivo');
        return;
      }

      // Obtener el primer archivo (index 0)
      const file = files[0];
      
      // Validación final: asegurar que es un File válido
      if (!file || !(file instanceof File)) {
        const error: ValidationError = {
          type: 'format_error',
          message: 'El archivo no es válido',
        };
        onError(error);
        toast.error('Error: El archivo no es válido');
        return;
      }

      // Procesar el archivo
      handleFile(file);
    },
    [handleFile, onError]
  );

  const handleRemoveFile = useCallback(() => {
    // Limpiar el input completamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.files = null as any;
    }
    setIsProcessing(false);
  }, []);

  return (
    <div className="space-y-4">
      {!csvFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-foreground mb-2">
            Arrastra un archivo CSV aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Máximo 50MB • Formato CSV • Debe contener columna ID
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessing}
            variant="outline"
          >
            {isProcessing ? 'Procesando...' : 'Seleccionar archivo'}
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">
                  {csvFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {csvFile.recordCount} registros • {(csvFile.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columnas: {csvFile.headers.join(', ')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleRemoveFile}
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessing}
            variant="outline"
            className="w-full"
          >
            {isProcessing ? 'Procesando...' : 'Cargar otro archivo'}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
