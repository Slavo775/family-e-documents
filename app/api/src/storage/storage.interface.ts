export const STORAGE_SERVICE = 'STORAGE_SERVICE'

export interface IStorageService {
  createUploadUrl(params: {
    documentId: string
    filename: string
    mimeType: string
    sizeBytes: number
  }): Promise<{ objectKey: string; uploadUrl: string; expiresAt: Date }>

  createDownloadUrl(params: {
    objectKey: string
    filename: string
    ttlSeconds?: number
  }): Promise<{ downloadUrl: string; expiresAt: Date }>

  objectExists(objectKey: string): Promise<boolean>

  deleteObject(objectKey: string): Promise<void>
}
