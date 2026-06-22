import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ProviderCard } from "@/components/zimma/cards";
import { providers, categories } from "@/components/zimma/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const list = providers
    .filter((p) =>
      [p.name, p.trade, p.area, ...p.skills].join(" ").toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "jobs") return b.jobs - a.jobs;
      return b.experience - a.experience;
    });

  return (
    <div className="min-h-screen">
      <Navbar />

      <header className="hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Karachi pros</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Find your perfect pro</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">3,800+ verified providers across DHA, Clifton, Gulshan, North Nazimabad and more.</p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, skill or area…"
                className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input defaultValue="Karachi" className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
            </div>
            <Button className="gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{list.length}</span> pros available now</p>
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

        {/* Trade chips */}
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => <ProviderCard key={p.id} p={p} />)}
        </div>
      </section>

      <Footer />
    </div>
  );
}
