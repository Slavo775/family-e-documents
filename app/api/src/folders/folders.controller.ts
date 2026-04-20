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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'
import type { Request } from 'express'
import type { Role } from '@family-docs/db'
import { BearerTokenGuard } from '../auth/bearer-token.guard'
import { FoldersService } from './folders.service'

type AuthRequest = Request & {
  user: { id: string; role: Role }
}

class CreateFolderBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentId?: string
}

class UpdateFolderBodyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentId?: string
}

class FolderQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  flat?: boolean
}

class DeleteFolderQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['reject', 'cascade'])
  strategy?: 'reject' | 'cascade'
}

@ApiTags('folders')
@ApiBearerAuth()
@Controller('api/v1/folders')
@UseGuards(BearerTokenGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  @ApiOperation({ summary: 'List folders (permission-filtered)' })
  @ApiQuery({ name: 'parentId', required: false, description: 'List children of this folder (omit for root)' })
  @ApiQuery({ name: 'flat', required: false, type: Boolean, description: 'Return flat list of all viewable folders' })
  @ApiResponse({ status: 200, description: 'Folder list' })
  list(@Req() req: AuthRequest, @Query() query: FolderQueryDto) {
    return this.foldersService.list(req.user.id, req.user.role, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder by ID with breadcrumbs' })
  @ApiResponse({ status: 200, description: 'Folder with breadcrumbs' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.foldersService.findOne(id, req.user.id, req.user.role)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a folder (ADMIN or MANAGE on parent)' })
  @ApiResponse({ status: 201, description: 'Folder created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Duplicate sibling name' })
  create(@Req() req: AuthRequest, @Body() dto: CreateFolderBodyDto) {
    return this.foldersService.create(dto, req.user.id, req.user.role)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or move a folder (MANAGE required)' })
  @ApiResponse({ status: 200, description: 'Folder updated' })
  @ApiResponse({ status: 400, description: 'Cycle detected' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Duplicate sibling name' })
  update(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateFolderBodyDto) {
    return this.foldersService.update(id, dto, req.user.id, req.user.role)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a folder (cascade requires ADMIN)' })
  @ApiQuery({ name: 'strategy', required: false, enum: ['reject', 'cascade'], description: 'reject (default) or cascade' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Folder not empty or cannot delete root' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Req() req: AuthRequest, @Param('id') id: string, @Query() query: DeleteFolderQueryDto) {
    return this.foldersService.remove(id, query.strategy ?? 'reject', req.user.id, req.user.role)
  }
}
