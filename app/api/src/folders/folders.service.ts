import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import type { FolderNode } from '@family-docs/types'
import { FolderAction, Prisma, Role } from '@family-docs/db'
import { PrismaService } from '../prisma/prisma.service'
import { PermissionsService } from '../permissions/permissions.service'

type FolderRow = {
  id: string
  name: string
  parentId: string | null
  createdAt: Date
  _count: { children: number; documents: number }
}

const ALL_ACTIONS: FolderAction[] = [
  FolderAction.VIEW,
  FolderAction.UPLOAD,
  FolderAction.DELETE,
  FolderAction.MANAGE,
]

const folderCountInclude = {
  _count: { select: { children: true, documents: true } },
} as const

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  private async toFolderNode(folder: FolderRow, userId: string, role: Role): Promise<FolderNode> {
    let userPermissions: FolderAction[]
    if (role === Role.ADMIN) {
      userPermissions = ALL_ACTIONS
    } else {
      const perm = await this.prisma.folderPermission.findUnique({
        where: { folderId_userId: { folderId: folder.id, userId } },
        select: { actions: true },
      })
      userPermissions = perm?.actions ?? [FolderAction.VIEW]
    }
    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      childCount: folder._count.children,
      documentCount: folder._count.documents,
      userPermissions,
      createdAt: folder.createdAt.toISOString(),
    }
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  async list(
    userId: string,
    role: Role,
    query: { parentId?: string; flat?: boolean },
  ): Promise<FolderNode[]> {
    const where = query.flat ? {} : { parentId: query.parentId ?? null }

    const folders = await this.prisma.folder.findMany({
      where,
      include: folderCountInclude,
      orderBy: { name: 'asc' },
    })

    const result: FolderNode[] = []
    for (const folder of folders) {
      if (role === Role.ADMIN) {
        result.push(await this.toFolderNode(folder, userId, role))
      } else {
        const canView = await this.permissions.canPerformAction(userId, folder.id, FolderAction.VIEW, role)
        if (canView) result.push(await this.toFolderNode(folder, userId, role))
      }
    }
    return result
  }

  // ─── Find One ────────────────────────────────────────────────────────────────

  async findOne(
    id: string,
    userId: string,
    role: Role,
  ): Promise<FolderNode & { breadcrumbs: { id: string; name: string }[] }> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: folderCountInclude,
    })
    if (!folder) throw new NotFoundException('Folder not found')

    if (role !== Role.ADMIN) {
      const canView = await this.permissions.canPerformAction(userId, id, FolderAction.VIEW, role)
      if (!canView) throw new ForbiddenException()
    }

    const node = await this.toFolderNode(folder, userId, role)

    // Walk up the tree to build breadcrumbs (root → parent of current)
    const breadcrumbs: { id: string; name: string }[] = []
    let currentParentId: string | null = folder.parentId
    while (currentParentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: currentParentId },
        select: { id: true, name: true, parentId: true },
      })
      if (!parent) break
      breadcrumbs.unshift({ id: parent.id, name: parent.name })
      currentParentId = parent.parentId
    }

    return { ...node, breadcrumbs }
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(dto: { name: string; parentId?: string }, userId: string, role: Role): Promise<FolderNode> {
    // Root-level folders require ADMIN
    if (!dto.parentId && role !== Role.ADMIN) {
      throw new ForbiddenException()
    }

    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
        select: { id: true },
      })
      if (!parent) throw new NotFoundException('Parent folder not found')

      if (role !== Role.ADMIN) {
        const canManage = await this.permissions.canPerformAction(userId, dto.parentId, FolderAction.MANAGE, role)
        if (!canManage) throw new ForbiddenException()
      }
    }

    try {
      const folder = await this.prisma.$transaction(async (tx) => {
        const created = await tx.folder.create({
          data: { name: dto.name, parentId: dto.parentId ?? null, createdById: userId },
          include: folderCountInclude,
        })

        // Cascade FolderPermission rows from parent (inherited=true)
        if (dto.parentId) {
          const parentPerms = await tx.folderPermission.findMany({
            where: { folderId: dto.parentId },
          })
          if (parentPerms.length > 0) {
            await tx.folderPermission.createMany({
              data: parentPerms.map((p) => ({
                folderId: created.id,
                userId: p.userId,
                actions: p.actions,
                inherited: true,
              })),
              skipDuplicates: true,
            })
          }
        }

        return created
      })

      return this.toFolderNode(folder, userId, role)
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A folder with that name already exists here')
      }
      throw e
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: { name?: string; parentId?: string },
    userId: string,
    role: Role,
  ): Promise<FolderNode> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: folderCountInclude,
    })
    if (!folder) throw new NotFoundException('Folder not found')

    if (role !== Role.ADMIN) {
      const canManage = await this.permissions.canPerformAction(userId, id, FolderAction.MANAGE, role)
      if (!canManage) throw new ForbiddenException()
    }

    const isMoving = dto.parentId !== undefined && dto.parentId !== folder.parentId
    if (isMoving) {
      await this.assertNoCycle(id, dto.parentId!)
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.folder.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
          },
          include: folderCountInclude,
        })

        if (isMoving) {
          // Remove inherited rows; preserve explicit overrides
          await tx.folderPermission.deleteMany({ where: { folderId: id, inherited: true } })

          // Re-cascade from new parent
          if (dto.parentId) {
            const parentPerms = await tx.folderPermission.findMany({
              where: { folderId: dto.parentId },
            })
            if (parentPerms.length > 0) {
              await tx.folderPermission.createMany({
                data: parentPerms.map((p) => ({
                  folderId: id,
                  userId: p.userId,
                  actions: p.actions,
                  inherited: true,
                })),
                skipDuplicates: true,
              })
            }
          }
        }

        return result
      })

      return this.toFolderNode(updated, userId, role)
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A folder with that name already exists here')
      }
      throw e
    }
  }

  // ─── Remove ──────────────────────────────────────────────────────────────────

  async remove(id: string, strategy: 'reject' | 'cascade', userId: string, role: Role): Promise<void> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      select: { id: true, parentId: true, _count: { select: { children: true, documents: true } } },
    })
    if (!folder) throw new NotFoundException('Folder not found')

    // Root folder is protected
    if (folder.parentId === null) {
      throw new BadRequestException('Cannot delete the root folder')
    }

    if (strategy === 'cascade') {
      if (role !== Role.ADMIN) throw new ForbiddenException()
    } else {
      if (role !== Role.ADMIN) {
        const canManage = await this.permissions.canPerformAction(userId, id, FolderAction.MANAGE, role)
        if (!canManage) throw new ForbiddenException()
      }
      if (folder._count.children > 0 || folder._count.documents > 0) {
        throw new BadRequestException('Folder is not empty')
      }
      await this.prisma.folder.delete({ where: { id } })
      return
    }

    // cascade: get all descendants sorted deepest-first (avoids FK violations)
    const descendants = await this.prisma.$queryRaw<{ id: string; depth: number }[]>(
      Prisma.sql`
        WITH RECURSIVE descendants AS (
          SELECT id, 0 AS depth FROM folders WHERE id = ${id}
          UNION ALL
          SELECT f.id, d.depth + 1
          FROM folders f
          JOIN descendants d ON f."parentId" = d.id
        )
        SELECT id, depth FROM descendants ORDER BY depth DESC
      `,
    )
    const descendantIds = descendants.map((d) => d.id)

    await this.prisma.$transaction(async (tx) => {
      const docs = await tx.document.findMany({
        where: { folderId: { in: descendantIds } },
        select: { fileKey: true },
      })
      const s3Keys = docs.map((d) => d.fileKey)

      // Delete documents first (FK: Restrict)
      await tx.document.deleteMany({ where: { folderId: { in: descendantIds } } })

      // Delete folders deepest-first (children before parents)
      for (const { id: fId } of descendants) {
        await tx.folder.delete({ where: { id: fId } })
      }

      if (s3Keys.length > 0) {
        this.logger.log(`[S3 CLEANUP STUB] Keys queued for async deletion: ${s3Keys.join(', ')}`)
      }
    })
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertNoCycle(folderId: string, newParentId: string): Promise<void> {
    if (folderId === newParentId) {
      throw new BadRequestException('Cannot move folder into its own descendant')
    }
    const descendants = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        WITH RECURSIVE descendants AS (
          SELECT id FROM folders WHERE id = ${folderId}
          UNION ALL
          SELECT f.id FROM folders f
          JOIN descendants d ON f."parentId" = d.id
        )
        SELECT id FROM descendants
      `,
    )
    if (descendants.some((d) => d.id === newParentId)) {
      throw new BadRequestException('Cannot move folder into its own descendant')
    }
  }
}
