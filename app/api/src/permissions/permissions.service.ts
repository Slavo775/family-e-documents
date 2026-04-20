import { Injectable, NotFoundException } from '@nestjs/common'
import type { PrismaService } from '../prisma/prisma.service'
import { FolderAction, Role } from '@family-docs/db'
import type { FolderPermissionEntry } from '@family-docs/types'

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async canPerformAction(
    userId: string,
    folderId: string,
    action: FolderAction,
    userRole: Role,
  ): Promise<boolean> {
    // Layer 1: ADMIN can do anything
    if (userRole === Role.ADMIN) return true

    // Layer 2: Walk up folder tree looking for explicit permission
    let currentFolderId: string | null = folderId
    const visited = new Set<string>()

    while (currentFolderId && !visited.has(currentFolderId)) {
      visited.add(currentFolderId)

      const permission = await this.prisma.folderPermission.findUnique({
        where: { folderId_userId: { folderId: currentFolderId, userId } },
      })

      if (permission) {
        return permission.actions.includes(action)
      }

      const folder: { parentId: string | null } | null = await this.prisma.folder.findUnique({
        where: { id: currentFolderId },
        select: { parentId: true },
      })

      currentFolderId = folder?.parentId ?? null
    }

    // Layer 3: USER baseline — VIEW is allowed by default, everything else is denied
    return action === FolderAction.VIEW
  }

  async canViewDocument(
    userId: string,
    userRole: Role,
    document: { folderId: string; visibility: string; allowedUserIds: string[] },
  ): Promise<boolean> {
    const canView = await this.canPerformAction(userId, document.folderId, FolderAction.VIEW, userRole)
    if (!canView) return false

    if (document.visibility === 'RESTRICTED') {
      return userRole === Role.ADMIN || document.allowedUserIds.includes(userId)
    }

    return true
  }

  async listForFolder(folderId: string): Promise<FolderPermissionEntry[]> {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const rows = await this.prisma.folderPermission.findMany({
      where: { folderId },
      include: { user: { select: { id: true, name: true } } },
    })

    return Promise.all(
      rows.map(async (row) => {
        const inheritedFrom = row.inherited
          ? await this.resolveInheritedFrom(folderId, row.userId)
          : undefined

        return {
          userId: row.userId,
          userName: row.user.name,
          actions: row.actions as string[],
          inherited: row.inherited,
          inheritedFrom,
        }
      }),
    )
  }

  async upsertForFolder(
    folderId: string,
    userId: string,
    actions: FolderAction[],
  ): Promise<FolderPermissionEntry> {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
    if (!user) throw new NotFoundException('User not found')

    const row = await this.prisma.folderPermission.upsert({
      where: { folderId_userId: { folderId, userId } },
      create: { folderId, userId, actions, inherited: false },
      update: { actions, inherited: false },
    })

    return {
      userId: row.userId,
      userName: user.name,
      actions: row.actions as string[],
      inherited: row.inherited,
    }
  }

  async removeForFolder(folderId: string, userId: string): Promise<void> {
    const row = await this.prisma.folderPermission.findUnique({
      where: { folderId_userId: { folderId, userId } },
    })
    if (!row) throw new NotFoundException('Permission not found')

    await this.prisma.folderPermission.delete({
      where: { folderId_userId: { folderId, userId } },
    })
  }

  private async resolveInheritedFrom(folderId: string, userId: string): Promise<string | undefined> {
    // Walk up from the parent of folderId to find the first ancestor
    // that has a FolderPermission row for this user
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { parentId: true },
    })

    let currentId: string | null = folder?.parentId ?? null
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)

      const perm = await this.prisma.folderPermission.findUnique({
        where: { folderId_userId: { folderId: currentId, userId } },
      })

      if (perm) return currentId

      const parent = await this.prisma.folder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })

      currentId = parent?.parentId ?? null
    }

    return undefined
  }
}
