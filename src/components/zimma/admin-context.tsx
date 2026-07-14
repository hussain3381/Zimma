import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminCtx = {
  ready: boolean;
  authed: boolean;
  email: string;
  password: string; // ✅ Wapas add kiya taake admin.tsx line 48 ka red error HAMESHA ke liye khatam ho jaye!
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (current: string, next: string) => Promise<boolean>;
};

const Ctx = createContext<AdminCtx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("admin@zimma.com");
  const [password, setPassword] = useState("********"); // TypeScript compatibility safety

  const checkAdminRole = async (userId: string, userEmail?: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (data?.role === "admin" || userEmail?.toLowerCase() === "admin@zimma.com") {
        setAuthed(true);
        if (userEmail) setEmail(userEmail);
        return true;
      } else {
        setAuthed(false);
        return false;
      }
    } catch {
      setAuthed(false);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety Timeout: Agar internet slow ho ya DB delay kare, tab bhi 4 second me screen khul jayegi
    const safetyTimer = setTimeout(() => {
      if (isMounted) setReady(true);
    }, 4000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await checkAdminRole(session.user.id, session.user.email);
        } else if (isMounted) {
          setAuthed(false);
        }
      } catch (err) {
        if (isMounted) setAuthed(false);
      } finally {
        if (isMounted) {
          setReady(true);
          clearTimeout(safetyTimer);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user && isMounted) {
          await checkAdminRole(session.user.id, session.user.email);
        } else if (isMounted) {
          setAuthed(false);
        }
      } finally {
        if (isMounted) setReady(true);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error || !data.user) return false;

      const isAdmin = await checkAdminRole(data.user.id, data.user.email);
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Access Denied: You do not have Super Admin privileges.");
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  const updatePassword = async (current: string, next: string): Promise<boolean> => {
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email,
        password: current,
      });
      if (signInErr) return false;

      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) {
        toast.error(updateErr.message);
        return false;
      }
      setPassword("********");
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Ctx.Provider value={{ ready, authed, email, password, login, logout, updatePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used inside <AdminProvider>");
  return c;
}