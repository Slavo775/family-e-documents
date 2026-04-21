import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { Role } from '@family-docs/types'
import { AuditService } from './audit.service'
import { BearerTokenGuard } from '../auth/bearer-token.guard'
import { RolesGuard } from '../common/roles.guard'
import { Roles } from '../common/roles.decorator'

class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string

  @IsOptional()
  @IsString()
  path?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number

  @IsOptional()
  @IsISO8601()
  from?: string

  @IsOptional()
  @IsISO8601()
  to?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Transform(({ value }: { value: number }) => Math.min(Number(value), 200))
  @IsInt()
  @Min(1)
  limit?: number
}

@ApiTags('audit')
@ApiBearerAuth()
@Controller('api/v1/audit-logs')
@UseGuards(BearerTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAll(query)
  }
}
