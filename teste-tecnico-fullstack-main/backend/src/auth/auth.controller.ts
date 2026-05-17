import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class ActivateDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  organizationName?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate account via invitation token' })
  activate(@Body() dto: ActivateDto) {
    return this.authService.activateAccount(
      dto.token,
      dto.name,
      dto.password,
      dto.organizationName,
    );
  }

  @Get('validate-token')
  @ApiOperation({ summary: 'Validate invitation token' })
  validateToken(@Query('token') token: string) {
    return this.authService.validateToken(token);
  }
}
