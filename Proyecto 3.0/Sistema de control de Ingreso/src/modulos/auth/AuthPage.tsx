// src/modulos/auth/AuthPage.tsx
import { useState } from "react";
import { LoginForm } from "../../auth/Loguinform";
import { RegisterForm } from "../../auth/RegisterForm";

export default function AuthPage() {
  // Estado para alternar entre 'login' y 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Renderizado condicional del formulario */}
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}