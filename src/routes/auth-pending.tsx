import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Clock, FileCheck2, UserCheck, PartyPopper, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/zimma/auth-context";
import { PendingSkeleton } from "@/components/zimma/loaders";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-pending")({
  head: () => ({ meta: [{ title: "Verification Pending — Zimma Pro" }] }),
  component: PendingWrapper,
});

function PendingWrapper() {
  const { ready, user } = useAuth();
  if (!ready) return <PendingSkeleton />;
  return <PendingPage user={user} />;
}

function PendingPage({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const navigate = useNavigate();
  const { refresh, signOut } = useAuth();

  // Derive initial application status from whichever shape the user carries.
  const initial: "pending" | "approved" | "rejected" =
    user?.role === "provider"
      ? user.status
      : user?.role === "customer" && user.providerApplication
        ? user.providerApplication.status
        : "pending";
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (!user) { navigate({ to: "/auth" }); return; }
    // Approved provider? Send them straight to the pro dashboard.
    if (user.role === "provider") { navigate({ to: "/dashboard/provider" }); return; }
    // Customer with no application at all? Nothing to show here.
    if (user.role === "customer" && !user.providerApplication) {
      navigate({ to: "/dashboard/customer" });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`provider-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "providers", filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { status: "pending" | "approved" | "rejected" }).status;
          setStatus(next);
          refresh();
          if (next === "approved") {
            setTimeout(() => navigate({ to: "/dashboard/provider" }), 1500);
          }
        },
      )
      .subscribe();

    const iv = setInterval(async () => {
      const { data } = await supabase.from("providers").select("status").eq("id", user.id).maybeSingle();
      if (data?.status && data.status !== status) {
        setStatus(data.status);
        refresh();
        if (data.status === "approved") {
          setTimeout(() => navigate({ to: "/dashboard/provider" }), 1500);
        }
      }
    }, 8000);

    return () => { supabase.removeChannel(channel); clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const approved = status === "approved";
  const rejected = status === "rejected";
  const progress = approved ? 100 : rejected ? 100 : 55;

  const steps = [
    { i: FileCheck2, label: "Application received", done: true },
    { i: UserCheck, label: "CNIC verification", done: true },
    { i: ShieldCheck, label: "Admin review", done: approved || rejected },
    { i: PartyPopper, label: "Profile approved", done: approved },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-soft via-background to-background">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Zimma</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/customer">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="gap-1">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card className="rounded-3xl border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${rejected ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"}`}>
            {approved ? <PartyPopper className="h-10 w-10" /> : <ShieldCheck className={`h-10 w-10 ${rejected ? "" : "animate-pulse"}`} />}
          </div>
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
            {approved ? "You're verified! 🎉" : rejected ? "Application declined" : "Verification in progress"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            {approved
              ? "Redirecting you to your Provider Dashboard…"
              : rejected
                ? "Your Pro application was not approved. Please contact support to review."
                : "Our Super Admin is reviewing your credentials (CNIC & background check). You'll be notified here instantly once approved. You can keep browsing Zimma in the meantime."}
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            {approved ? "Approved" : rejected ? "Declined" : "Waiting on admin approval"}
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all duration-500 ${rejected ? "bg-destructive" : "bg-gradient-to-r from-primary to-blue-600"}`} style={{ width: `${progress}%` }} />
          </div>

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

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link to="/dashboard/customer">
              <Button variant="outline" size="sm">Keep browsing</Button>
            </Link>
            <Link to="/providers">
              <Button variant="ghost" size="sm">See other pros</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
