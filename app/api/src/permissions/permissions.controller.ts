import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { IsArray, IsEnum } from 'class-validator'
import { FolderAction } from '@family-docs/db'
import { Role } from '@family-docs/types'
import { BearerTokenGuard } from '../auth/bearer-token.guard'
import { RolesGuard } from '../common/roles.guard'
import { Roles } from '../common/roles.decorator'
import { PermissionsService } from './permissions.service'

class UpsertPermissionBodyDto {
  @IsArray()
  @IsEnum(FolderAction, { each: true })
  actions!: FolderAction[]
}

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('api/v1/folders/:folderId/permissions')
@UseGuards(BearerTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all per-user permissions on a folder (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Permission list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  list(@Param('folderId') folderId: string) {
    return this.permissionsService.listForFolder(folderId)
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Upsert explicit permission override on a folder (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Permission entry' })
  @ApiResponse({ status: 400, description: 'Validation failure' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Folder or user not found' })
  upsert(
    @Param('folderId') folderId: string,
    @Param('userId') userId: string,
    @Body() dto: UpsertPermissionBodyDto,
  ) {
    return this.permissionsService.upsertForFolder(folderId, userId, dto.actions)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove permission override from a folder (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('folderId') folderId: string, @Param('userId') userId: string) {
    return this.permissionsService.removeForFolder(folderId, userId)
  }
}
