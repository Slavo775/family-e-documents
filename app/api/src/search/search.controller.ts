import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  IsArray,
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
import type { SearchService } from './search.service'
import { BearerTokenGuard } from '../auth/bearer-token.guard'

type AuthRequest = Request & { user: { id: string; role: Role } }

class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  q!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) => (Array.isArray(value) ? value : [value]))
  tags?: string[]

  @IsOptional()
  @IsString()
  folderId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}

class SearchTagsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  q?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}

@ApiTags('search')
@ApiBearerAuth()
@Controller('api/v1/search')
@UseGuards(BearerTokenGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text document search with optional tag and folder filters' })
  @ApiQuery({ name: 'q', description: 'Search query (1–200 chars)', required: true })
  @ApiQuery({ name: 'tags', description: 'Filter: document must contain ALL specified tags', required: false, isArray: true })
  @ApiQuery({ name: 'folderId', description: 'Scope search to this folder and its descendants', required: false })
  @ApiQuery({ name: 'page', description: 'Page number (default 1)', required: false })
  @ApiQuery({ name: 'limit', description: 'Results per page (default 20, max 50)', required: false })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Req() req: AuthRequest, @Query() query: SearchQueryDto) {
    return this.searchService.search(req.user.id, req.user.role, {
      q: query.q,
      tags: query.tags,
      folderId: query.folderId,
      page: query.page,
      limit: query.limit,
    })
  }

  @Get('tags')
  @ApiOperation({ summary: 'Tag autocomplete — returns distinct tags from accessible documents ordered by frequency' })
  @ApiQuery({ name: 'q', description: 'Tag prefix (min 1 char)', required: false })
  @ApiQuery({ name: 'limit', description: 'Max results (default 20)', required: false })
  @ApiResponse({ status: 200, description: 'Array of matching tag strings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTags(@Req() req: AuthRequest, @Query() query: SearchTagsQueryDto) {
    return this.searchService.getTags(req.user.id, req.user.role, {
      q: query.q,
      limit: query.limit,
    })
  }
}
