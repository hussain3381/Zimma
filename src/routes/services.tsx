import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/zimma/Navbar";
import { Footer } from "@/components/zimma/Footer";
import { ServiceCard } from "@/components/zimma/cards";
import { categories } from "@/components/zimma/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "All Services — Zimma" },
      { name: "description", content: "Browse all home service categories available on Zimma across Karachi." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [active, setActive] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = categories.filter((c) =>
    (active === "all" || c.slug === active) &&
    c.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <header className="hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Explore</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">All home services</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">12+ professional categories. Every pro on Zimma is background-verified and rated by Karachi customers.</p>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search services… (e.g. plumber, AC)"
                className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button variant="outline" className="gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip active={active === "all"} onClick={() => setActive("all")}>All</FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)}>{c.name}</FilterChip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => <ServiceCard key={c.slug} {...c} />)}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No services match your search.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
