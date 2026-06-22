import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, MapPin, ShieldCheck, Briefcase, Clock, MessageCircle, Phone, Share2, Heart, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ReviewCard } from "@/components/zimma/cards";
import { providers } from "@/components/zimma/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/providers/$id")({
  loader: ({ params }) => {
    const p = providers.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Provider not found</h1>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">Back to all pros</Link>
      </div>
    </div>
  ),
  component: ProviderProfile,
});

const reviews = [
  { name: "Hassan A.", area: "DHA", text: "Showed up on time, fixed the issue, cleaned up after himself. Will book again.", rating: 5 },
  { name: "Maryam K.", area: "Clifton", text: "Very professional and explained everything. Worth every rupee.", rating: 5 },
  { name: "Bilal S.", area: "Gulshan", text: "Solid work — finished faster than I expected. Recommended.", rating: 4 },
];

const portfolio = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600",
  "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=600",
  "https://images.unsplash.com/photo-1599839619722-39751411ea63?w=600",
];

function ProviderProfile() {
  const p = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Cover */}
      <div className="relative h-32 bg-slate-300 border-b border-border sm:h-48">
        <div className="absolute inset-0 opacity-40 z-0" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.15) 1px, transparent 1px), radial-gradient(circle at 80% 60%, hsl(var(--primary) / 0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
          <Link to="/providers">
            <Button variant="secondary" size="sm" className="gap-1"><ChevronLeft className="h-4 w-4" /> Back</Button>
          </Link>
        </div>
        <div className="absolute right-4 top-4 flex gap-2 sm:right-8 sm:top-8">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full"><Share2 className="h-4 w-4" /></Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full"><Heart className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="-mt-25 relative z-50 grid gap-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <img src={p.avatar} alt={p.name} className="h-24 w-24 rounded-2xl ring-4 ring-card sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{p.name}</h1>
              {p.verified && (
                <Badge className="gap-1 rounded-full bg-success-soft text-success hover:bg-success-soft">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{p.trade}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> <span className="font-semibold">{p.rating}</span> <span className="text-muted-foreground">({p.reviews} reviews)</span></span>
              <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="h-4 w-4" /> {p.jobs} jobs</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> {p.experience} years</span>
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {p.area}</span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 lg:items-end">
            <div className="flex items-baseline justify-between gap-2 lg:justify-end">
              <div className="text-2xl font-bold text-foreground">{p.price}</div>
              <div className="text-xs text-success lg:hidden">{p.available}</div>
            </div>
            <div className="hidden text-xs text-success lg:block">{p.available}</div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="icon" className="shrink-0"><MessageCircle className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="shrink-0"><Phone className="h-4 w-4" /></Button>
              <Button size="lg" className="flex-1 shadow-glow">Book Now</Button>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p.name} is a {p.trade.toLowerCase()} with {p.experience} years of hands-on experience serving households across {p.area} and greater Karachi. Known for punctuality, transparent quotes, and clean finish — over {p.reviews} verified customers have given an average rating of {p.rating}/5.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["CNIC Verified", "Background Check", "Insured Work", "Toolkit Owned"].map((b) => (
                  <div key={b} className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium text-success">{b}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">Skills & Specialities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...p.skills, "Emergency", "Same-day", "Warranty"].map((s: string) => (
                  <Badge key={s} variant="secondary" className="rounded-full bg-primary-soft px-3 py-1.5 text-primary hover:bg-primary-soft">{s}</Badge>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">Portfolio</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolio.map((img, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-muted">
                    <img src={img} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Reviews ({p.reviews})</h2>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-bold">{p.rating}</span>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {reviews.map((r) => <ReviewCard key={r.name} {...r} />)}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="sticky top-20 rounded-2xl border-border bg-card p-6 shadow-card">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quick book</h3>
              <p className="mt-3 text-3xl font-bold">{p.price}</p>
              <p className="text-xs text-success">{p.available}</p>
              <div className="mt-5 space-y-2">
                {["Today", "Tomorrow", "Friday", "Weekend"].map((d) => (
                  <button key={d} className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary-soft hover:text-primary">
                    {d}
                    <span className="text-xs text-muted-foreground">Available</span>
                  </button>
                ))}
              </div>
              <Button size="lg" className="mt-5 w-full shadow-glow">Book Now</Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Free cancellation up to 2 hours before</p>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}