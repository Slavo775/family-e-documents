import type { Role } from './enums'

export interface UserPublic {
  id: string
  email: string
  name: string
  role: Role
  canRestrictDocs: boolean
  createdAt: string
}

export interface CreateUserDto {
  email: string
  password: string
  name: string
  role?: Role
  canRestrictDocs?: boolean
}

export interface UpdateUserDto {
  email?: string
  name?: string
  role?: Role
  canRestrictDocs?: boolean
  password?: string
}

export interface AuditLogEntry {
  id: string
  userId: string | null
  userName: string | null
  method: string
  path: string
  statusCode: number
  durationMs: number
  ipAddress: string
  userAgent: string | null
  body: object | null
  timestamp: string
}

export interface AuditLogQueryParams {
  userId?: string
  method?: string
  path?: string
  statusCode?: number
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface AuditLogsResponse {
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

export interface DocumentPublic {
  id: string
  name: string
  title: string
  description: string | null
  tags: string[]
  folderId: string
  folderName: string
  mimeType: string
  sizeBytes: number
  status: 'ACTIVE' | 'PENDING'
  visibility: 'PUBLIC' | 'RESTRICTED'
  allowedUserIds: string[]
  uploadedBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentDto {
  name: string
  title: string
  description?: string
  tags?: string[]
  folderId: string
  mimeType: string
  sizeBytes: number
}

export interface UpdateDocumentDto {
  name?: string
  title?: string
  description?: string | null
  tags?: string[]
  visibility?: 'PUBLIC' | 'RESTRICTED'
  allowedUserIds?: string[]
}

export interface DocumentListResponse {
  data: DocumentPublic[]
  total: number
  page: number
  limit: number
}

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  childCount: number
  documentCount: number
  userPermissions: string[]
  createdAt: string
}

export interface UploadInitResponse {
  documentId: string
  uploadUrl: string
  uploadExpiresAt: string
}

export interface FolderPermissionEntry {
  userId: string
  userName: string
  actions: string[]
  inherited: boolean
  inheritedFrom?: string
}

export interface SearchResult {
  id: string
  name: string
  title: string
  description: string | null
  tags: string[]
  folderId: string
  folderName: string
  folderPath: string
  mimeType: string
  sizeBytes: number
  rank: number
  uploadedBy: { id: string; name: string }
  createdAt: string
}

export interface SearchResultsResponse {
  data: SearchResult[]
  total: number
  page: number
  limit: number
  query: string
}
