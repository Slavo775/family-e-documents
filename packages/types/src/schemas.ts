import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginDto = z.infer<typeof LoginSchema>

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
})

export type CreateFolderDto = z.infer<typeof CreateFolderSchema>

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().optional(),
})

export type UpdateFolderDto = z.infer<typeof UpdateFolderSchema>

export const UpsertFolderPermissionSchema = z.object({
  actions: z.array(z.enum(['VIEW', 'UPLOAD', 'DELETE', 'MANAGE'])),
})

export type UpsertFolderPermissionDto = z.infer<typeof UpsertFolderPermissionSchema>

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required').max(200, 'Query too long').trim(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50, 'Limit cannot exceed 50').optional().default(20),
})

export type SearchQueryDto = z.infer<typeof SearchQuerySchema>

export const SearchTagsQuerySchema = z.object({
  q: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export type SearchTagsQueryDto = z.infer<typeof SearchTagsQuerySchema>
