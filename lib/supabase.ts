/**
 * Supabase Client Configuration
 * Configuración centralizada del cliente Supabase para la aplicación
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtener variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Las variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY son requeridas.\n' +
    'Por favor, crea un archivo .env en la raíz del proyecto basándote en .env.example'
  );
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar AsyncStorage para persistir la sesión
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos de base de datos (se generarán automáticamente después)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          document: string | null;
          role: 'client' | 'admin' | 'super_admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          document?: string | null;
          role?: 'client' | 'admin' | 'super_admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          document?: string | null;
          role?: 'client' | 'admin' | 'super_admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          image_url: string | null;
          date: string;
          time: string;
          location: string;
          venue: string | null;
          price: number;
          available_tickets: number;
          total_tickets: number;
          category: string | null;
          rating: number | null;
          status: 'draft' | 'active' | 'cancelled' | 'completed';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          image_url?: string | null;
          date: string;
          time: string;
          location: string;
          venue?: string | null;
          price: number;
          available_tickets: number;
          total_tickets: number;
          category?: string | null;
          rating?: number | null;
          status?: 'draft' | 'active' | 'cancelled' | 'completed';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          image_url?: string | null;
          date?: string;
          time?: string;
          location?: string;
          venue?: string | null;
          price?: number;
          available_tickets?: number;
          total_tickets?: number;
          category?: string | null;
          rating?: number | null;
          status?: 'draft' | 'active' | 'cancelled' | 'completed';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          total_amount: number;
          payment_method: 'card' | 'pse' | 'nequi' | 'daviplata';
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id: string | null;
          user_name: string;
          user_email: string;
          user_phone: string | null;
          user_document: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          total_amount: number;
          payment_method: 'card' | 'pse' | 'nequi' | 'daviplata';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id?: string | null;
          user_name: string;
          user_email: string;
          user_phone?: string | null;
          user_document?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          total_amount?: number;
          payment_method?: 'card' | 'pse' | 'nequi' | 'daviplata';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id?: string | null;
          user_name?: string;
          user_email?: string;
          user_phone?: string | null;
          user_document?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          ticket_code: string;
          purchase_id: string;
          event_id: string;
          user_id: string;
          ticket_type: string;
          seat_number: string | null;
          price: number;
          qr_code_data: string;
          status: 'active' | 'used' | 'expired' | 'cancelled';
          used_at: string | null;
          validated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_code: string;
          purchase_id: string;
          event_id: string;
          user_id: string;
          ticket_type?: string;
          seat_number?: string | null;
          price: number;
          qr_code_data: string;
          status?: 'active' | 'used' | 'expired' | 'cancelled';
          used_at?: string | null;
          validated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_code?: string;
          purchase_id?: string;
          event_id?: string;
          user_id?: string;
          ticket_type?: string;
          seat_number?: string | null;
          price?: number;
          qr_code_data?: string;
          status?: 'active' | 'used' | 'expired' | 'cancelled';
          used_at?: string | null;
          validated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      validations: {
        Row: {
          id: string;
          ticket_id: string;
          validated_by: string;
          validation_result: 'valid' | 'invalid' | 'already_used' | 'expired' | 'cancelled';
          validation_message: string | null;
          device_info: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          validated_by: string;
          validation_result: 'valid' | 'invalid' | 'already_used' | 'expired' | 'cancelled';
          validation_message?: string | null;
          device_info?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          validated_by?: string;
          validation_result?: 'valid' | 'invalid' | 'already_used' | 'expired' | 'cancelled';
          validation_message?: string | null;
          device_info?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
