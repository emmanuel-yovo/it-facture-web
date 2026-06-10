import { supabase } from '../supabase'

export class StorageService {
  /**
   * Upload a logo to the public 'logos' bucket
   * @param file The file to upload
   * @param workspaceId The workspace ID (used as folder)
   * @returns The public URL of the uploaded logo
   */
  async uploadLogo(file: File, workspaceId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${workspaceId}/logo-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (error) {
      throw new Error(`Failed to upload logo: ${error.message}`)
    }

    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  /**
   * Upload an invoice PDF to the private 'invoices' bucket
   */
  async uploadInvoicePdf(file: Blob, workspaceId: string, invoiceId: string): Promise<string> {
    const fileName = `${workspaceId}/${invoiceId}.pdf`

    const { error } = await supabase.storage
      .from('invoices')
      .upload(fileName, file, { upsert: true, contentType: 'application/pdf' })

    if (error) {
      throw new Error(`Failed to upload invoice: ${error.message}`)
    }

    return fileName
  }

  /**
   * Get a signed URL to download or view a private invoice PDF
   */
  async getInvoicePdfUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(path, 60 * 60) // 1 hour valid

    if (error || !data) {
      throw new Error(`Failed to get invoice URL: ${error?.message}`)
    }

    return data.signedUrl
  }
}

export const storageService = new StorageService()
