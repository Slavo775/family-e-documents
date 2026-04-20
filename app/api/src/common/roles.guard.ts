import type { CanActivate, ExecutionContext} from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { Role } from '@family-docs/types'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const req = context.switchToHttp().getRequest<Request & { user?: { role: string } }>()

    if (!req.user) {
      throw new ForbiddenException()
    }

    if (!requiredRoles.includes(req.user.role as Role)) {
      throw new ForbiddenException()
    }

    return true
  }
}
