import { Logo } from "@/components/zimma/Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/zimma/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const firstName = user?.name;

  const handleSignOut = () => {
    signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate({ 
      to: "/providers",
      search: searchQuery.trim() ? (prev: any) => ({ ...prev, q: searchQuery }) as never : undefined
    });
    setIsSearchOpen(false);
    setOpen(false);
  };

  // Click Outside Detector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus Input Field on dropdown reveal
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* --- FIXED LOGO WRAPPER: No Stretch Aspect Ratio --- */}
        <Link to="/" className="flex items-center">
          <div className="flex h-10 w-32 items-center justify-start z-40 select-none">
            <Logo className="h-8 w-full max-w-full object-contain" />
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="group relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground duration-400 hover:scale-110"
              activeProps={{ className: "relative rounded-lg px-3 py-2 text-sm font-semibold text-primary" }}
            >
              {l.label}
              <span className="pointer-events-none absolute bottom-1 left-3 right-3 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* DESKTOP ACTIONS CONTAINER */}
        <div className="hidden items-center gap-2 md:flex">
          
          {/* --- ANIMATED DOWNWARDS DROPDOWN SEARCH BAR --- */}
          <div ref={searchRef} className="relative flex items-center justify-end h-9">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 transition-colors duration-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" /> 
              <span>Search</span>
            </Button>

            {/* Downwards Animated Dropdown Container */}
            <form 
              onSubmit={handleSearchSubmit}
              className={`absolute top-12 right-0 flex items-center bg-background border border-border rounded-md pl-3 pr-1 h-10 shadow-lg transition-all duration-300 ease-out origin-top z-50 w-64
                ${isSearchOpen ? 'translate-y-0 opacity-100 scale-100 visible' : '-translate-y-2 opacity-0 scale-95 invisible pointer-events-none'}`}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm pr-2 outline-none text-foreground placeholder-muted-foreground/70"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-sm"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          {/* --- SEARCH BAR END --- */}

          {user ? (
            <>
              <Link
                to={user.role === "provider" ? "/dashboard/provider" : "/dashboard/customer"}
                className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary "
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName || "")}&backgroundColor=2563eb`}
                    alt={firstName || "User"}
                    className="h-full w-full object-cover"
                  />
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
                <Button size="sm" className="shadow-glow btn-glow">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 md:hidden text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE RESPONSIVE DRAWER MENU */}
      <div
        className={`overflow-hidden border-t border-border bg-background transition-[max-height,opacity] duration-300 md:hidden ${
          open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-3 px-4 py-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full bg-accent/50 border border-border rounded-lg px-3 h-10 shadow-inner">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search providers or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground"
            />
          </form>

          {user && (
            <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-sm font-semibold text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName || "")}&backgroundColor=2563eb`}
                  alt={firstName || "User"}
                  className="h-full w-full object-cover"
                />
              </span>
              Welcome, {firstName}
            </div>
          )}

          <div className="space-y-1">
            {links.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="block rounded-lg px-3 py-2 text-base font-medium text-foreground transition hover:bg-accent"
                activeProps={{ className: "block rounded-lg px-3 py-2 text-base font-semibold bg-primary-soft text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex flex-col gap-2">
            {user ? (
              <Button variant="outline" size="default" className="w-full gap-2 justify-center" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className="w-full">
                  <Button variant="outline" size="default" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth" search={{ role: "provider" } as never} onClick={() => setOpen(false)} className="w-full">
                  <Button size="default" className="w-full shadow-glow btn-glow">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
