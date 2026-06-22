import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, ShieldCheck, Clock, Wallet, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ServiceCard, ProviderCard, ReviewCard } from "@/components/zimma/cards";
import { categories, providers, testimonials } from "@/components/zimma/data";
import { Reveal, CountUp } from "@/components/zimma/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-primary hover:bg-primary-soft animate-fade-up">
              <ShieldCheck className="h-3.5 w-3.5" /> Karachi's most trusted home services
            </Badge>
            <h1 className="animate-fade-up text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl" style={{ animationDelay: "80ms" }}>
              Book verified pros for <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">every corner</span> of your home.
            </h1>
            <p className="mt-5 max-w-xl animate-fade-up text-base text-muted-foreground sm:text-lg" style={{ animationDelay: "180ms" }}>
              From DHA to North Nazimabad — Zimma connects you with background-checked electricians, plumbers, cleaners and more. Transparent prices. On-demand booking.
            </p>

            {/* Search */}
            <div className="mt-8 animate-fade-up rounded-2xl border border-border bg-card p-2 shadow-card sm:flex sm:items-center sm:gap-2" style={{ animationDelay: "280ms" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="What do you need? e.g. AC repair, plumber…" className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
              </div>
              <div className="relative flex-1 border-t border-border sm:border-l sm:border-t-0">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input defaultValue="Karachi" className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
              </div>
              <Link to="/book">
                <Button size="lg" className="mt-2 w-full shadow-glow btn-glow sm:mt-0 sm:w-auto">Search</Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "360ms" }}>
              <span className="font-medium">Popular:</span>
              {["Deep Cleaning", "AC Service", "Geyser Repair", "Painter"].map((t) => (
                <Link key={t} to="/book" className="rounded-full bg-card px-3 py-1 shadow-soft transition hover:-translate-y-0.5 hover:text-primary hover:shadow-card">
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "440ms" }}>
              <HeroStat value={52} suffix="K+" label="Customers" />
              <HeroStat value={3800} suffix="+" label="Verified pros" />
              <HeroStat value={180} suffix="K+" label="Jobs done" />
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative animate-fade-in-soft" style={{ animationDelay: "300ms" }}>
            <div className="absolute -left-8 top-10 hidden h-72 w-72 rounded-full bg-primary/20 blur-3xl md:block" />
            <div className="absolute -right-8 bottom-0 hidden h-64 w-64 rounded-full bg-success/20 blur-3xl md:block" />

            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="glass-card animate-float rounded-3xl p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <img src={providers[0].avatar} alt="" className="h-12 w-12 rounded-xl" />
                    <div>
                      <p className="text-sm font-semibold">{providers[0].name}</p>
                      <p className="text-xs text-muted-foreground">{providers[0].trade}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">4.9</span>
                    <span className="text-muted-foreground">· 540 jobs</span>
                  </div>
                  <Link to="/book"><Button size="sm" className="mt-4 w-full btn-glow">Book in 2 mins</Button></Link>
                </div>
                <div className="animate-float-slow rounded-3xl bg-foreground p-5 text-background shadow-card">
                  <Wallet className="h-6 w-6 text-success" />
                  <p className="mt-3 text-2xl font-bold">PKR 0</p>
                  <p className="text-xs opacity-70">Cancellation fee. Always.</p>
                </div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="animate-float-slow rounded-3xl bg-primary p-5 text-primary-foreground shadow-glow">
                  <ShieldCheck className="h-6 w-6" />
                  <p className="mt-3 text-lg font-bold leading-tight">100% Verified Professionals</p>
                  <p className="mt-1 text-xs opacity-90">CNIC + background check on every pro.</p>
                </div>
                <div className="glass-card animate-float rounded-3xl p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Booking</p>
                  <p className="mt-2 text-sm font-semibold">AC Service — Tomorrow, 11 AM</p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">Confirmed in Clifton</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <Section
        eyebrow="Categories"
        title="Every household service, one app"
        sub="Pick from 12+ professional categories tailored for Karachi homes."
        action={<Link to="/services"><Button variant="ghost" className="gap-1">View all <ArrowRight className="h-4 w-4" /></Button></Link>}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 12).map((c, i) => (
            <Reveal key={c.slug} delay={i * 60}>
              <ServiceCard {...c} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FEATURED PROVIDERS */}
      <Section
        eyebrow="Top rated"
        title="Featured professionals near you"
        sub="Handpicked, verified, and loved by 50K+ Karachi households."
        action={<Link to="/providers"><Button variant="ghost" className="gap-1">See all pros <ArrowRight className="h-4 w-4" /></Button></Link>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {providers.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProviderCard p={p} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* WHY ZIMMA */}
      <Section eyebrow="Why Zimma" title="Built on trust, designed for ease">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Verified Professionals", d: "Every pro is CNIC-verified, reference-checked and rated by real customers." },
            { icon: Wallet, t: "Transparent Pricing", d: "Upfront quotes — no surprises, no haggling, no inflated invoices." },
            { icon: Clock, t: "On-Time Guarantee", d: "If we're late, your next service is on us. Punctuality is non-negotiable." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 100}>
              <div className="hover-lift rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section eyebrow="How it works" title="From request to relief in three steps">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Tell us what you need", d: "Pick a service, share your address, and choose a time slot that fits." },
            { n: "02", t: "Get matched instantly", d: "We auto-match you with the highest-rated pro near you in under 60 seconds." },
            { n: "03", t: "Relax & rate", d: "Track arrival live, pay cashless, and leave a review to help your neighbours." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="hover-lift relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
                <span className="absolute right-4 top-4 text-5xl font-bold text-primary/10">{s.n}</span>
                <h3 className="text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section eyebrow="Loved across Karachi" title="What our customers say">
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <ReviewCard {...t} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* STATS */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-8 text-primary-foreground shadow-glow sm:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-success/20 blur-3xl" />
            <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <BigStat value={52} suffix="K+" label="Happy Customers" />
              <BigStat value={3800} suffix="+" label="Verified Pros" />
              <BigStat value={180} suffix="K+" label="Jobs Completed" />
              <BigStat value={4.9} decimals={1} suffix=" ★" label="Avg. Rating" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Are you a skilled professional?</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">Join 3,800+ pros earning weekly with Zimma. Set your hours, your area, your prices.</p>
          </div>
          <div className="flex items-stretch md:items-center md:justify-end">
            <Link to="/auth" search={{ role: "provider" } as never} className="w-full md:w-auto">
              <Button size="lg" className="w-full shadow-glow btn-glow md:w-auto">Become a Zimma Pro</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({ eyebrow, title, sub, action, children }: { eyebrow: string; title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:mt-24 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h2>
          {sub && <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{sub}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function HeroStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-foreground">
        <CountUp to={value} suffix={suffix} />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function BigStat({ value, suffix, label, decimals }: { value: number; suffix?: string; label: string; decimals?: number }) {
  return (
    <div>
      <div className="text-4xl font-bold sm:text-5xl">
        <CountUp to={value} suffix={suffix} decimals={decimals} />
      </div>
      <div className="mt-2 text-sm opacity-90">{label}</div>
    </div>
  );
}

