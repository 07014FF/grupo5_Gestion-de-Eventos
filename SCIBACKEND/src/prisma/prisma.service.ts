// src/prisma/prisma.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Esta función asegura que nos conectemos a la BD
  // en cuanto la aplicación arranque.
  async onModuleInit() {
    await this.$connect();
  }
}