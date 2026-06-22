import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Calendar, Heart, History, Bell, Settings, Plus, MapPin, Star,
  MoreHorizontal, CheckCircle2, CreditCard, User, Lock, Trash2, Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/zimma/DashboardLayout";
import { providers } from "@/components/zimma/data";
import { CountUp, Reveal } from "@/components/zimma/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/zimma/auth-context";
import { DashboardSkeleton } from "@/components/zimma/loaders";

export const Route = createFileRoute("/dashboard/customer")({
  head: () => ({ meta: [{ title: "My Dashboard — Zimma" }] }),
  component: CustomerDashboardWrapper,
});

function CustomerDashboardWrapper() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && (!user || user.role !== "customer")) {
      navigate({ to: "/auth" });
    }
  }, [ready, user, navigate]);
  if (!ready || !user || user.role !== "customer") return <DashboardSkeleton />;
  return <CustomerDashboard />;
}

const upcoming = [
  { service: "AC Service & Gas Refill", pro: providers[3], date: "Tomorrow, 11:00 AM", status: "Confirmed", price: "PKR 1,200" },
  { service: "Deep Home Cleaning", pro: providers[2], date: "Sat, 26 Jun · 9:00 AM", status: "Confirmed", price: "PKR 4,500" },
];
const history = [
  { service: "Geyser Installation", pro: providers[1], date: "12 Jun 2026", status: "Completed", price: "PKR 2,800", rated: 5 },
  { service: "Wiring Repair", pro: providers[0], date: "01 Jun 2026", status: "Completed", price: "PKR 1,600", rated: 5 },
  { service: "Wardrobe Fix", pro: providers[5], date: "20 May 2026", status: "Completed", price: "PKR 2,100", rated: 4 },
];

function CustomerDashboard() {
  const [tab, setTab] = useState("Overview");
  const { user } = useAuth();
  const displayName = user?.role === "customer" ? user.name : "Ayesha Tariq";
  const nav = [
    { label: "Overview", icon: Home },
    { label: "Bookings", icon: Calendar },
    { label: "Favourites", icon: Heart },
    { label: "History", icon: History },
    { label: "Notifications", icon: Bell },
    { label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout role="Customer" name={displayName} nav={nav} activeLabel={tab} onSelect={setTab}>

      {tab === "Overview" && <OverviewPanel />}
      {tab === "Bookings" && <BookingsPanel />}
      {tab === "Favourites" && <FavouritesPanel />}
      {tab === "History" && <HistoryPanel />}
      {tab === "Notifications" && <NotificationsPanel />}
      {tab === "Settings" && <SettingsPanel />}
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

function BookingRow({ b, action = "Details" }: { b: typeof upcoming[number] & { rated?: number }; action?: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-3 transition hover:border-primary/40 hover:bg-primary-soft/40 sm:gap-4 sm:p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <img src={b.pro.avatar} alt="" className="h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">{b.service}</p>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{b.pro.name} · {b.pro.trade}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {b.date}</span>
          <Badge className="rounded-full bg-success-soft text-success hover:bg-success-soft">{b.status}</Badge>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0 sm:text-right">
        <p className="font-semibold">{b.price}</p>
        <Button size="sm" variant="outline" className="sm:mt-2">{action}</Button>
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <>
      <section className="rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-5 text-primary-foreground shadow-glow sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 sm:text-xs">Welcome back</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-4xl">Hi Ayesha 👋</h1>
            <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">You have 2 upcoming bookings this week. Need something else done?</p>
          </div>
          <Link to="/book" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full gap-2 btn-glow sm:w-auto">
              <Plus className="h-4 w-4" /> Book a Service
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
          {[
            { v: <CountUp to={12} />, l: "Total bookings" },
            { v: <CountUp to={8} />, l: "Pros hired" },
            { v: <CountUp to={24} prefix="PKR " suffix="K" />, l: "Spent this year" },
            { v: <CountUp to={4.9} decimals={1} suffix="★" />, l: "Avg. rating given" },
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Upcoming bookings</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="mt-4 space-y-3">{upcoming.map((b) => <BookingRow key={b.service} b={b} />)}</div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Favourite pros</h2>
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div className="mt-4 space-y-3">
            {providers.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.avatar} alt="" className="h-10 w-10 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.trade}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 grid gap-6 rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">Saved addresses</h2>
          <p className="mt-1 text-sm text-muted-foreground">We dispatch the nearest pro from these locations.</p>
        </div>
        <div className="space-y-3">
          {[
            { l: "Home", a: "House 24, Khayaban-e-Shahbaz, DHA Phase 6" },
            { l: "Office", a: "Plot 12, II Chundrigar Road, Karachi" },
          ].map((a) => (
            <div key={a.l} className="flex items-start gap-3 rounded-xl border border-border p-4">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.l}</p>
                <p className="text-xs text-muted-foreground">{a.a}</p>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function BookingsPanel() {
  return (
    <>
      <SectionHeader
        title="My bookings"
        subtitle="Manage upcoming jobs and reschedule when you need."
        action={<Link to="/book"><Button className="gap-2"><Plus className="h-4 w-4" /> New booking</Button></Link>}
      />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap gap-2">
          {["All", "Confirmed", "In Progress", "Cancelled"].map((f, i) => (
            <button key={f} className={`rounded-full px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
        <div className="mt-5 space-y-3">{upcoming.map((b) => <BookingRow key={b.service} b={b} action="Manage" />)}</div>
      </Card>
    </>
  );
}

function FavouritesPanel() {
  return (
    <>
      <SectionHeader title="Favourite pros" subtitle="Quick access to the people you trust most." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
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
              <Heart className="h-5 w-5 fill-destructive text-destructive" />
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/providers/$id" params={{ id: p.id }} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Profile</Button>
              </Link>
              <Link to="/book" className="flex-1">
                <Button size="sm" className="w-full">Book</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function HistoryPanel() {
  return (
    <>
      <SectionHeader title="Booking history" subtitle="Every job you've completed with Zimma." action={<Button variant="outline" size="sm">Export CSV</Button>} />
      <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search history…" className="rounded-xl pl-9" />
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium">Pro</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.service} className="border-b border-border/60 last:border-0">
                  <td className="py-4 font-medium">{h.service}</td>
                  <td className="py-4 text-muted-foreground">{h.pro.name}</td>
                  <td className="py-4 text-muted-foreground">{h.date}</td>
                  <td className="py-4 font-semibold">{h.price}</td>
                  <td className="py-4">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: h.rated }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />)}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {history.map((h) => (
            <div key={h.service} className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{h.service}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.pro.name} · {h.date}</p>
                </div>
                <p className="shrink-0 font-semibold">{h.price}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: h.rated }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />)}
                </div>
                <Button variant="ghost" size="sm">Rebook</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function NotificationsPanel() {
  const items = [
    { i: CheckCircle2, t: "Booking confirmed", s: "Asif (Electrician) arriving tomorrow at 4 PM", time: "2m ago", c: "bg-success-soft text-success" },
    { i: Star, t: "New review received", s: "Rate your AC service with Imran Qureshi", time: "1h ago", c: "bg-amber-50 text-amber-600" },
    { i: CreditCard, t: "Payment processed", s: "PKR 4,500 charged for Deep Home Cleaning", time: "Yesterday", c: "bg-primary-soft text-primary" },
    { i: Bell, t: "Reminder", s: "Geyser annual maintenance is due next week", time: "2 days ago", c: "bg-muted text-muted-foreground" },
  ];
  return (
    <>
      <SectionHeader title="Notifications" subtitle="Stay updated on every booking, payment and reminder." action={<Button variant="outline" size="sm">Mark all read</Button>} />
      <Card className="rounded-2xl border-border bg-card p-2 shadow-soft sm:p-3">
        {items.map((n) => (
          <div key={n.t} className="flex gap-3 rounded-xl p-3 transition hover:bg-accent sm:p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.c}`}><n.i className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{n.t}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.s}</p>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

function SettingsPanel() {
  return (
    <>
      <SectionHeader title="Settings" subtitle="Manage your profile, security and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><User className="h-4 w-4" /> Profile</h2>
          <div className="mt-4 space-y-3">
            <div><label className="text-xs text-muted-foreground">Full name</label><Input defaultValue="Ayesha Tariq" className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Email</label><Input defaultValue="[email protected]" className="mt-1 rounded-xl" /></div>
            <div><label className="text-xs text-muted-foreground">Phone</label><Input defaultValue="+92 300 1234567" className="mt-1 rounded-xl" /></div>
            <Button className="w-full sm:w-auto">Save changes</Button>
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
