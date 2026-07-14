import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  Wallet,
  Star,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ServiceCard } from "@/components/zimma/cards";
import { categories } from "@/components/zimma/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import servicesHero from "@/assets/services-hero.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "All Services — Zimma" },
      {
        name: "description",
        content:
          "Browse all home service categories available on Zimma across Karachi.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = categories.filter(
    (c) =>
      (active === "all" || c.slug === active) &&
      c.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <header className="relative overflow-hidden bg-slate-950">
        <img
          src={servicesHero}
          alt="Zimma verified professionals — electrician, plumber and cleaner"
          width={1600}
          height={1008}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-80"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/20" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
        <div className="pointer-events-none absolute -left-24 top-1/3 hidden h-96 w-96 rounded-full bg-primary/30 blur-[120px] md:block" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <Badge className="mb-4 w-fit gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-primary hover:bg-primary-soft">
            <ShieldCheck className="h-3.5 w-3.5" /> 12+ verified categories
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Every home service, one{" "}
            <span className="bg-gradient-to-r from-sky-300 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              trusted marketplace
            </span>
            .
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            Background-checked electricians, plumbers, AC techs, cleaners and
            more — ready across Karachi with transparent pricing.
          </p>

          <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/15 bg-white/95 p-2 shadow-glow backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search services… (e.g. plumber, AC)"
                className="border-0 bg-transparent pl-9 text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> CNIC-verified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-success" /> Same-day slots
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-success" /> Upfront pricing
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9 ·
              2,400+ reviews
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip
            active={active === "all"}
            onClick={() => setActive("all")}
          >
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              active={active === c.slug}
              onClick={() => setActive(c.slug)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <ServiceCard key={c.slug} {...c} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              No services match your search.
            </p>
          </div>
        )}
      </section>

      {/* WHY BOOK */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: "Verified Professionals",
              d: "Every pro is CNIC-verified with references checked.",
            },
            {
              icon: Clock,
              t: "On-Time Guarantee",
              d: "Punctuality is non-negotiable — or your next visit is on us.",
            },
            {
              icon: Wallet,
              t: "Transparent Pricing",
              d: "See exact rates upfront. No haggling, no surprises.",
            },
          ].map((f) => (
            <div
              key={f.t}
              className="hover-lift rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto mb-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-blue-600 to-blue-800 p-8 text-primary-foreground shadow-glow sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-success/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Can't decide? Talk to a pro.
              </h2>
              <p className="mt-2 max-w-xl text-sm opacity-90">
                Tell us what's broken — we'll match you with the right
                specialist in under 60 seconds.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/book">
                <Button size="lg" variant="secondary" className="gap-1">
                  Book now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/providers">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Browse pros
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
