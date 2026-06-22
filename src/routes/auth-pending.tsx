import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Clock, FileCheck2, UserCheck, PartyPopper, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/zimma/auth-context";
import { PendingSkeleton } from "@/components/zimma/loaders";
import { Logo } from "@/components/zimma/Logo";

export const Route = createFileRoute("/auth-pending")({
  head: () => ({ meta: [{ title: "Verification Pending — Zimma Pro" }] }),
  component: PendingWrapper,
});

const DURATION = 30;

function PendingWrapper() {
  const { ready } = useAuth();
  if (!ready) return <PendingSkeleton />;
  return <PendingPage />;
}

function PendingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(DURATION);
  const [verified, setVerified] = useState(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/auth", search: { role: "provider" } as never });
      return;
    }
    if (user.role !== "provider") {
      navigate({ to: "/dashboard/customer" });
    }
  }, [user, navigate]);

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining !== 0 || notifiedRef.current) return;
    notifiedRef.current = true;
    setVerified(true);
    updateUser({ verified: true } as never);

    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          new Notification("Zimma Pro Verified 🎉", { body: "Your Zimma Pro profile has been verified successfully." });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") new Notification("Zimma Pro Verified 🎉", { body: "Your Zimma Pro profile has been verified successfully." });
          });
        }
      } catch {}
    }

    const t = setTimeout(() => navigate({ to: "/dashboard/provider" }), 3500);
    return () => clearTimeout(t);
  }, [remaining, navigate, updateUser]);

  const progress = ((DURATION - remaining) / DURATION) * 100;
  const steps = [
    { i: FileCheck2, label: "Documents received", done: progress > 10 },
    { i: UserCheck, label: "CNIC verification", done: progress > 45 },
    { i: ShieldCheck, label: "Background check", done: progress > 80 },
    { i: PartyPopper, label: "Profile approved", done: verified },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-soft via-background to-background">
      {verified && (
        <div className="fixed left-1/2 top-6 z-50 w-[92%] max-w-md -translate-x-1/2 animate-fade-up">
          <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
              <PartyPopper className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Congratulations! 🎉</p>
              <p className="text-sm text-muted-foreground">Your Zimma Pro profile has been verified successfully.</p>
            </div>
            <button onClick={() => navigate({ to: "/dashboard/provider" })} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card className="rounded-3xl border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft text-primary">
            {verified ? <PartyPopper className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10 animate-pulse" />}
          </div>
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
            {verified ? "You're verified!" : "Verification in progress"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            {verified
              ? "Redirecting you to your Provider Dashboard…"
              : "Our team is verifying your credentials (CNIC & background check). This usually takes 1 to 24 hours."}
          </p>

          {/* Countdown */}
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            {verified ? "Approved" : `Demo: auto-approve in ${remaining}s`}
          </div>

          {/* Progress */}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Steps */}
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            {steps.map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  s.done ? "border-success/30 bg-success-soft/40" : "border-border bg-background"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.done ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                  <s.i className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              size="lg"
              disabled={!verified}
              onClick={() => {
                updateUser({ verified: true } as never);
                navigate({ to: "/dashboard/provider" });
              }}
              className="w-full gap-2 btn-glow sm:w-auto"
            >
              {verified ? "Enter Provider Dashboard" : "Waiting for approval…"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              We'll also send a confirmation to your email and SMS. You can safely close this tab.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
