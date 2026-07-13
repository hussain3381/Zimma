import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home, Calendar, Briefcase, Wallet, MessageSquare, Settings, Star, TrendingUp,
  Clock, CheckCircle2, ArrowDownToLine, User, Lock, IdCard, BadgeCheck, Pencil, Save, X, MapPin, Phone, Mail, Bell,
  Upload, FileText, AlertCircle, Loader2,
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
import { ChatInbox, openConversationWithCustomer, useUnreadMessageCount } from "@/components/zimma/chat";
import { NotificationsPanel as LiveNotificationsPanel, useNotificationBadge } from "@/components/zimma/notification-center";
import { emitDashboardNav, subscribeDashboardNav } from "@/lib/dashboard-nav";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    if (user.status !== "approved") { navigate({ to: "/auth-pending" }); return; }
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
      const { data } = await supabase.from("bookings").select("*")
        .eq("provider_id", authUser.id)
        .order("booking_date", { ascending: false });
      if (mounted) setRows((data ?? []) as BookingRow[]);
    };
    load();
    // Unique channel per mount avoids the "cannot add postgres_changes
    // callbacks after subscribe()" error in StrictMode where the same-named
    // channel handle is re-used across the double-mount before cleanup ran.
    const ch = supabase
      .channel(`bookings-prov-${authUser.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `provider_id=eq.${authUser.id}` },
        load,
      )
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
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
  const [focusConversationId, setFocusConversationId] = useState<string | undefined>();
  const [focusBookingId, setFocusBookingId] = useState<string | undefined>();
  const [focusToken, setFocusToken] = useState(0);
  const { user } = useAuth();
  const unread = useUnreadMessageCount();
  const notifCount = useNotificationBadge("provider");
  const displayName = user?.role === "provider" ? user.name : "Provider";

  useEffect(() => subscribeDashboardNav((target) => {
    setTab(target.tab);
    setFocusConversationId(target.conversationId);
    setFocusBookingId(target.bookingId);
    setFocusToken(target.token ?? Date.now());
  }), []);

  const nav = [
    { label: "Overview", icon: Home },
    { label: "Pro Profile", icon: BadgeCheck },
    { label: "Jobs", icon: Briefcase },
    { label: "Messages", icon: MessageSquare, badge: unread },
    { label: "Notifications", icon: Bell, badge: notifCount },
    { label: "Calendar", icon: Calendar },
    { label: "Earnings", icon: Wallet },
    { label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout role="Provider" name={displayName} nav={nav} activeLabel={tab} onSelect={setTab}>

      {tab === "Overview" && <OverviewPanel />}
      {tab === "Pro Profile" && <ProProfilePanel />}
      {tab === "Jobs" && <JobsPanel focusBookingId={focusBookingId} focusToken={focusToken} />}
      {tab === "Calendar" && <CalendarPanel />}
      {tab === "Earnings" && <EarningsPanel />}
      {tab === "Messages" && <MessagesPanel focusConversationId={focusConversationId} focusToken={focusToken} />}
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
      cnic: form.cnic || null,
      area: form.area,
      experience: Number(form.experience) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      availability: form.availability,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      bio: form.bio,
      is_online: form.is_online,
    };
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
              <ProField
                editing={editing}
                label={form.cnic ? "CNIC Number (verified)" : "CNIC Number"}
                icon={IdCard}
                value={form.cnic}
                onChange={(v) => setForm({ ...form, cnic: v })}
                disabled={!!provider?.cnic}
              />
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "CNIC Verified", s: form.cnic || "Not provided", ok: !!form.cnic },
              { l: "Admin approval", s: provider?.status === "approved" ? "Approved" : "Pending", ok: provider?.status === "approved" },
              {
                l: "KYC document",
                s:
                  provider?.kyc_status === "approved" ? "Verified"
                  : provider?.kyc_status === "submitted" ? "Under review"
                  : provider?.kyc_status === "rejected" ? "Rejected — re-upload"
                  : "Not submitted",
                ok: provider?.kyc_status === "approved",
              },
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
          <KycUploadCard />
        </Card>
      </div>
    </>
  );
}

function KycUploadCard() {
  const { user, refresh } = useAuth();
  const provider = user?.role === "provider" ? user : null;
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!provider) return null;
  const status = provider.kyc_status ?? "not_submitted";
  const notes = provider.kyc_notes ?? "";
  const documentPath = provider.kyc_document_path ?? null;

  const statusMeta: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    not_submitted: { label: "No document uploaded", cls: "bg-muted text-muted-foreground", icon: AlertCircle },
    submitted: { label: "Under review by admin", cls: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Verified", cls: "bg-success-soft text-success", icon: CheckCircle2 },
    rejected: { label: "Rejected — please re-upload", cls: "bg-destructive/10 text-destructive", icon: X },
  };
  const meta = statusMeta[status];

  const onFile = async (file: File) => {
    if (!provider) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("File must be under 8 MB"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    if (!["jpg", "jpeg", "png", "pdf", "webp"].includes(ext)) {
      toast.error("Only JPG/PNG/PDF/WEBP allowed"); return;
    }
    setUploading(true);
    try {
      const path = `${provider.id}/kyc-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const patch: {
        kyc_document_path: string;
        kyc_document_type: string;
        kyc_status: "submitted";
        kyc_submitted_at: string;
        kyc_notes: null;
      } = {
        kyc_document_path: path,
        kyc_document_type: file.type,
        kyc_status: "submitted",
        kyc_submitted_at: new Date().toISOString(),
        kyc_notes: null,
      };
      const { error: dbErr } = await supabase.from("providers").update(patch).eq("id", provider.id);
      if (dbErr) throw dbErr;
      toast.success("KYC document submitted — admin will review shortly.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const viewDocument = async () => {
    if (!documentPath) return;
    setPreviewing(true);
    try {
      const { data, error } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(documentPath, 60);
      if (error || !data?.signedUrl) throw error ?? new Error("Could not open document");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open document");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">KYC Document</p>
            <p className="text-xs text-muted-foreground">Upload CNIC / ID card front and back or a scanned PDF.</p>
          </div>
        </div>
        <Badge className={`rounded-full ${meta.cls}`}>
          <meta.icon className="mr-1 h-3 w-3" /> {meta.label}
        </Badge>
      </div>
      {notes && status === "rejected" && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          Admin note: {notes}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        {status !== "approved" && (
          <Button size="sm" disabled={uploading || status === "submitted"}
            onClick={() => inputRef.current?.click()} className="gap-1">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {status === "not_submitted"
              ? "Upload document"
              : status === "rejected"
              ? "Re-upload"
              : "Under review"}
          </Button>
        )}
        {documentPath && (
          <Button size="sm" variant="outline" onClick={viewDocument} disabled={previewing} className="gap-1">
            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            View submitted document
          </Button>
        )}
        {status === "submitted" && (
          <p className="text-xs text-muted-foreground">Submitted {provider.kyc_submitted_at ? new Date(provider.kyc_submitted_at).toLocaleString() : ""} — waiting on admin approval.</p>
        )}
        {status === "approved" && (
          <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Verified — no action needed.</p>
        )}
      </div>
    </div>
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

function BookingJobRow({ b, highlight }: { b: BookingRow; highlight?: boolean }) {
  const { user } = useAuth();
  const providerId = user?.role === "provider" ? user.id : null;
  const [busy, setBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [status, setLocalStatus] = useState(b.status);

  useEffect(() => { setLocalStatus(b.status); }, [b.status]);

  const setStatus = async (next: BookingRow["status"]) => {
    if (!providerId) return;
    setBusy(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("bookings").update({ status: next }).eq("id", b.id).eq("provider_id", providerId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLocalStatus(next);
    toast.success(`Booking marked ${next.replace("_", " ")}`);
  };

  const messageCustomer = async () => {
    if (!providerId) return;
    setChatBusy(true);
    const convId = await openConversationWithCustomer(b.customer_id);
    setChatBusy(false);
    if (!convId) return;
    emitDashboardNav({ tab: "Messages", conversationId: convId });
    toast.success("Opening customer chat");
  };

  return (
    <div data-booking-id={b.id} className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] ${highlight ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
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
        <Button size="sm" variant="outline" disabled={chatBusy} className="gap-1 sm:mt-2" onClick={messageCustomer}>
          {chatBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
          Message
        </Button>
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

function JobsPanel({ focusBookingId, focusToken }: { focusBookingId?: string; focusToken?: number }) {
  const bookings = useProviderBookings();
  const [filter, setFilter] = useState<"all" | BookingRow["status"]>("all");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const filters: { key: "all" | BookingRow["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in_progress", label: "In progress" },
    { key: "completed", label: "Completed" },
  ];
  const list = (bookings ?? []).filter((b) => filter === "all" ? true : b.status === filter);

  useEffect(() => {
    if (!focusBookingId || !bookings) return;
    const target = bookings.find((b) => b.id === focusBookingId);
    if (!target) return;
    if (filter !== "all" && target.status !== filter) setFilter("all");
    const t = window.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLDivElement>(`[data-booking-id="${focusBookingId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(focusBookingId);
    }, 80);
    const clear = window.setTimeout(() => setHighlightId(null), 2600);
    return () => { window.clearTimeout(t); window.clearTimeout(clear); };
  }, [focusBookingId, focusToken, bookings, filter]);

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
        <div ref={containerRef} className="mt-5 space-y-3">
          {bookings === null ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Clock className="h-5 w-5 animate-pulse" /></div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No jobs in this bucket.
            </div>
          ) : (
            list.map((b) => <BookingJobRow key={b.id} b={b} highlight={highlightId === b.id} />)
          )}
        </div>
      </Card>
    </>
  );
}

function CalendarPanel() {
  const bookings = useProviderBookings();
  const todayDate = new Date();
  const start = new Date(todayDate);
  start.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const todayKey = todayDate.toDateString();
  const scheduled = (bookings ?? []).filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status));
  const todayJobs = scheduled
    .filter((b) => new Date(b.booking_date).toDateString() === todayKey)
    .sort((a, b) => +new Date(a.booking_date) - +new Date(b.booking_date));
  return (
    <>
      <SectionHeader title="Calendar" subtitle="Your live booking schedule." action={<Button variant="outline" size="sm">Set availability</Button>} />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const count = scheduled.filter((b) => new Date(b.booking_date).toDateString() === d.toDateString()).length;
            const isToday = d.toDateString() === todayKey;
            return (
            <button key={d.toISOString()} className={`flex flex-col items-center rounded-xl p-2 text-xs transition sm:p-3 ${isToday ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-foreground hover:bg-accent"}`}>
              <span className="opacity-80">{d.toLocaleDateString([], { weekday: "short" })}</span>
              <span className="mt-1 text-base font-bold sm:text-xl">{d.getDate()}</span>
              {count > 0 && <span className={`mt-1 rounded-full px-1.5 text-[10px] ${isToday ? "bg-white/20 text-white" : "bg-primary-soft text-primary"}`}>{count}</span>}
            </button>
          );})}
        </div>
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Today's schedule</h3>
          {bookings === null ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Clock className="h-5 w-5 animate-pulse" /></div>
          ) : todayJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No jobs scheduled for today.</div>
          ) : todayJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 rounded-xl border border-border p-3 sm:p-4">
              <span className="shrink-0 text-xs font-semibold text-primary sm:text-sm">{new Date(job.booking_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.service_type}</p>
                <p className="truncate text-xs text-muted-foreground">{job.address ?? "Address pending"}</p>
              </div>
              <Badge className={`rounded-full ${provStatusStyle[job.status]}`}>{job.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function EarningsPanel() {
  const bookings = useProviderBookings();
  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const total = completed
        .filter((b) => {
          const date = new Date(b.booking_date);
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        })
        .reduce((sum, b) => sum + (b.price ?? 0), 0);
      return { d: d.toLocaleDateString([], { month: "short" }), v: Math.round(total / 1000), raw: total };
    });
  }, [completed]);
  const thisMonth = monthly.at(-1)?.raw ?? 0;
  const lifetime = completed.reduce((sum, b) => sum + (b.price ?? 0), 0);
  return (
    <>
      <SectionHeader title="Earnings" subtitle="Track completed-job earnings from live bookings." action={<Button className="gap-2"><ArrowDownToLine className="h-4 w-4" /> Withdraw</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "This month", v: `PKR ${thisMonth.toLocaleString()}`, c: "bg-primary-soft text-primary" },
          { l: "Completed jobs", v: `${completed.length}`, c: "bg-amber-50 text-amber-600" },
          { l: "Lifetime", v: `PKR ${lifetime.toLocaleString()}`, c: "bg-success-soft text-success" },
        ].map((s) => (
          <Card key={s.l} className="rounded-2xl border-border bg-card p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="mt-1 text-2xl font-bold">{s.v}</p>
            <div className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs ${s.c}`}>Live</div>
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
        <h2 className="text-lg font-bold">Recent completed jobs</h2>
        <div className="mt-4 space-y-2">
          {bookings === null ? (
            <div className="flex justify-center py-8 text-muted-foreground"><Clock className="h-5 w-5 animate-pulse" /></div>
          ) : completed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Completed jobs will appear here.</div>
          ) : completed.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.service_type}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.booking_date).toLocaleDateString()} · {p.address ?? "No address"}</p>
              </div>
              <p className="shrink-0 font-semibold">PKR {p.price.toLocaleString()}</p>
              <Badge className="rounded-full bg-success-soft text-success hover:bg-success-soft">Completed</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function MessagesPanel({ focusConversationId, focusToken }: { focusConversationId?: string; focusToken?: number }) {
  return (
    <>
      <SectionHeader title="Messages" subtitle="Chat with your customers in real time." />
      <ChatInbox role="provider" focusConversationId={focusConversationId} focusToken={focusToken} />
    </>
  );
}


function SettingsPanel() {
  const { user, refresh } = useAuth();
  const provider = user?.role === "provider" ? user : null;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name ?? "",
    profession: provider?.profession ?? "",
    area: provider?.area ?? "",
  });

  useEffect(() => {
    setForm({
      name: provider?.name ?? "",
      profession: provider?.profession ?? "",
      area: provider?.area ?? "",
    });
  }, [provider?.name, provider?.profession, provider?.area]);

  const save = async () => {
    if (!provider) return;
    if (!form.name.trim() || !form.profession.trim() || !form.area.trim()) {
      toast.error("Please complete your display name, trade, and service area.");
      return;
    }
    setSaving(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("providers").update({
      name: form.name.trim(),
      profession: form.profession.trim(),
      area: form.area.trim(),
    }).eq("id", provider.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Provider settings saved");
    await refresh();
  };

  return (
    <>
      <SectionHeader title="Settings" subtitle="Profile, services and notification preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><User className="h-4 w-4" /> Pro profile</h2>
          <div className="mt-4 space-y-3">
            <div><label className="text-xs text-muted-foreground">Display name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Trade</label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Service area</label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="mt-1 rounded-xl" /></div>
            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Save changes"}</Button>
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
