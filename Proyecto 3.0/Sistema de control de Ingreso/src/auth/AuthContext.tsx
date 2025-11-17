// src/auth/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Definimos la información del Usuario y del Token ---

// Esta es la información del usuario que guardaremos en el estado
type User = {
  id: number;
  email: string;
  rol: 'CLIENTE' | 'ORGANIZADOR' | 'PERSONAL_INGRESO';
}

// Esta es la forma completa del token (como en tu LoginForm)
interface JwtPayload {
  email: string;
  rol: 'CLIENTE' | 'ORGANIZADOR' | 'PERSONAL_INGRESO';
  sub: number; // 'sub' (subject) es el ID de usuario en el token
  iat: number;
  exp: number;
}

// --- Definimos el tipo de nuestro Contexto ---
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // 👈 NUEVO: Para saber si estamos verificando el token
  login: (accessToken: string) => void;
  // register simula el registro localmente y guarda un token falso
  register: (email: string, role: string) => void;
  logout: () => void;
}

// --- Creamos el Contexto ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Creamos el Proveedor (Provider) ---
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 👈 Empezamos cargando
  const navigate = useNavigate();

  // --- Función Helper para decodificar el token ---
  const decodeToken = (token: string): JwtPayload | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = atob(payloadBase64);
      return JSON.parse(decodedPayload);
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return null;
    }
  };

  // --- EFECTO DE INICIALIZACIÓN ---
  // Se ejecuta 1 VEZ cuando la app carga.
  // Revisa si ya existe un token en el localStorage.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = decodeToken(token);
      // Verificamos que el token no haya expirado
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          id: payload.sub,
          email: payload.email,
          rol: payload.rol,
        });
      } else {
        // Si el token es inválido o expiró, lo borramos
        localStorage.removeItem('accessToken');
      }
    }
    // Terminamos de cargar, ya sea que encontramos un token o no
    setIsLoading(false);
  }, []);

  // --- Función de Login (¡la que usa tu LoginForm!) ---
  const login = (accessToken: string) => {
    const payload = decodeToken(accessToken);

    if (payload) {
      // 1. Guardamos el token en el navegador
      localStorage.setItem('accessToken', accessToken);
      // 2. Actualizamos el estado del usuario
      setUser({
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
      });
      // (La redirección ya la hace tu LoginForm, así que no la repetimos aquí)
    } else {
      console.error('No se pudo decodificar el token durante el login.');
    }
  };

  // --- Función de Register (simulada) ---
  // Recibe el email y el rol seleccionado en el formulario de registro
  // Crea un token JWT falso (solo para la UI) y actualiza el estado.
  const register = (email: string, selectedRole: string) => {
    const roleMap: Record<string, User['rol']> = {
      asistente: 'CLIENTE',
      organizador: 'ORGANIZADOR',
      seguridad: 'PERSONAL_INGRESO',
    };
    const rol = roleMap[selectedRole] ?? 'CLIENTE';

    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      email,
      rol,
      sub: now, // usamos timestamp como id temporal
      iat: now,
      exp: now + 60 * 60, // 1 hora
    };

    // Creamos un token simple: header.payload.signature
    const payloadBase64 = btoa(JSON.stringify(payload));
    const fakeToken = `header.${payloadBase64}.signature`;

    // Guardamos token y actualizamos estado
    localStorage.setItem('accessToken', fakeToken);
    setUser({ id: payload.sub, email: payload.email, rol: payload.rol });
  };

  // --- Función de Logout ---
  const logout = () => {
    // 1. Borramos el token del navegador
    localStorage.removeItem('accessToken');
    // 2. Limpiamos el estado del usuario
    setUser(null);
    // 3. Redirigimos a la página de inicio
    navigate('/login');
  };

  // El valor que será accesible por toda la app
  const value = {
    user,
    isAuthenticated: !!user, // Es true si 'user' no es null
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Creamos el Hook (useAuth) ---
// (Así lo usas en LoginForm)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}