import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Lock, Mail, AlertTriangle, Sparkles, LogOut, Settings, KeyRound,
  Users, Wrench, Activity, ArrowRight, CheckCircle2, ShieldAlert,
  Check, X as XIcon, Loader2, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAdmin } from "@/components/zimma/admin-context";
import { adminListProviders, adminSetProviderStatus, adminGetStats } from "@/lib/admin.client";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/zimma/Logo";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Super Admin Terminal — Zimma" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  const { ready, authed } = useAdmin();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A2540]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00D4B2] border-t-transparent" />
      </div>
    );
  }
  return authed ? <AdminDashboard /> : <AdminGate />;
}

/* ---------------- Gatekeeper ---------------- */
function AdminGate() {
  const { login } = useAdmin();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !pwd) return setError("Enter administrator email and password.");
    setBusy(true);
    setTimeout(() => {
      const ok = login(email, pwd);
      setBusy(false);
      if (!ok) setError("Access Denied: Invalid Administrative Credentials.");
      else toast.success("Authenticated. Welcome to the Super Admin Terminal.");
    }, 450);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A2540] text-white">
      {/* background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#00D4B2 1px,transparent 1px),linear-gradient(90deg,#00D4B2 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }} />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-120 w-120-translate-x-1/2 rounded-full bg-[#00D4B2]/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D4B2] text-[#0A2540]">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Zimma</span>
          <span className="ml-2 rounded-md border border-[#00D4B2]/40 bg-[#00D4B2]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#00D4B2]">
            Admin
          </span>
        </Link>
        <Link to="/" className="text-xs text-white/60 hover:text-white">← Exit terminal</Link>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-2xl border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D4B2]/15 text-[#00D4B2] ring-1 ring-[#00D4B2]/40">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Admin Authentication Portal</h1>
              <p className="text-xs text-white/60">Restricted access — credentials required.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <DarkField icon={Mail} label="Admin email" value={email} onChange={setEmail} type="email" placeholder="[email protected]" />
            <DarkField icon={Lock} label="Password" value={pwd} onChange={setPwd} type="password" placeholder="••••••••" />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full gap-2 bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90"
            >
              {busy ? "Verifying credentials…" : (<>Unlock Terminal <ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/60">
            <p className="font-semibold text-white/80">Demo credentials</p>
            <p className="mt-1">Email: <span className="text-[#00D4B2]">[email protected]</span></p>
            <p>Password: <span className="text-[#00D4B2]">admin123</span></p>
          </div>
        </Card>
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function AdminDashboard() {
  const { logout, password } = useAdmin();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [counts, setCounts] = useState<{ totalUsers: number; totalProviders: number; pendingProviders: number; approvedProviders: number; totalCustomers: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await adminGetStats();
        if (mounted) setCounts(s);
      } catch { /* ignore */ }
    };
    load();
    const ch = supabase
      .channel("admin-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [password]);

  const stats = [
    { label: "Total Users", value: counts ? counts.totalUsers.toLocaleString() : "…", icon: Users },
    { label: "Active Pros", value: counts ? counts.approvedProviders.toLocaleString() : "…", icon: Wrench },
    { label: "Pending Pros", value: counts ? counts.pendingProviders.toLocaleString() : "…", icon: Clock },
    { label: "Customers", value: counts ? counts.totalCustomers.toLocaleString() : "…", icon: Activity },
  ];


  return (
    <div className="min-h-screen bg-[#0A2540] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A2540]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-30  items-center justify-center rounded-xl  text-[#00D4B2]">
              <Logo className="text-base font-bold sm:text-lg " />
            </span>
            
            <span className="ml-1 rounded-md border border-[#00D4B2]/40 bg-[#00D4B2]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#00D4B2]">
              Super Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">System Settings</span>
            </Button>
            <Button
              size="sm"
              onClick={() => { logout(); toast.message("Signed out of admin terminal."); navigate({ to: "/" }); }}
              className="gap-2 bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4B2]">Terminal Online</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">System Overview</h1>
            <p className="text-sm text-white/60">Real-time operational metrics for the Zimma platform.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#00D4B2]/40 bg-[#00D4B2]/10 px-3 py-1 text-xs text-[#00D4B2]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4B2]" /> All systems operational
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="rounded-2xl border-white/10 bg-white/5 p-4 text-white backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00D4B2]/15 text-[#00D4B2]">
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#00D4B2]" />
              </div>
              <p className="mt-3 text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/60">{s.label}</p>
            </Card>
          ))}
        </div>

        <PendingApprovals />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border-white/10 bg-white/5 p-5 text-white backdrop-blur lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">Recent Activity</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "New Pro verified — Ahmed K. (Electrician)",
                "Booking #4821 completed — Clifton",
                "Payout batch processed — ₨ 1.2M",
                "Refund issued — Booking #4790",
                "New customer signup — Defence Phase 6",
              ].map((row, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00D4B2]" /> {row}</span>
                  <span className="text-xs text-white/40">just now</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="rounded-2xl border-white/10 bg-white/5 p-5 text-white backdrop-blur">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/70">
              <ShieldAlert className="h-4 w-4 text-[#00D4B2]" /> Security
            </h2>
            <p className="mt-3 text-sm text-white/70">No threats detected. Master credentials are encrypted in session memory.</p>
            <Button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 w-full gap-2 bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90"
            >
              <KeyRound className="h-4 w-4" /> Update Master Password
            </Button>
          </Card>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

/* ---------------- Pending approvals ---------------- */
type ProviderLite = {
  id: string; name: string; email: string | null; profession: string;
  phone: string | null; cnic: string | null; area: string;
  status: "pending" | "approved" | "rejected"; created_at: string;
};

function PendingApprovals() {
  const { password } = useAdmin();
  const [rows, setRows] = useState<ProviderLite[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const list = await adminListProviders("pending");
      setRows(list as ProviderLite[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load providers");
      setRows([]);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    /* eslint-disable-next-line */
  }, []);


  const act = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await adminSetProviderStatus(id, status);
      toast.success(status === "approved" ? "Provider approved — now live in marketplace." : "Provider rejected.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const approved = (rows ?? []).filter((r) => r.status === "approved");

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Provider Approvals</h2>
          <p className="text-xs text-white/60">Approve or reject new Pro applications — updates propagate live.</p>
        </div>
        <Badge className="rounded-full bg-[#00D4B2]/15 text-[#00D4B2] hover:bg-[#00D4B2]/15">
          {pending.length} pending · {approved.length} live
        </Badge>
      </div>

      <Card className="mt-4 rounded-2xl border-white/10 bg-white/5 p-4 text-white backdrop-blur">
        {rows === null ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#00D4B2]" /></div>
        ) : pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/60">
            <Clock className="mx-auto mb-2 h-5 w-5 text-white/40" /> No pending applications right now.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D4B2]/15 text-sm font-bold text-[#00D4B2]">
                  {p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name} <span className="text-white/50 font-normal">· {p.profession}</span></p>
                  <p className="truncate text-xs text-white/60">{p.email} · CNIC {p.cnic || "—"} · {p.area}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => act(p.id, "rejected")}
                    className="gap-1 border-white/20 bg-transparent text-white hover:bg-white/10">
                    <XIcon className="h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" disabled={busyId === p.id} onClick={() => act(p.id, "approved")}
                    className="gap-1 bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90">
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}


/* ---------------- Settings modal ---------------- */
function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { updatePassword } = useAdmin();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setError(""); };

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 6;
  const canSubmit = current && next && confirm && !mismatch && !tooShort;

  const submit = () => {
    setError("");
    if (!canSubmit) return;
    const ok = updatePassword(current, next);
    if (!ok) { setError("Current password is incorrect."); return; }
    toast.success("Master Password updated successfully in state memory.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="border-white/10 bg-[#0A2540] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <KeyRound className="h-5 w-5 text-[#00D4B2]" /> Update Master Password
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Change the password required to enter the Super Admin Terminal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <DarkField icon={Lock} label="Current password" value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
          <DarkField icon={KeyRound} label="New password" value={next} onChange={setNext} type="password" placeholder="At least 6 characters" />
          <DarkField icon={KeyRound} label="Confirm new password" value={confirm} onChange={setConfirm} type="password" placeholder="Re-enter new password" />

          {tooShort && <p className="text-xs text-amber-300">New password must be at least 6 characters.</p>}
          {mismatch && <p className="text-xs text-red-300">New passwords do not match.</p>}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit} className="bg-[#00D4B2] text-[#0A2540] hover:bg-[#00D4B2]/90 disabled:opacity-50">
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Field ---------------- */
function DarkField({
  icon: Icon, label, value, onChange, type = "text", placeholder,
}: {
  icon: typeof Mail; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/70">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/40 focus-visible:ring-[#00D4B2]"
        />
      </div>
    </div>
  );
}
