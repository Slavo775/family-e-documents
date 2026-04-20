import type { MiddlewareConsumer, NestModule } from '@nestjs/common'
import { Module, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { AuditModule } from './audit/audit.module'
import { AuditMiddleware } from './audit/audit.middleware'
import { StorageModule } from './storage/storage.module'
import { PermissionsModule } from './permissions/permissions.module'
import { DocumentsModule } from './documents/documents.module'
import { FoldersModule } from './folders/folders.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    AuditModule,
    StorageModule,
    PermissionsModule,
    DocumentsModule,
    FoldersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
