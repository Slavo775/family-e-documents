import { Injectable } from '@nestjs/common'
import type { Prisma } from '@family-docs/db'
import type { AuditLogEntry, AuditLogQueryParams, AuditLogsResponse } from '@family-docs/types'
import type { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryParams): Promise<AuditLogsResponse> {
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 50, 200)
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {}

    if (query.userId) where.userId = query.userId
    if (query.method) where.method = query.method
    if (query.statusCode) where.statusCode = query.statusCode
    if (query.path) where.path = { startsWith: query.path }
    if (query.from || query.to) {
      where.timestamp = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      }
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ])

    const data: AuditLogEntry[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.user?.name ?? null,
      method: row.method,
      path: row.path,
      statusCode: row.statusCode,
      durationMs: row.durationMs,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      body: row.body as object | null,
      timestamp: row.timestamp.toISOString(),
    }))

    return { data, total, page, limit }
  }
}
