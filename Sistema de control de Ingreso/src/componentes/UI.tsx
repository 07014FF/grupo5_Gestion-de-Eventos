import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Container({children}:{children:ReactNode}) {
  return <div className="max-w-6xl mx-auto px-4">{children}</div>;
}

export function Card({children, className=""}:{children:ReactNode; className?:string}) {
  return <div className={`rounded-2xl bg-white border shadow-soft hover:shadow-lg hover:-translate-y-[2px] transition ${className}`}>{children}</div>;
}
export function CardBody({children, className=""}:{children:ReactNode; className?:string}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function Button({children, className="", ...p}:ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className={`px-4 py-2 rounded-xl bg-brand text-white font-semibold tracking-wide
                  hover:bg-brand-600 active:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand/30 ${className}`}>
      {children}
    </button>
  );
}
export function SecondaryButton({children, className="", ...p}:ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className={`px-4 py-2 rounded-xl bg-gray-100 text-ink-900 hover:bg-gray-200 transition ${className}`}>
      {children}
    </button>
  );
}

export function Input(p:InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p}
    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 ${p.className||""}`} />;
}
export function Select(p:SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p}
    className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 ${p.className||""}`} />;
}

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
