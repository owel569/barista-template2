import React from 'react';
// Séparation des responsabilités - ExportToExcelButton - Amélioration #2 des attached_assets
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';

import { ExportData } from '@/lib/excel-export';

interface ExportToExcelButtonProps {
  data: ExportData[];
  filename?: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function ExportToExcelButton({
  data,
  filename = 'export',
  sheetName = 'Données',
  disabled = false,
  variant = 'outline',
  size = 'default'
}: ExportToExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Ajout d'une gestion d'erreur professionnelle et typage strict
  const handleExport = async () => {
    if (!Array.isArray(data) || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    setIsExporting(true);
    try {
      if (data.length > 1000) {
        const proceed = confirm(
          `Le fichier contient ${data.length} lignes. Cela peut prendre du temps. Continuer ?`
        );
        if (!proceed) {
          setIsExporting(false);
          return;
        }
      }
      
      await exportToExcel(data, {
        filename: `${filename}_${new Date().toISOString().split('T')[0]}`,
        sheetName,
        autoWidth: true,
        styleHeaders: true
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || data.length === 0}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      }
      {isExporting ? 'Export en cours...' : 'Exporter (Excel)'}
    </Button>
  );
}