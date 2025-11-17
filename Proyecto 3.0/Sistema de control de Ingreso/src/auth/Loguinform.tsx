// src/auth/LoginForm.tsx

import { useState } from 'react'; // 👈 PASO 1: Importa useState
import { useAuth } from "./AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 👈 PASO 2: Importa axios

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

// Definimos la forma del Payload de nuestro token
interface JwtPayload {
  email: string;
  rol: 'CLIENTE' | 'ORGANIZADOR' | 'PERSONAL_INGRESO';
  sub: number;
  iat: number;
  exp: number;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- PASO 3: Estados para manejar el formulario ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Para errores
  const [isLoading, setIsLoading] = useState(false); // Para el botón de carga

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); // 👈 Empezamos a cargar
    setError(null);     // 👈 Limpiamos errores

    // --- PASO 4: Llamada REAL al Backend ---
    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email: email,
        password: password,
      });

      // ¡Éxito! El backend nos devuelve el token
      const { accessToken } = response.data;

      // --- PASO 5: Decodificamos el token para obtener el ROL ---
      // (Sin instalar librerías extra, solo usando funciones del navegador)
      const payloadBase64 = accessToken.split('.')[1];
      const decodedPayload = atob(payloadBase64);
      const payload: JwtPayload = JSON.parse(decodedPayload);
      const role = payload.rol; // 'CLIENTE', 'ORGANIZADOR', etc.
      
      // --- PASO 6: Llamamos al login del Contexto ---
      // (Tu AuthContext.tsx ahora debe guardar el token)
      login(accessToken);

      // --- PASO 7: Redirigimos según el ROL REAL del token ---
      switch (role) {
        case 'ORGANIZADOR':
          navigate('/organizador');
          break;
        case 'PERSONAL_INGRESO':
          navigate('/scanner');
          break;
        default: // 'CLIENTE'
          navigate('/');
          break;
      }

    } catch (err: unknown) {
      // --- PASO 8: Manejo de Errores ---
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) { // 401 Unauthorized
          setError('Correo o contraseña incorrectos.');
        } else {
          setError('Error del servidor. Inténtalo más tarde.');
        }
      } else {
        setError('No se pudo conectar. Revisa tu conexión.');
      }
    } finally {
      setIsLoading(false); // 👈 Terminamos de cargar
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-soft space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink-900">Bienvenido de Vuelta</h1>
        <p className="text-ink-700">Ingresa tus credenciales para acceder.</p>
      </div>

      {/* --- PASO 9: Conectamos los inputs a los estados --- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink-700 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand"
            placeholder="tu@correo.com"
            value={email} // 👈 Conectado al estado
            onChange={(e) => setEmail(e.target.value)} // 👈 Conectado al estado
            disabled={isLoading} // 👈 Deshabilitado mientras carga
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-ink-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand"
            placeholder="••••••••"
            value={password} // 👈 Conectado al estado
            onChange={(e) => setPassword(e.target.value)} // 👈 Conectado al estado
            disabled={isLoading} // 👈 Deshabilitado mientras carga
          />
        </div>

        {/* --- PASO 10: Mostramos el error si existe --- */}
        {error && (
          <p className="text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
          disabled={isLoading} // 👈 Deshabilitado mientras carga
        >
          {/* Mostramos 'Cargando...' si está en proceso */}
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-700">
        ¿No tienes una cuenta?{' '}
        <button onClick={onSwitchToRegister} className="font-semibold text-green-600 hover:underline">
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}