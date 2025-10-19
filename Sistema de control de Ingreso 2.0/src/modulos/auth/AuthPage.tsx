import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function AuthPage() {
  const { register, login } = useAuth();
  const [tab, setTab] = useState<"login"|"register">("login");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");          // <-- nuevo
  const [password2, setPassword2] = useState("");        // <-- confirmación
  const [isOrg, setIsOrg] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();
  const loc = useLocation() as any;

  const goAfter = () => {
    const to = loc.state?.from ?? (isOrg ? "/organizador" : "/");
    nav(to, { replace: true });
  };

  const onRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !password) { setMsg("Completa todos los campos"); return; }
    if (password.length < 6) { setMsg("La contraseña debe tener mínimo 6 caracteres"); return; }
    if (password !== password2) { setMsg("Las contraseñas no coinciden"); return; }
    register({ nombre, apellido, email, password, isOrganizer: isOrg });
    goAfter();
  };

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    if (login(email, password)) goAfter();
    else setMsg("Credenciales inválidas");
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-center mb-6">Iniciar sesión</h1>

      <div className="mb-4 grid grid-cols-2 rounded-xl overflow-hidden border">
        <button className={`py-2 ${tab==="login"?"bg-black text-white":"bg-white"}`} onClick={()=>setTab("login")}>Ya tengo cuenta</button>
        <button className={`py-2 ${tab==="register"?"bg-black text-white":"bg-white"}`} onClick={()=>setTab("register")}>Crear cuenta</button>
      </div>

      {tab==="register" ? (
        <form onSubmit={onRegister} className="space-y-3">
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Apellido" value={apellido} onChange={e=>setApellido(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Repite la contraseña" type="password" value={password2} onChange={e=>setPassword2(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isOrg} onChange={e=>setIsOrg(e.target.checked)} />
            <span>Quiero registrarme como organizador</span>
          </label>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="w-full bg-black text-white rounded-xl py-2">Crear cuenta</button>
        </form>
      ) : (
        <form onSubmit={onLogin} className="space-y-3">
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="w-full bg-black text-white rounded-xl py-2">Entrar</button>
        </form>
      )}
    </div>
  );
}
