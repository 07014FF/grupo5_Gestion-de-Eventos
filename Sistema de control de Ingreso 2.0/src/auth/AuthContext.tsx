import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type User = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;        // <-- nuevo
  isOrganizer: boolean;
};

type AuthCtx = {
  user: User | null;
  register: (u: Omit<User, "id">) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "auth_user";
const LIST = "auth_users_list";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    register: (u) => {
      const newUser: User = { id: crypto.randomUUID(), ...u };
      const list: User[] = JSON.parse(localStorage.getItem(LIST) || "[]");
      // si ya existe email, reemplaza
      const idx = list.findIndex(x => x.email.toLowerCase() === newUser.email.toLowerCase());
      if (idx >= 0) list[idx] = newUser; else list.push(newUser);
      localStorage.setItem(LIST, JSON.stringify(list));
      localStorage.setItem(KEY, JSON.stringify(newUser));
      setUser(newUser);
    },
    login: (email, password) => {
      const list: User[] = JSON.parse(localStorage.getItem(LIST) || "[]");
      const found = list.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!found) return false;

      // compat: si el usuario antiguo no tenía password guardado, acepta cualquiera
      if (!("password" in found) || found.password === "" || found.password == null) {
        localStorage.setItem(KEY, JSON.stringify(found));
        setUser(found);
        return true;
      }

      if (found.password === password) {
        localStorage.setItem(KEY, JSON.stringify(found));
        setUser(found);
        return true;
      }
      return false;
    },
    logout: () => {
      localStorage.removeItem(KEY);
      setUser(null);
    }
  }), [user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
