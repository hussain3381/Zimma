import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Loader2, Send, MessageSquare, ArrowLeft, Search, AlertCircle, RotateCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { emitDashboardNav } from "@/lib/dashboard-nav";

type Role = "customer" | "provider";

export type ConversationRow = {
  id: string;
  customer_id: string;
  provider_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type PeerInfo = { id: string; name: string; avatar: string | null; subtitle?: string | null; phone?: string | null; email?: string | null };

// Wrapper: calling `supabase.rpc` through an aliased reference loses the
// internal `this` binding (throws "Cannot read properties of undefined (reading 'rest')").
// Always invoke it as a method on the supabase proxy.
async function callRpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: { message?: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (supabase.rpc as any)(fn, args);
  return res as { data: T | null; error: { message?: string } | null };
}

function friendlyChatError(message?: string) {
  const raw = (message || "").toLowerCase();
  if (raw.includes("not authenticated") || raw.includes("sign in")) return "Please sign in again to send messages.";
  if (raw.includes("conversation not found")) return "Conversation not found — reopen it from your inbox.";
  if (raw.includes("own conversations") || raw.includes("row-level") || raw.includes("permission") || raw.includes("policy")) {
    return "This chat belongs to another account. Reopen the correct conversation from your inbox.";
  }
  if (raw.includes("network") || raw.includes("failed to fetch")) return "Network issue — your message didn't send. Please retry.";
  return message || "Couldn't send your message. Please try again.";
}

/** Public helper — customer opens (or creates) a thread with a provider. Returns conversation id. */
export async function openConversationWithProvider(providerId: string): Promise<string | null> {
  const { data, error } = await callRpc<string>("get_or_create_conversation", { _provider_id: providerId });
  if (error) { toast.error(friendlyChatError(error.message)); return null; }
  return data as unknown as string;
}

/** Provider opens (or creates) a thread with a customer who has booked them. */
export async function openConversationWithCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await callRpc<string>("provider_get_or_create_conversation", { _customer_id: customerId });
  if (error) { toast.error(friendlyChatError(error.message)); return null; }
  return data as unknown as string;
}

/** Live unread count for the current user (across all their conversations). */
export function useUnreadMessageCount() {
  const { authUser } = useAuth();
  const [count, setCount] = useState(0);
  const iidRef = useRef<string>(Math.random().toString(36).slice(2, 10));

  const refresh = useCallback(async () => {
    if (!authUser) { setCount(0); return; }
    // messages I did not send and haven't marked read, in conversations I'm part of.
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, read_at, conversation_id, conversations!inner(customer_id, provider_id)")
      .is("read_at", null)
      .neq("sender_id", authUser.id);
    if (error) { setCount(0); return; }
    setCount((data ?? []).length);
  }, [authUser?.id]);

  useEffect(() => {
    refresh();
    if (!authUser) return;
    const ch = supabase
      .channel(`unread-${authUser.id}-${iidRef.current}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, refresh]);

  return count;
}

function useConversations(role: Role) {
  const { authUser } = useAuth();
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const iidRef = useRef<string>(Math.random().toString(36).slice(2, 10));

  const load = useCallback(async () => {
    if (!authUser) { setRows([]); return; }
    const filterCol = role === "customer" ? "customer_id" : "provider_id";
    const { data, error } = await supabase.from("conversations").select("*")
      .eq(filterCol, authUser.id)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) {
      setRows([]);
      setPeers({});
      toast.error(friendlyChatError(error.message));
      return;
    }
    const list = (data ?? []) as ConversationRow[];
    setRows(list);
    // fetch peer identities
    const peerIds = Array.from(new Set(list.map((c) => (role === "customer" ? c.provider_id : c.customer_id))));
    if (peerIds.length === 0) { setPeers({}); return; }
    if (role === "customer") {
      const { data: provs, error: provError } = await supabase.from("providers").select("id, name, avatar_url, profession").in("id", peerIds);
      const map: Record<string, PeerInfo> = {};
      if (provError) {
        peerIds.forEach((id) => { map[id] = { id, name: "Service provider", avatar: null, subtitle: "Profile unavailable" }; });
        setPeers(map);
        return;
      }
      (provs ?? []).forEach((p) => { map[p.id] = { id: p.id, name: p.name, avatar: p.avatar_url, subtitle: p.profession }; });
      setPeers(map);
    } else {
      const { data: custsRaw, error: custError } = await callRpc<Array<{ id: string; name: string; phone: string | null; email: string | null }>>("get_chat_customer_profiles", { _ids: peerIds });
      const custs = (custsRaw ?? []) as Array<{ id: string; name: string; phone: string | null; email: string | null }>;
      const map: Record<string, PeerInfo> = {};
      if (custError) {
        peerIds.forEach((id) => { map[id] = { id, name: "Customer", avatar: null, subtitle: "Profile unavailable" }; });
        setPeers(map);
        return;
      }
      custs.forEach((c) => {
        const displayName = (c.name && c.name.trim()) || (c.email ? c.email.split("@")[0] : "") || "Customer";
        const subtitle = c.phone ? `ID · ${c.phone}` : c.email ? c.email : "Customer";
        map[c.id] = { id: c.id, name: displayName, avatar: null, subtitle, phone: c.phone, email: c.email };
      });
      setPeers(map);
    }
  }, [authUser?.id, role]);

  useEffect(() => {
    load();
    if (!authUser) return;
    const filterCol = role === "customer" ? "customer_id" : "provider_id";
    const ch = supabase
      .channel(`conv-${role}-${authUser.id}-${iidRef.current}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `${filterCol}=eq.${authUser.id}` }, load)
      // New messages update conversation previews/timestamps but may fire before conversations UPDATE lands — refresh list too.
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, role, load]);

  return { rows, peers, reload: load };
}

function useMessages(conversationId: string | null) {
  const { authUser } = useAuth();
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const iidRef = useRef<string>(Math.random().toString(36).slice(2, 10));
  const append = useCallback((m: MessageRow) => {
    setRows((prev) => (prev ? [...prev.filter((x) => x.id !== m.id), m] : [m]));
  }, []);

  useEffect(() => {
    if (!conversationId) { setRows(null); return; }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("messages").select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) {
        if (mounted) {
          setRows([]);
          toast.error(friendlyChatError(error.message));
        }
        return;
      }
      if (mounted) setRows((data ?? []) as MessageRow[]);
    })();
    const ch = supabase
      .channel(`msgs-${conversationId}-${iidRef.current}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as MessageRow;
        append(m);
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [conversationId, append]);

  // Mark unread messages (not sent by me) as read on open / when new arrive.
  useEffect(() => {
    if (!conversationId || !authUser || !rows) return;
    const unreadIds = rows.filter((m) => !m.read_at && m.sender_id !== authUser.id).map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds).then(({ error }) => {
      if (error) console.warn("mark read failed", error.message);
    });
  }, [rows, conversationId, authUser?.id]);

  return { rows, append };
}

export function ChatInbox({ role, focusConversationId, focusToken }: { role: Role; focusConversationId?: string; focusToken?: number }) {
  const { authUser } = useAuth();
  const { rows, peers } = useConversations(role);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Deep-link: when the notification center asks us to focus a thread, select it as soon as it appears in the list.
  useEffect(() => {
    if (!focusConversationId) return;
    if (rows?.some((c) => c.id === focusConversationId)) {
      setActiveId(focusConversationId);
    }
  }, [focusConversationId, focusToken, rows]);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const peer = peers[role === "customer" ? c.provider_id : c.customer_id];
      return (
        peer?.name?.toLowerCase().includes(q) ||
        (peer?.phone ?? "").toLowerCase().includes(q) ||
        (peer?.email ?? "").toLowerCase().includes(q) ||
        (peer?.subtitle ?? "").toLowerCase().includes(q) ||
        (c.last_message_preview ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, peers, query, role]);

  const active = activeId ? rows?.find((c) => c.id === activeId) ?? null : null;
  const activePeerId = active ? (role === "customer" ? active.provider_id : active.customer_id) : null;
  const activePeer = activePeerId ? peers[activePeerId] ?? {
    id: activePeerId,
    name: role === "provider" ? "Customer" : "Service provider",
    avatar: null,
    subtitle: "Loading profile…",
  } : null;

  if (!authUser) return null;

  return (
    <Card className="grid h-[calc(100vh-12rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border-border shadow-soft md:grid-cols-[320px_1fr]">
      <aside className={`flex flex-col border-r border-border bg-muted/30 ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={role === "provider" ? "Search by name, phone, or message…" : "Search by pro, service, or message…"}
              className="pl-9 pr-9"
              aria-label="Search conversations"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {rows && rows.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {query ? `${filtered.length} of ${rows.length} conversations` : `${rows.length} conversation${rows.length === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {rows === null ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted/70" />
                  </div>
                </div>
              ))}
              <p className="pt-2 text-center text-xs text-muted-foreground">Loading your conversations…</p>
            </div>
          ) : filtered.length === 0 && query ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No conversations match “{query}”.
              <button onClick={() => setQuery("")} className="mt-2 block w-full text-xs font-medium text-primary hover:underline">Clear search</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="font-medium text-foreground">No conversations yet</p>
              {role === "customer" && <p className="mt-1 text-xs">Open a pro's profile and tap <span className="font-medium">Message</span> to start chatting.</p>}
              {role === "provider" && <p className="mt-1 text-xs">Open <span className="font-medium">Jobs</span> and tap <span className="font-medium">Message</span> on a customer booking.</p>}
            </div>
          ) : (
            filtered.map((c) => {
              const peerId = role === "customer" ? c.provider_id : c.customer_id;
              const peer = peers[peerId] ?? {
                id: peerId,
                name: role === "provider" ? "Customer" : "Service provider",
                avatar: null,
                subtitle: "Loading profile…",
              };
              const selected = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition hover:bg-accent ${selected ? "bg-accent" : ""}`}
                >
                  <img
                    src={peer.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name)}&backgroundColor=2563eb`}
                    alt={peer.name}
                    className="h-10 w-10 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{peer.name}</p>
                      {c.last_message_at && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatWhen(c.last_message_at)}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.last_message_preview ?? peer.subtitle ?? "Start the conversation"}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={`flex min-w-0 flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {active && activePeer ? (
          <ChatThread
            conversationId={active.id}
            peer={activePeer}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
            <div className="max-w-xs">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-foreground">Pick a conversation</p>
              <p className="mt-1 text-xs">Select a chat from the list to view messages, or search by {role === "provider" ? "customer name or phone" : "pro name"}.</p>
            </div>
          </div>
        )}
      </section>
    </Card>
  );
}

function ChatThread({ conversationId, peer, onBack }: { conversationId: string; peer: PeerInfo; onBack: () => void }) {
  const { authUser } = useAuth();
  const { rows: messages, append } = useMessages(conversationId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<{ id: string; body: string; error: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, failed?.id]);

  // Clear stale failed state when switching threads
  useEffect(() => { setFailed(null); }, [conversationId]);

  const sendBody = useCallback(async (body: string): Promise<boolean> => {
    if (!authUser) { toast.error("Please sign in again to send messages."); return false; }
    setSending(true);
    try {
      const { data, error } = await callRpc<MessageRow>("send_conversation_message", { _conversation_id: conversationId, _body: body });
      if (error) {
        const friendly = friendlyChatError(error.message);
        setFailed({ id: `fail-${Date.now()}`, body, error: friendly });
        toast.error(friendly);
        return false;
      }
      if (data) append(data);
      emitDashboardNav({ tab: "Messages", conversationId });
      return true;
    } catch (err) {
      const friendly = friendlyChatError(err instanceof Error ? err.message : undefined);
      setFailed({ id: `fail-${Date.now()}`, body, error: friendly });
      toast.error(friendly);
      return false;
    } finally {
      setSending(false);
    }
  }, [authUser, conversationId, append]);

  const send = async () => {
    if (sending) return;
    const body = draft.trim();
    if (!body) { toast.error("Type a message before sending."); return; }
    if (body.length > 4000) { toast.error("Messages are limited to 4000 characters."); return; }
    const ok = await sendBody(body);
    if (ok) { setDraft(""); setFailed(null); }
  };

  const retryFailed = async () => {
    if (!failed || sending) return;
    const body = failed.body;
    const ok = await sendBody(body);
    if (ok) setFailed(null);
  };

  const canSend = Boolean(authUser) && draft.trim().length > 0 && !sending;
  const charCount = draft.length;
  const overLimit = charCount > 4000;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3  ">
        <button onClick={onBack} className="md:hidden"><ArrowLeft className="h-5 w-5" /></button>
        <img
          src={peer.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name)}&backgroundColor=2563eb`}
          alt={peer.name}
          className="h-9 w-9 rounded-xl"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peer.name}</p>
          {peer.subtitle && <p className="truncate text-xs text-muted-foreground">{peer.subtitle}</p>}
        </div>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/20 px-4 py-4">
        {messages === null ? (
          <div className="space-y-3 py-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className={`h-8 animate-pulse rounded-2xl bg-muted ${i === 0 ? "w-40" : i === 1 ? "w-56" : "w-32"}`} />
              </div>
            ))}
            <p className="pt-2 text-center text-xs text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="pt-10 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="font-medium text-foreground">Start the conversation</p>
            <p className="mt-1 text-xs">Say hi to {peer.name} — messages are private between you two.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === authUser?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatWhen(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        {failed && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
              <p className="whitespace-pre-wrap break-words text-foreground/90">{failed.body}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3" /> Not delivered — {failed.error}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="destructive" onClick={retryFailed} disabled={sending} className="h-7 gap-1 px-2 text-xs">
                  {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />} Retry
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(failed.body); setFailed(null); }} className="h-7 gap-1 px-2 text-xs">
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFailed(null)} className="h-7 gap-1 px-2 text-xs" aria-label="Dismiss failed message">
                  <X className="h-3 w-3" /> Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex flex-col gap-2 border-t border-border p-3"
      >
        {!authUser && (
          <p className="flex items-center gap-1 text-xs font-medium text-destructive"><AlertCircle className="h-3.5 w-3.5" /> Your session expired — please sign in again to send a message.</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={authUser ? "Type a message…" : "Sign in to send messages"}
            maxLength={4000}
            disabled={sending || !authUser}
            aria-invalid={overLimit}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend || overLimit}
            title={!authUser ? "Sign in to send" : !draft.trim() ? "Type a message first" : "Send message"}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Press Enter to send · Shift+Enter for a new line</span>
          <span className={overLimit ? "font-medium text-destructive" : charCount > 3600 ? "text-amber-600 dark:text-amber-400" : ""}>
            {charCount}/4000
          </span>
        </div>
      </form>
    </>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
