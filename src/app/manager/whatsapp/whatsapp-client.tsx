"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Edit3, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { QueuedMessage } from "@/lib/messaging";

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function WhatsAppClient({
  initialMessages,
  initialSummary,
}: {
  initialMessages: QueuedMessage[];
  initialSummary: { queued: number; sent: number };
}) {
  const [messages, setMessages] = useState<QueuedMessage[]>(initialMessages);
  const [summary, setSummary] = useState(initialSummary);
  const [filter, setFilter] = useState<"queued" | "sent" | "all">("queued");
  const filtered = filter === "all" ? messages : messages.filter(m => m.status === filter);
  const [isPending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedBodies, setEditedBodies] = useState<Record<number, string>>({});
  const [scheduledAt, setScheduledAt] = useState<Record<number, string>>({});

  const refresh = async () => {
    const res = await fetch("/api/messages/queue", { cache: "no-store" });
    const data = await res.json();
    setMessages(data.messages);
    setSummary(data.summary);
  };

  const defaultScheduled = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const sendOne = (id: number) => {
    start(async () => {
      const body = editedBodies[id];
      const scheduled = scheduledAt[id];
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], edited_body: body, scheduled_at: scheduled }),
      });
      setEditingId(null);
      await refresh();
    });
  };

  const sendAll = () => {
    const ids = filtered.filter(m => m.status === "queued").map(m => m.id);
    if (!ids.length) return;
    start(async () => {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      await refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>WhatsApp Campaign Queue</CardTitle>
            <CardDescription>Edit messages, set send time, then dispatch. Production connects to Make.com webhook.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent">Queued: {summary.queued}</Badge>
            <Badge variant="success">Sent: {summary.sent}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill active={filter === "queued"} onClick={() => setFilter("queued")}>Queued</FilterPill>
          <FilterPill active={filter === "sent"} onClick={() => setFilter("sent")}>Sent</FilterPill>
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>All</FilterPill>
          {filter === "queued" && filtered.length > 0 && (
            <Button onClick={sendAll} disabled={isPending} className="ml-auto" size="sm">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send all {filtered.length} to WhatsApp
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing in this view yet. Generate drafts from the Cohort Engine.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const isEditing = editingId === m.id;
              const body = editedBodies[m.id] ?? m.message_body;
              const sched = scheduledAt[m.id] ?? defaultScheduled();
              return (
                <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-secondary/30">
                    <div>
                      <div className="text-sm font-semibold">{m.patient_name}</div>
                      <div className="text-xs text-muted-foreground">{m.phone}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">{m.discount_code}</Badge>
                      <Badge variant="outline" className="text-[10px]">KYA-{String(m.patient_id).padStart(5,"0")}</Badge>
                      <Badge variant="outline" className="text-[10px]">{m.cohort_name}</Badge>
                      <Badge variant={m.status === "sent" ? "success" : "accent"}>{m.status}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {isEditing ? (
                      <Textarea value={body} onChange={e => setEditedBodies(p => ({ ...p, [m.id]: e.target.value }))} rows={6} className="text-sm font-mono" />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed bg-secondary/20 rounded-lg p-3">{body}</div>
                    )}
                    {m.status === "queued" && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" /><span>Send at:</span>
                        </div>
                        <input
                          type="datetime-local"
                          value={sched}
                          onChange={e => setScheduledAt(p => ({ ...p, [m.id]: e.target.value }))}
                          className="text-xs rounded-md border border-input bg-background px-2 py-1 text-foreground"
                        />
                        <div className="flex items-center gap-2 ml-auto">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingId(isEditing ? null : m.id);
                            if (!isEditing && !editedBodies[m.id]) setEditedBodies(p => ({ ...p, [m.id]: m.message_body }));
                          }}>
                            <Edit3 className="h-3.5 w-3.5 mr-1" />{isEditing ? "Done" : "Edit"}
                          </Button>
                          <Button size="sm" onClick={() => sendOne(m.id)} disabled={isPending}>
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {scheduledAt[m.id] ? "Schedule" : "Send now"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
