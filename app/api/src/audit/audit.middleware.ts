import type { NestMiddleware } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'
import { PrismaService } from '../prisma/prisma.service'

const REDACTED_FIELDS = ['password', 'passwordHash', 'token', 'secret']
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function sanitizeBody(body: unknown): object | null {
  if (!body || typeof body !== 'object') return null
  const sanitized = { ...(body as Record<string, unknown>) }
  for (const field of REDACTED_FIELDS) {
    if (field in sanitized) sanitized[field] = '[REDACTED]'
  }
  return sanitized
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()

    res.on('finish', () => {
      const user = (req as Request & { user?: { id: string } }).user
      const body = MUTATING_METHODS.has(req.method) ? sanitizeBody(req.body) : null

      this.prisma.auditLog
        .create({
          data: {
            userId: user?.id ?? null,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            ipAddress: req.ip ?? '',
            userAgent:
              typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
            body: body ?? undefined,
          },
        })
        .catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[AuditMiddleware] Failed to write audit log:', err)
        })
    })

    next()
  }
}
