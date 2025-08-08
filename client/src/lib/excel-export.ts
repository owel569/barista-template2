import ExcelJS from 'exceljs'
import { exportStatistics } from '@/lib/excel-export';
import { exportCustomerProfiles } from '@/lib/excel-export';
import { exportToExcel, exportCustomerProfiles, exportStatistics } from '@/lib/excel-export';;

export interface ExportData {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
  autoWidth?: boolean;
  styleHeaders?: boolean;
}

/**
 * Export des données vers Excel avec exceljs (plus léger que XLSX)
 * @param data - Données à exporter
 * @param options - Options d'export
 */
export const exportToExcel = async (
  data: ExportData[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const {
      filename = `export_${new Date().toISOString().split('T')[0]}`,
      sheetName = 'Données',
      headers,
      autoWidth = true,
      styleHeaders = true
    } = options;

    // Créer un nouveau workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Déterminer les en-têtes
    const dataHeaders = headers || Object.keys(data[0] || {});
    
    // Ajouter les en-têtes
    const headerRow = worksheet.addRow(dataHeaders);
    
    // Styliser les en-têtes si demandé
    if (styleHeaders) {
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Ajouter les données
    data.forEach((row) => {
      const rowData = dataHeaders.map(header => row[header] ?? '');
      worksheet.addRow(rowData);
    });

    // Ajuster automatiquement la largeur des colonnes
    if (autoWidth) {
      worksheet.columns.forEach((column) => {
        if (column.values) {
          const maxLength = Math.max(
            ...column.values.map((cell: any) => 
              cell ? cell.toString().length : 0
            )
          );
          column.width = Math.min(maxLength + 2, 50); // Max 50 caractères
        }
      });
    }

    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Télécharger le fichier
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    throw new Error('Échec de l\'export Excel');
  }
};

/**
 * Export spécifique pour les profils clients
 */
export const exportCustomerProfiles = async (profiles: any[]): Promise<void> => {
  const exportData = profiles.map(profile => ({
    'ID': profile.id,
    'Nom': profile.lastName,
    'Prénom': profile.firstName,
    'Email': profile.email || '',
    'Téléphone': profile.phone || '',
    'Adresse': profile.address || '',
    'Ville': profile.city || '',
    'Code Postal': profile.postalCode || '',
    'Date de naissance': profile.birthDate || '',
    'Points fidélité': profile.loyalty?.points || 0,
    'Niveau': profile.loyalty?.level || '',
    'Total dépensé': profile.loyalty?.totalSpent || 0,
    'Nombre de visites': profile.loyalty?.visitsCount || 0,
    'Date d\'inscription': profile.loyalty?.joinDate || '',
    'Statut': profile.isActive ? 'Actif' : 'Inactif',
    'Dernière activité': profile.lastActivity || ''
  }));

  await exportToExcel(exportData, {
    filename: 'profils-clients',
    sheetName: 'Profils Clients',
    styleHeaders: true
  });
};

/**
 * Export spécifique pour les statistiques
 */
export const exportStatistics = async (data: any[], type: string): Promise<void> => {
  const exportData = data.map(item => {
    switch (type) {
      case 'revenue':
        return {
          'Date': item.date,
          'Revenus': item.revenue,
          'Commandes': item.orders
        };
      case 'customers':
        return {
          'Nom': item.name,
          'Visites': item.visits,
          'Dépensé': item.spent
        };
      case 'categories':
        return {
          'Catégorie': item.category,
          'Valeur': item.value,
          'Pourcentage': `${((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(2)}%`
        };
      default:
        return item;
    }
  });

  await exportToExcel(exportData, {
    filename: `statistiques-${type}`,
    sheetName: `Statistiques ${type}`,
    styleHeaders: true
  });
};

/**
 * Export avec formatage avancé
 */
export const exportWithFormatting = async (
  data: ExportData[],
  options: ExportOptions & {
    numberColumns?: string[];
    dateColumns?: string[];
    currencyColumns?: string[];
  } = {}
): Promise<void> => {
  const {
    numberColumns = [],
    dateColumns = [],
    currencyColumns = [],
    ...exportOptions
  } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(exportOptions.sheetName || 'Données');

    const headers = exportOptions.headers || Object.keys(data[0] || {});
    const headerRow = worksheet.addRow(headers);

    // Styliser les en-têtes
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    // Ajouter les données avec formatage
    data.forEach((row) => {
      const rowData = headers.map(header => row[header] ?? '');
      const excelRow = worksheet.addRow(rowData);
      
             // Appliquer le formatage selon le type de colonne
       excelRow.eachCell((cell, colNumber) => {
         const columnName = headers[colNumber - 1];
         
         if (columnName && numberColumns.includes(columnName)) {
           cell.numFmt = '#,##0';
         } else if (columnName && dateColumns.includes(columnName)) {
           cell.numFmt = 'dd/mm/yyyy';
         } else if (columnName && currencyColumns.includes(columnName)) {
           cell.numFmt = '#,##0.00 €';
         }
       });
    });

    // Ajuster la largeur des colonnes
    worksheet.columns.forEach((column) => {
      if (column.values) {
        const maxLength = Math.max(
          ...column.values.map((cell: any) => 
            cell ? cell.toString().length : 0
          )
        );
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportOptions.filename || 'export'}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Erreur lors de l\'export avec formatage:', error);
    throw new Error('Échec de l\'export Excel avec formatage');
  }
}; 