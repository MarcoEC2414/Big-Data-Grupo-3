import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/comparison/exportService';
import { ComparisonItem, ComparisonType } from '@/lib/comparison/types';

interface ExportButtonProps {
  results: ComparisonItem[] | null;
  filteredResults: ComparisonItem[];
  comparisonType: ComparisonType;
  comparisonsAt: Date;
}

export function ExportButton({
  results,
  filteredResults,
  comparisonType,
  comparisonsAt,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (filteredResults.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }

    setIsExporting(true);
    try {
      await exportToCSV(filteredResults, comparisonType, comparisonsAt);

      toast.success(
        `✓ Exportados ${filteredResults.length} registros a CSV`,
        {
          duration: 3000,
        }
      );
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Error al exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (filteredResults.length === 0) {
      toast.error('No hay registros para copiar');
      return;
    }

    try {
      // Crear CSV en formato text
      const headers = [
        'ID',
        'Tipo',
        'Campos_con_Diferencia',
        'Valores_Firebase',
        'Valores_CSV',
      ];

      const rows = filteredResults.map((item) => [
        item.id,
        item.type,
        item.differenceFields.map((d) => d.fieldName).join('; '),
        item.firebaseRecord ? JSON.stringify(item.firebaseRecord) : 'N/A',
        item.csvRecord ? JSON.stringify(item.csvRecord) : 'N/A',
      ]);

      const csvContent = [
        headers.join('\t'),
        ...rows.map((row) => row.join('\t')),
      ].join('\n');

      await navigator.clipboard.writeText(csvContent);
      toast.success(`✓ ${filteredResults.length} registros copiados al portapapeles`);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Error al copiar al portapapeles');
    }
  };

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleExportCSV}
        disabled={isExporting || filteredResults.length === 0}
        size="sm"
        className="gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Exportar CSV ({filteredResults.length})
          </>
        )}
      </Button>

      <Button
        onClick={handleCopyToClipboard}
        disabled={filteredResults.length === 0}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        Copiar ({filteredResults.length})
      </Button>
    </div>
  );
}
