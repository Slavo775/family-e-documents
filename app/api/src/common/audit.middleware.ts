import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name)

  use(req: Request, _res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.path}`)
    next()
  }
}
