import { jsPDF } from 'jspdf'
import * as htmlToImage from 'html-to-image'
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
    
    // Force visible styling for the clone within the viewport but behind everything
    element.style.display = 'block'
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.zIndex = '-9999'
    document.body.appendChild(element)

    try {
      // Force layout recalculation
      const width = element.offsetWidth || 794 // 210mm in px at 96dpi
      const height = element.offsetHeight || 1123 // 297mm in px at 96dpi

      // html-to-image handles fonts and images much better
      const imgData = await htmlToImage.toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Equivalent to scale(2)
        width: width,
        height: height
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
      console.error("html-to-image failed:", error)
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
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.zIndex = '-9999'
    document.body.appendChild(element)

    try {
      // Force layout recalculation
      const width = element.offsetWidth || 794
      const height = element.offsetHeight || 1123

      const imgData = await htmlToImage.toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: width,
        height: height
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
      console.error("html-to-image upload failed:", error)
      throw error
    } finally {
      document.body.removeChild(element)
    }
  }
}

export const pdfService = new PdfService()
