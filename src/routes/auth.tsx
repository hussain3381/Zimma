import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Wrench, Mail, Lock, IdCard, Briefcase, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/zimma/auth-context";
import { AuthSkeleton, FullScreenSpinner } from "@/components/zimma/loaders";
import { Logo } from "@/components/zimma/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In or Join — Zimma" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    role: s.role === "provider" ? ("provider" as const) : ("customer" as const),
  }),
  component: AuthPageWrapper,
});

function AuthPageWrapper() {
  const { ready } = useAuth();
  if (!ready) return <AuthSkeleton />;
  return <AuthPage />;
}

type Mode = "login" | "signup";
type Role = "customer" | "provider";

function AuthPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>("signup");
  const [role, setRole] = useState<Role>(search.role);

  // shared
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // provider
  const [profession, setProfession] = useState("Electrician");
  const [cnic, setCnic] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Signing you in…");

  const finish = (to: "/dashboard/customer" | "/dashboard/provider" | "/auth/pending", label: string) => {
    setSubmitLabel(label);
    setSubmitting(true);
    // small delay so the user sees the transition state
    setTimeout(() => navigate({ to }), 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      if (!email || !password) return setError("Enter email and password.");
      if (role === "customer") {
        signIn({ role: "customer", name: name || email.split("@")[0], email });
        finish("/dashboard/customer", "Welcome back! Loading your dashboard…");
      } else {
        signIn({ role: "provider", name: name || email.split("@")[0], email, profession: "Electrician", cnic: "—", verified: true });
        finish("/dashboard/provider", "Welcome back, Pro! Loading your dashboard…");
      }
      return;
    }

    // signup
    if (!name || !email || !password) return setError("Please complete all fields.");
    if (role === "customer") {
      signIn({ role: "customer", name, email });
      finish("/dashboard/customer", "Creating your account…");
    } else {
      if (!cnic || cnic.replace(/\D/g, "").length < 13) return setError("Enter a valid 13-digit CNIC.");
      signIn({ role: "provider", name, email, profession, cnic, verified: false });
      finish("/auth/pending", "Submitting your Pro application…");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-30"/>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      </header>

      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:py-12">
        {/* Marketing */}
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome to Zimma</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Karachi's trusted home services, one tap away.</h1>
          <p className="mt-4 text-muted-foreground">Join thousands of customers booking verified pros — or grow your business as a Zimma Pro.</p>
          <div className="mt-8 space-y-4">
            {[
              "Background-checked & CNIC-verified pros",
              "Transparent pricing — no surprises",
              "24/7 in-app support across Karachi",
              "Secure payments and full booking history",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-3xl border-border bg-card p-5 shadow-card sm:p-8">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                role === "customer" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" /> Join as Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                role === "provider" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Wrench className="h-4 w-4" /> Join as Service Pro
            </button>
          </div>

          {/* Mode toggle */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : role === "customer" ? "Create your account" : "Register as a Zimma Pro"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue to your dashboard." : role === "provider" ? "We'll verify your CNIC and run a quick background check." : "It only takes a minute."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field icon={User} label="Full name" value={name} onChange={setName} placeholder="e.g. Ahmed Khan" />
            )}
            <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="[email protected]" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {mode === "signup" && role === "provider" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Profession</label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {["Electrician", "Plumber", "AC Technician", "Carpenter", "Painter", "Cleaner"].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Field icon={IdCard} label="CNIC Number" value={cnic} onChange={(v) => setCnic(v.replace(/[^\d-]/g, ""))} placeholder="42101-1234567-1" />
              </>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="w-full gap-2 btn-glow">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</>
              ) : (
                <>
                  {mode === "signup" && role === "provider" ? "Register as Pro" : mode === "signup" ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to Zimma?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-primary hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </Card>
      </div>
      {submitting && <FullScreenSpinner label={submitLabel} />}
    </div>
  );
}

function Field({
  icon: Icon, label, value, onChange, type = "text", placeholder,
}: {
  icon: typeof User; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl pl-9"
        />
      </div>
    </div>
  );
}
