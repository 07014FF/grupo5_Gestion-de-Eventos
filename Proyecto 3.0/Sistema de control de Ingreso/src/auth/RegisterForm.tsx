// src/auth/RegisterForm.tsx
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from 'react-router-dom'; // 👈 Importa useNavigate

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const roles = [
  { id: 'asistente', name: 'Asistente', description: 'Quiero comprar tickets y asistir a eventos.' },
  { id: 'seguridad', name: 'Seguridad', description: 'Soy parte del equipo y validaré los accesos.' },
  { id: 'organizador', name: 'Organizador', description: 'Quiero crear y gestionar mis propios eventos.' },
];

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const navigate = useNavigate(); // 👈 Obtén la función de navegación
  const [selectedRole, setSelectedRole] = useState<'asistente' | 'seguridad' | 'organizador'>('asistente');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // 1. Llama a la función de registro del contexto
    register(email, selectedRole);

    alert(`¡Simulación de registro como ${selectedRole} exitoso!`);

    // 2. Redirige al usuario según el rol elegido
    switch (selectedRole) {
      case 'organizador':
        navigate('/organizador');
        break;
      case 'seguridad':
        navigate('/scanner');
        break;
      default:
        navigate('/');
        break;
    }
  };
  
  // El resto de tu código JSX se mantiene igual...
  return (
    <div className="bg-white p-8 rounded-xl shadow-soft space-y-6">
      {/* Selector de Rol */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink-700">Tipo de Cuenta</label>
          <div className="grid grid-cols-1 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id as any)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedRole === role.id
                    ? 'border-green-600 bg-green-100 ring-2 ring-green-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className="font-bold text-ink-900">{role.name}</p>
                <p className="text-sm text-ink-700">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... tus inputs de email y password ... */}
        <div>
          <label htmlFor="email-reg" className="block text-sm font-semibold text-ink-700 mb-1">Correo Electrónico</label>
          <input type="email" name="email" id="email-reg" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand" placeholder="tu@correo.com" />
        </div>
        <div>
          <label htmlFor="password-reg" className="block text-sm font-semibold text-ink-700 mb-1">Contraseña</label>
          <input type="password" name="password" id="password-reg" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand" placeholder="Crea una contraseña segura" />
        </div>
        <button type="submit" className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">Crear Cuenta</button>
      </form>

      {/* Switch a Login */}
      <p className="text-center text-sm text-ink-700">
        ¿Ya tienes una cuenta?{' '}
        <button onClick={onSwitchToLogin} className="font-semibold text-green-600 hover:underline">Inicia sesión</button>
      </p>
    </div>
  );
}