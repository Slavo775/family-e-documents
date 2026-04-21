import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import type { UserPublic } from '@family-docs/types'
import { Role } from '@family-docs/types'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'

function toUserPublic(user: {
  id: string
  email: string
  name: string
  role: string
  canRestrictDocs: boolean
  createdAt: Date
}): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    canRestrictDocs: user.canRestrictDocs,
    createdAt: user.createdAt.toISOString(),
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserPublic[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
    return users.map(toUserPublic)
  }

  async findOne(id: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    return toUserPublic(user)
  }

  async create(dto: CreateUserDto): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already in use')

    const passwordHash = await hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role ?? Role.USER,
        canRestrictDocs: dto.canRestrictDocs ?? false,
      },
    })
    return toUserPublic(user)
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')

    // Guard: cannot downgrade last admin
    if (dto.role === Role.USER && user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } })
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot downgrade the last admin')
      }
    }

    const data: Record<string, unknown> = {}
    if (dto.email !== undefined) data.email = dto.email
    if (dto.name !== undefined) data.name = dto.name
    if (dto.role !== undefined) data.role = dto.role
    if (dto.canRestrictDocs !== undefined) data.canRestrictDocs = dto.canRestrictDocs
    if (dto.password !== undefined) data.passwordHash = await hash(dto.password, 10)

    const updated = await this.prisma.user.update({ where: { id }, data })
    return toUserPublic(updated)
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException('User not found')

    if (id === requesterId) {
      throw new BadRequestException('Cannot delete your own account')
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } })
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin')
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Reassign uploaded documents to the requesting admin
      await tx.document.updateMany({
        where: { uploadedById: id },
        data: { uploadedById: requesterId },
      })

      // Remove deleted user from all document allowedUserIds
      const docsWithUser = await tx.document.findMany({
        where: { allowedUserIds: { has: id } },
        select: { id: true, allowedUserIds: true },
      })
      for (const doc of docsWithUser) {
        await tx.document.update({
          where: { id: doc.id },
          data: { allowedUserIds: doc.allowedUserIds.filter((uid: string) => uid !== id) },
        })
      }

      // Delete user (cascades sessions and folder permissions)
      await tx.user.delete({ where: { id } })
    })
  }
}
