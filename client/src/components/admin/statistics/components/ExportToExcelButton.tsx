// Séparation des responsabilités - ExportToExcelButton - Amélioration #2 des attached_assets
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportToExcelButtonProps {
  data: any[];
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

  const handleExport = async () => {
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    
    try {
      // Vérifier la taille des données (limite recommandée: 1000 lignes)
      if (data.length > 1000) {
        const proceed = confirm(
          `Le fichier contient ${data.length} lignes. Cela peut prendre du temps. Continuer ?`
        );
        if (!proceed) {
          setIsExporting(false);
          return;
        }
      }

      // Créer le workbook et la worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Générer et télécharger le fichier
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, fullFilename);
      
    } catch (error) {
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
      )}
      {isExporting ? 'Export en cours...' : 'Exporter (Excel)'}
    </Button>
  );
}