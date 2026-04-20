import { Injectable } from '@nestjs/common'
import { createHash, randomBytes } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex')
  }

  async createSession(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = this.hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await this.prisma.session.create({
      data: { userId, token: hashedToken, expiresAt },
    })

    return rawToken
  }

  async validateToken(rawToken: string) {
    const hashedToken = this.hashToken(rawToken)
    const session = await this.prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Sliding window: reset expiry on each validated request
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiry },
    })

    return session.user
  }

  async deleteSession(rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken)
    await this.prisma.session.deleteMany({ where: { token: hashedToken } })
  }
}
