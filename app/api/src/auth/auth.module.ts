import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

@Module({
  controllers: [AuthController],
  providers: [SessionService, AuthService],
  exports: [SessionService],
})
export class AuthModule {}
