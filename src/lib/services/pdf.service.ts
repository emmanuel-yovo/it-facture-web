import { jsPDF } from 'jspdf'
import domtoimage from 'dom-to-image'
import { storageService } from './storage.service'

export class PdfService {
  /**
   * Generates a PDF from an HTML element ID and triggers a download.
   */
  async downloadPdfFromElement(elementId: string, filename: string): Promise<void> {
    const originalElement = document.getElementById(elementId)
    if (!originalElement) throw new Error('Element not found')

    // Create a clone to ensure it's visible and fully rendered (fixes display:none on mobile/small screens)
    const element = originalElement.cloneNode(true) as HTMLElement
    element.classList.add('pdf-render-mode')
    
    // Force visible styling for the clone
    element.style.display = 'block'
    element.style.position = 'absolute'
    element.style.top = '-9999px'
    element.style.left = '-9999px'
    document.body.appendChild(element)

    try {
      // Force layout recalculation
      const width = element.offsetWidth || 794 // 210mm in px at 96dpi
      const height = element.offsetHeight || 1123 // 297mm in px at 96dpi

      // Create a clean image using the browser's native rendering
      const imgData = await domtoimage.toJpeg(element, {
        quality: 0.95,
        bgcolor: '#ffffff',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: width + 'px',
          height: height + 'px'
        },
        width: width * 2,
        height: height * 2
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (height * pdfWidth) / width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } catch (error) {
      console.error("dom-to-image failed:", error)
      throw error
    } finally {
      document.body.removeChild(element)
    }
  }

  /**
   * Generates a PDF from an HTML element ID and uploads it to Supabase Storage.
   */
  async uploadPdfFromElement(elementId: string, workspaceId: string, invoiceId: string): Promise<string> {
    const originalElement = document.getElementById(elementId)
    if (!originalElement) throw new Error('Element not found')

    // Create a clone to ensure it's visible and fully rendered
    const element = originalElement.cloneNode(true) as HTMLElement
    element.classList.add('pdf-render-mode')
    
    // Force visible styling for the clone
    element.style.display = 'block'
    element.style.position = 'absolute'
    element.style.top = '-9999px'
    element.style.left = '-9999px'
    document.body.appendChild(element)

    try {
      // Force layout recalculation
      const width = element.offsetWidth || 794
      const height = element.offsetHeight || 1123

      const imgData = await domtoimage.toJpeg(element, {
        quality: 0.95,
        bgcolor: '#ffffff',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: width + 'px',
          height: height + 'px'
        },
        width: width * 2,
        height: height * 2
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (height * pdfWidth) / width

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
      document.body.removeChild(element)
    }
  }
}

export const pdfService = new PdfService()
