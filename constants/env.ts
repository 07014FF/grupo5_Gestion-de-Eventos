/**
 * Environment Configuration with Zod Validation
 * Ensures required environment variables are present and valid at runtime
 */

import { z } from 'zod';

/**
 * Environment variables schema
 * Validates all required environment variables
 */
const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL')
    .min(1, 'EXPO_PUBLIC_SUPABASE_URL is required'),

  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
});

/**
 * Parse and validate environment variables
 * Throws an error with detailed information if validation fails
 */
function validateEnv() {
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      }).join('\n');

      throw new Error(
        `❌ Error de configuración de variables de entorno:\n\n${missingVars}\n\n` +
        `Por favor, asegúrate de tener un archivo .env en la raíz del proyecto con las siguientes variables:\n` +
        `EXPO_PUBLIC_SUPABASE_URL=tu-url-de-supabase\n` +
        `EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase\n`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const Env = validateEnv();

/**
 * Type-safe environment variables
 */
export type EnvType = z.infer<typeof envSchema>;
