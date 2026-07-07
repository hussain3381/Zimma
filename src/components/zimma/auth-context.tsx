import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ProviderRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cnic: string | null;
  avatar_url: string | null;
  profession: string;
  bio: string;
  area: string;
  experience: number;
  hourly_rate: number;
  availability: string;
  skills: string[];
  rating: number;
  total_jobs: number;
  reviews_count: number;
  is_online: boolean;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
};

export type ProviderApplication = {
  status: "pending" | "approved" | "rejected";
};

export type CustomerUser = {
  role: "customer";
  id: string;
  name: string;
  email: string;
  // If the customer has submitted a Pro application, its current status.
  providerApplication?: ProviderApplication;
};

export type ProviderUser = { role: "provider" } & ProviderRow;

export type ZimmaUser = CustomerUser | ProviderUser;

type AuthCtx = {
  user: ZimmaUser | null;
  authUser: User | null;
  ready: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function loadZimmaUser(u: User): Promise<ZimmaUser | null> {
  const { data: prov } = await supabase.from("providers").select("*").eq("id", u.id).maybeSingle();

  // Only treat as provider when application is approved. Pending/rejected
  // applicants stay on the customer surface (per product requirement) and
  // are shunted to /auth/pending when they try to open Pro-only screens.
  if (prov && prov.status === "approved") {
    return { role: "provider", ...(prov as ProviderRow) };
  }

  const { data: cust } = await supabase
    .from("customer_profiles").select("*").eq("id", u.id).maybeSingle();

  const application: ProviderApplication | undefined = prov
    ? { status: prov.status as ProviderApplication["status"] }
    : undefined;

  if (cust) {
    return {
      role: "customer",
      id: cust.id,
      name: cust.name,
      email: cust.email ?? u.email ?? "",
      providerApplication: application,
    };
  }

  // Fallback: metadata (edge case if trigger didn't fire).
  const md = u.user_metadata ?? {};
  return {
    role: "customer",
    id: u.id,
    name: (md.name as string) || (u.email?.split("@")[0] ?? "You"),
    email: u.email ?? "",
    providerApplication: application,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<ZimmaUser | null>(null);
  const [ready, setReady] = useState(false);

  const hydrate = async (u: User | null) => {
    setAuthUser(u);
    if (!u) { setUser(null); return; }
    const zu = await loadZimmaUser(u);
    setUser(zu);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      hydrate(data.session?.user ?? null).finally(() => setReady(true));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      hydrate(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user, authUser, ready,
        refresh: async () => { if (authUser) await hydrate(authUser); },
        signOut: async () => { await supabase.auth.signOut(); setUser(null); setAuthUser(null); },
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
