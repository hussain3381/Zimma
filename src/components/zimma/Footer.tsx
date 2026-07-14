import { Link } from "@tanstack/react-router";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Clock,
  House,
} from "lucide-react";
import { Logo } from "@/components/zimma/Logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    toast.success("You're on the list — welcome to Zimma!");
    setEmail("");
  };

  return (
    <footer className="relative mt-32 border-t border-border/50 bg-gradient-to-b from-card/30 to-background pt-8 pb-4">
      <div
        className="absolute left-0 right-0 top-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{ transform: "translateY(-50%)" }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-primary via-blue-600 to-indigo-800 p-8 text-white shadow-2xl shadow-primary/20 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 hover:scale-110" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Stay in the loop
              </h3>
              <p className="mt-2 text-sm text-blue-100/80">
                Get seasonal offers, safety tips, and priority slots — 1 email a
                month, no spam.
              </p>
            </div>
            <form
              onSubmit={onSubscribe}
              className="flex w-full max-w-sm flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@karachi.com"
                className="h-12 flex-1 rounded-xl border-white/20 bg-white/10 px-4 text-white placeholder:text-white/50 backdrop-blur-sm focus-visible:ring-white/50"
                required
              />
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-12 rounded-xl px-6 font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4 lg:gap-8">
          {/* Brand & Contact */}
          <div className="space-y-6">
            <Link
              to="/"
              className="inline-block transition-transform hover:scale-105"
            >
              <Logo className="w-32" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Karachi's most trusted marketplace for verified home service
              professionals.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />{" "}
                <a
                  href="tel:+922135000000"
                  className="transition-colors hover:text-primary"
                >
                  +92 21 3500 0000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />{" "}
                <a
                  href="mailto:hello@zimma.pk"
                  className="transition-colors hover:text-primary"
                >
                  hello@zimma.pk
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" /> DHA Phase 6, Karachi
                75500
              </li>
            </ul>
            <div className="flex gap-4">
              {[
                { Icon: FaFacebook, href: "https://facebook.com" },
                { Icon: FaInstagram, href: "https://instagram.com" },
                { Icon: FaTwitter, href: "https://twitter.com" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              Services
            </h4>
            <ul className="mt-6 space-y-3">
              {[
                { label: "Electricians", slug: "electrician" },
                { label: "Plumbers", slug: "plumber" },
                { label: "AC Repair", slug: "ac-tech" },
                { label: "Home Cleaning", slug: "cleaning" },
                { label: "Painting", slug: "painter" },
                { label: "Carpentry", slug: "carpenter" },
              ].map((it) => (
                <li key={it.slug}>
                  <Link
                    to="/services"
                    className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary font-medium"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              Company
            </h4>
            <ul className="mt-6 space-y-3">
              {[
                { label: "Browse Pros", to: "/providers" },
                { label: "All Services", to: "/services" },
                { label: "Become a Pro", to: "/auth" },
                { label: "Book Now", to: "/book" },
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.to}
                    className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:careers@zimma.pk"
                  className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary font-medium"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              Support
            </h4>
            <ul className="mt-6 space-y-3">
              {[
                "Help Center",
                "Trust & Safety",
                "Terms of Service",
                "Privacy Policy",
              ].map((item, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary font-medium"
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:hello@zimma.pk"
                  className="inline-block text-sm text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary font-medium"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 🛡️ Premium Trust Badges */}
        <div className="mt-12 grid gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-muted/30 via-muted/10 to-muted/30 p-6 backdrop-blur-sm sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              CNIC & Background Verified
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              On-time or free next visit
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <House className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              50,000+ Karachi households
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Zimma. Crafted with ❤️ in Karachi 🇵🇰
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="transition-colors hover:text-primary">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
