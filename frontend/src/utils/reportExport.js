import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const safeFileName = (fileName) => String(fileName || 'report')
  .trim()
  .replace(/[^a-z0-9_-]+/gi, '-')
  .replace(/^-+|-+$/g, '') || 'report';

export const exportExcelReport = ({ fileName, sheetName, headers, rows }) => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map((header, index) => ({
    wch: Math.min(36, Math.max(
      String(header).length + 2,
      ...rows.map((row) => String(row[index] ?? '').length + 2),
    )),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Report');
  XLSX.writeFile(workbook, `${safeFileName(fileName)}.xlsx`);
};

export const exportPdfReport = ({ title, fileName, headers, rows }) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(title, 14, 17);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 24);
  autoTable(pdf, {
    head: [headers],
    body: rows,
    startY: 30,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 64, 120] },
    alternateRowStyles: { fillColor: [245, 248, 252] },
  });
  pdf.save(`${safeFileName(fileName)}.pdf`);
};
