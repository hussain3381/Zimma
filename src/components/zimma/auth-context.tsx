import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ZimmaUser =
  | { role: "customer"; name: string; email: string }
  | { role: "provider"; name: string; email: string; profession: string; cnic: string; verified: boolean };

type AuthCtx = {
  user: ZimmaUser | null;
  ready: boolean;
  signIn: (u: ZimmaUser) => void;
  signOut: () => void;
  updateUser: (patch: Partial<ZimmaUser>) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "zimma_user_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZimmaUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = (u: ZimmaUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    } catch {}
  };

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        signIn: persist,
        signOut: () => persist(null),
        updateUser: (patch) =>
          setUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...patch } as ZimmaUser;
            try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
            return next;
          }),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
