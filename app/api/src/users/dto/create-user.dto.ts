import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { Role } from '@family-docs/types'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsBoolean()
  canRestrictDocs?: boolean
}
