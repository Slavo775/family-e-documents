import type { CanActivate, ExecutionContext} from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import type { SessionService } from './session.service'

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const rawToken = authHeader.slice(7)
    const user = await this.sessionService.validateToken(rawToken)

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token')
    }

    const r = req as Request & { user: unknown; token: string }
    r.user = user
    r.token = rawToken

    return true
  }
}
