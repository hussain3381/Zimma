import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, MapPin, Loader2, ShieldCheck, Star, Users, Award, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ProviderCard } from "@/components/zimma/cards";
import { categories } from "@/components/zimma/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { ProviderRow } from "@/components/zimma/auth-context";
import { rowToProvider } from "@/components/zimma/provider-mapping";
import providersHero from "@/assets/providers-hero.jpg";

export const Route = createFileRoute("/providers/")({
  head: () => ({
    meta: [
      { title: "Browse Pros — Zimma" },
      { name: "description", content: "Discover top-rated, verified home service providers in Karachi." },
    ],
  }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"rating" | "jobs" | "exp">("rating");
  const [rows, setRows] = useState<ProviderRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("providers").select("*").eq("status", "approved");
      if (mounted) setRows((data ?? []) as ProviderRow[]);
    };
    load();
    const ch = supabase
      .channel("providers-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "providers" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const list = (rows ?? [])
    .filter((p) =>
      [p.name, p.profession, p.area, ...(p.skills ?? [])].join(" ").toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "rating") return Number(b.rating) - Number(a.rating);
      if (sort === "jobs") return b.total_jobs - a.total_jobs;
      return b.experience - a.experience;
    })
    .map(rowToProvider);

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* HERO */}
      <header className="relative overflow-hidden bg-slate-950">
        <img
          src={providersHero}
          alt="Verified Zimma professional in a modern home"
          width={1600}
          height={1008}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-80"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40" />
        <div className="pointer-events-none absolute -right-24 top-1/4 hidden h-96 w-96 rounded-full bg-success/25 blur-[120px] md:block" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <Badge className="mb-4 w-fit gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-primary hover:bg-primary-soft">
            <ShieldCheck className="h-3.5 w-3.5" /> 100% background-checked
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Meet Karachi's <span className="bg-gradient-to-r from-sky-300 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">most trusted</span> pros.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            CNIC-verified, reference-checked and rated by real Karachi customers — from DHA to North Nazimabad.
          </p>

          <div className="mt-8 grid max-w-3xl gap-3 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-glow backdrop-blur-xl sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, skill or area…"
                className="border-0 bg-transparent pl-9 text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input defaultValue="Karachi" className="border-0 bg-transparent pl-9 text-foreground shadow-none focus-visible:ring-0" />
            </div>
            <Button className="gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
          </div>

          {/* Trust stats */}
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { icon: Users, v: rows === null ? "…" : `${rows.length}+`, l: "Verified pros" },
              { icon: Star, v: "4.9", l: "Avg. rating" },
              { icon: Award, v: "100%", l: "Background-checked" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-xl font-bold text-white">{s.v}</p>
                <p className="text-[11px] text-slate-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{rows === null ? "…" : list.length}</span> pros available now
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {(["rating", "jobs", "exp"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {s === "rating" ? "Top rated" : s === "jobs" ? "Most jobs" : "Experience"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.slice(0, 8).map((c) => (
            <button
              key={c.slug}
              onClick={() => setQ(c.name)}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              {c.name}
            </button>
          ))}
        </div>

        {rows === null ? (
          <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
            <h3 className="text-lg font-semibold">No approved pros yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once the Super Admin approves new registrations, they'll appear here in real time.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* Become a pro CTA */}
      <section className="mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">For pros</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Are you skilled? Get on the list.</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">Join Karachi's fastest-growing services marketplace. We handle discovery, bookings, and payments — you focus on great work.</p>
          </div>
          <div className="flex items-stretch md:items-center md:justify-end">
            <Link to="/auth" className="w-full md:w-auto">
              <Button size="lg" className="w-full shadow-glow btn-glow md:w-auto">Apply as a Pro <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
