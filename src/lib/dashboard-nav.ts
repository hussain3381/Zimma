/**
 * Tiny in-memory event bus used by the notification center to deep-link into
 * a specific dashboard tab (and optionally a specific conversation or booking).
 * Dashboards subscribe on mount and react by switching tabs + setting a focus id.
 */
export type DashboardNavTarget = {
  tab: string;
  conversationId?: string;
  bookingId?: string;
  /** monotonically-increasing token so consumers can re-run focus effects when the same id is emitted twice */
  token?: number;
};

type Handler = (target: DashboardNavTarget) => void;

const listeners = new Set<Handler>();
let counter = 0;
const PENDING_KEY = "zimma:pending-dashboard-nav";

function savePending(target: DashboardNavTarget) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(target)); } catch {/* ignore */}
}

function takePending(): DashboardNavTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as DashboardNavTarget;
  } catch {
    return null;
  }
}

export function emitDashboardNav(target: Omit<DashboardNavTarget, "token">) {
  counter += 1;
  const enriched: DashboardNavTarget = { ...target, token: counter };
  if (listeners.size === 0) savePending(enriched);
  listeners.forEach((h) => h(enriched));
}

export function subscribeDashboardNav(handler: Handler): () => void {
  listeners.add(handler);
  const pending = takePending();
  if (pending) window.setTimeout(() => handler({ ...pending, token: pending.token ?? ++counter }), 0);
  return () => { listeners.delete(handler); };
}
