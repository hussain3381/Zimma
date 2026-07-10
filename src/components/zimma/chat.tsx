import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Loader2, Send, MessageSquare, ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

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

type PeerInfo = { id: string; name: string; avatar: string | null; subtitle?: string | null };

/** Public helper — customer opens (or creates) a thread with a provider. Returns conversation id. */
export async function openConversationWithProvider(providerId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", { _provider_id: providerId });
  if (error) { toast.error(error.message); return null; }
  return data as unknown as string;
}

/** Live unread count for the current user (across all their conversations). */
export function useUnreadMessageCount() {
  const { authUser } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!authUser) { setCount(0); return; }
    // messages I did not send and haven't marked read, in conversations I'm part of.
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, read_at, conversation_id, conversations!inner(customer_id, provider_id)")
      .is("read_at", null)
      .neq("sender_id", authUser.id);
    setCount((data ?? []).length);
  }, [authUser?.id]);

  useEffect(() => {
    refresh();
    if (!authUser) return;
    const ch = supabase
      .channel(`unread-${authUser.id}`)
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

  const load = useCallback(async () => {
    if (!authUser) { setRows([]); return; }
    const filterCol = role === "customer" ? "customer_id" : "provider_id";
    const { data } = await supabase.from("conversations").select("*")
      .eq(filterCol, authUser.id)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    const list = (data ?? []) as ConversationRow[];
    setRows(list);
    // fetch peer identities
    const peerIds = Array.from(new Set(list.map((c) => (role === "customer" ? c.provider_id : c.customer_id))));
    if (peerIds.length === 0) { setPeers({}); return; }
    if (role === "customer") {
      const { data: provs } = await supabase.from("providers").select("id, name, avatar_url, profession").in("id", peerIds);
      const map: Record<string, PeerInfo> = {};
      (provs ?? []).forEach((p) => { map[p.id] = { id: p.id, name: p.name, avatar: p.avatar_url, subtitle: p.profession }; });
      setPeers(map);
    } else {
      const { data: custs } = await supabase.from("customer_profiles").select("id, name, email").in("id", peerIds);
      const map: Record<string, PeerInfo> = {};
      (custs ?? []).forEach((c) => { map[c.id] = { id: c.id, name: c.name, avatar: null, subtitle: c.email }; });
      setPeers(map);
    }
  }, [authUser?.id, role]);

  useEffect(() => {
    load();
    if (!authUser) return;
    const filterCol = role === "customer" ? "customer_id" : "provider_id";
    const ch = supabase
      .channel(`conv-${role}-${authUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `${filterCol}=eq.${authUser.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [authUser?.id, role, load]);

  return { rows, peers, reload: load };
}

function useMessages(conversationId: string | null) {
  const { authUser } = useAuth();
  const [rows, setRows] = useState<MessageRow[] | null>(null);

  useEffect(() => {
    if (!conversationId) { setRows(null); return; }
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("messages").select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (mounted) setRows((data ?? []) as MessageRow[]);
    })();
    const ch = supabase
      .channel(`msgs-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const m = payload.new as MessageRow;
        setRows((prev) => (prev ? [...prev.filter((x) => x.id !== m.id), m] : [m]));
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [conversationId]);

  // Mark unread messages (not sent by me) as read on open / when new arrive.
  useEffect(() => {
    if (!conversationId || !authUser || !rows) return;
    const unreadIds = rows.filter((m) => !m.read_at && m.sender_id !== authUser.id).map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds).then(({ error }) => {
      if (error) console.warn("mark read failed", error.message);
    });
  }, [rows, conversationId, authUser?.id]);

  return rows;
}

export function ChatInbox({ role }: { role: Role }) {
  const { authUser } = useAuth();
  const { rows, peers } = useConversations(role);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = rows ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const peer = peers[role === "customer" ? c.provider_id : c.customer_id];
      return peer?.name?.toLowerCase().includes(q) || (c.last_message_preview ?? "").toLowerCase().includes(q);
    });
  }, [rows, peers, query, role]);

  const active = activeId ? rows?.find((c) => c.id === activeId) ?? null : null;
  const activePeer = active ? peers[role === "customer" ? active.provider_id : active.customer_id] : null;

  if (!authUser) return null;

  return (
    <Card className="grid h-[calc(100vh-12rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-2xl border-border shadow-soft md:grid-cols-[320px_1fr]">
      <aside className={`flex flex-col border-r border-border bg-muted/30 ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations…" className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rows === null ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No conversations yet.
              {role === "customer" && <div className="mt-1 text-xs">Open a pro's profile and tap Message to start chatting.</div>}
            </div>
          ) : (
            filtered.map((c) => {
              const peer = peers[role === "customer" ? c.provider_id : c.customer_id];
              const selected = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition hover:bg-accent ${selected ? "bg-accent" : ""}`}
                >
                  <img
                    src={peer?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer?.name ?? "?")}&backgroundColor=2563eb`}
                    alt={peer?.name ?? "Peer"}
                    className="h-10 w-10 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{peer?.name ?? "Unknown"}</p>
                      {c.last_message_at && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatWhen(c.last_message_at)}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.last_message_preview ?? peer?.subtitle ?? "Start the conversation"}</p>
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
            <div>
              <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">Pick a conversation to start messaging.</p>
            </div>
          </div>
        )}
      </section>
    </Card>
  );
}

function ChatThread({ conversationId, peer, onBack }: { conversationId: string; peer: PeerInfo; onBack: () => void }) {
  const { authUser } = useAuth();
  const messages = useMessages(conversationId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !authUser || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: authUser.id,
      body,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft("");
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
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
          <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">Say hi — messages are private between you two.</p>
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
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={4000}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
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
