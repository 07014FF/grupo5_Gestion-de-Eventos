/**
 * Supabase Client Configuration
 * Configuración centralizada del cliente Supabase para la aplicación
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env } from '@/constants/env';
import type { Database } from '@/types/database.types';

// Crear y exportar el cliente de Supabase con tipos automáticos
export const supabase = createClient<Database>(
  Env.EXPO_PUBLIC_SUPABASE_URL,
  Env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // Usar AsyncStorage para persistir la sesión
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Re-exportar tipo Database para conveniencia
export type { Database } from '@/types/database.types';
