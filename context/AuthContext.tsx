import React, { createContext, useState, useContext, PropsWithChildren, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  role?: 'client' | 'admin' | 'super_admin';
  avatar_url?: string;
}

// Definimos la forma del contexto de autenticación
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// Creamos el contexto con un valor inicial de null
const AuthContext = createContext<AuthContextType | null>(null);

// Creamos un proveedor de autenticación
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar perfil de usuario desde la tabla public.users
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Loading user profile for ID:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading user profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setUser(null);
      } else if (data) {
        console.log('✅ User profile loaded successfully:', {
          id: data.id,
          email: data.email,
          role: data.role,
          name: data.name
        });

        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          document: data.document || undefined,
          role: data.role as 'client' | 'admin' | 'super_admin',
          avatar_url: data.avatar_url || undefined,
        });
      } else {
        console.warn('⚠️ No user data found for ID:', userId);
        setUser(null);
      }
    } catch (error) {
      console.error('💥 Exception loading user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión con Supabase
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Mensajes de error más específicos
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email o contraseña incorrectos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Debes confirmar tu email antes de iniciar sesión' };
        }

        return { success: false, error: error.message || 'Error al iniciar sesión' };
      }

      if (data.session) {
        console.log('✅ Login successful! User ID:', data.user.id);
        // El perfil se cargará automáticamente por el listener onAuthStateChange
        // Cierra el modal de login si está abierto
        if (router.canGoBack()) {
          router.back();
        }
        return { success: true };
      }

      console.warn('⚠️ No session created after login');
      return { success: false, error: 'No se pudo iniciar sesión' };
    } catch (error: any) {
      console.error('💥 Login exception:', error);
      console.error('Exception message:', error?.message);
      console.error('Exception stack:', error?.stack);
      return { success: false, error: error?.message || 'Error al iniciar sesión. Intenta nuevamente.' };
    }
  };

  // Registro de nuevo usuario
  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 Attempting signup for:', email);

      // Crear usuario en auth.users
      // El trigger 'on_auth_user_created' creará automáticamente el perfil en public.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        console.error('❌ Signup auth error:', authError);
        console.error('Error code:', authError.status);
        console.error('Error message:', authError.message);
        console.error('Error details:', JSON.stringify(authError, null, 2));

        // Mensajes de error más específicos
        if (authError.message.includes('already registered')) {
          return { success: false, error: 'Este email ya está registrado' };
        }
        if (authError.message.includes('Password should be')) {
          return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        }

        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user data returned after signup');
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      console.log('✅ Auth user created:', authData.user.id);
      console.log('✅ User profile will be created automatically by database trigger');

      // El perfil se crea automáticamente mediante el trigger 'on_auth_user_created'
      // El perfil se cargará automáticamente por el listener onAuthStateChange

      return { success: true };
    } catch (error: any) {
      console.error('💥 Signup exception:', error);
      console.error('Exception message:', error?.message);
      console.error('Exception stack:', error?.stack);
      return { success: false, error: error?.message || 'Error al registrar usuario. Intenta nuevamente.' };
    }
  };

  // Cierre de sesión
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de autenticación de forma sencilla
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
