import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { SessionService } from './session.service'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { BearerTokenGuard } from './bearer-token.guard'

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [SessionService, AuthService, BearerTokenGuard],
  exports: [SessionService, BearerTokenGuard],
})
export class AuthModule {}
