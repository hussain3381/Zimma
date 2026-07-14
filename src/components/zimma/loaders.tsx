export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl 
      bg-zinc-300/80 border border-gray-300/30 
      dark:bg-zinc-800 ${className}`}
    />
  );
}

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-soft via-background to-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:py-12">
        <div className="hidden space-y-4 lg:block">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-3/4" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="mt-6 h-8 w-2/3" />
          <SkeletonBlock className="mt-2 h-4 w-1/2" />
          <div className="mt-6 space-y-4">
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-24 w-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
          </div>
          <SkeletonBlock className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export function PendingSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-soft via-background to-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <SkeletonBlock className="h-9 w-28" />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          <SkeletonBlock className="mx-auto h-20 w-20 rounded-3xl" />
          <SkeletonBlock className="mx-auto mt-6 h-8 w-2/3" />
          <SkeletonBlock className="mx-auto mt-3 h-4 w-3/4" />
          <SkeletonBlock className="mt-6 h-2 w-full" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FullScreenSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
