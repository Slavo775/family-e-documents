import { Injectable } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { IStorageService } from './storage.interface'

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly uploadTtl: number
  private readonly downloadTtl: number

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('S3_REGION', 'eu-central-1')
    const endpoint = this.config.get<string>('S3_ENDPOINT')

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    })

    this.bucket = this.config.getOrThrow<string>('S3_BUCKET')
    this.uploadTtl = this.config.get<number>('UPLOAD_URL_TTL_SECONDS', 900)
    this.downloadTtl = this.config.get<number>('DOWNLOAD_URL_TTL_SECONDS', 3600)
  }

  async createUploadUrl(params: {
    documentId: string
    mimeType: string
    sizeBytes: number
  }): Promise<{ objectKey: string; uploadUrl: string; expiresAt: Date }> {
    const objectKey = `documents/${params.documentId}`

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
    })

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.uploadTtl,
    })

    const expiresAt = new Date(Date.now() + this.uploadTtl * 1000)
    return { objectKey, uploadUrl, expiresAt }
  }

  async createDownloadUrl(params: {
    objectKey: string
    filename: string
    ttlSeconds?: number
  }): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const ttl = params.ttlSeconds ?? this.downloadTtl

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.objectKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(params.filename)}"`,
    })

    const downloadUrl = await getSignedUrl(this.client, command, { expiresIn: ttl })
    const expiresAt = new Date(Date.now() + ttl * 1000)
    return { downloadUrl, expiresAt }
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }))
      return true
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === 'NotFound') {
        return false
      }
      throw err
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }))
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === 'NotFound') {
        return
      }
      throw err
    }
  }
}
