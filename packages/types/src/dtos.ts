import type { Role } from './enums'

export interface UserPublic {
  id: string
  email: string
  name: string
  role: Role
  canRestrictDocs: boolean
}
