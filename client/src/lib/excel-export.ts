
import ExcelJS from 'exceljs';

interface ExportData {
  [key: string]: any;
}

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
  headers?: string[];
  formatters?: { [key: string]: (value: any) => string };
  styles?: {
    headerStyle?: Partial<ExcelJS.Style>;
    dataStyle?: Partial<ExcelJS.Style>;
    titleStyle?: Partial<ExcelJS.Style>;
  };
}

class ExcelExporter {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'Barista Café Management System';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
  }

  private getDefaultStyles() {
    return {
      headerStyle: {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      } as Partial<ExcelJS.Style>,
      dataStyle: {
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      } as Partial<ExcelJS.Style>,
      titleStyle: {
        font: { bold: true, size: 16, color: { argb: 'FF1F2937' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      } as Partial<ExcelJS.Style>
    };
  }

  async exportData(data: ExportData[], options: ExportOptions = {}): Promise<void> {
    const {
      filename = 'export.xlsx',
      sheetName = 'Data',
      title = 'Export de données',
      headers,
      formatters = {},
      styles = {}
    } = options;

    const worksheet = this.workbook.addWorksheet(sheetName);
    const defaultStyles = this.getDefaultStyles();
    const mergedStyles = {
      ...defaultStyles,
      ...styles
    };

    let currentRow = 1;

    // Ajout du titre
    if (title) {
      worksheet.getCell(`A${currentRow}`).value = title;
      worksheet.getCell(`A${currentRow}`).style = mergedStyles.titleStyle;
      
      // Fusionner les cellules du titre
      if (headers && headers.length > 1) {
        worksheet.mergeCells(`A${currentRow}:${this.getColumnLetter(headers.length)}${currentRow}`);
      }
      
      currentRow += 2;
    }

    if (data.length === 0) {
      worksheet.getCell(`A${currentRow}`).value = 'Aucune donnée disponible';
      return this.downloadWorkbook(filename);
    }

    // Déterminer les colonnes
    const columns = headers || Object.keys(data[0]);
    
    // Ajouter les en-têtes
    columns.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.style = mergedStyles.headerStyle;
    });
    
    currentRow++;

    // Ajouter les données
    data.forEach((row) => {
      columns.forEach((column, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        let value = row[column];
        
        // Appliquer les formatters
        if (formatters[column]) {
          value = formatters[column](value);
        }
        
        cell.value = value;
        cell.style = mergedStyles.dataStyle;
      });
      currentRow++;
    });

    // Auto-ajuster les largeurs
    this.autoFitColumns(worksheet);

    await this.downloadWorkbook(filename);
  }

  private getColumnLetter(columnNumber: number): string {
    let columnName = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column) => {
      if (column && column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          maxLength = Math.max(maxLength, cellLength);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });
  }

  private async downloadWorkbook(filename: string): Promise<void> {
    try {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      throw new Error('Échec de l\'export Excel');
    }
  }
}

// Fonctions utilitaires pour les exports spécifiques
export const exportCustomerProfiles = async (customers: any[]): Promise<void> => {
  const exporter = new ExcelExporter();
  
  const formattedData = customers.map(customer => ({
    'ID': customer.id,
    'Nom': customer.lastName,
    'Prénom': customer.firstName,
    'Email': customer.email,
    'Téléphone': customer.phone,
    'Points de fidélité': customer.loyaltyPoints,
    'Commandes totales': customer.totalOrders,
    'Montant total': customer.totalSpent,
    'Date d\'inscription': customer.registrationDate,
    'Dernière visite': customer.lastVisit,
    'Statut': customer.status
  }));

  await exporter.exportData(formattedData, {
    filename: `profils-clients-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Profils Clients',
    title: 'Profils des Clients - Barista Café',
    formatters: {
      'Montant total': (value) => `${value}€`,
      'Date d\'inscription': (value) => new Date(value).toLocaleDateString('fr-FR'),
      'Dernière visite': (value) => new Date(value).toLocaleDateString('fr-FR')
    }
  });
};

export const exportStatistics = async (stats: any[]): Promise<void> => {
  const exporter = new ExcelExporter();
  
  await exporter.exportData(stats, {
    filename: `statistiques-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Statistiques',
    title: 'Statistiques - Barista Café',
    formatters: {
      'Revenue': (value) => `${value}€`,
      'Date': (value) => new Date(value).toLocaleDateString('fr-FR')
    }
  });
};

export const exportOrders = async (orders: any[]): Promise<void> => {
  const exporter = new ExcelExporter();
  
  const formattedData = orders.map(order => ({
    'N° Commande': order.id,
    'Date': order.createdAt,
    'Client': order.customerName,
    'Articles': order.items?.map((item: any) => `${item.name} x${item.quantity}`).join(', '),
    'Total': order.total,
    'Statut': order.status,
    'Mode de paiement': order.paymentMethod,
    'Type': order.type
  }));

  await exporter.exportData(formattedData, {
    filename: `commandes-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Commandes',
    title: 'Commandes - Barista Café',
    formatters: {
      'Total': (value) => `${value}€`,
      'Date': (value) => new Date(value).toLocaleDateString('fr-FR')
    }
  });
};

export const exportInventory = async (inventory: any[]): Promise<void> => {
  const exporter = new ExcelExporter();
  
  const formattedData = inventory.map(item => ({
    'Produit': item.name,
    'Catégorie': item.category,
    'Stock actuel': item.currentStock,
    'Stock minimum': item.minStock,
    'Stock maximum': item.maxStock,
    'Prix unitaire': item.unitPrice,
    'Fournisseur': item.supplier,
    'Dernière mise à jour': item.lastUpdated,
    'Statut': item.status
  }));

  await exporter.exportData(formattedData, {
    filename: `inventaire-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Inventaire',
    title: 'Inventaire - Barista Café',
    formatters: {
      'Prix unitaire': (value) => `${value}€`,
      'Dernière mise à jour': (value) => new Date(value).toLocaleDateString('fr-FR')
    }
  });
};

export default ExcelExporter;
