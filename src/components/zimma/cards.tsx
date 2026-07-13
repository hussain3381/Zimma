import { Link } from "@tanstack/react-router";
import { Star, MapPin, ShieldCheck, Briefcase, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "./favorites";
import type { Provider } from "./data";
import type { LucideIcon } from "lucide-react";
import { UNVERIFIED_BOOK_MESSAGE } from "./provider-mapping";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert } from "lucide-react";

export function ServiceCard({ icon: Icon, name, count, color, slug }: { icon: LucideIcon; name: string; count: number; color: string; slug: string }) {
  return (
    <Link to="/providers" className="group" data-slug={slug}>
      <Card className="hover-lift flex h-full flex-col items-start gap-4 rounded-2xl border-border/60 bg-card p-5 shadow-soft">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{count} pros available</p>
        </div>
        <span className="mt-auto text-sm font-medium text-primary transition group-hover:translate-x-1">
          Browse pros →
        </span>
      </Card>
    </Link>
  );
}

export function ProviderCard({ p }: { p: Provider }) {
  const [hoverStars, setHoverStars] = useState(0);
  return (
    <Card className="hover-lift group flex flex-col gap-4 rounded-2xl border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <img
          src={p.avatar}
          alt={p.name}
          className="h-16 w-16 shrink-0 rounded-2xl ring-2 ring-primary/10 transition duration-300 group-hover:scale-105 group-hover:ring-primary/30"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-foreground">{p.name}</h3>
            {p.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-success" />}
          </div>
          <p className="truncate text-sm text-muted-foreground">{p.trade}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {p.area}
          </div>
        </div>
        <FavoriteButton providerId={p.id} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {p.skills.slice(0, 3).map((s) => (
          <Badge key={s} variant="secondary" className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">{s}</Badge>
        ))}
      </div>

      {/* Interactive rating */}
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverStars(0)}
        aria-label={`Rating ${p.rating}`}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = (hoverStars || Math.round(p.rating)) >= i;
          return (
            <button
              key={i}
              onMouseEnter={() => setHoverStars(i)}
              className="transition-transform duration-150 hover:scale-125"
              type="button"
              aria-label={`${i} stars`}
            >
              <Star
                className={`h-4 w-4 transition ${
                  active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                }`}
              />
            </button>
          );
        })}
        <span className="ml-1 text-xs font-semibold text-foreground">{p.rating}</span>
        <span className="text-xs text-muted-foreground">· {p.reviews} reviews</span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3 text-center">
        <Stat icon={Briefcase} label={`${p.jobs}`} sub="jobs done" />
        <Stat icon={Clock} label={`${p.experience}y`} sub="experience" />
        <Stat icon={ShieldCheck} label="ID" sub="verified" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{p.price}</div>
          <div className="text-xs text-success">{p.available}</div>
        </div>
        <div className="flex gap-2">
          <Link to="/providers/$id" params={{ id: p.id }}>
            <Button variant="outline" size="sm">Profile</Button>
          </Link>
          {p.bookable === false ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-auto py-1.5 px-3 flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-70 text-center whitespace-normal" 
                    disabled 
                    aria-disabled
                  >
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> 
                    <span className="block max-w-[100px] break-words">
                      Verification pending
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs">{UNVERIFIED_BOOK_MESSAGE}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link to="/book" search={{ providerId: p.id }}>
              <Button size="sm" className="shadow-glow btn-glow">Book Now</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ icon: Icon, label, sub }: { icon: LucideIcon; label: string; sub: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{sub}</div>
    </div>
  );
}

export function ReviewCard({ name, area, text, rating }: { name: string; area: string; text: string; rating: number }) {
  return (
    <Card className="hover-lift flex h-full flex-col gap-4 rounded-2xl border-border/60 bg-card p-6 shadow-soft">
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
      </div>
      <p className="text-sm leading-relaxed text-foreground">"{text}"</p>
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
          {name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{area}, Karachi</div>
        </div>
      </div>
    </Card>
  );
}