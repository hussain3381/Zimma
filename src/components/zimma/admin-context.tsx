import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AdminCtx = {
  ready: boolean;
  authed: boolean;
  password: string;
  email: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updatePassword: (current: string, next: string) => boolean;
};

const Ctx = createContext<AdminCtx | null>(null);
const PWD_KEY = "zimma_admin_pwd_v1";
const SESS_KEY = "zimma_admin_authed_v1";
const ADMIN_EMAIL = "admin@zimma.com";
const DEFAULT_PWD = "admin123";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState(DEFAULT_PWD);
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PWD_KEY);
      if (p) setPassword(p);
      if (sessionStorage.getItem(SESS_KEY) === "1") setAuthed(true);
    } catch {}
    setReady(true);
  }, []);

  const login = (email: string, pwd: string) => {
    if (email.trim().toLowerCase() === ADMIN_EMAIL && pwd === password) {
      setAuthed(true);
      try { sessionStorage.setItem(SESS_KEY, "1"); } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthed(false);
    try { sessionStorage.removeItem(SESS_KEY); } catch {}
  };

  const updatePassword = (current: string, next: string) => {
    if (current !== password) return false;
    setPassword(next);
    try { localStorage.setItem(PWD_KEY, next); } catch {}
    return true;
  };

  return (
    <Ctx.Provider value={{ ready, authed, password, email: ADMIN_EMAIL, login, logout, updatePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used inside <AdminProvider>");
  return c;
}
