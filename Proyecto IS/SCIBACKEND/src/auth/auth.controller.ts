// src/auth/auth.controller.ts

import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'; // <-- Modifica esta línea
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; // <-- 1. IMPORTA el DTO de Login

@Controller('auth') // Ruta base /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // Endpoint de Registro
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // --- NUEVO ENDPOINT DE LOGIN ---
  @HttpCode(HttpStatus.OK) // <-- 2. Le decimos que devuelva 200 OK
  @Post('login') // <-- 3. Define la ruta POST /auth/login
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}