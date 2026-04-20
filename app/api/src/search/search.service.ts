import { Injectable } from '@nestjs/common'
import { Prisma, Role, FolderAction } from '@family-docs/db'
import { z } from 'zod'
import type { SearchResult, SearchResultsResponse } from '@family-docs/types'
import type { PrismaService } from '../prisma/prisma.service'

interface SearchQuery {
  q: string
  tags?: string[]
  folderId?: string
  page?: number
  limit?: number
}

interface TagsQuery {
  q?: string
  limit?: number
}

// Zod schema for validating raw search query result rows
const RawSearchRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  folderId: z.string(),
  folderName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedById: z.string(),
  uploadedByName: z.string(),
  createdAt: z.date(),
  rank: z.number(),
  totalCount: z.bigint(),
})

type FolderNode = {
  id: string
  name: string
  parentId: string | null
  permissions?: { actions: FolderAction[] }[]
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, userRole: Role, query: SearchQuery): Promise<SearchResultsResponse> {
    const { q, tags, folderId: scopeFolderId, page = 1, limit = 20 } = query
    const offset = (page - 1) * limit

    // 1. Fetch all folders with this user's permissions in one query
    const folderNodes = await this.fetchFolderNodes(userId, userRole)
    const folderMap = new Map(folderNodes.map((f) => [f.id, f]))

    // 2. Compute accessible folder IDs in memory
    let accessibleIds = this.resolveAccessibleFolderIds(folderNodes, folderMap, userRole)

    // 3. Apply optional folder scope (restrict to subtree)
    if (scopeFolderId) {
      const subtreeIds = this.buildSubtreeIds(scopeFolderId, folderNodes)
      accessibleIds = accessibleIds.filter((id) => subtreeIds.has(id))
    }

    if (accessibleIds.length === 0) {
      return { data: [], total: 0, page, limit, query: q }
    }

    // 4. Build folder path map for display (e.g. "Finance / Tax Returns")
    const pathCache = this.buildFolderPathMap(folderNodes, folderMap)

    // 5. Build conditional query fragments
    const trigramClause =
      q.length >= 3
        ? Prisma.sql`OR (d.title % ${q} OR d.description % ${q})`
        : Prisma.empty

    const tagsClause =
      tags && tags.length > 0
        ? Prisma.sql`AND d.tags @> ARRAY[${Prisma.join(tags)}]`
        : Prisma.empty

    const visibilityClause =
      userRole === Role.ADMIN
        ? Prisma.empty
        : Prisma.sql`AND (d.visibility = 'PUBLIC' OR ${userId} = ANY(d."allowedUserIds"))`

    // 6. Execute parameterised raw search query
    const sqlQuery = Prisma.sql`
      SELECT
        d.id,
        d.name,
        d.title,
        d.description,
        d.tags,
        d."folderId",
        f.name                                                              AS "folderName",
        d."mimeType",
        d."sizeBytes",
        u.id                                                                AS "uploadedById",
        u.name                                                              AS "uploadedByName",
        d."createdAt",
        ts_rank(d."searchVector", plainto_tsquery('simple', ${q}))         AS rank,
        COUNT(*) OVER()                                                     AS "totalCount"
      FROM documents d
      JOIN folders f ON f.id = d."folderId"
      JOIN users   u ON u.id = d."uploadedById"
      WHERE
        d.status = 'ACTIVE'
        AND d."folderId" IN (${Prisma.join(accessibleIds)})
        AND (
          d."searchVector" @@ plainto_tsquery('simple', ${q})
          ${trigramClause}
        )
        ${visibilityClause}
        ${tagsClause}
      ORDER BY rank DESC, d."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const rawRows = await this.prisma.$queryRaw<unknown[]>(sqlQuery)

    // 7. Validate raw rows with Zod before mapping to response type
    const rows = z.array(RawSearchRowSchema).parse(rawRows)

    const total = rows.length > 0 ? Number(rows[0]!.totalCount) : 0

    const data: SearchResult[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      tags: row.tags,
      folderId: row.folderId,
      folderName: row.folderName,
      folderPath: pathCache.get(row.folderId) ?? row.folderName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      rank: row.rank,
      uploadedBy: { id: row.uploadedById, name: row.uploadedByName },
      createdAt: row.createdAt.toISOString(),
    }))

    return { data, total, page, limit, query: q }
  }

  async getTags(userId: string, userRole: Role, query: TagsQuery): Promise<string[]> {
    const { q, limit = 20 } = query

    const folderNodes = await this.fetchFolderNodes(userId, userRole)
    const folderMap = new Map(folderNodes.map((f) => [f.id, f]))
    const accessibleIds = this.resolveAccessibleFolderIds(folderNodes, folderMap, userRole)

    if (accessibleIds.length === 0) return []

    const prefixClause = q ? Prisma.sql`AND tag ILIKE ${q + '%'}` : Prisma.empty

    const rows = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT tag, COUNT(*) AS freq
      FROM documents d, UNNEST(d.tags) AS tag
      WHERE
        d.status = 'ACTIVE'
        AND d."folderId" IN (${Prisma.join(accessibleIds)})
        ${prefixClause}
      GROUP BY tag
      ORDER BY freq DESC
      LIMIT ${limit}
    `

    return rows.map((r) => r.tag)
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async fetchFolderNodes(userId: string, userRole: Role): Promise<FolderNode[]> {
    if (userRole === Role.ADMIN) {
      return this.prisma.folder.findMany({ select: { id: true, name: true, parentId: true } })
    }
    return this.prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        permissions: { where: { userId }, select: { actions: true } },
      },
    })
  }

  private resolveAccessibleFolderIds(
    folderNodes: FolderNode[],
    folderMap: Map<string, FolderNode>,
    userRole: Role,
  ): string[] {
    if (userRole === Role.ADMIN) return folderNodes.map((f) => f.id)

    const viewCache = new Map<string, boolean>()

    const canView = (folderId: string, visited = new Set<string>()): boolean => {
      if (viewCache.has(folderId)) return viewCache.get(folderId)!
      if (visited.has(folderId)) return true
      visited.add(folderId)

      const f = folderMap.get(folderId)
      if (!f) return false

      const perms = f.permissions ?? []
      if (perms.length > 0) {
        const result = perms[0]!.actions.includes(FolderAction.VIEW)
        viewCache.set(folderId, result)
        return result
      }

      // No explicit permission — walk to parent; USER default is VIEW=true
      const result = f.parentId ? canView(f.parentId, visited) : true
      viewCache.set(folderId, result)
      return result
    }

    return folderNodes.filter((f) => canView(f.id)).map((f) => f.id)
  }

  private buildSubtreeIds(rootId: string, folderNodes: FolderNode[]): Set<string> {
    const subtreeIds = new Set<string>()
    const addSubtree = (id: string) => {
      subtreeIds.add(id)
      folderNodes.filter((f) => f.parentId === id).forEach((f) => addSubtree(f.id))
    }
    addSubtree(rootId)
    return subtreeIds
  }

  private buildFolderPathMap(folderNodes: FolderNode[], folderMap: Map<string, FolderNode>): Map<string, string> {
    const pathCache = new Map<string, string>()

    const getPath = (id: string): string => {
      if (pathCache.has(id)) return pathCache.get(id)!
      const f = folderMap.get(id)
      if (!f) return ''
      const path = f.parentId ? `${getPath(f.parentId)} / ${f.name}` : f.name
      pathCache.set(id, path)
      return path
    }

    folderNodes.forEach((f) => getPath(f.id))
    return pathCache
  }
}
