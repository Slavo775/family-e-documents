import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { DocumentPublic, CreateDocumentDto, UpdateDocumentDto } from '@family-docs/types'
import { FolderAction, Role } from '@family-docs/db'
import { PrismaService } from '../prisma/prisma.service'
import { PermissionsService } from '../permissions/permissions.service'
import { STORAGE_SERVICE, type IStorageService } from '../storage/storage.interface'

const MAX_TAG_LENGTH = 50
const MAX_TAGS = 20

function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0)
  if (normalized.some((t) => t.length > MAX_TAG_LENGTH)) {
    throw new BadRequestException(`Tag length must not exceed ${MAX_TAG_LENGTH} characters`)
  }
  if (normalized.length > MAX_TAGS) {
    throw new BadRequestException(`Cannot have more than ${MAX_TAGS} tags`)
  }
  return [...new Set(normalized)]
}

type DocumentWithRelations = {
  id: string
  name: string
  title: string
  description: string | null
  tags: string[]
  folderId: string
  fileKey: string
  mimeType: string
  sizeBytes: number
  status: string
  visibility: string
  allowedUserIds: string[]
  uploadedById: string
  createdAt: Date
  updatedAt: Date
  folder: { id: string; name: string }
  uploadedBy: { id: string; name: string }
}

function toDocumentPublic(doc: DocumentWithRelations): DocumentPublic {
  return {
    id: doc.id,
    name: doc.name,
    title: doc.title,
    description: doc.description,
    tags: doc.tags,
    folderId: doc.folderId,
    folderName: doc.folder.name,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status as 'ACTIVE' | 'PENDING',
    visibility: doc.visibility as 'PUBLIC' | 'RESTRICTED',
    allowedUserIds: doc.allowedUserIds,
    uploadedBy: { id: doc.uploadedBy.id, name: doc.uploadedBy.name },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

const documentInclude = {
  folder: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
} as const

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async initiateUpload(
    userId: string,
    userRole: Role,
    dto: CreateDocumentDto,
  ): Promise<{ documentId: string; uploadUrl: string; uploadExpiresAt: string }> {
    const canUpload = await this.permissions.canPerformAction(userId, dto.folderId, FolderAction.UPLOAD, userRole)
    if (!canUpload) throw new ForbiddenException('You do not have permission to upload to this folder')

    const existing = await this.prisma.document.findFirst({
      where: { folderId: dto.folderId, name: { equals: dto.name, mode: 'insensitive' }, status: { not: 'DELETED' } },
    })
    if (existing) throw new ConflictException('A document with this name already exists in the folder')

    const tags = normalizeTags(dto.tags ?? [])
    const documentId = randomUUID()

    const { objectKey, uploadUrl, expiresAt } = await this.storage.createUploadUrl({
      documentId,
      filename: dto.name,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })

    await this.prisma.document.create({
      data: {
        id: documentId,
        name: dto.name,
        title: dto.title,
        description: dto.description ?? null,
        tags,
        folderId: dto.folderId,
        fileKey: objectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        status: 'PENDING',
        uploadedById: userId,
      },
    })

    return { documentId, uploadUrl, uploadExpiresAt: expiresAt.toISOString() }
  }

  async confirmUpload(userId: string, userRole: Role, documentId: string): Promise<DocumentPublic> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: documentInclude,
    })
    if (!doc) throw new NotFoundException('Document not found')

    if (doc.uploadedById !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only the uploader or an admin can confirm this upload')
    }

    if (doc.status === 'ACTIVE') throw new ConflictException('Document is already active')
    if (doc.status === 'DELETED') throw new NotFoundException('Document not found')

    const exists = await this.storage.objectExists(doc.fileKey)
    if (!exists) throw new BadRequestException('File not found in storage')

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'ACTIVE' },
      include: documentInclude,
    })

    return toDocumentPublic(updated)
  }

  async findAll(
    userId: string,
    userRole: Role,
    query: { folderId?: string; page?: number; limit?: number },
  ): Promise<{ data: DocumentPublic[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.min(100, Math.max(1, query.limit ?? 20))

    const where = {
      status: 'ACTIVE' as const,
      ...(query.folderId ? { folderId: query.folderId } : {}),
    }

    const docs = await this.prisma.document.findMany({
      where,
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    })

    const visible: DocumentPublic[] = []
    for (const doc of docs) {
      const canView = await this.permissions.canViewDocument(userId, userRole, {
        folderId: doc.folderId,
        visibility: doc.visibility,
        allowedUserIds: doc.allowedUserIds,
      })
      if (canView) visible.push(toDocumentPublic(doc))
    }

    const total = visible.length
    const data = visible.slice((page - 1) * limit, page * limit)

    return { data, total, page, limit }
  }

  async findOne(userId: string, userRole: Role, documentId: string): Promise<DocumentPublic> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: documentInclude,
    })
    if (!doc || doc.status === 'DELETED') throw new NotFoundException('Document not found')

    const canView = await this.permissions.canViewDocument(userId, userRole, {
      folderId: doc.folderId,
      visibility: doc.visibility,
      allowedUserIds: doc.allowedUserIds,
    })
    if (!canView) throw new ForbiddenException('You do not have permission to view this document')

    return toDocumentPublic(doc)
  }

  async getDownloadUrl(
    userId: string,
    userRole: Role,
    documentId: string,
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId }, include: documentInclude })
    if (!doc || doc.status !== 'ACTIVE') throw new NotFoundException('Document not found')

    const canView = await this.permissions.canViewDocument(userId, userRole, {
      folderId: doc.folderId,
      visibility: doc.visibility,
      allowedUserIds: doc.allowedUserIds,
    })
    if (!canView) throw new ForbiddenException('You do not have permission to download this document')

    const { downloadUrl, expiresAt } = await this.storage.createDownloadUrl({
      objectKey: doc.fileKey,
      filename: doc.name,
    })

    return { downloadUrl, expiresAt: expiresAt.toISOString() }
  }

  async updateMetadata(
    userId: string,
    userRole: Role,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentPublic> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId }, include: documentInclude })
    if (!doc || doc.status === 'DELETED') throw new NotFoundException('Document not found')

    if (doc.uploadedById !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only the uploader or an admin can update this document')
    }

    if (dto.visibility === 'RESTRICTED') {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { canRestrictDocs: true } })
      if (!user?.canRestrictDocs && userRole !== Role.ADMIN) {
        throw new BadRequestException('You do not have permission to set documents as restricted')
      }
    }

    if (dto.name && dto.name !== doc.name) {
      const existing = await this.prisma.document.findFirst({
        where: {
          folderId: doc.folderId,
          name: { equals: dto.name, mode: 'insensitive' },
          status: { not: 'DELETED' },
          NOT: { id: documentId },
        },
      })
      if (existing) throw new ConflictException('A document with this name already exists in the folder')
    }

    const tags = dto.tags !== undefined ? normalizeTags(dto.tags) : undefined

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(tags !== undefined && { tags }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.allowedUserIds !== undefined && { allowedUserIds: dto.allowedUserIds }),
      },
      include: documentInclude,
    })

    return toDocumentPublic(updated)
  }

  async moveDocument(
    userId: string,
    userRole: Role,
    documentId: string,
    targetFolderId: string,
  ): Promise<DocumentPublic> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId }, include: documentInclude })
    if (!doc || doc.status === 'DELETED') throw new NotFoundException('Document not found')

    const canDelete = await this.permissions.canPerformAction(userId, doc.folderId, FolderAction.DELETE, userRole)
    if (!canDelete) throw new ForbiddenException('You do not have permission to move documents from this folder')

    const canUpload = await this.permissions.canPerformAction(userId, targetFolderId, FolderAction.UPLOAD, userRole)
    if (!canUpload) throw new ForbiddenException('You do not have permission to upload to the target folder')

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { folderId: targetFolderId },
      include: documentInclude,
    })

    return toDocumentPublic(updated)
  }

  async softDelete(userId: string, userRole: Role, documentId: string): Promise<void> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } })
    if (!doc || doc.status === 'DELETED') throw new NotFoundException('Document not found')

    const canDelete = await this.permissions.canPerformAction(userId, doc.folderId, FolderAction.DELETE, userRole)
    if (!canDelete && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this document')
    }

    await this.prisma.document.update({ where: { id: documentId }, data: { status: 'DELETED' } })

    try {
      await this.storage.deleteObject(doc.fileKey)
    } catch (err) {
      this.logger.error(`Failed to delete object ${doc.fileKey} from storage`, err)
    }
  }
}
