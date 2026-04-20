import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import type { Request } from 'express'
import type { UserPublic } from '@family-docs/types'
import { AuthService } from './auth.service'
import { BearerTokenGuard } from './bearer-token.guard'

class LoginBodyDto {
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsString()
  password!: string
}

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginBodyDto) {
    return this.authService.login(body.email, body.password)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(BearerTokenGuard)
  async logout(@Req() req: Request & { token: string }) {
    await this.authService.logout(req.token)
    return { message: 'Logged out' }
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(BearerTokenGuard)
  me(@Req() req: Request & { user: UserPublic }) {
    return req.user
  }
}
