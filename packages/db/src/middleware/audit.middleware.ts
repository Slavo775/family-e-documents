import { Prisma } from '../generated/prisma/index.js'

const SENSITIVE_FIELDS = ['passwordHash']

type GetUserIdFn = () => string | null

function stripSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  for (const field of SENSITIVE_FIELDS) {
    if (field in result) {
      result[field] = '[REDACTED]'
    }
  }
  return result
}

function computeDiff(
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> | null {
  const diff: Record<string, { old: unknown; new: unknown }> = {}

  for (const key of Object.keys(newRecord)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      if (oldRecord[key] !== newRecord[key]) {
        diff[key] = { old: '[REDACTED]', new: '[REDACTED]' }
      }
      continue
    }
    const oldVal = oldRecord[key]
    const newVal = newRecord[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal }
    }
  }

  return Object.keys(diff).length > 0 ? diff : null
}

function toClientModel(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1)
}

/**
 * Creates a Prisma Client extension that audits create, update, and delete
 * operations on the specified models.
 */
export function createAuditExtension(auditedModels: string[], getUserId?: GetUserIdFn) {
  return Prisma.defineExtension((prisma) =>
    prisma.$extends({
      name: 'audit',
      query: {
        $allModels: {
          async $allOperations(op: {
            model?: string
            operation: string
            args: Record<string, unknown>
            query: (args: unknown) => Promise<unknown>
          }) {
            const { model, operation, args, query } = op

            if (!model || !auditedModels.includes(model) || model === 'AuditLog') {
              return query(args)
            }

            const performedBy = getUserId?.() ?? null
            const modelKey = toClientModel(model)
            const modelDelegate = (prisma as Record<string, unknown>)[modelKey] as
              | { findUnique: (args: { where: unknown }) => Promise<Record<string, unknown> | null> }
              | undefined

            if (operation === 'create') {
              const result = (await query(args)) as Record<string, unknown>
              try {
                await prisma.auditLog.create({
                  data: {
                    userId: performedBy,
                    method: 'PRISMA',
                    path: `${model}.create`,
                    statusCode: 0,
                    durationMs: 0,
                    ipAddress: 'internal',
                    userAgent: 'prisma-extension',
                    body: stripSensitiveFields(result) as Prisma.InputJsonValue,
                  },
                })
              } catch {
                // Never let audit failure break the primary operation
              }
              return result
            }

            if (operation === 'update') {
              let oldRecord: Record<string, unknown> | null = null
              if (modelDelegate && args && typeof args === 'object' && 'where' in args) {
                try {
                  oldRecord = await modelDelegate.findUnique({
                    where: (args as { where: unknown }).where,
                  })
                } catch {
                  // ignore lookup failure
                }
              }

              const result = (await query(args)) as Record<string, unknown>
              try {
                const changes = oldRecord
                  ? computeDiff(oldRecord, result)
                  : stripSensitiveFields((args as { data?: Record<string, unknown> }).data ?? {})

                if (changes && Object.keys(changes).length > 0) {
                  await prisma.auditLog.create({
                    data: {
                      userId: performedBy,
                      method: 'PRISMA',
                      path: `${model}.update`,
                      statusCode: 0,
                      durationMs: 0,
                      ipAddress: 'internal',
                      userAgent: 'prisma-extension',
                      body: changes as Prisma.InputJsonValue,
                    },
                  })
                }
              } catch {
                // ignore audit failure
              }
              return result
            }

            if (operation === 'delete') {
              let oldRecord: Record<string, unknown> | null = null
              if (modelDelegate && args && typeof args === 'object' && 'where' in args) {
                try {
                  oldRecord = await modelDelegate.findUnique({
                    where: (args as { where: unknown }).where,
                  })
                } catch {
                  // ignore lookup failure
                }
              }

              const result = (await query(args)) as Record<string, unknown>
              try {
                await prisma.auditLog.create({
                  data: {
                    userId: performedBy,
                    method: 'PRISMA',
                    path: `${model}.delete`,
                    statusCode: 0,
                    durationMs: 0,
                    ipAddress: 'internal',
                    userAgent: 'prisma-extension',
                    body: (
                      oldRecord ? stripSensitiveFields(oldRecord) : undefined
                    ) as Prisma.InputJsonValue | undefined,
                  },
                })
              } catch {
                // ignore audit failure
              }
              return result
            }

            return query(args)
          },
        },
      },
    }),
  )
}
