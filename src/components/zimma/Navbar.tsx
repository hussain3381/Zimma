import { Logo } from "@/components/zimma/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/zimma/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const links = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/providers", label: "Providers" },
    {
      to: user?.role === "provider" ? "/dashboard/provider" : "/dashboard/customer",
      label: "Dashboard",
    },
  ] as const;

  const firstName = user?.name?.split(" ")[0];

  const handleSignOut = () => {
    signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-0">
          <span className="flex h-30 w-30 items-center justify-center rounded-xl bg-transparent z-40">
            <Logo className="h-30px" />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="group relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "relative rounded-lg px-3 py-2 text-sm font-semibold text-primary" }}
            >
              {l.label}
              <span className="pointer-events-none absolute bottom-1 left-3 right-3 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
          {/* <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
              <ShieldCheck className="h-3.5 w-3.5" /> Super Admin Terminal
            </Button>
          </Link> */}

          {user ? (
            <>
              <Link
                to={user.role === "provider" ? "/dashboard/provider" : "/dashboard/customer"}
                className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                  {firstName?.[0]?.toUpperCase()}
                </span>
                Welcome, {firstName}
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth" search={{ role: "provider" } as never}>
                <Button size="sm" className="shadow-glow btn-glow">Become a Pro</Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-300 md:hidden ${
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-4 py-3">
          {user && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {firstName?.[0]?.toUpperCase()}
              </span>
              Welcome, {firstName}
            </div>
          )}
          {links.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent animate-fade-up"
              activeProps={{ className: "block rounded-lg px-3 py-2 text-sm font-semibold bg-primary-soft text-primary animate-fade-up" }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Super Admin Terminal</span>
          </Link>
          <div className="flex gap-2 pt-2">
            {user ? (
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth" search={{ role: "provider" } as never} onClick={() => setOpen(false)} className="flex-1">
                  <Button size="sm" className="w-full">Become a Pro</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
