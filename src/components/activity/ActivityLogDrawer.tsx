"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { useRouter } from "next/navigation";
import { ClockIcon, Trash2Icon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeatureType = "notes" | "answer_assistant" | "answer_checker";

interface ActivityRow {
  id: string;
  feature_type: FeatureType;
  title: string;
  created_at: string;
}

// Navigate to the most-recently-stored subject, falling back to the first known subject.
const FEATURE_PATH: Record<FeatureType, string> = {
  notes: "notes",
  answer_assistant: "answer-assistant",
  answer_checker: "answer-checker",
};

const FEATURE_LABEL: Record<FeatureType, string> = {
  notes: "Notes",
  answer_assistant: "Answer Assistant",
  answer_checker: "Answer Checker",
};

const FEATURE_BADGE_CLASS: Record<FeatureType, string> = {
  notes:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
  answer_assistant:
    "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-800",
  answer_checker:
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-800",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function getActiveSubject(): string {
  try {
    return localStorage.getItem("edufixpk:lastSubject") ?? "pakistan-studies";
  } catch {
    return "pakistan-studies";
  }
}

// ---------------------------------------------------------------------------
// ActivityLogDrawer
// ---------------------------------------------------------------------------

interface ActivityLogDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ActivityLogDrawer({ open, onClose }: ActivityLogDrawerProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch activities whenever the drawer opens
  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    (async () => {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
          setRows([]);
          return;
        }
        const { data, error } = await supabase
          .from("user_activities")
          .select("id, feature_type, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Failed to fetch activity log:", error);
          setRows([]);
        } else {
          setRows((data ?? []) as ActivityRow[]);
        }
      } catch (e) {
        console.error("Unexpected error fetching activity log:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  function handleCardClick(row: ActivityRow) {
    const subject = getActiveSubject();
    const path = FEATURE_PATH[row.feature_type];
    router.push(`/${subject}/${path}?activityId=${row.id}`);
    onClose();
  }

  async function handleDelete(e: React.MouseEvent | React.KeyboardEvent, id: string) {
    e.stopPropagation();
    // Optimistic update
    setRows((prev) => prev.filter((r) => r.id !== id));
    try {
      const { createSupabaseBrowserClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("user_activities")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Failed to delete activity:", error);
      }
    } catch (e) {
      console.error("Unexpected error deleting activity:", e);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "duration-200"
          )}
        />

        {/* Panel — slides in from the right */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col",
            "bg-background shadow-xl ring-1 ring-border",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
            "duration-200 ease-out"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              <DialogPrimitive.Title className="text-sm font-semibold">
                My Activity
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              aria-label="Close activity log"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <ScrollAreaPrimitive.Root className="flex-1 overflow-hidden">
            <ScrollAreaPrimitive.Viewport className="h-full w-full">
              {loading ? (
                <div className="flex flex-col gap-2 p-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-muted/60"
                    />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                <ul className="flex flex-col gap-1 p-3">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => handleCardClick(row)}
                        className="group relative w-full rounded-lg border border-transparent px-3 py-2.5 text-start transition-colors hover:border-border hover:bg-accent focus-visible:outline-2 focus-visible:outline-emerald-600"
                      >
                        {/* Feature badge */}
                        <span
                          className={cn(
                            "mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            FEATURE_BADGE_CLASS[row.feature_type]
                          )}
                        >
                          {FEATURE_LABEL[row.feature_type]}
                        </span>

                        {/* Title */}
                        <p className="line-clamp-2 text-sm leading-snug text-foreground">
                          {row.title}
                        </p>

                        {/* Timestamp */}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimestamp(row.created_at)}
                        </p>

                        {/* Delete button — appears on hover */}
                        <span
                          role="button"
                          aria-label="Delete activity"
                          tabIndex={0}
                          onClick={(e) => handleDelete(e, row.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleDelete(e, row.id);
                            }
                          }}
                          className="absolute end-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollAreaPrimitive.Viewport>
            <ScrollAreaPrimitive.Scrollbar
              orientation="vertical"
              className="flex w-1.5 touch-none select-none p-px"
            >
              <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
            </ScrollAreaPrimitive.Scrollbar>
          </ScrollAreaPrimitive.Root>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
