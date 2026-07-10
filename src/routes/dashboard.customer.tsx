import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Home, Calendar, Heart, History, Bell, Settings, Plus, Star,
  User, Lock, Trash2, Search, Loader2, Wrench, Sparkles, ArrowRight,
  CheckCircle2, Clock, XCircle, MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/zimma/DashboardLayout";
import { Reveal } from "@/components/zimma/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/zimma/auth-context";
import type { ProviderRow } from "@/components/zimma/auth-context";
import { rowToProvider } from "@/components/zimma/provider-mapping";
import { DashboardSkeleton } from "@/components/zimma/loaders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BecomeProDialog } from "@/components/zimma/BecomeProDialog";
import { useFavorites } from "@/components/zimma/favorites";
import { ChatInbox, useUnreadMessageCount } from "@/components/zimma/chat";
import { NotificationsPanel as LiveNotificationsPanel, useNotificationBadge } from "@/components/zimma/notification-center";

export const Route = createFileRoute("/dashboard/customer")({
  head: () => ({ meta: [{ title: "My Dashboard — Zimma" }] }),
  component: CustomerDashboardWrapper,
});

function CustomerDashboardWrapper() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    // Approved providers belong on the pro dashboard.
    if (user.role === "provider") navigate({ to: "/dashboard/provider" });
  }, [ready, user, navigate]);
  if (!ready || !user || user.role !== "customer") return <DashboardSkeleton />;
  return <CustomerDashboard />;
}

function useApprovedProviders() {
  const [rows, setRows] = useState<ProviderRow[] | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("providers").select("*").eq("status", "approved");
      if (mounted) setRows((data ?? []) as ProviderRow[]);
    };
    load();
    const ch = supabase
      .channel("customer-providers")
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);
  return rows;
}

function CustomerDashboard() {
  const [tab, setTab] = useState("Overview");
  const [proDialogOpen, setProDialogOpen] = useState(false);
  const { user } = useAuth();
  const { ids: favoriteIds } = useFavorites();
  const [bookings, setBookings] = useCustomerBookings();
  const unread = useUnreadMessageCount();
  const notifCount = useNotificationBadge("customer");
  const displayName = user?.role === "customer" ? user.name : "You";
  const application = user?.role === "customer" ? user.providerApplication : undefined;
  const providersRows = useApprovedProviders();
  const providers = (providersRows ?? []).map(rowToProvider);
  const liveBookingCount = (bookings ?? []).filter((b) => !["completed", "cancelled", "rejected"].includes(b.status)).length;

  const nav = [
    { label: "Overview", icon: Home },
    { label: "Bookings", icon: Calendar, badge: liveBookingCount },
    { label: "Messages", icon: MessageSquare, badge: unread },
    { label: "Favourites", icon: Heart, badge: favoriteIds.size },
    { label: "History", icon: History },
    { label: "Notifications", icon: Bell, badge: notifCount },
    { label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout role="Customer" name={displayName} nav={nav} activeLabel={tab} onSelect={setTab}>
      {tab === "Overview" && (
        <OverviewPanel
          name={displayName}
          providers={providers}
          bookings={bookings}
          loading={providersRows === null}
          application={application}
          onBecomePro={() => setProDialogOpen(true)}
        />
      )}
      {tab === "Bookings" && <BookingsPanel rows={bookings} setRows={setBookings} />}
      {tab === "Messages" && (
        <>
          <SectionHeader title="Messages" subtitle="Chat with your service pros in real time." />
          <ChatInbox role="customer" />
        </>
      )}
      {tab === "Favourites" && <FavouritesPanel providers={providers} loading={providersRows === null} />}
      {tab === "History" && <HistoryPanel />}
      {tab === "Notifications" && <NotificationsPanel />}
      {tab === "Settings" && <SettingsPanel />}
      <BecomeProDialog open={proDialogOpen} onOpenChange={setProDialogOpen} />
    </DashboardLayout>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, subtitle, cta }: { title: string; subtitle: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}

function OverviewPanel({
  name, providers, bookings, loading, application, onBecomePro,
}: {
  name: string;
  providers: ReturnType<typeof rowToProvider>[];
  bookings: BookingRow[] | null;
  loading: boolean;
  application?: { status: "pending" | "approved" | "rejected" };
  onBecomePro: () => void;
}) {
  const completedBookings = (bookings ?? []).filter((b) => b.status === "completed");
  const uniquePros = new Set((bookings ?? []).map((b) => b.provider_id)).size;
  const spent = completedBookings.reduce((sum, b) => sum + (b.price ?? 0), 0);
  const upcoming = (bookings ?? []).filter((b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_progress");
  return (
    <>
      <section className="rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-5 text-primary-foreground shadow-glow sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 sm:text-xs">Welcome</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-4xl">Hi {name} 👋</h1>
            <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">Book your first service to get started with Zimma.</p>
          </div>
          <Link to="/book" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full gap-2 btn-glow sm:w-auto">
              <Plus className="h-4 w-4" /> Book a Service
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
          {[
            { v: bookings?.length ?? 0, l: "Total bookings" },
            { v: uniquePros, l: "Pros hired" },
            { v: `PKR ${spent}`, l: "Spent this year" },
            { v: providers.length, l: "Pros available" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 80}>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur transition hover:bg-white/15 sm:p-4">
                <div className="text-xl font-bold sm:text-2xl">{s.v}</div>
                <div className="mt-1 text-[11px] opacity-90 sm:text-xs">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <BecomeProCTA application={application} onBecomePro={onBecomePro} />


      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Upcoming bookings</h2>
          </div>
          <div className="mt-4">
            {bookings === null ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming bookings"
                subtitle="Your confirmed jobs will appear here."
                cta={<Link to="/book"><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New booking</Button></Link>}
              />
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((b) => <CompactBookingRow key={b.id} b={b} />)}
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Top pros</h2>
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : providers.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No approved pros yet.</p>
            ) : (
              providers.slice(0, 4).map((p) => (
                <Link to="/providers/$id" params={{ id: p.id }} key={p.id} className="flex items-center gap-3 rounded-xl p-1 hover:bg-accent">
                  <img src={p.avatar} alt="" className="h-10 w-10 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.trade}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function BecomeProCTA({
  application, onBecomePro,
}: { application?: { status: "pending" | "approved" | "rejected" }; onBecomePro: () => void }) {
  if (application?.status === "pending") {
    return (
      <Card className="mt-6 rounded-2xl border-amber-500/30 bg-amber-50 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">Service Pro application under review</p>
              <p className="mt-0.5 text-xs text-amber-800/80">
                Our Super Admin is verifying your credentials. You can keep browsing and booking in the meantime.
              </p>
            </div>
          </div>
          <Link to="/auth/pending">
            <Button size="sm" variant="outline" className="gap-1 border-amber-600/40 bg-white text-amber-800 hover:bg-amber-100">
              View status <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }
  if (application?.status === "rejected") {
    return (
      <Card className="mt-6 rounded-2xl border-destructive/30 bg-destructive/5 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Pro application declined</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Contact support for details or reapply below.</p>
            </div>
          </div>
          <Button size="sm" onClick={onBecomePro} className="gap-1">Reapply</Button>
        </div>
      </Card>
    );
  }
  return (
    <Card className="mt-6 overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Earn with Zimma</p>
            <h3 className="mt-1 text-lg font-bold sm:text-xl">Become a Service Pro</h3>
            <p className="mt-1 max-w-md text-sm text-white/70">
              Are you an electrician, plumber, cleaner or handyman? Apply once — we'll verify your CNIC and get you jobs in Karachi.
            </p>
          </div>
        </div>
        <Button size="lg" onClick={onBecomePro} className="gap-2 btn-glow">
          <Wrench className="h-4 w-4" /> Apply now
        </Button>
      </div>
    </Card>
  );
}

type BookingRow = {
  id: string;
  customer_id: string;
  provider_id: string;
  service_type: string;
  booking_date: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  price: number;
  address: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  customer_id: string;
  provider_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

function useCustomerBookings() {
  const { authUser } = useAuth();
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const readyRef = useRef(false);
  const rowsRef = useRef<BookingRow[]>([]);
  useEffect(() => {
    if (!authUser) { setRows([]); rowsRef.current = []; return; }
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("bookings").select("*")
        .eq("customer_id", authUser.id)
        .order("booking_date", { ascending: false });
      if (mounted) {
        const next = (data ?? []) as BookingRow[];
        rowsRef.current = next;
        setRows(next);
        readyRef.current = true;
      }
    };
    load();
    const ch = supabase.channel(`bookings-cust-${authUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${authUser.id}` }, (payload) => {
        const eventType = payload.eventType;
        const nextRow = payload.new as BookingRow | null;
        const oldRow = payload.old as BookingRow | null;
        if (readyRef.current) {
          if (eventType === "INSERT") toast.success("New booking added to your dashboard");
          if (eventType === "UPDATE" && nextRow && oldRow && nextRow.status !== oldRow.status) {
            toast.success(`Booking is now ${nextRow.status.replace("_", " ")}`);
          }
          if (eventType === "DELETE") toast("A booking was removed");
        }
        if (nextRow && eventType === "UPDATE") {
          rowsRef.current = rowsRef.current.map((row) => row.id === nextRow.id ? nextRow : row);
          setRows([...rowsRef.current]);
        }
        load();
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [authUser?.id]);
  return [rows, setRows] as const;
}

const statusStyle: Record<BookingRow["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-primary-soft text-primary",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-success-soft text-success",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const timelineSteps: { key: BookingRow["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Completed" },
];

function statusLabel(status: BookingRow["status"]) {
  if (status === "in_progress") return "active";
  return status;
}

function CompactBookingRow({ b }: { b: BookingRow }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{b.service_type}</p>
        <p className="truncate text-xs text-muted-foreground">{new Date(b.booking_date).toLocaleString()}</p>
      </div>
      <Badge className={`rounded-full ${statusStyle[b.status]}`}>{statusLabel(b.status)}</Badge>
    </div>
  );
}

function BookingTimeline({ status }: { status: BookingRow["status"] }) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        <XCircle className="h-4 w-4" /> This booking is {status}.
      </div>
    );
  }
  const current = timelineSteps.findIndex((s) => s.key === status);
  return (
    <ol className="mt-4 grid grid-cols-4 gap-2">
      {timelineSteps.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step.key} className="min-w-0">
            <div className={`h-1.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
            <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${done ? "text-primary" : "text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function useCustomerReviews() {
  const { authUser } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  useEffect(() => {
    if (!authUser) { setReviews([]); return; }
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, customer_id, provider_id, booking_id, rating, comment, created_at")
        .eq("customer_id", authUser.id);
      if (mounted) setReviews((data ?? []) as ReviewRow[]);
    };
    load();
    const ch = supabase.channel(`reviews-cust-${authUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `customer_id=eq.${authUser.id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [authUser?.id]);
  return [reviews, setReviews] as const;
}

function ReviewForm({ booking, existing, onSaved }: { booking: BookingRow; existing?: ReviewRow; onSaved: (review: ReviewRow) => void }) {
  const { authUser } = useAuth();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
    setError(null);
  }, [existing?.id, existing?.rating, existing?.comment]);

  const submit = async () => {
    if (!authUser) return;
    setError(null);
    if (booking.status !== "completed") { setError("You can only review a completed booking."); return; }
    if (rating < 1 || rating > 5) { setError("Please pick a star rating between 1 and 5."); return; }
    if (comment.trim().length > 1000) { setError("Please keep your review under 1000 characters."); return; }
    setSaving(true);
    const payload = {
      customer_id: authUser.id,
      provider_id: booking.provider_id,
      booking_id: booking.id,
      rating,
      comment: comment.trim() || null,
    };
    const query = existing
      ? supabase.from("reviews").update(payload).eq("id", existing.id).select("id, customer_id, provider_id, booking_id, rating, comment, created_at").single()
      : supabase.from("reviews").insert(payload).select("id, customer_id, provider_id, booking_id, rating, comment, created_at").single();
    const { data, error: err } = await query;
    setSaving(false);
    if (err) {
      const msg = err.message || "";
      if (msg.includes("reviews_unique_per_booking") || (err.code === "23505")) {
        setError("You've already left a review for this booking.");
      } else if (msg.toLowerCase().includes("row-level") || msg.toLowerCase().includes("permission")) {
        setError("Reviews are only allowed for your own completed bookings.");
      } else if (msg.includes("reviews_rating_check")) {
        setError("Please pick a star rating between 1 and 5.");
      } else {
        setError(msg || "Couldn't save your review. Please try again.");
      }
      return;
    }
    if (data) onSaved(data as ReviewRow);
    toast.success(existing ? "Review updated" : "Thanks for your review!");
  };

  return (
    <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{existing ? "Your review" : "Leave a review"}</p>
          <p className="text-xs text-muted-foreground">One review per completed booking.</p>
        </div>
        <div className="flex gap-1" aria-label="Choose rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => { setRating(value); setError(null); }} className="transition hover:scale-110" aria-label={`${value} stars`}>
              <Star className={`h-5 w-5 ${rating >= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the service? (optional)"
        maxLength={1000}
        className="mt-3 min-h-24 rounded-xl bg-background"
      />
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">{comment.length}/1000</span>
        <Button size="sm" onClick={submit} disabled={saving || rating < 1}>
          {saving ? "Saving…" : existing ? "Update review" : "Submit review"}
        </Button>
      </div>
    </div>
  );
}

function BookingActions({ b, setRows }: { b: BookingRow; setRows: Dispatch<SetStateAction<BookingRow[] | null>> }) {
  const [busy, setBusy] = useState(false);

  const cancelBooking = async () => {
    setBusy(true);
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id).eq("customer_id", b.customer_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev ? prev.map((row) => row.id === b.id ? { ...row, status: "cancelled" } : row) : prev);
    toast.success("Booking cancelled");
  };

  if (b.status === "pending") {
    return <Button size="sm" variant="outline" disabled={busy} onClick={cancelBooking}>Cancel request</Button>;
  }
  if (b.status === "confirmed") {
    return <Button size="sm" variant="outline" disabled={busy} onClick={cancelBooking}>Cancel booking</Button>;
  }
  if (b.status === "in_progress") {
    return <Badge className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-100">Job active</Badge>;
  }
  if (b.status === "completed") {
    return <Link to="/book" search={{ providerId: b.provider_id }}><Button size="sm" variant="outline">Book again</Button></Link>;
  }
  return <Link to="/book"><Button size="sm" variant="outline">New booking</Button></Link>;
}

function BookingsPanel({ rows, setRows }: { rows: BookingRow[] | null; setRows: Dispatch<SetStateAction<BookingRow[] | null>> }) {
  const [reviews, setReviews] = useCustomerReviews();
  const reviewByBooking = new Map((reviews ?? []).filter((r) => r.booking_id).map((r) => [r.booking_id as string, r]));
  return (
    <>
      <SectionHeader
        title="My bookings"
        subtitle="Manage upcoming jobs and reschedule when you need."
        action={<Link to="/book"><Button className="gap-2"><Plus className="h-4 w-4" /> New booking</Button></Link>}
      />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        {rows === null ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <EmptyState title="No bookings yet" subtitle="When you book a service, it will show up here." />
        ) : (
          <div className="space-y-3">
            {rows.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border p-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{b.service_type}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[b.status]}`}>{statusLabel(b.status)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {new Date(b.booking_date).toLocaleString()} · {b.address ?? "No address"}
                    </p>
                    <BookingTimeline status={b.status} />
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <span className="text-sm font-semibold">PKR {b.price}</span>
                    <BookingActions b={b} setRows={setRows} />
                  </div>
                </div>
                {b.status === "completed" && reviews !== null && (
                  <ReviewForm
                    booking={b}
                    existing={reviewByBooking.get(b.id)}
                    onSaved={(review) => setReviews((prev) => {
                      const current = prev ?? [];
                      const exists = current.some((r) => r.id === review.id);
                      return exists ? current.map((r) => r.id === review.id ? review : r) : [review, ...current];
                    })}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function FavouritesPanel({ providers, loading }: { providers: ReturnType<typeof rowToProvider>[]; loading: boolean }) {
  const { ids: favIds, ready } = useFavorites();
  const list = providers.filter((p) => favIds.has(p.id));
  const isLoading = loading || !ready;

  return (
    <>
      <SectionHeader title="My favourites" subtitle="Pros you've saved for quick booking." />
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <EmptyState
          title="No favourites yet"
          subtitle="Tap the heart on any provider to save them here."
          cta={<Link to="/providers"><Button size="sm">Browse pros</Button></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="rounded-2xl border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-start gap-3">
                <img src={p.avatar} alt="" className="h-14 w-14 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.trade}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{p.rating}</span>
                    <span className="text-muted-foreground">· {p.area}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/providers/$id" params={{ id: p.id }} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Profile</Button>
                </Link>
                <Link to="/book" search={{ providerId: p.id }} className="flex-1">
                  <Button size="sm" className="w-full">Book</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function HistoryPanel() {
  return (
    <>
      <SectionHeader title="Booking history" subtitle="Every completed job will appear here." />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search history…" className="rounded-xl pl-9" />
        </div>
        <EmptyState title="No history yet" subtitle="You haven't completed any bookings." />
      </Card>
    </>
  );
}

function NotificationsPanel() {
  return (
    <>
      <SectionHeader title="Notifications" subtitle="Every booking, message and review — live from your account." />
      <LiveNotificationsPanel role="customer" />
    </>
  );
}

function SettingsPanel() {
  const { user, refresh } = useAuth();
  const cust = user?.role === "customer" ? user : null;
  const [name, setName] = useState(cust?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(cust?.name ?? ""); }, [cust?.name]);

  const save = async () => {
    if (!cust) return;
    setSaving(true);
    const { error } = await supabase.from("customer_profiles").update({ name }).eq("id", cust.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
  };

  return (
    <>
      <SectionHeader title="Settings" subtitle="Manage your profile, security and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><User className="h-4 w-4" /> Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Full name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={cust?.email ?? ""} disabled className="mt-1 rounded-xl" />
            </div>
            <Button onClick={save} disabled={saving || !name.trim()} className="w-full sm:w-auto">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-4 w-4" /> Preferences</h2>
          <div className="mt-4 space-y-4">
            {[
              { l: "Email notifications", s: "Booking confirmations & reminders" },
              { l: "SMS alerts", s: "Critical updates to your phone" },
              { l: "Promotional offers", s: "Discounts and seasonal campaigns" },
            ].map((p, i) => (
              <div key={p.l} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.l}</p>
                  <p className="text-xs text-muted-foreground">{p.s}</p>
                </div>
                <Switch defaultChecked={i !== 2} />
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" /> Delete account</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
