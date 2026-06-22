import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Calendar, Briefcase, Wallet, MessageSquare, Settings, Star, TrendingUp,
  Clock, CheckCircle2, Search, Send, ArrowDownToLine, User, Lock, IdCard, BadgeCheck, Pencil, Save, X, MapPin, Phone, Mail,
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

export const Route = createFileRoute("/dashboard/provider")({
  head: () => ({ meta: [{ title: "Provider Dashboard — Zimma" }] }),
  component: ProviderDashboardWrapper,
});

function ProviderDashboardWrapper() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && (!user || user.role !== "provider")) {
      navigate({ to: "/auth", search: { role: "provider" } as never });
    }
  }, [ready, user, navigate]);
  if (!ready || !user || user.role !== "provider") return <DashboardSkeleton />;
  return <ProviderDashboard />;
}

const earnings = [
  { d: "Mon", v: 3200 }, { d: "Tue", v: 4800 }, { d: "Wed", v: 2900 },
  { d: "Thu", v: 6100 }, { d: "Fri", v: 5400 }, { d: "Sat", v: 7800 }, { d: "Sun", v: 4200 },
];

const activeJobs = [
  { service: "Wiring Inspection", customer: "Mr. Hassan", area: "DHA Phase 5", time: "Today, 4:00 PM", status: "In Progress", price: "PKR 1,800" },
  { service: "MCB Replacement", customer: "Mrs. Sana", area: "Clifton", time: "Today, 6:30 PM", status: "Confirmed", price: "PKR 2,400" },
  { service: "Inverter Setup", customer: "Mr. Bilal", area: "Gulshan", time: "Tomorrow, 10:00 AM", status: "Confirmed", price: "PKR 4,500" },
];

function ProviderDashboard() {
  const [tab, setTab] = useState("Overview");
  const { user } = useAuth();
  const displayName = user?.role === "provider" ? user.name : "Asif Mehmood";
  const nav = [
    { label: "Overview", icon: Home },
    { label: "Pro Profile", icon: BadgeCheck },
    { label: "Jobs", icon: Briefcase },
    { label: "Calendar", icon: Calendar },
    { label: "Earnings", icon: Wallet },
    { label: "Messages", icon: MessageSquare },
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
      {tab === "Settings" && <SettingsPanel />}
    </DashboardLayout>
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
  const { user, updateUser } = useAuth();
  const provider = user?.role === "provider" ? user : null;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name ?? "Asif Mehmood",
    email: provider?.email ?? "[email protected]",
    profession: provider?.profession ?? "Electrician",
    cnic: provider?.cnic ?? "42101-1234567-1",
    phone: "+92 300 1234567",
    area: "DHA, Clifton, Gulshan",
    experience: "8",
    bio: "Master electrician with 8+ years of experience across residential and commercial wiring, MCB installations, and inverter setups.",
  });

  const save = () => {
    if (provider) {
      updateUser({ name: form.name, email: form.email, profession: form.profession, cnic: form.cnic } as never);
    }
    setEditing(false);
  };


  return (
    <>
      <SectionHeader
        title="Pro Profile"
        subtitle="Your verified Zimma Pro details — visible to customers."
        action={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="gap-1"><X className="h-4 w-4" /> Cancel</Button>
              <Button size="sm" onClick={save} className="gap-1"><Save className="h-4 w-4" /> Save</Button>
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
              <h2 className="text-2xl font-bold sm:text-3xl">{form.name}</h2>
              {(provider?.verified ?? true) && (
                <Badge className="gap-1 rounded-full bg-success/30 text-white hover:bg-success/30"><BadgeCheck className="h-3.5 w-3.5" /> Verified Pro</Badge>
              )}
            </div>
            <p className="mt-1 text-sm opacity-90">{form.profession} · {form.experience} yrs experience</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs opacity-90">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" /> 4.9 (213 reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {form.area}</span>
            </div>
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
              <ProField editing={editing} label="Email" icon={Mail} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="sm:col-span-2">
              <ProField editing={editing} label="CNIC Number (verified)" icon={IdCard} value={form.cnic} onChange={(v) => setForm({ ...form, cnic: v })} disabled />
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
            <div className="sm:col-span-2">
              <ProField editing={editing} label="Service area" icon={MapPin} value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">About</label>
              {editing ? (
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
              ) : (
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">{form.bio}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-lg font-bold"><BadgeCheck className="h-4 w-4 text-success" /> Verification Status</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { l: "CNIC Verified", s: form.cnic, ok: true },
              { l: "Background Check", s: "Cleared on 12 Jun 2026", ok: true },
              { l: "Profile Approved", s: "Active Zimma Pro", ok: provider?.verified ?? true },
            ].map((v) => (
              <div key={v.l} className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft/40 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success text-white">
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

function JobRow({ j }: { j: typeof activeJobs[number] }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-3 sm:gap-4 sm:p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">{j.service}</p>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{j.customer} · {j.area}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {j.time}</span>
          <Badge className={`rounded-full ${j.status === "In Progress" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-primary-soft text-primary hover:bg-primary-soft"}`}>{j.status}</Badge>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0 sm:text-right">
        <p className="font-semibold">{j.price}</p>
        <Button size="sm" className="sm:mt-2">Open</Button>
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-5 text-primary-foreground shadow-glow sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 sm:text-xs">Total earnings · this month</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
                PKR <CountUp to={184200} />
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge className="gap-1 rounded-full bg-success/30 text-white hover:bg-success/30"><TrendingUp className="h-3 w-3" /> +18.2%</Badge>
                <span className="opacity-80">vs last month</span>
              </div>
            </div>
            <Button variant="secondary" size="sm">Withdraw</Button>
          </div>
          <div className="mt-6 h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earnings}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ background: "#1E293B", border: "none", borderRadius: 12, color: "#fff" }} />
                <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { icon: Briefcase, l: "Active jobs", v: 6, c: "bg-primary-soft text-primary" },
            { icon: CheckCircle2, l: "Completed (mo)", v: 42, c: "bg-success-soft text-success" },
            { icon: Star, l: "Avg. rating", v: 4.9, decimals: 1, c: "bg-amber-50 text-amber-600" },
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
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="mt-4 space-y-3">{activeJobs.map((j) => <JobRow key={j.service} j={j} />)}</div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold">Performance</h2>
          <div className="mt-4 space-y-4">
            {[
              { l: "Response time", v: "92%", w: 92 },
              { l: "Acceptance rate", v: "88%", w: 88 },
              { l: "On-time arrival", v: "96%", w: 96 },
              { l: "Job completion", v: "99%", w: 99 },
            ].map((p) => (
              <div key={p.l}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.l}</span>
                  <span className="font-semibold">{p.v}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${p.w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function JobsPanel() {
  return (
    <>
      <SectionHeader title="Jobs" subtitle="Manage every booking on your plate." />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap gap-2">
          {["All", "In Progress", "Confirmed", "Completed"].map((f, i) => (
            <button key={f} className={`rounded-full px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {[...activeJobs, ...activeJobs].map((j, i) => <JobRow key={i} j={j} />)}
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
  const chats = [
    { n: "Mr. Hassan", m: "Aap kitne baje aa rahe hain?", t: "2m", u: 2 },
    { n: "Mrs. Sana", m: "Shukriya, kal milte hain.", t: "1h", u: 0 },
    { n: "Mr. Bilal", m: "Inverter setup confirm?", t: "Yest", u: 1 },
  ];
  return (
    <>
      <SectionHeader title="Messages" subtitle="Stay in touch with your customers." />
      <Card className="rounded-2xl border-border bg-card p-0 shadow-soft">
        <div className="grid lg:grid-cols-[300px_1fr]">
          <div className="border-b border-border p-3 lg:border-b-0 lg:border-r">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats…" className="rounded-xl pl-9" />
            </div>
            <div className="space-y-1">
              {chats.map((c, i) => (
                <button key={c.n} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${i === 0 ? "bg-primary-soft" : "hover:bg-accent"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                    {c.n.split(" ").map((x) => x[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.n}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{c.t}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.m}</p>
                  </div>
                  {c.u > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{c.u}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-[480px] flex-col">
            <div className="border-b border-border p-4">
              <p className="font-semibold">Mr. Hassan</p>
              <p className="text-xs text-success">● Online</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {[
                { me: false, t: "Salam, kal ki booking confirm hai?" },
                { me: true, t: "Walaikum salam! Ji bilkul, 4 PM tak pohnch jaunga." },
                { me: false, t: "Aap kitne baje aa rahe hain?" },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.t}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input placeholder="Type a message…" className="rounded-xl" />
              <Button size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </Card>
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
