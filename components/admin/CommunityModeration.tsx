"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, SelectField, Section } from "@/components/admin/ui";

type CommentStatus = "review" | "visible" | "hidden" | "all";

interface AdminComment {
  id: string;
  target?: "player" | "team";
  body: string;
  status: Exclude<CommentStatus, "all">;
  created_at: string;
  players?: { id?: string; ign?: string | null } | { id?: string; ign?: string | null }[] | null;
  fan_profiles?:
    | { display_name?: string | null; avatar_url?: string | null; provider?: string | null }
    | { display_name?: string | null; avatar_url?: string | null; provider?: string | null }[]
    | null;
  moderation?: {
    status: "visible" | "review";
    categories: string[];
  };
}

const STATUS_OPTIONS: { value: CommentStatus; label: string }[] = [
  { value: "review", label: "Review Queue" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
];

const STATUS_STYLE = {
  review: "border-amethyst/50 bg-amethyst/10 text-glow",
  visible: "border-win/50 bg-win/10 text-win",
  hidden: "border-loss/50 bg-loss/10 text-loss",
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CommunityModeration() {
  const [status, setStatus] = useState<CommentStatus>("review");
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    return comments.reduce(
      (acc, comment) => {
        acc[comment.status] += 1;
        return acc;
      },
      { review: 0, visible: 0, hidden: 0 }
    );
  }, [comments]);

  async function load(nextStatus = status) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/community-comments?status=${nextStatus}`, { cache: "no-store" });
      const json = (await res.json()) as { comments?: AdminComment[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load comments.");
      setComments(json.comments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load comments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function updateStatus(comment: AdminComment, nextStatus: "visible" | "review" | "hidden") {
    setSavingId(`${comment.target ?? "player"}:${comment.id}`);
    setError("");
    try {
      const res = await fetch("/api/admin/community-comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: comment.id, status: nextStatus, target: comment.target ?? "player" }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not update comment.");
      await load(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update comment.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-5">
      <Section
        title="Community Moderation"
        hint="Hide + review queue for fan comments on player profile pages."
        defaultOpen
        collapsible={false}
        action={<Button onClick={() => load(status)} disabled={loading}>Refresh</Button>}
      >
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <SelectField
            label="Comment status"
            value={status}
            onChange={(value) => setStatus(value as CommentStatus)}
            options={STATUS_OPTIONS}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {(["review", "visible", "hidden"] as const).map((item) => (
              <div key={item} className={`border px-4 py-3 ${STATUS_STYLE[item]}`}>
                <p className="font-display text-2xl font-black uppercase">{counts[item]}</p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {error && <p className="border border-loss/40 bg-loss/10 px-4 py-3 font-mono text-xs text-loss">{error}</p>}

      <div className="space-y-3">
        {loading ? (
          <Card>
            <p className="font-mono text-sm text-ash">Loading comments...</p>
          </Card>
        ) : comments.length === 0 ? (
          <Card>
            <p className="font-mono text-sm text-ash">No comments in this queue.</p>
          </Card>
        ) : (
          comments.map((comment) => {
            const player = one(comment.players);
            const profile = one(comment.fan_profiles);
            const targetLabel = comment.target === "team" ? "Team" : "Player";
            const targetName = comment.target === "team" ? "NIIGHTMARE" : player?.ign || "Unknown";
            const saveKey = `${comment.target ?? "player"}:${comment.id}`;
            return (
              <Card key={saveKey} className="bg-crypt/70">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLE[comment.status]}`}>
                        {comment.status}
                      </span>
                      <span className="border border-amethyst/40 bg-amethyst/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-glow">
                        {targetLabel}
                      </span>
                      {comment.moderation?.categories?.map((category) => (
                        <span key={category} className="border border-edge bg-void/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ash">
                          {category}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-soul">{comment.body}</p>
                    <p className="mt-3 font-mono text-[11px] text-ash">
                      {targetLabel}: <span className="text-spectre">{targetName}</span> · Fan:{" "}
                      <span className="text-spectre">{profile?.display_name || "NIIGHTMARE Fan"}</span> ·{" "}
                      {dateLabel(comment.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {comment.status !== "visible" && (
                      <Button
                        variant="primary"
                        onClick={() => updateStatus(comment, "visible")}
                        disabled={savingId === saveKey}
                      >
                        Approve
                      </Button>
                    )}
                    {comment.status !== "review" && (
                      <Button onClick={() => updateStatus(comment, "review")} disabled={savingId === saveKey}>
                        Review
                      </Button>
                    )}
                    {comment.status !== "hidden" && (
                      <Button
                        variant="danger"
                        onClick={() => updateStatus(comment, "hidden")}
                        disabled={savingId === saveKey}
                      >
                        Hide
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
