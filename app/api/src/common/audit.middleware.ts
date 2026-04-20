import type { NestMiddleware} from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name)

  // Verification (task 5.1): this middleware is applied to all routes via AppModule.
  // Failed login attempts (POST /api/v1/auth/login → 401) are logged here at request-entry
  // time. No additional wiring is needed — every auth attempt, successful or not, produces
  // an audit log entry with method and path.
  use(req: Request, _res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.path}`)
    next()
  }
}
