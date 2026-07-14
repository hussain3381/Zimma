import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  ShieldCheck,
  Clock,
  Wallet,
  Star,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import {
  ServiceCard,
  ProviderCard,
  ReviewCard,
} from "@/components/zimma/cards";
import { categories } from "@/components/zimma/data";
import { Reveal, CountUp } from "@/components/zimma/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useLiveHomeStats,
  useLiveTestimonials,
  useTopProviders,
} from "@/components/zimma/notification-center";
import { rowToProvider } from "@/components/zimma/provider-mapping";
import type { ProviderRow } from "@/components/zimma/auth-context";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const topProviderRows = useTopProviders(4);
  const topProviders = (topProviderRows ?? []).map((r) =>
    rowToProvider(r as ProviderRow),
  );
  const heroPro = topProviders[0];
  const testimonials = useLiveTestimonials(3);
  const stats = useLiveHomeStats();
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* Background image */}
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1280}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-90"
        />
        {/* Overlays for readability + brand tone */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/40" />
        <div className="pointer-events-none absolute -left-24 top-1/3 hidden h-96 w-96 rounded-full bg-primary/30 blur-[120px] md:block" />
        <div className="pointer-events-none absolute -right-24 bottom-0 hidden h-96 w-96 rounded-full bg-success/25 blur-[120px] md:block" />
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col justify-center text-white">
            <Badge className="mb-4 w-fit gap-3 rounded-full border border-white/15 bg-white/10 text-primary p-5 shadow-card backdrop-blur-xl px-3 py-1.5  hover:bg-primary-soft animate-fade-up">
              <ShieldCheck className="h-6 w-6 animate-pulse text-success" />{" "}
              Karachi's most trusted home services
            </Badge>
            <h1
              className="animate-fade-up text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Book verified pros for{" "}
              <span className="bg-gradient-to-r from-sky-300 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                every corner
              </span>{" "}
              of your home.
            </h1>
            <p
              className="mt-5 max-w-xl animate-fade-up text-base text-slate-300 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              From DHA to North Nazimabad — Zimma connects you with
              background-checked electricians, plumbers, cleaners and more.
              Transparent prices. On-demand booking.
            </p>

            {/* Search */}
            <div
              className="mt-8 animate-fade-up rounded-2xl border border-white/15 bg-white/95 p-2 shadow-glow backdrop-blur-xl sm:flex sm:items-center sm:gap-2"
              style={{ animationDelay: "280ms" }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="What do you need? e.g. AC repair, plumber…"
                  className="border-0 bg-transparent pl-9 text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="relative flex-1 border-t border-slate-200 sm:border-l sm:border-t-0">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  defaultValue="Karachi"
                  className="border-0 bg-transparent pl-9 text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <Link to="/book">
                <Button
                  size="lg"
                  className="mt-2 w-full shadow-glow btn-glow sm:mt-0 sm:w-auto"
                >
                  Search
                </Button>
              </Link>
            </div>

            <div
              className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300 animate-fade-up"
              style={{ animationDelay: "360ms" }}
            >
              <span className="font-medium">Popular:</span>
              {["Deep Cleaning", "AC Service", "Geyser Repair", "Painter"].map(
                (t) => (
                  <Link
                    key={t}
                    to="/book"
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-white/15 hover:text-white"
                  >
                    {t}
                  </Link>
                ),
              )}
            </div>

            {/* Trust row */}
            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 animate-fade-up"
              style={{ animationDelay: "420ms" }}
            >
              <div className="flex items-center gap-2 text-sm text-white">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-slate-950 bg-linear-to-br from-primary to-success"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-1 font-semibold">4.9</span>
                  <span className="text-slate-400">· 2,400+ reviews</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-success" /> Same-day
                booking
              </div>
            </div>

            <div
              className="mt-10 grid max-w-md grid-cols-3 gap-4 animate-fade-up"
              style={{ animationDelay: "440ms" }}
            >
              <HeroStat value={stats?.customers ?? 0} label="Customers" />
              <HeroStat value={stats?.pros ?? 0} label="Verified pros" />
              <HeroStat value={stats?.jobs ?? 0} label="Jobs done" />
            </div>
          </div>

          {/* Hero visual */}
          <div
            className="relative animate-fade-in-soft lg:pl-8"
            style={{ animationDelay: "300ms" }}
          >
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4 ">
                <div className="animate-float  rounded-3xl border border-white/15 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
                  {heroPro ? (
                    <>
                      <div className="flex items-center gap-3">
                        <img
                          src={heroPro.avatar}
                          alt=""
                          className="h-12 w-12 rounded-xl"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {heroPro.name}
                          </p>
                          <p className="text-xs text-slate-300">
                            {heroPro.trade}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-white">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">
                          {heroPro.rating.toFixed(1)}
                        </span>
                        <span className="text-slate-300">
                          · {heroPro.jobs} jobs
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white/20 animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded bg-white/20 animate-pulse" />
                        <div className="h-3 w-16 rounded bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  )}
                  <Link to="/book">
                    <Button
                      size="sm"
                      className="mt-4 w-full btn-glow animate-pulse-ring"
                    >
                      Book in 2 mins
                    </Button>
                  </Link>
                </div>
                <div className="animate-float-slow rounded-3xl bg-linear-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-glow">
                  <Wallet className="h-6 w-6" />
                  <p className="mt-3 text-2xl font-bold">
                    <CountUp to={stats?.jobs ?? 0} />
                  </p>
                  <p className="text-xs opacity-90">
                    Completed jobs from live bookings.
                  </p>
                </div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="animate-float-slow rounded-3xl bg-linear-to-br from-primary to-blue-700 p-5 text-primary-foreground shadow-glow">
                  <ShieldCheck className="h-6 w-6 animate-pulse-ring" />
                  <p className="mt-3 text-lg font-bold leading-tight">
                    100% Verified Professionals
                  </p>
                  <p className="mt-1 text-xs opacity-90">
                    CNIC + background check on every pro.
                  </p>
                </div>
                <div className="animate-float rounded-3xl border border-white/15 bg-white/10 p-5 shadow-card backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                    Booking
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {heroPro
                      ? `${heroPro.trade} · ${heroPro.area}`
                      : "Live booking activity"}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-success animate-pulse-ring" />
                    <span>
                      {heroPro
                        ? `${heroPro.jobs} completed jobs`
                        : "Updates appear as jobs complete"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* CATEGORIES */}
      <Section
        eyebrow="Categories"
        title="Every household service, one app"
        sub="Pick from 12+ professional categories tailored for Karachi homes."
        action={
          <Link to="/services">
            <Button variant="ghost" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
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
        sub="Top-rated approved providers, ranked from live reviews and completed jobs."
        action={
          <Link to="/providers">
            <Button variant="ghost" className="gap-1">
              See all pros <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      >
        {topProviderRows === null ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : topProviders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
            No approved pros yet — new registrations appear here in real time.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topProviders.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProviderCard p={p} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      {/* WHY ZIMMA */}
      <Section eyebrow="Why Zimma" title="Built on trust, designed for ease">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: "Verified Professionals",
              d: "Every pro is CNIC-verified, reference-checked and rated by real customers.",
            },
            {
              icon: Wallet,
              t: "Transparent Pricing",
              d: "Upfront quotes — no surprises, no haggling, no inflated invoices.",
            },
            {
              icon: Clock,
              t: "On-Time Guarantee",
              d: "If we're late, your next service is on us. Punctuality is non-negotiable.",
            },
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
      <Section
        eyebrow="How it works"
        title="From request to relief in three steps"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Tell us what you need",
              d: "Pick a service, share your address, and choose a time slot that fits.",
            },
            {
              n: "02",
              t: "Get matched instantly",
              d: "We auto-match you with the highest-rated pro near you in under 60 seconds.",
            },
            {
              n: "03",
              t: "Relax & rate",
              d: "Track arrival live, pay cashless, and leave a review to help your neighbours.",
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="hover-lift relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
                <span className="absolute right-4 top-4 text-5xl font-bold text-primary/10">
                  {s.n}
                </span>
                <h3 className="text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      {testimonials === null
        ? null
        : testimonials.length > 0 && (
            <Section
              eyebrow="Loved across Karachi"
              title="What our customers say"
            >
              <div className="grid gap-5 md:grid-cols-3">
                {testimonials.map((t, i) => (
                  <Reveal key={`${t.name}-${i}`} delay={i * 100}>
                    <ReviewCard {...t} />
                  </Reveal>
                ))}
              </div>
            </Section>
          )}

      {/* STATS */}
      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-blue-600 to-blue-800 p-6 py-10 md:p-10 text-primary-foreground shadow-glow">
            {/* Background Decorative Blur Circles */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-success/20 blur-3xl" />

            {/* Responsive Grid: Mobile pe 2-columns, Tablet/Desktop pe 4-columns */}
            <div className="relative grid grid-cols-2 gap-x-4 gap-y-8 text-center md:grid-cols-4 justify-items-center items-center">
              <BigStat value={stats?.customers ?? 0} label="Happy Customers" />
              <BigStat value={stats?.pros ?? 0} label="Verified Pros" />
              <BigStat value={stats?.jobs ?? 0} label="Jobs Completed" />
              <BigStat
                value={stats?.rating ?? 0}
                decimals={1}
                suffix=" ★"
                label="Avg. Rating"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Are you a skilled professional?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Sign up for a free Zimma account, then apply as a Service Pro from
              your dashboard — we'll verify you and get you jobs.
            </p>
          </div>
          <div className="flex items-stretch md:items-center md:justify-end">
            <Link to="/auth" className="w-full md:w-auto">
              <Button
                size="lg"
                className="w-full shadow-glow btn-glow md:w-auto"
              >
                Sign up to apply as a Pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  sub,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:mt-24 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {title}
          </h2>
          {sub && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {sub}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function HeroStat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">
        <CountUp to={value} suffix={suffix} />
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function BigStat({
  value,
  suffix,
  label,
  decimals,
}: {
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
}) {
  return (
    <div>
      <div className="text-4xl font-bold sm:text-5xl">
        <CountUp to={value} suffix={suffix} decimals={decimals} />
      </div>
      <div className="mt-2 text-sm opacity-90">{label}</div>
    </div>
  );
}
