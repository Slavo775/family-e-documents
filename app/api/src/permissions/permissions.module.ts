import { Global, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PermissionsService } from './permissions.service'
import { PermissionsController } from './permissions.controller'
import { RolesGuard } from '../common/roles.guard'

@Global()
@Module({
  imports: [AuthModule],
  providers: [PermissionsService, RolesGuard],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
