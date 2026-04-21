import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import type { UserPublic } from '@family-docs/types'
import { PrismaService } from '../prisma/prisma.service'
import { SessionService } from './session.service'

// Used for constant-time compare when the user is not found, preventing timing attacks
const DUMMY_HASH = '$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  async login(email: string, password: string): Promise<{ user: UserPublic; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } })

    // Always run bcrypt.compare to prevent timing-based user enumeration
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH
    const isValid = await bcrypt.compare(password, hashToCompare)

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const token = await this.sessionService.createSession(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserPublic['role'],
        canRestrictDocs: user.canRestrictDocs,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    }
  }

  async logout(rawToken: string): Promise<void> {
    await this.sessionService.deleteSession(rawToken)
  }
}
