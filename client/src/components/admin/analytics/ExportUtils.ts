export const exportToJSON = (data: any, filename: string) => {
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

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
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

export const exportToExcel = async (data: any[], filename: string) => {
  try {
    // Import dynamically to avoid bundle size increase
    const XLSX = await import('xlsx');
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Export to Excel failed:', error);
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
    const svgData = new XMLSerializer().serializeToString(svgElements[0]);
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
};