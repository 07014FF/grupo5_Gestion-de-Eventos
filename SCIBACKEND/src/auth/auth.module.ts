// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt'; // <--- 1. Importa esto

@Module({
  imports: [
    JwtModule.register({ // <--- 2. Añade esta configuración
      global: true, // Hace que el JwtModule esté disponible en todos lados
      secret: 'ESTA-ES-UNA-CLAVE-SECRETA', // <--- ¡CAMBIA ESTO!
      signOptions: { expiresIn: '1h' }, // El token expira en 1 hora
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}