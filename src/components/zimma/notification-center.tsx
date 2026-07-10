import { useEffect, useState, useCallback } from "react";
import { Bell, Calendar, Star, MessageSquare, Heart, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export type Notification = {
  id: string;
  kind: "booking" | "review" | "message" | "favorite";
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

type Prefs = { toasts: boolean; bookings: boolean; messages: boolean; reviews: boolean };
const PREF_KEY = "zimma:notif-prefs";
const READ_KEY = "zimma:notif-read";

const iconFor = (k: Notification["kind"]) =>
  k === "booking" ? Calendar : k === "review" ? Star : k === "message" ? MessageSquare : Heart;

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { toasts: true, bookings: true, messages: true, reviews: true };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { toasts: true, bookings: true, messages: true, reviews: true, ...JSON.parse(raw) };
  } catch {/* ignore */}
  return { toasts: true, bookings: true, messages: true, reviews: true };
}

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {/* ignore */}
  return new Set();
}

function persistReadIds(set: Set<string>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set).slice(-500))); } catch {/* ignore */}
}

/**
 * Live notification feed for the current user, backed by Supabase realtime.
 * Aggregates bookings + reviews + incoming messages. Persists read-state in localStorage.
 */
export function useNotifications(role: "customer" | "provider") {
  const { authUser } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {/* ignore */} }, [prefs]);

  const push = useCallback((n: Omit<Notification, "read">) => {
    setItems((prev) => {
      if (prev.some((x) => x.id === n.id)) return prev;
      return [{ ...n, read: readIds.has(n.id) }, ...prev].slice(0, 100);
    });
  }, [readIds]);

  // Initial hydrate: last 20 bookings + reviews for this user
  useEffect(() => {
    if (!authUser) { setItems([]); return; }
    let mounted = true;
    (async () => {
      const filterCol = role === "customer" ? "customer_id" : "provider_id";
      const [bk, rv] = await Promise.all([
        supabase.from("bookings").select("id, service_type, status, booking_date, created_at").eq(filterCol, authUser.id).order("created_at", { ascending: false }).limit(15),
        supabase.from("reviews").select("id, rating, comment, created_at, provider_id, customer_id").eq(role === "provider" ? "provider_id" : "customer_id", authUser.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (!mounted) return;
      const notifs: Notification[] = [];
      (bk.data ?? []).forEach((b) => notifs.push({
        id: `booking:${b.id}:${b.status}`,
        kind: "booking",
        title: `Booking ${b.status.replace("_", " ")}`,
        body: `${b.service_type} · ${new Date(b.booking_date).toLocaleString()}`,
        created_at: b.created_at,
        read: false,
      }));
      (rv.data ?? []).forEach((r) => notifs.push({
        id: `review:${r.id}`,
        kind: "review",
        title: role === "provider" ? `New ${r.rating}★ review` : `You rated ${r.rating}★`,
        body: r.comment ?? "No comment",
        created_at: r.created_at,
        read: false,
      }));
      notifs.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setItems(notifs.slice(0, 60).map((n) => ({ ...n, read: readIds.has(n.id) })));
    })();
    return () => { mounted = false; };
  }, [authUser?.id, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime bookings
  useEffect(() => {
    if (!authUser) return;
    const filterCol = role === "customer" ? "customer_id" : "provider_id";
    const ch = supabase.channel(`notif-b-${role}-${authUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `${filterCol}=eq.${authUser.id}` }, (payload) => {
        if (!prefs.bookings) return;
        const row = (payload.new ?? payload.old) as { id: string; service_type: string; status: string; booking_date: string; created_at: string } | null;
        if (!row) return;
        const title = payload.eventType === "INSERT" ? "New booking" : payload.eventType === "DELETE" ? "Booking removed" : `Booking ${row.status.replace("_", " ")}`;
        const n = {
          id: `booking:${row.id}:${row.status}:${payload.eventType}`,
          kind: "booking" as const,
          title,
          body: `${row.service_type} · ${new Date(row.booking_date).toLocaleString()}`,
          created_at: new Date().toISOString(),
        };
        push(n);
        if (prefs.toasts) toast.success(title, { description: n.body });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, role, prefs.bookings, prefs.toasts, push]);

  // Realtime reviews (providers get told when a customer leaves one)
  useEffect(() => {
    if (!authUser) return;
    const filterCol = role === "provider" ? "provider_id" : "customer_id";
    const ch = supabase.channel(`notif-r-${role}-${authUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews", filter: `${filterCol}=eq.${authUser.id}` }, (payload) => {
        if (!prefs.reviews) return;
        const r = payload.new as { id: string; rating: number; comment: string | null; created_at: string };
        const title = role === "provider" ? `New ${r.rating}★ review` : `Review submitted`;
        push({ id: `review:${r.id}`, kind: "review", title, body: r.comment ?? "No comment", created_at: r.created_at });
        if (prefs.toasts) toast.success(title, { description: r.comment ?? undefined });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, role, prefs.reviews, prefs.toasts, push]);

  // Realtime messages (only for messages I did NOT send)
  useEffect(() => {
    if (!authUser) return;
    const ch = supabase.channel(`notif-m-${authUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (!prefs.messages) return;
        const m = payload.new as { id: string; sender_id: string; body: string; created_at: string };
        if (m.sender_id === authUser.id) return;
        push({ id: `msg:${m.id}`, kind: "message", title: "New message", body: m.body.slice(0, 140), created_at: m.created_at });
        if (prefs.toasts) toast("New message", { description: m.body.slice(0, 120) });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, prefs.messages, prefs.toasts, push]);

  const unread = items.filter((i) => !i.read).length;
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setReadIds((prev) => {
      const next = new Set(prev);
      items.forEach((n) => next.add(n.id));
      persistReadIds(next);
      return next;
    });
  }, [items]);
  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setReadIds((prev) => { const next = new Set(prev); next.add(id); persistReadIds(next); return next; });
  }, []);

  return { items, unread, prefs, setPrefs, markAllRead, markRead };
}

export function NotificationsPanel({ role }: { role: "customer" | "provider" }) {
  const { items, unread, prefs, setPrefs, markAllRead, markRead } = useNotifications(role);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="rounded-2xl border-border p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Activity</h2>
            {unread > 0 && <Badge className="rounded-full bg-primary text-primary-foreground">{unread} new</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0} className="gap-1">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        </div>
        <div className="mt-4 divide-y divide-border">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">You're all caught up. New alerts land here in real time.</p>
          ) : items.map((n) => {
            const Icon = iconFor(n.kind);
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex w-full items-start gap-3 py-3 text-left transition ${n.read ? "opacity-60" : ""} hover:bg-accent/50`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="h-fit rounded-2xl border-border p-5 shadow-soft">
        <h3 className="text-sm font-semibold">Notification preferences</h3>
        <p className="mt-1 text-xs text-muted-foreground">Choose which live events you'd like to see.</p>
        <div className="mt-4 space-y-3">
          {[
            { key: "toasts" as const, l: "Realtime toasts", s: "Popup for every new event" },
            { key: "bookings" as const, l: "Booking updates", s: "Status changes on your jobs" },
            { key: "messages" as const, l: "New messages", s: "Chat notifications" },
            { key: "reviews" as const, l: "Reviews", s: role === "provider" ? "When customers rate you" : "Confirmation of your ratings" },
          ].map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{p.l}</p>
                <p className="text-xs text-muted-foreground">{p.s}</p>
              </div>
              <Switch checked={prefs[p.key]} onCheckedChange={(v) => setPrefs((prev) => ({ ...prev, [p.key]: v }))} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Unread badge count for the sidebar "Notifications" nav item. */
export function useNotificationBadge(role: "customer" | "provider") {
  const { unread } = useNotifications(role);
  return unread;
}

export function useLiveHomeStats() {
  const [stats, setStats] = useState<{ customers: number; pros: number; jobs: number; rating: number } | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [c, p, j, r] = await Promise.all([
        supabase.from("customer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("providers").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("providers").select("rating").eq("status", "approved").gt("reviews_count", 0),
      ]);
      if (!mounted) return;
      const ratings = (r.data ?? []).map((x: { rating: number }) => Number(x.rating)).filter((x) => x > 0);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      setStats({
        customers: c.count ?? 0,
        pros: p.count ?? 0,
        jobs: j.count ?? 0,
        rating: Number(avg.toFixed(1)),
      });
    };
    load();
    const ch = supabase.channel("home-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);
  return stats;
}

export type LiveTestimonial = { name: string; area: string; text: string; rating: number };

export function useLiveTestimonials(limit = 3) {
  const [items, setItems] = useState<LiveTestimonial[] | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: rvs } = await supabase
        .from("reviews")
        .select("id, rating, comment, customer_id, provider_id, created_at")
        .not("comment", "is", null)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(limit * 3);
      const rows = rvs ?? [];
      if (rows.length === 0) { if (mounted) setItems([]); return; }
      const custIds = Array.from(new Set(rows.map((r) => r.customer_id)));
      const provIds = Array.from(new Set(rows.map((r) => r.provider_id)));
      const [{ data: custs }, { data: provs }] = await Promise.all([
        supabase.from("customer_profiles").select("id, name").in("id", custIds),
        supabase.from("providers").select("id, area").in("id", provIds),
      ]);
      const cmap = new Map((custs ?? []).map((c) => [c.id, c.name]));
      const pmap = new Map((provs ?? []).map((p) => [p.id, p.area]));
      const mapped: LiveTestimonial[] = rows
        .filter((r) => (r.comment ?? "").trim().length > 10)
        .slice(0, limit)
        .map((r) => ({
          name: cmap.get(r.customer_id) ?? "Zimma customer",
          area: pmap.get(r.provider_id) ?? "Karachi",
          text: (r.comment ?? "").trim(),
          rating: r.rating,
        }));
      if (mounted) setItems(mapped);
    };
    load();
    const ch = supabase.channel("home-testimonials")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [limit]);
  return items;
}

export function useTopProviders(limit = 4) {
  const [rows, setRows] = useState<Array<{
    id: string; name: string; profession: string; area: string; rating: number; reviews_count: number;
    total_jobs: number; experience: number; hourly_rate: number; availability: string; is_online: boolean;
    verified: boolean; skills: string[]; avatar_url: string | null; status: string;
  }> | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("providers").select("*")
        .eq("status", "approved")
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false })
        .limit(limit);
      if (mounted) setRows((data ?? []) as never);
    };
    load();
    const ch = supabase.channel("home-top-providers")
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [limit]);
  return rows;
}
