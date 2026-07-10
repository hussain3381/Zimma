import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Calendar, Clock, MapPin,
  ShieldCheck, Sparkles, Star, CheckCircle2, Wallet, Home, Loader2,
} from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { categories } from "@/components/zimma/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/zimma/animations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/zimma/auth-context";
import type { ProviderRow } from "@/components/zimma/auth-context";
import { rowToProvider } from "@/components/zimma/provider-mapping";
import { toast } from "sonner";

type BookSearch = { providerId?: string };

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>): BookSearch => ({
    providerId: typeof s.providerId === "string" ? s.providerId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a Service — Zimma" },
      { name: "description", content: "Book a verified household service professional in Karachi in 6 simple steps." },
    ],
  }),
  component: BookingFlow,
});

const STEPS = ["Service", "Provider", "Date", "Time", "Address", "Confirm"] as const;
const TIMES = ["09:00 AM", "10:30 AM", "12:00 PM", "01:30 PM", "03:00 PM", "04:30 PM", "06:00 PM"];

function toIsoDateTime(dateLabel: string, timeLabel: string, dates: { iso: string; weekday: string; date: string }[]): string {
  const match = dates.find((d) => `${d.weekday}, ${d.date}` === dateLabel);
  const iso = match?.iso ?? new Date().toISOString().slice(0, 10);
  // parse "01:30 PM"
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(timeLabel);
  let h = m ? parseInt(m[1], 10) : 9;
  const min = m ? parseInt(m[2], 10) : 0;
  const pm = m && /pm/i.test(m[3]);
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  const local = new Date(`${iso}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`);
  return local.toISOString();
}

function BookingFlow() {
  const navigate = useNavigate();
  const { providerId: initialProviderId } = Route.useSearch();
  const { authUser } = useAuth();

  const [step, setStep] = useState(initialProviderId ? 0 : 0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [providers, setProviders] = useState<ProviderRow[] | null>(null);
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(initialProviderId ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [address, setAddress] = useState({ label: "Home", line: "", area: "DHA Phase 6", notes: "" });

  // Load approved providers live
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("providers").select("*").eq("status", "approved");
      if (mounted) setProviders((data ?? []) as ProviderRow[]);
    })();
    return () => { mounted = false; };
  }, []);

  const providerRow = providers?.find((p) => p.id === providerId) ?? null;

  // When a providerId is prefilled, auto-select matching service category if we can.
  useEffect(() => {
    if (!providerRow || serviceSlug) return;
    const cat = categories.find((c) => c.name.toLowerCase() === providerRow.profession.toLowerCase());
    if (cat) setServiceSlug(cat.slug);
    else setServiceSlug(categories[0]?.slug ?? null);
  }, [providerRow, serviceSlug]);

  const service = categories.find((c) => c.slug === serviceSlug);
  const provider = providerRow ? rowToProvider(providerRow) : null;

  const dates = useMemo(() => {
    const out: { iso: string; day: string; date: string; weekday: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push({
        iso: d.toISOString().slice(0, 10),
        day: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en", { weekday: "short" }),
        date: d.toLocaleDateString("en", { day: "2-digit", month: "short" }),
        weekday: d.toLocaleDateString("en", { weekday: "long" }),
      });
    }
    return out;
  }, []);

  const canNext = [
    !!serviceSlug,
    !!providerId,
    !!date,
    !!time,
    address.line.length > 3,
    true,
  ][step];

  async function submitBooking() {
    if (!authUser) {
      toast.error("Please sign in to confirm your booking.");
      navigate({ to: "/auth" });
      return;
    }
    if (!providerRow || !date || !time || !service) return;
    setSubmitting(true);
    const bookingDateIso = toIsoDateTime(date, time, dates);
    const fullAddress = `${address.label} — ${address.line}, ${address.area}${address.notes ? ` (${address.notes})` : ""}`;
    const { error } = await supabase.from("bookings").insert({
      customer_id: authUser.id,
      provider_id: providerRow.id,
      service_type: providerRow.profession,
      booking_date: bookingDateIso,
      address: fullAddress,
      notes: address.notes || null,
      price: providerRow.hourly_rate,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking confirmed!");
    setDone(true);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else submitBooking();
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success-soft text-success animate-fade-in-soft">
            <span className="absolute inset-0 rounded-full animate-pulse-ring" />
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="animate-fade-up text-3xl font-bold sm:text-4xl">Booking confirmed!</h1>
          <p className="mt-3 animate-fade-up text-muted-foreground" style={{ animationDelay: "120ms" }}>
            Your <strong>{service?.name}</strong> with <strong>{provider?.name}</strong> is scheduled for {date} at {time}.
          </p>

          <Card className="mt-8 animate-fade-up rounded-2xl border-border bg-card p-6 text-left shadow-card" style={{ animationDelay: "240ms" }}>
            <div className="flex items-center gap-4">
              {provider && <img src={provider.avatar} alt="" className="h-14 w-14 rounded-xl ring-2 ring-primary/10" />}
              <div className="flex-1">
                <p className="font-semibold">{provider?.name}</p>
                <p className="text-sm text-muted-foreground">{provider?.trade} · {provider?.area}</p>
              </div>
              <Badge className="rounded-full bg-success-soft text-success hover:bg-success-soft">Pending</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={Calendar} k="Date" v={date ?? ""} />
              <InfoRow icon={Clock} k="Time" v={time ?? ""} />
              <InfoRow icon={MapPin} k="Address" v={`${address.line}, ${address.area}`} />
              <InfoRow icon={Wallet} k="Estimate" v={provider?.price ?? ""} />
            </div>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard/customer"><Button size="lg" className="shadow-glow btn-glow">Go to Dashboard</Button></Link>
            <Link to="/"><Button variant="outline" size="lg">Back home</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Book a service</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {STEPS[step] === "Confirm" ? "Review & confirm" : `Step ${step + 1}: ${STEPS[step]}`}
          </h1>
        </Reveal>

        {/* Stepper */}
        <div className="mt-8 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 sm:gap-3">
            {STEPS.map((s, i) => {
              const active = i === step;
              const complete = i < step;
              return (
                <li key={s} className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : complete
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      active ? "bg-white/20" : complete ? "bg-success text-white" : "bg-background"
                    }`}>
                      {complete ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {s}
                  </button>
                  {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-10" />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Card key={step} className="animate-fade-up rounded-3xl border-border bg-card p-6 shadow-soft sm:p-8">
            {step === 0 && (
              <>
                <h2 className="text-lg font-bold">What do you need help with?</h2>
                <p className="text-sm text-muted-foreground">Pick the service category — we'll match you with the best pros in your area.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {categories.map((c) => {
                    const selected = serviceSlug === c.slug;
                    return (
                      <button
                        key={c.slug}
                        onClick={() => setServiceSlug(c.slug)}
                        className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition hover-lift ${
                          selected ? "border-primary bg-primary-soft shadow-glow" : "border-border bg-card"
                        }`}
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                          <c.icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.count} pros</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-bold">Choose a professional</h2>
                <p className="text-sm text-muted-foreground">Verified pros currently live on Zimma.</p>
                {providers === null ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : providers.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">No approved pros available yet.</p>
                ) : (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {providers.map((row) => {
                      const p = rowToProvider(row);
                      const selected = providerId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setProviderId(p.id)}
                          className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition hover-lift ${
                            selected ? "border-primary bg-primary-soft shadow-glow" : "border-border bg-card"
                          }`}
                        >
                          <img src={p.avatar} alt="" className="h-14 w-14 rounded-xl ring-2 ring-primary/10" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{p.trade} · {p.area}</p>
                            <div className="mt-1.5 flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 font-semibold text-amber-500">
                                <Star className="h-3 w-3 fill-amber-400" /> {p.rating}
                              </span>
                              <span className="text-muted-foreground">· {p.jobs} jobs</span>
                              <span className="ml-auto font-semibold text-foreground">{p.price}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-bold">Pick a date</h2>
                <p className="text-sm text-muted-foreground">Choose when you'd like the pro to arrive.</p>
                <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {dates.map((d) => {
                    const selected = date === d.weekday + ", " + d.date;
                    return (
                      <button
                        key={d.iso}
                        onClick={() => setDate(`${d.weekday}, ${d.date}`)}
                        className={`rounded-2xl border p-4 text-center transition hover-lift ${
                          selected ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{d.day}</p>
                        <p className="mt-1 text-lg font-bold">{d.date}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-bold">Choose a time slot</h2>
                <p className="text-sm text-muted-foreground">All times are PKT — your pro arrives within a 30-minute window.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TIMES.map((t) => {
                    const selected = time === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-2xl border p-3 text-sm font-semibold transition hover-lift ${
                          selected ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-bold">Where should we send your pro?</h2>
                <p className="text-sm text-muted-foreground">Provide a complete address so the pro can reach you on time.</p>
                <div className="mt-6 grid gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(["Home", "Office", "Other"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setAddress({ ...address, label: l })}
                        className={`rounded-xl border p-3 text-sm font-medium transition ${
                          address.label === l ? "border-primary bg-primary-soft text-primary" : "border-border"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Street address</label>
                    <Input
                      placeholder="House #, street, building…"
                      value={address.line}
                      onChange={(e) => setAddress({ ...address, line: e.target.value })}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Area</label>
                    <select
                      value={address.area}
                      onChange={(e) => setAddress({ ...address, area: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    >
                      {["DHA Phase 6", "DHA Phase 5", "Clifton", "Gulshan-e-Iqbal", "PECHS", "North Nazimabad", "Bahadurabad", "Bahria Town", "Korangi"].map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes (optional)</label>
                    <Textarea
                      placeholder="Gate code, landmark, parking…"
                      value={address.notes}
                      onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-lg font-bold">Review your booking</h2>
                <p className="text-sm text-muted-foreground">Make sure everything looks right before confirming.</p>

                <div className="mt-6 space-y-3 rounded-2xl border border-border bg-muted/40 p-5">
                  <Row k="Service" v={service?.name ?? "—"} />
                  <Row k="Provider" v={provider?.name ?? "—"} sub={provider?.trade} />
                  <Row k="When" v={`${date ?? ""} · ${time ?? ""}`} />
                  <Row k="Address" v={`${address.label} — ${address.line}, ${address.area}`} />
                  <Row k="Estimate" v={provider?.price ?? "—"} bold />
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm text-success">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <p>Free cancellation up to 1 hour before. You'll only be charged after the job is completed.</p>
                </div>
              </>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                variant="ghost"
                onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={!canNext || submitting}
                size="lg"
                className="ml-auto gap-2 shadow-glow btn-glow"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === STEPS.length - 1 ? (submitting ? "Submitting…" : "Confirm booking") : "Continue"}
                {step !== STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </Card>

          <aside className="space-y-4">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your booking</p>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow icon={Sparkles} k="Service" v={service?.name ?? "Not selected"} />
                <SummaryRow icon={ShieldCheck} k="Pro" v={provider?.name ?? "Not selected"} />
                <SummaryRow icon={Calendar} k="Date" v={date ?? "—"} />
                <SummaryRow icon={Clock} k="Time" v={time ?? "—"} />
                <SummaryRow icon={Home} k="Address" v={address.line ? `${address.line}, ${address.area}` : "—"} />
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimate</span>
                  <span className="text-lg font-bold">{provider?.price ?? "—"}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Final price confirmed after inspection.</p>
              </div>
            </Card>

            <Card className="rounded-3xl border-border bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-6 text-primary-foreground shadow-glow">
              <ShieldCheck className="h-6 w-6" />
              <p className="mt-3 text-sm font-semibold">100% Zimma Guarantee</p>
              <p className="mt-1 text-xs opacity-90">If anything goes wrong, we re-do the job — free of charge.</p>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ k, v, sub, bold }: { k: string; v: string; sub?: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={`text-right ${bold ? "text-lg font-bold" : "font-semibold"}`}>
        {v}
        {sub && <span className="block text-xs font-normal text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

function SummaryRow({ icon: Icon, k, v }: { icon: typeof Sparkles; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{k}</p>
        <p className="truncate text-sm font-semibold">{v}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, k, v }: { icon: typeof Sparkles; k: string; v: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{k}</p>
        <p className="text-sm font-semibold">{v}</p>
      </div>
    </div>
  );
}
