import { Injectable } from '@nestjs/common'
import type { PrismaService } from '../prisma/prisma.service'
import { FolderAction, Role } from '@family-docs/db'

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
}
