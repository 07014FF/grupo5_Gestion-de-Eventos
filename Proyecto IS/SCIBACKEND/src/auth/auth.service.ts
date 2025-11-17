// src/auth/auth.service.ts

import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException, // <-- AÑADIDO
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'; // <-- AÑADIDO
import { LoginDto } from './dto/login.dto'; // <-- AÑADIDO

@Injectable()
export class AuthService {
  // Inyectamos PrismaService y JwtService
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // <-- AÑADIDO
  ) {}

  async register(dto: RegisterDto) {
    // 1. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    try {
      // 2. Crear el usuario en la base de datos
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          nombre: dto.nombre,
          rol: dto.rol,
          password: hashedPassword,
        },
      });

      // 3. No devolver NUNCA la contraseña hasheada
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;

    } catch (error) {
      // Manejar el error si el email ya existe
      if (error.code === 'P2002') {
        throw new HttpException('El correo ya está registrado', HttpStatus.CONFLICT);
      }
      throw new HttpException('Algo salió mal', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- NUEVO MÉTODO DE LOGIN ---
  async login(dto: LoginDto) {
    // 1. Encontrar al usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Comparar contraseñas
    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar el Token JWT
    // El payload es la info que guardamos en el token
    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const accessToken = await this.jwtService.signAsync(payload);

    // 4. Devolver el token
    return {
      message: 'Inicio de sesión exitoso',
      accessToken: accessToken,
    };
  }
}