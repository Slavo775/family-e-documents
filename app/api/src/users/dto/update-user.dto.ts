import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { Role } from '@family-docs/types'

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsBoolean()
  canRestrictDocs?: boolean
}
