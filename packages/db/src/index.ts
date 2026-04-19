export { PrismaClient, Prisma } from './generated/prisma/index.js'
export type { PrismaClient as PrismaClientType } from './generated/prisma/index.js'

// Enums
export { Role, DocumentStatus, Visibility, FolderAction } from './generated/prisma/index.js'

// Model types
export type {
  User,
  Folder,
  FolderPermission,
  Document,
  AuditLog,
} from './generated/prisma/index.js'

// Audit extension
export { createAuditExtension } from './middleware/audit.middleware.js'

// Factories (dev only — not imported in production code)
export { UserFactory } from './factories/User.js'
export { FolderFactory } from './factories/Folder.js'
export { DocumentFactory } from './factories/Document.js'
