import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ScoutingReport } from '../types';

interface ExportOptions {
  report: ScoutingReport;
  teamName: string;
  tournamentName?: string;
}

/**
 * Export the current view to PDF by capturing the actual UI.
 */
export async function exportReportToPdf(
  contentElement: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { teamName } = options;

  try {
    // Capture the content as canvas with high quality
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f1419',
      logging: false,
      width: contentElement.scrollWidth,
      height: contentElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add pages for the captured content
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedTeamName}_scouting_report_${dateStr}.pdf`;

    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

/**
 * Capture a specific element and return as image data for PDF.
 */
async function _captureElement(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#0f1419',
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Export report by capturing actual UI components.
 * This creates a multi-page PDF that looks like the app.
 */
export async function exportReportAsScreenshot(
  reportContainer: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { teamName } = options;

  try {
    // Capture the entire report container
    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f1419',
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Ensure cloned document has proper styles
        const clonedElement = clonedDoc.body.querySelector('[data-pdf-content]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.width = '1200px';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Use landscape for wider content
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add more pages as needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    pdf.save(`${sanitizedTeamName}_scouting_report_${dateStr}.pdf`);
  } catch (error) {
    console.error('Screenshot PDF export failed:', error);
    throw error;
  }
}

/**
 * Main export function - captures the visible report content.
 */
export async function exportVisibleReport(options: ExportOptions): Promise<void> {
  const { teamName } = options;
  
  // Find the main content area
  const mainContent = document.querySelector('main');
  if (!mainContent) {
    throw new Error('Could not find report content');
  }

  try {
    const canvas = await html2canvas(mainContent as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f1419',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    pdf.save(`${sanitizedTeamName}_scouting_report_${dateStr}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
