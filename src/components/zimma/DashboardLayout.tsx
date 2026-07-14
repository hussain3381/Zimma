import { Link } from "@tanstack/react-router";
import { Bell, Search, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/zimma/Logo";

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
};

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
  const isActive = (n: NavItem) =>
    activeLabel ? n.label === activeLabel : !!n.active;
  const notificationBadge =
    nav.find((n) => n.label === "Notifications")?.badge ?? 0;
  const mobileNavRef = useRef<HTMLElement>(null);

  // Auto-scroll the active mobile tab into view so users can always see where they are.
  useEffect(() => {
    const container = mobileNavRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    if (active) {
      active.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeLabel]);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2 px-6 py-5">
            <span className="flex h-9 items-center justify-center ">
              <Logo className="[&_span]:hidden absolute left-2 " />
            </span>
          </Link>

          <div className="px-3">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {role} panel
            </p>
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
                  <span className="min-w-0 flex-1 truncate text-left">
                    {n.label}
                  </span>
                  {!!n.badge && (
                    <span
                      className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive(n) ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"}`}
                    >
                      {n.badge > 99 ? "99+" : n.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto m-4 rounded-2xl bg-linear-to-br from-primary to-blue-700 p-5 text-primary-foreground shadow-glow">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="mt-1 text-xs opacity-90">
              Our team is online 24/7 across Karachi.
            </p>
            <Button size="sm" variant="secondary" className="mt-3 w-full">
              Contact Support
            </Button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:gap-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2 px-6 py-5">
              <span className="flex h-9 items-center justify-center ">
                <Logo className="[&_span]:max-[400px]:hidden" />
              </span>
            </Link>

            <div className="relative ml-auto hidden max-w-md flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookings, providers, jobs…"
                className="rounded-xl border-border pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => onSelect?.("Notifications")}
              className="relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-accent sm:ml-0"
              aria-label="Open notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationBadge > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {notificationBadge > 9 ? "9+" : notificationBadge}
                </span>
              )}
            </button>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className=" min-w-0 text-right ">
                <p className="truncate text-sm font-semibold leading-tight">
                  {name}
                </p>
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
            className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 backdrop-blur lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{
              paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
            }}
          >
            {/* MAGIC STEP: JavaScript se array ka order change kar rahe hain bina asal array ko chhede */}
            {(() => {
              // 1. Pehle hum 'Overview' item ko dhoondenge
              const overviewItem = nav.find((n) => n.label === "Overview");
              // 2. Baki ke saare items alag kar lenge (jisme overview na ho)
              const otherItems = nav.filter((n) => n.label !== "Overview");

              // 3. Mobile ke liye hume top 4 dusre items chahiye taaki total 5 ban sakein
              const mobileOthers = otherItems.slice(0, 4);

              // 4. Ab hum new array banayenge jisme Overview bilkul beech (index 2) par hoga
              const mobileNav = [...mobileOthers];
              if (overviewItem) {
                mobileNav.splice(2, 0, overviewItem); // Index 2 par Overview ko insert kar diya
              }

              // Ab is custom 5-item sorted array par loop chalega
              return mobileNav.map((n) => {
                const active = isActive(n);
                return (
                  <button
                    key={n.label}
                    onClick={() => onSelect?.(n.label)}
                    className="relative flex h-full w-12 flex-col items-center justify-center transition-all duration-300 ease-out"
                  >
                    {/* Active Blue Floating Circle Design */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-out
              ${
                active
                  ? "bg-blue-600 text-white -translate-y-4 shadow-md shadow-blue-600/30 scale-110"
                  : "text-muted-foreground hover:text-foreground"
              }`}
                    >
                      <n.icon className="h-5 w-5 transition-transform duration-300" />

                      {/* Badges Functionality */}
                      {!!n.badge && (
                        <span
                          className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground transition-all
                ${active ? "bg-red-500 text-white" : ""}`}
                        >
                          {n.badge > 9 ? "9+" : n.badge}
                        </span>
                      )}
                    </div>

                    {/* Text Label */}
                    <span
                      className={`absolute bottom-1 max-w-16 truncate text-[10px] font-medium transition-all duration-300
              ${
                active
                  ? "text-blue-600 opacity-100 translate-y-0.5"
                  : "text-muted-foreground opacity-70"
              }`}
                    >
                      {n.label.split(" ")[0]}
                    </span>
                  </button>
                );
              });
            })()}
          </nav>
          <main className="px-3 pb-28 pt-6 sm:px-6 lg:pb-10 lg:px-8 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
