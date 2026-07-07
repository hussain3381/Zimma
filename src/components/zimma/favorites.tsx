import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type FavCtx = {
  ids: Set<string>;
  ready: boolean;
  toggle: (providerId: string) => Promise<void>;
  isFav: (providerId: string) => boolean;
};

const Ctx = createContext<FavCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const idsRef = useRef<Set<string>>(new Set());

  const applyIds = useCallback((next: Set<string>) => {
    idsRef.current = next;
    setIds(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!authUser) { applyIds(new Set()); setReady(true); return; }
    setReady(false);
    (async () => {
      const { data } = await supabase.from("favorites").select("provider_id").eq("user_id", authUser.id);
      if (!mounted) return;
      applyIds(new Set((data ?? []).map((r) => r.provider_id as string)));
      setReady(true);
    })();
    const ch = supabase
      .channel(`favorites-live-${authUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${authUser.id}` }, (payload) => {
        const eventType = payload.eventType;
        const next = new Set(idsRef.current);
        const newRow = payload.new as { provider_id?: string } | null;
        const oldRow = payload.old as { provider_id?: string } | null;
        if (eventType === "INSERT" && newRow?.provider_id) {
          next.add(newRow.provider_id);
          applyIds(next);
          toast.success("Added to favourites");
        }
        if (eventType === "DELETE" && oldRow?.provider_id) {
          next.delete(oldRow.provider_id);
          applyIds(next);
          toast("Removed from favourites");
        }
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [authUser?.id, applyIds]);

  const toggle = useCallback(async (providerId: string) => {
    if (!authUser) { toast.error("Sign in to save favourites"); return; }
    const has = ids.has(providerId);
    // optimistic
    setIds((prev) => {
      const next = new Set(prev);
      if (has) next.delete(providerId); else next.add(providerId);
      idsRef.current = next;
      return next;
    });
    if (has) {
      const { error } = await supabase.from("favorites").delete()
        .eq("user_id", authUser.id).eq("provider_id", providerId);
      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          next.add(providerId);
          idsRef.current = next;
          return next;
        });
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase.from("favorites")
        .insert({ user_id: authUser.id, provider_id: providerId });
      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(providerId);
          idsRef.current = next;
          return next;
        });
        toast.error(error.message);
      }
    }
  }, [authUser, ids]);

  const isFav = useCallback((id: string) => ids.has(id), [ids]);

  return <Ctx.Provider value={{ ids, ready, toggle, isFav }}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return c;
}

export function FavoriteButton({ providerId, variant = "icon" }: { providerId: string; variant?: "icon" | "pill" }) {
  const { isFav, toggle } = useFavorites();
  const on = isFav(providerId);
  if (variant === "pill") {
    return (
      <Button
        type="button"
        variant={on ? "default" : "outline"}
        size="sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(providerId); }}
        className="gap-1.5"
      >
        <Heart className={`h-4 w-4 ${on ? "fill-current" : ""}`} />
        {on ? "Saved" : "Save"}
      </Button>
    );
  }
  return (
    <button
      type="button"
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(providerId); }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
        on ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-card text-muted-foreground hover:text-destructive"
      }`}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-current" : ""}`} />
    </button>
  );
}
