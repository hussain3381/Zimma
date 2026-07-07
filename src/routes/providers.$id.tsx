import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, MapPin, ShieldCheck, Briefcase, Clock, MessageCircle, Phone, Share2, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ReviewCard } from "@/components/zimma/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { ProviderRow } from "@/components/zimma/auth-context";
import { rowToProvider } from "@/components/zimma/provider-mapping";
import { FavoriteButton } from "@/components/zimma/favorites";

export const Route = createFileRoute("/providers/$id")({
  component: ProviderProfile,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Provider not found</h1>
        <Link to="/providers" className="mt-4 inline-block text-primary underline">Back to all pros</Link>
      </div>
    </div>
  ),
});

type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string; customer_id: string };

const portfolio = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600",
  "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=600",
  "https://images.unsplash.com/photo-1599839619722-39751411ea63?w=600",
];

function ProviderProfile() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<ProviderRow | null | undefined>(undefined);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("providers").select("*").eq("id", id).eq("status", "approved").maybeSingle();
      if (mounted) setRow((data as ProviderRow) ?? null);
    };
    load();
    const ch = supabase
      .channel(`provider-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "providers", filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, customer_id")
        .eq("provider_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (mounted) setReviews((data ?? []) as ReviewRow[]);
    };
    load();
    const ch = supabase
      .channel(`reviews-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `provider_id=eq.${id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id]);

  if (row === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (row === null) throw notFound();
  const p = rowToProvider(row);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="absolute z-0 h-32 bg-primary-soft sm:h-48">
        <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
          <Link to="/providers">
            <Button variant="secondary" size="sm" className="gap-1"><ChevronLeft className="h-4 w-4" /> Back</Button>
          </Link>
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-8 sm:top-8">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full"><Share2 className="h-4 w-4" /></Button>
          <FavoriteButton providerId={id} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-10 grid gap-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:-mt-16 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <img src={p.avatar} alt={p.name} className="h-24 w-24 rounded-2xl ring-4 ring-card sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{p.name}</h1>
              {p.verified && (
                <Badge className="gap-1 rounded-full bg-success-soft text-success hover:bg-success-soft">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              {row.is_online && (
                <Badge className="gap-1 rounded-full bg-emerald-100 text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Online
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
            <div className="text-2xl font-bold text-foreground">{p.price}</div>
            <div className="text-xs text-success">{p.available}</div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="icon"><MessageCircle className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon"><Phone className="h-4 w-4" /></Button>
              <Link to="/book" search={{ providerId: id }} className="flex-1"><Button size="lg" className="w-full shadow-glow">Book Now</Button></Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {row.bio || `${p.name} is a ${p.trade.toLowerCase()} serving households across ${p.area} and greater Karachi.`}
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

            {p.skills.length > 0 && (
              <Card className="rounded-2xl border-border bg-card p-6 shadow-soft">
                <h2 className="text-lg font-bold">Skills & Specialities</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.skills.map((s: string) => (
                    <Badge key={s} variant="secondary" className="rounded-full bg-primary-soft px-3 py-1.5 text-primary hover:bg-primary-soft">{s}</Badge>
                  ))}
                </div>
              </Card>
            )}

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
              {reviews.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No reviews yet. Be the first to book and share your experience.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {reviews.map((r) => (
                    <ReviewCard
                      key={r.id}
                      name={`Customer · ${r.customer_id.slice(0, 6)}`}
                      area={new Date(r.created_at).toLocaleDateString()}
                      text={r.comment ?? ""}
                      rating={r.rating}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

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
              <Link to="/book" search={{ providerId: id }}><Button size="lg" className="mt-5 w-full shadow-glow">Book Now</Button></Link>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Free cancellation up to 2 hours before</p>
            </Card>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
