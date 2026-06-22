import { Link } from "@tanstack/react-router";
import { Bell, Search, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Logo } from "@/components/zimma/Logo";


type NavItem = { label: string; icon: LucideIcon; active?: boolean };

export function DashboardLayout({
  role,
  name,
  nav,
  activeLabel,
  onSelect,
  children,
}: {
  role: "Customer" | "Provider";
  name: string;
  nav: NavItem[];
  activeLabel?: string;
  onSelect?: (label: string) => void;
  children: ReactNode;
}) {
  const isActive = (n: NavItem) => (activeLabel ? n.label === activeLabel : !!n.active);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2 px-6 py-5">
            <Logo/>
          </Link>

          <div className="px-3">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{role} panel</p>
            <nav className="space-y-1">
              {nav.map((n) => (
                <button
                  key={n.label}
                  onClick={() => onSelect?.(n.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(n)
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto m-4 rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-5 text-primary-foreground shadow-glow">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="mt-1 text-xs opacity-90">Our team is online 24/7 across Karachi.</p>
            <Button size="sm" variant="secondary" className="mt-3 w-full">Contact Support</Button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:gap-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2 lg:hidden">
                <img 
                src="/logo-zimma.png" 
                alt="Zimma Logo" 
                className="h-10 w-auto" 
                />
            </Link>

            <div className="relative ml-auto hidden max-w-md flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search bookings, providers, jobs…" className="rounded-xl border-border pl-9" />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-accent sm:ml-0">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border-border bg-popover p-2 shadow-card"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notifications</p>
                {[
                  { t: "Booking confirmed", s: "Asif (Electrician) arriving 4 PM" },
                  { t: "New review", s: "You received a 5★ from Ayesha" },
                  { t: "Payment received", s: "PKR 3,200 credited to wallet" },
                ].map((n) => (
                  <div key={n.t} className="rounded-xl px-3 py-2.5 hover:bg-accent">
                    <p className="text-sm font-medium text-foreground">{n.t}</p>
                    <p className="text-xs text-muted-foreground">{n.s}</p>
                  </div>
                ))}
              </PopoverContent>
            </Popover>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold leading-tight">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563eb`}
                alt={name}
                className="h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10"
              />
            </div>
          </header>

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-2 pt-2 backdrop-blur lg:hidden"
            style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
          >
            {nav.slice(0, 5).map((n) => (
              <button
                key={n.label}
                onClick={() => onSelect?.(n.label)}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] ${isActive(n) ? "text-primary" : "text-muted-foreground"}`}
              >
                <n.icon className="h-4 w-4" />
                <span className="max-w-[64px] truncate">{n.label.split(" ")[0]}</span>
              </button>
            ))}
          </nav>

          <main className="px-3 pb-28 pt-6 sm:px-6 lg:pb-10 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}