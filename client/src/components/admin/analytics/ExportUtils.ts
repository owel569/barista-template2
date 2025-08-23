export const exportToJSON = (data: Record<string, unknown>, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: unknown[], filename: string) => {
  if (!Array.isArray(data) || data.length === 0) return;
  
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => (row as Record<string, unknown>)[header]).join(',');].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (data: unknown[], filename: string) => {
  try {
    // Import dynamically to avoid bundle size increase
    const ExcelJS = await import('exceljs');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    
    if (Array.isArray(data) && data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0] as Record<string, unknown>);
      worksheet.addRow(headers);
      
      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => (row as Record<string, unknown>)[header]);
        worksheet.addRow(values);
      });
    }
    
    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export to Excel failed:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
    // Fallback to CSV
    exportToCSV(data, filename);
  }
};

export const exportChart = (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
  if (!chartRef.current) return;
  
  // Create a canvas to capture the chart
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  // Get chart dimensions
  const chartElement = chartRef.current;
  const rect = chartElement.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Convert SVG to canvas (simplified approach)
  const svgElements = chartElement.querySelectorAll('svg');
  
  if (svgElements.length > 0) {
    const svgElement = svgElements[0];
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // Download as PNG
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }
};