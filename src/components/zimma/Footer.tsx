import { Link } from "@tanstack/react-router";
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { X } from "lucide-react";
import { Logo } from "@/components/zimma/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-0">
               <Logo className="w-32" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Karachi's most trusted marketplace for verified home service professionals.
            </p>
            <div className="mt-5 flex gap-3">
              {[FaFacebook, FaInstagram, X].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Services", items: ["Electricians", "Plumbers", "AC Repair", "Cleaning", "Painting", "Carpentry"] },
            { title: "Company", items: ["About Us", "Careers", "Press", "Partners", "Blog"] },
            { title: "Support", items: ["Help Center", "Safety", "Terms", "Privacy", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.items.map((it) => (
                  <li key={it}>
                    <a href="#" className="text-sm text-muted-foreground transition hover:text-primary">{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 Zimma. Crafted in Karachi 🇵🇰</p>
          <p className="text-xs text-muted-foreground">Trusted by 50,000+ households across Karachi</p>
        </div>
      </div>
    </footer>
  );
}
