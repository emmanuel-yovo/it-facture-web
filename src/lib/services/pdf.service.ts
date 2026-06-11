import { jsPDF } from 'jspdf'
import domtoimage from 'dom-to-image'
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
      // Create a clean image using the browser's native rendering
      const imgData = await domtoimage.toJpeg(element, {
        quality: 0.95,
        bgcolor: '#ffffff',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: element.offsetWidth + 'px',
          height: element.offsetHeight + 'px'
        },
        width: element.offsetWidth * 2,
        height: element.offsetHeight * 2
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } catch (error) {
      console.error("dom-to-image failed:", error)
      throw error
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
      const imgData = await domtoimage.toJpeg(element, {
        quality: 0.95,
        bgcolor: '#ffffff',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: element.offsetWidth + 'px',
          height: element.offsetHeight + 'px'
        },
        width: element.offsetWidth * 2,
        height: element.offsetHeight * 2
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      
      // Get the PDF as a Blob
      const pdfBlob = pdf.output('blob')
      
      // Upload to Supabase Storage
      const path = await storageService.uploadInvoicePdf(pdfBlob, workspaceId, invoiceId)
      return path
    } catch (error) {
      console.error("dom-to-image upload failed:", error)
      throw error
    } finally {
      element.className = originalClass
    }
  }
}

export const pdfService = new PdfService()
