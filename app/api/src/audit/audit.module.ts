import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { AuditMiddleware } from './audit.middleware'

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService, AuditMiddleware],
  exports: [AuditMiddleware],
})
export class AuditModule {}
