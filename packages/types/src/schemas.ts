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
