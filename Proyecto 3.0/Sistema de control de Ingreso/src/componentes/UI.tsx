// src/componentes/UI.tsx
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

// --- Componentes de Layout (Sin cambios) ---
export function Container({children}:{children:ReactNode}) {
  return <div className="max-w-6xl mx-auto px-4">{children}</div>;
}

export function Card({children, className=""}:{children:ReactNode; className?:string}) {
  return <div className={`rounded-2xl bg-white border shadow-soft hover:shadow-lg hover:-translate-y-[2px] transition ${className}`}>{children}</div>;
}
export function CardBody({children, className=""}:{children:ReactNode; className?:string}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}


// --- Componente de Botón Refactorizado ---

// 1. Definimos una interfaz para las props del botón
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'; // Hacemos 'variant' opcional
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  // 2. Definimos los estilos base que todos los botones comparten
  const baseClasses = "px-4 py-2 rounded-xl font-semibold tracking-wide transition focus:outline-none disabled:opacity-50";

  // 3. Definimos los estilos específicos para cada variante
  const variantClasses = {
    primary: "bg-brand text-white hover:bg-brand-600 active:bg-brand-700 focus:ring-2 focus:ring-brand/30",
    secondary: "bg-gray-100 text-ink-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300",
  };

  // 4. Combinamos todas las clases
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
// NOTA: El componente <SecondaryButton> ha sido eliminado porque ya no es necesario.


// --- Componentes de Formulario (Sin cambios) ---
export function Input(p:InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p}
    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 ${p.className||""}`} />;
}
export function Select(p:SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p}
    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 ${p.className||""}`} />;
}


// --- Componentes de Datos (Sin cambios) ---
export function Stat({label, value}:{label:string; value:string|number}) {
  return (
    <div className="rounded-2xl bg-white border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export function Badge({children}:{children:ReactNode}) {
  return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-brand border border-rose-100">★ {children}</span>;
}