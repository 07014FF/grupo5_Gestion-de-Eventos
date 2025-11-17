// src/auth/dto/register.dto.ts

export class RegisterDto {
  email: string;
  nombre: string;
  password: string;
  rol: string; // "CLIENTE", "ORGANIZADOR", o "PERSONAL_INGRESO"
}