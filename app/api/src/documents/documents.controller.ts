import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'
import type { Request } from 'express'
import type { Role } from '@family-docs/db'
import type { DocumentsService } from './documents.service'
import { BearerTokenGuard } from '../auth/bearer-token.guard'

type AuthRequest = Request & {
  user: { id: string; role: Role; canRestrictDocs: boolean }
}

class CreateDocumentBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsString()
  @IsNotEmpty()
  folderId!: string

  @IsString()
  @IsNotEmpty()
  mimeType!: string

  @IsInt()
  @Min(1)
  @Max(500 * 1024 * 1024) // 500 MB
  @Type(() => Number)
  sizeBytes!: number
}

class UpdateDocumentBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsEnum(['PUBLIC', 'RESTRICTED'])
  visibility?: 'PUBLIC' | 'RESTRICTED'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUserIds?: string[]
}

class MoveDocumentBodyDto {
  @IsString()
  @IsNotEmpty()
  targetFolderId!: string
}

class DocumentQueryDto {
  @IsOptional()
  @IsString()
  folderId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Transform(({ value }: { value: number }) => Math.min(Number(value), 100))
  @IsInt()
  @Min(1)
  limit?: number
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('api/v1/documents')
@UseGuards(BearerTokenGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  initiateUpload(@Req() req: AuthRequest, @Body() dto: CreateDocumentBodyDto) {
    return this.documentsService.initiateUpload(req.user.id, req.user.role, dto)
  }

  @Post(':id/confirm')
  confirmUpload(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.documentsService.confirmUpload(req.user.id, req.user.role, id)
  }

  @Get()
  findAll(@Req() req: AuthRequest, @Query() query: DocumentQueryDto) {
    return this.documentsService.findAll(req.user.id, req.user.role, query)
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.documentsService.findOne(req.user.id, req.user.role, id)
  }

  @Get(':id/download')
  getDownloadUrl(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.documentsService.getDownloadUrl(req.user.id, req.user.role, id)
  }

  @Patch(':id')
  updateMetadata(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateDocumentBodyDto) {
    return this.documentsService.updateMetadata(req.user.id, req.user.role, id, dto)
  }

  @Post(':id/move')
  moveDocument(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: MoveDocumentBodyDto) {
    return this.documentsService.moveDocument(req.user.id, req.user.role, id, dto.targetFolderId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.documentsService.softDelete(req.user.id, req.user.role, id)
  }
}
