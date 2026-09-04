"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { NotesResults } from "@/components/notes/NotesResults";
import { TopicSelector } from "@/components/notes/TopicSelector";
import { getTopicOptions, type SubjectTaxonomy } from "@/lib/kb/topics";
import type { NotesApiResponse, NotesPayload } from "@/lib/notes/types";
import { logActivity } from "@/lib/supabase/activity";

interface NotesStudioProps {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  taxonomy: SubjectTaxonomy;
}

type Status = "idle" | "loading" | "error" | "success";

/** Lightweight placeholder shown during the first generation. */
function NotesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-live="polite">
      {[0, 1, 2, 3].map((card) => (
        <div
          key={card}
          className="h-40 animate-pulse rounded-xl bg-muted/60 ring-1 ring-foreground/5"
        />
      ))}
    </div>
  );
}

/**
 * Notes module client orchestrator: owns the topic selection and generation
 * lifecycle, calls the context-isolated route `POST /api/[subject]/notes`, and
 * renders the structured Note Cards. The subject is fixed by the route and can
 * never be overridden from the client (rules.md §2).
 */
export function NotesStudio({
  subjectId,
  subjectName,
  subjectCode,
  taxonomy,
}: NotesStudioProps) {
  const searchParams = useSearchParams();
  const firstPaperId = taxonomy.papers[0]?.id ?? "all";
  const [paperId, setPaperId] = useState<string>(firstPaperId);
  const [topicId, setTopicId] = useState<string>(
    () => getTopicOptions(taxonomy, firstPaperId)[0]?.id ?? ""
  );
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<NotesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Phase B: rehydrate from activityId query param
  useEffect(() => {
    const activityId = searchParams.get("activityId");
    if (!activityId) return;

    (async () => {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createSupabaseBrowserClient();
        const { data, error: fetchError } = await supabase
          .from("user_activities")
          .select("prompt_payload, result_payload")
          .eq("id", activityId)
          .single();

        if (fetchError || !data) return;

        const prompt = data.prompt_payload as {
          paperId?: string;
          topicId?: string;
        } | null;
        const result = data.result_payload as NotesPayload | null;

        if (prompt?.paperId) setPaperId(prompt.paperId);
        if (prompt?.topicId) setTopicId(prompt.topicId);
        if (result) {
          setResult(result);
          setStatus("success");
        }
      } catch {
        // Rehydration failure must never affect the core generation flow.
      }
    })();
  }, [searchParams]);

  function handlePaperChange(nextPaperId: string) {
    setPaperId(nextPaperId);
    // Keep a valid topic selected for the new paper scope.
    setTopicId(getTopicOptions(taxonomy, nextPaperId)[0]?.id ?? "");
  }

  async function generate() {
    if (!topicId) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch(`/api/${subjectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperCode: paperId, topicId }),
      });
      const json = (await response.json()) as NotesApiResponse;
      if (!response.ok || !json.ok) {
        const message = json.ok
          ? `Request failed with status ${response.status}.`
          : json.error.message;
        throw new Error(message);
      }
      setResult(json.data);
      setStatus("success");

      // Phase A: fire-and-forget activity log — never blocks UI.
      (async () => {
        try {
          const { createSupabaseBrowserClient } = await import(
            "@/lib/supabase/client"
          );
          const supabase = createSupabaseBrowserClient();
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;
          if (!userId) return;

          const topicLabel =
            getTopicOptions(taxonomy, paperId).find((t) => t.id === topicId)
              ?.title ?? topicId;

          logActivity({
            userId,
            featureType: "notes",
            title: `Notes — ${topicLabel}`,
            promptPayload: { paperId, topicId },
            resultPayload: json.data,
          });
        } catch {
          // Logging failures are silently ignored.
        }
      })();
    } catch (err) {
      setResult(null);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to generate notes."
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <TopicSelector
        subjectName={subjectName}
        subjectCode={subjectCode}
        taxonomy={taxonomy}
        paperId={paperId}
        topicId={topicId}
        isGenerating={status === "loading"}
        onPaperChange={handlePaperChange}
        onTopicChange={setTopicId}
        onGenerate={generate}
      />

      {status === "loading" && !result ? <NotesSkeleton /> : null}

      {result ? (
        <div
          className={
            status === "loading"
              ? "pointer-events-none opacity-60 transition-opacity"
              : undefined
          }
        >
          <NotesResults
            payload={result}
            isGenerating={status === "loading"}
            onRegenerate={generate}
          />
        </div>
      ) : null}

      {status === "error" && error ? (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-medium text-destructive">Could not generate notes</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {status === "idle" ? (
        <p className="text-sm text-muted-foreground">
          Select a paper and topic, then generate revision notes grounded
          strictly in the official CAIE knowledge base.
        </p>
      ) : null}
    </div>
  );
}
