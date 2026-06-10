import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { storageService } from './storage.service'

export class PdfService {
  /**
   * Generates a PDF from an HTML element ID and triggers a download.
   */
  async downloadPdfFromElement(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) throw new Error(`Element with id ${elementId} not found.`)

    // We add a temporary class to ensure it's rendered correctly for PDF (e.g. no shadows, white background)
    const originalClass = element.className
    element.classList.add('pdf-render-mode')

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } finally {
      element.className = originalClass
    }
  }

  /**
   * Generates a PDF from an HTML element ID and uploads it to Supabase Storage.
   */
  async uploadPdfFromElement(elementId: string, workspaceId: string, invoiceId: string): Promise<string> {
    const element = document.getElementById(elementId)
    if (!element) throw new Error(`Element with id ${elementId} not found.`)

    const originalClass = element.className
    element.classList.add('pdf-render-mode')

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      
      // Get the PDF as a Blob
      const pdfBlob = pdf.output('blob')
      
      // Upload to Supabase Storage
      const path = await storageService.uploadInvoicePdf(pdfBlob, workspaceId, invoiceId)
      return path
    } finally {
      element.className = originalClass
    }
  }
}

export const pdfService = new PdfService()
