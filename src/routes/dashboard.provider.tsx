import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Calendar, Briefcase, Wallet, MessageSquare, Settings, Star, TrendingUp,
  Clock, CheckCircle2, ArrowDownToLine, User, Lock, IdCard, BadgeCheck, Pencil, Save, X, MapPin, Phone, Mail, Bell,
} from "lucide-react";
import { DashboardLayout } from "@/components/zimma/DashboardLayout";
import { CountUp } from "@/components/zimma/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart, BarChart, Bar } from "recharts";
import { useAuth } from "@/components/zimma/auth-context";
import { DashboardSkeleton } from "@/components/zimma/loaders";
import { ChatInbox, useUnreadMessageCount } from "@/components/zimma/chat";
import { NotificationsPanel as LiveNotificationsPanel, useNotificationBadge } from "@/components/zimma/notification-center";

export const Route = createFileRoute("/dashboard/provider")({
  head: () => ({ meta: [{ title: "Provider Dashboard — Zimma" }] }),
  component: ProviderDashboardWrapper,
});

function ProviderDashboardWrapper() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!user) { navigate({ to: "/auth", search: { role: "provider" } as never }); return; }
    if (user.role !== "provider") { navigate({ to: "/dashboard/customer" }); return; }
    if (user.status !== "approved") { navigate({ to: "/auth/pending" }); return; }
  }, [ready, user, navigate]);
  if (!ready || !user || user.role !== "provider" || user.status !== "approved") return <DashboardSkeleton />;
  return <ProviderDashboard />;
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

function useProviderBookings() {
  const { authUser } = useAuth();
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  useEffect(() => {
    if (!authUser) { setRows([]); return; }
    let mounted = true;
    const load = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("bookings").select("*")
        .eq("provider_id", authUser.id)
        .order("booking_date", { ascending: false });
      if (mounted) setRows((data ?? []) as BookingRow[]);
    };
    load();
    let cleanup: (() => void) | undefined;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const ch = supabase.channel(`bookings-prov-${authUser.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `provider_id=eq.${authUser.id}` }, load)
        .subscribe();
      cleanup = () => { supabase.removeChannel(ch); };
    })();
    return () => { mounted = false; cleanup?.(); };
  }, [authUser?.id]);
  return rows;
}

const provStatusStyle: Record<BookingRow["status"], string> = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  confirmed: "bg-primary-soft text-primary hover:bg-primary-soft",
  in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-success-soft text-success hover:bg-success-soft",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
  rejected: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

function ProviderDashboard() {
  const [tab, setTab] = useState("Overview");
  const { user } = useAuth();
  const unread = useUnreadMessageCount();
  const notifCount = useNotificationBadge("provider");
  const displayName = user?.role === "provider" ? user.name : "Asif Mehmood";
  const nav = [
    { label: "Overview", icon: Home },
    { label: "Pro Profile", icon: BadgeCheck },
    { label: "Jobs", icon: Briefcase },
    { label: "Calendar", icon: Calendar },
    { label: "Earnings", icon: Wallet },
    { label: "Messages", icon: MessageSquare, badge: unread },
    { label: "Notifications", icon: Bell, badge: notifCount },
    { label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout role="Provider" name={displayName} nav={nav} activeLabel={tab} onSelect={setTab}>

      {tab === "Overview" && <OverviewPanel />}
      {tab === "Pro Profile" && <ProProfilePanel />}
      {tab === "Jobs" && <JobsPanel />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Earnings" && <EarningsPanel />}
      {tab === "Messages" && <MessagesPanel />}
      {tab === "Notifications" && <NotificationsTabPanel />}
      {tab === "Settings" && <SettingsPanel />}
    </DashboardLayout>
  );
}

function NotificationsTabPanel() {
  return (
    <>
      <SectionHeader title="Notifications" subtitle="Live activity from your customers — jobs, messages, and reviews." />
      <LiveNotificationsPanel role="provider" />
    </>
  );
}

function ProField({ label, value, onChange, icon: Icon, editing, disabled }: { label: string; value: string; onChange: (v: string) => void; icon: typeof User; editing: boolean; disabled?: boolean }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      {editing && !disabled ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
      ) : (
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium">{value || "—"}</p>
      )}
    </div>
  );
}

function ProProfilePanel() {
  const { user, refresh } = useAuth();
  const provider = user?.role === "provider" ? user : null;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name ?? "",
    email: provider?.email ?? "",
    profession: provider?.profession ?? "Electrician",
    cnic: provider?.cnic ?? "",
    phone: provider?.phone ?? "",
    area: provider?.area ?? "Karachi",
    experience: String(provider?.experience ?? 0),
    hourly_rate: String(provider?.hourly_rate ?? 800),
    availability: provider?.availability ?? "Available today",
    skills: (provider?.skills ?? []).join(", "),
    bio: provider?.bio ?? "",
    is_online: provider?.is_online ?? false,
  });

  useEffect(() => {
    if (!provider) return;
    setForm({
      name: provider.name,
      email: provider.email ?? "",
      profession: provider.profession,
      cnic: provider.cnic ?? "",
      phone: provider.phone ?? "",
      area: provider.area,
      experience: String(provider.experience),
      hourly_rate: String(provider.hourly_rate),
      availability: provider.availability,
      skills: (provider.skills ?? []).join(", "),
      bio: provider.bio,
      is_online: provider.is_online,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id]);

  const save = async () => {
    if (!provider) return;
    setSaving(true);
    const patch = {
      name: form.name,
      profession: form.profession,
      phone: form.phone,
      area: form.area,
      experience: Number(form.experience) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      availability: form.availability,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: form.bio,
      is_online: form.is_online,
    };
    const { supabase } = await import("@/integrations/supabase/client");
    const { toast } = await import("sonner");
    const { error } = await supabase.from("providers").update(patch).eq("id", provider.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated — customers see this live.");
    setEditing(false);
    await refresh();
  };

  const toggleOnline = async (val: boolean) => {
    if (!provider) return;
    setForm((f) => ({ ...f, is_online: val }));
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("providers").update({ is_online: val }).eq("id", provider.id);
    await refresh();
  };

  return (
    <>
      <SectionHeader
        title="Pro Profile"
        subtitle="Your verified Zimma Pro details — visible to customers in real time."
        action={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="gap-1"><X className="h-4 w-4" /> Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1"><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)} className="gap-1"><Pencil className="h-4 w-4" /> Edit Profile</Button>
          )
        }
      />

      <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-5 text-primary-foreground shadow-glow sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold backdrop-blur">
            {form.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold sm:text-3xl">{form.name || "Your name"}</h2>
              {provider?.verified && (
                <Badge className="gap-1 rounded-full bg-success/30 text-white hover:bg-success/30"><BadgeCheck className="h-3.5 w-3.5" /> Verified Pro</Badge>
              )}
            </div>
            <p className="mt-1 text-sm opacity-90">{form.profession} · {form.experience || 0} yrs experience</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-90">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" /> {provider?.rating ?? 0} ({provider?.reviews_count ?? 0} reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {form.area}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${form.is_online ? "bg-emerald-300 animate-pulse" : "bg-white/50"}`} />
            <span>{form.is_online ? "Online" : "Offline"}</span>
            <Switch checked={form.is_online} onCheckedChange={toggleOnline} />
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold"><User className="h-4 w-4" /> Personal Details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProField editing={editing} label="Full name" icon={User} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <ProField editing={editing} label="Phone" icon={Phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div className="sm:col-span-2">
              <ProField editing={false} label="Email (read only)" icon={Mail} value={form.email} onChange={() => {}} disabled />
            </div>
            <div className="sm:col-span-2">
              <ProField editing={false} label="CNIC Number (verified)" icon={IdCard} value={form.cnic} onChange={() => {}} disabled />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-4 w-4" /> Professional Details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Profession
              </label>
              {editing ? (
                <select value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                  {["Electrician", "Plumber", "AC Technician", "Carpenter", "Painter", "Cleaner"].map((p) => <option key={p}>{p}</option>)}
                </select>
              ) : (
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium">{form.profession}</p>
              )}
            </div>
            <ProField editing={editing} label="Experience (years)" icon={Clock} value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} />
            <ProField editing={editing} label="Hourly rate (PKR)" icon={Briefcase} value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} />
            <ProField editing={editing} label="Availability" icon={Clock} value={form.availability} onChange={(v) => setForm({ ...form, availability: v })} />
            <div className="sm:col-span-2">
              <ProField editing={editing} label="Service area" icon={MapPin} value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
            </div>
            <div className="sm:col-span-2">
              <ProField editing={editing} label="Skills (comma separated)" icon={BadgeCheck} value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">About</label>
              {editing ? (
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
              ) : (
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">{form.bio || "—"}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-lg font-bold"><BadgeCheck className="h-4 w-4 text-success" /> Verification Status</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { l: "CNIC Verified", s: form.cnic || "Not provided", ok: !!form.cnic },
              { l: "Admin approval", s: provider?.status === "approved" ? "Approved" : "Pending", ok: provider?.status === "approved" },
              { l: "Profile live", s: provider?.status === "approved" ? "Visible to customers" : "Hidden until approved", ok: provider?.status === "approved" },
            ].map((v) => (
              <div key={v.l} className={`flex items-start gap-3 rounded-2xl border p-3 ${v.ok ? "border-success/30 bg-success-soft/40" : "border-border bg-muted/40"}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${v.ok ? "bg-success text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{v.l}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.s}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
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

function BookingJobRow({ b }: { b: BookingRow }) {
  const { user } = useAuth();
  const providerId = user?.role === "provider" ? user.id : null;
  const [busy, setBusy] = useState(false);
  const [status, setLocalStatus] = useState(b.status);

  useEffect(() => { setLocalStatus(b.status); }, [b.status]);

  const setStatus = async (next: BookingRow["status"]) => {
    if (!providerId) return;
    setBusy(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { toast } = await import("sonner");
    const { error } = await supabase.from("bookings").update({ status: next }).eq("id", b.id).eq("provider_id", providerId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLocalStatus(next);
    toast.success(`Booking marked ${next.replace("_", " ")}`);
  };

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-3 sm:gap-4 sm:p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">{b.service_type}</p>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{b.address ?? "Address pending"}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(b.booking_date).toLocaleString()}</span>
          <Badge className={`rounded-full ${provStatusStyle[status]}`}>{status}</Badge>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-2 border-t border-border/60 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0 sm:text-right">
        <p className="font-semibold">PKR {b.price}</p>
        {status === "pending" && (
          <div className="flex gap-2 sm:mt-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("rejected")}>Decline</Button>
            <Button size="sm" disabled={busy} onClick={() => setStatus("confirmed")}>Accept</Button>
          </div>
        )}
        {status === "confirmed" && (
          <Button size="sm" disabled={busy} className="sm:mt-2" onClick={() => setStatus("in_progress")}>Start job</Button>
        )}
        {status === "in_progress" && (
          <Button size="sm" disabled={busy} className="sm:mt-2" onClick={() => setStatus("completed")}>Mark complete</Button>
        )}
      </div>
    </div>
  );
}

function OverviewPanel() {
  const bookings = useProviderBookings();
  const { user } = useAuth();
  const providerRating = user?.role === "provider" ? Number(user.rating) || 0 : 0;

  const active = (bookings ?? []).filter((b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_progress");
  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const monthEarnings = completed
    .filter((b) => new Date(b.booking_date).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + (b.price ?? 0), 0);

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-5 text-primary-foreground shadow-glow sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 sm:text-xs">Total earnings · this month</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
                PKR <CountUp to={monthEarnings} />
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge className="gap-1 rounded-full bg-success/30 text-white hover:bg-success/30"><TrendingUp className="h-3 w-3" /> Live</Badge>
                <span className="opacity-80">from completed jobs</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm opacity-80">
            {bookings === null
              ? "Loading your job history…"
              : completed.length === 0
              ? "Complete your first job to start earning."
              : `${completed.length} completed job${completed.length === 1 ? "" : "s"} so far.`}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { icon: Briefcase, l: "Active jobs", v: active.length, c: "bg-primary-soft text-primary" },
            { icon: CheckCircle2, l: "Completed", v: completed.length, c: "bg-success-soft text-success" },
            { icon: Star, l: "Avg. rating", v: providerRating, decimals: 1, c: "bg-amber-50 text-amber-600" },
          ].map((s) => (
            <Card key={s.l} className="hover-lift flex items-center gap-4 rounded-2xl border-border bg-card p-4 shadow-soft sm:p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.c}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold"><CountUp to={s.v} decimals={s.decimals ?? 0} /></p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Active bookings</h2>
          </div>
          <div className="mt-4 space-y-3">
            {bookings === null ? (
              <div className="flex justify-center py-8"><Clock className="h-5 w-5 animate-pulse text-muted-foreground" /></div>
            ) : active.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No active jobs. Customers will book you here.
              </div>
            ) : (
              active.map((b) => <BookingJobRow key={b.id} b={b} />)
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {(bookings ?? []).slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.service_type}</p>
                  <p className="truncate text-muted-foreground">{new Date(b.booking_date).toLocaleDateString()}</p>
                </div>
                <Badge className={`rounded-full ${provStatusStyle[b.status]}`}>{b.status}</Badge>
              </div>
            ))}
            {bookings !== null && bookings.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">Nothing yet.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function JobsPanel() {
  const bookings = useProviderBookings();
  const [filter, setFilter] = useState<"all" | BookingRow["status"]>("all");
  const filters: { key: "all" | BookingRow["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
  ];
  const list = (bookings ?? []).filter((b) => filter === "all" ? true : b.status === filter);

  return (
    <>
      <SectionHeader title="Jobs" subtitle="Manage every booking on your plate." />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {bookings === null ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Clock className="h-5 w-5 animate-pulse" /></div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No jobs in this bucket.
            </div>
          ) : (
            list.map((b) => <BookingJobRow key={b.id} b={b} />)
          )}
        </div>
      </Card>
    </>
  );
}

function CalendarPanel() {
  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();
  return (
    <>
      <SectionHeader title="Calendar" subtitle="Your week, at a glance." action={<Button variant="outline" size="sm">Set availability</Button>} />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="grid grid-cols-7 gap-2">
          {week.map((d, i) => (
            <button key={d} className={`flex flex-col items-center rounded-xl p-2 text-xs transition sm:p-3 ${i === (today === 0 ? 6 : today - 1) ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-foreground hover:bg-accent"}`}>
              <span className="opacity-80">{d}</span>
              <span className="mt-1 text-base font-bold sm:text-xl">{15 + i}</span>
              {(i === 1 || i === 3 || i === 5) && <span className={`mt-1 h-1 w-1 rounded-full ${i === (today === 0 ? 6 : today - 1) ? "bg-white" : "bg-primary"}`} />}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Today's schedule</h3>
          {[
            { t: "10:00 AM", s: "Wiring inspection · DHA Phase 5", c: "Mr. Hassan" },
            { t: "1:30 PM", s: "Geyser repair · Clifton", c: "Mrs. Khan" },
            { t: "4:00 PM", s: "Inverter setup · Gulshan", c: "Mr. Bilal" },
            { t: "6:30 PM", s: "MCB replacement · Clifton", c: "Mrs. Sana" },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-3 rounded-xl border border-border p-3 sm:p-4">
              <span className="shrink-0 text-xs font-semibold text-primary sm:text-sm">{s.t}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.s}</p>
                <p className="truncate text-xs text-muted-foreground">{s.c}</p>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function EarningsPanel() {
  const monthly = [
    { d: "Jan", v: 92 }, { d: "Feb", v: 110 }, { d: "Mar", v: 134 },
    { d: "Apr", v: 121 }, { d: "May", v: 156 }, { d: "Jun", v: 184 },
  ];
  return (
    <>
      <SectionHeader title="Earnings" subtitle="Track payouts and trends." action={<Button className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Withdraw</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "This month", v: "PKR 184,200", c: "bg-primary-soft text-primary" },
          { l: "Pending payout", v: "PKR 22,400", c: "bg-amber-50 text-amber-600" },
          { l: "Lifetime", v: "PKR 1.42M", c: "bg-success-soft text-success" },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl border-border bg-card p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="mt-1 text-2xl font-bold">{s.v}</p>
            <div className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs ${s.c}`}>+18.2%</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-bold">Monthly earnings (PKR ‘000)</h2>
        <div className="mt-4 h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="d" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="v" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="text-lg font-bold">Recent payouts</h2>
        <div className="mt-4 space-y-2">
          {[
            { d: "10 Jun 2026", a: "PKR 34,800", s: "Paid" },
            { d: "03 Jun 2026", a: "PKR 28,200", s: "Paid" },
            { d: "27 May 2026", a: "PKR 41,500", s: "Paid" },
          ].map((p) => (
            <div key={p.d} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.d}</p>
                <p className="text-xs text-muted-foreground">JazzCash · ending 8821</p>
              </div>
              <p className="shrink-0 font-semibold">{p.a}</p>
              <Badge className="rounded-full bg-success-soft text-success hover:bg-success-soft">{p.s}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function MessagesPanel() {
  return (
    <>
      <SectionHeader title="Messages" subtitle="Chat with your customers in real time." />
      <ChatInbox role="provider" />
    </>
  );
}


function SettingsPanel() {
  return (
    <>
      <SectionHeader title="Settings" subtitle="Profile, services and notification preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><User className="h-4 w-4" /> Pro profile</h2>
          <div className="mt-4 space-y-3">
            <div><label className="text-xs text-muted-foreground">Display name</label><Input defaultValue="Asif Mehmood" className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Trade</label><Input defaultValue="Master Electrician" className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Service area</label><Input defaultValue="DHA, Clifton, Gulshan" className="mt-1 rounded-xl" /></div>
            <Button className="w-full sm:w-auto">Save changes</Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-4 w-4" /> Notifications</h2>
          <div className="mt-4 space-y-4">
            {[
              { l: "New booking alerts", s: "Instant push when a customer books" },
              { l: "Customer messages", s: "Notify on every new chat" },
              { l: "Weekly earnings report", s: "Sent every Monday morning" },
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
        </Card>
      </div>
    </>
  );
}
