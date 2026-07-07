import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, User, Mail, Lock, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
// Lovable import removed from here
import { useAuth } from "@/components/zimma/auth-context";
import { AuthSkeleton, FullScreenSpinner } from "@/components/zimma/loaders";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In or Join — Zimma" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    role: s.role === "provider" ? ("provider" as const) : ("customer" as const),
  }),
  component: AuthPageWrapper,
});

function AuthPageWrapper() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && user) {
      if (user.role === "provider") {
        navigate({ to: user.status === "approved" ? "/dashboard/provider" : "/auth/pending" });
      } else {
        navigate({ to: "/dashboard/customer" });
      }
    }
  }, [ready, user, navigate]);
  if (!ready) return <AuthSkeleton />;
  return <AuthPage />;
}

type Mode = "login" | "signup";

function AuthPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Please wait…");

  const finish = async (label: string) => {
    setSubmitLabel(label);
    setSubmitting(true);
    await refresh();
    setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) { setSubmitting(false); return; }
      const { data: prov } = await supabase
        .from("providers").select("status").eq("id", u.id).maybeSingle();
      if (prov?.status === "approved") navigate({ to: "/dashboard/provider" });
      else navigate({ to: "/dashboard/customer" });
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Enter email and password.");

    setSubmitting(true);
    setSubmitLabel(mode === "login" ? "Signing you in…" : "Creating your account…");

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await finish("Welcome back!");
      } else {
        if (!name.trim()) throw new Error("Please enter your full name.");
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (err) throw err;
        toast.success("Welcome to Zimma 🎉");
        await finish("Setting up your account…");
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  // Google Auth function updated to use pure Supabase Auth
  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    setSubmitLabel("Redirecting to Google…");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (err) throw err;
      await finish("Signing you in…");
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Zimma</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
      </header>

      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:py-12">
        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome to Zimma</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Karachi's trusted home services, one tap away.</h1>
          <p className="mt-4 text-muted-foreground">
            Create your free account to book verified pros. Want to earn as a Service Pro? Sign up first,
            then apply from inside your dashboard — we'll verify you and get you live.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "One account for booking and (later) for going Pro",
              "Background-checked & CNIC-verified pros",
              "Transparent pricing — no surprises",
              "Secure payments and full booking history",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="rounded-3xl border-border bg-card p-5 shadow-card sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to continue to your dashboard."
              : "Every Zimma account starts as a customer. You can apply to become a Service Pro from your dashboard."}
          </p>

          <div className="mt-5">
            <Button type="button" variant="outline" onClick={handleGoogle} disabled={submitting} className="w-full gap-2">
              <GoogleIcon /> Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            {mode === "signup" && (
              <Field icon={User} label="Full name" value={name} onChange={setName} placeholder="e.g. M hussaain" />
            )}
            <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="w-full gap-2 btn-glow">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</>
              ) : (
                <>{mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight className="h-4 w-4" /></>
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.25 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.7 6.6 2.7 12S6.8 21.5 12 21.5c6.9 0 9.5-4.9 9.5-9 0-.6-.1-1.1-.2-1.5H12z"/>
    </svg>
  );
}