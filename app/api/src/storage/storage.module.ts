import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { S3StorageService } from './s3-storage.service'
import { STORAGE_SERVICE } from './storage.interface'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: S3StorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
