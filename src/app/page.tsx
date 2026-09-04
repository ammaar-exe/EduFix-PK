"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  ClipboardCheckIcon,
  ClockIcon,
  LanguagesIcon,
  LandmarkIcon,
  ListChecksIcon,
  NotebookPenIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";

import { ActivityLogDrawer } from "@/components/activity/ActivityLogDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MODULES,
  getDefaultModule,
  getVisibleModules,
  type ModuleId,
} from "@/lib/context-guard";
import { SUBJECTS, type SubjectId } from "@/lib/subjects";

/**
 * EduFix PK landing page with global Activity Log Drawer integration.
 */

const MODULE_BLURBS: Record<ModuleId, string> = {
  notes: "Revision notes generated from past-paper content for a chosen syllabus topic.",
  "answer-assistant":
    "A structured scaffold — key points and a paragraph outline — for a past-paper question.",
  "answer-checker":
    "Submit an answer, typed or photographed, for mark-scheme feedback, a level and a grade.",
};

// Decorative-only icon maps. These do not alter any routing or data.
const SUBJECT_ICONS: Record<SubjectId, LucideIcon> = {
  "pak-studies": LandmarkIcon,
  islamiyat: BookOpenTextIcon,
  urdu: LanguagesIcon,
};

const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  notes: NotebookPenIcon,
  "answer-assistant": ListChecksIcon,
  "answer-checker": ClipboardCheckIcon,
};

const TRUST_POINTS = [
  {
    icon: SparklesIcon,
    label: "Past-paper grounded",
    detail: "Retrieved from real CAIE papers.",
  },
  {
    icon: ShieldCheckIcon,
    label: "Subject-isolated",
    detail: "No cross-subject leakage.",
  },
  {
    icon: BookOpenTextIcon,
    label: "Honest by design",
    detail: "Says so when it can't answer.",
  },
];

export default function Home() {
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Ambient background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-accent)_0%,transparent_70%)] opacity-80 dark:opacity-50"
      />

      {/* Top Action Bar */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/edufix-logo.png"
          alt="EduFix PK"
          className="h-9 w-auto"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActivityOpen(true)}
          className="gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <ClockIcon className="size-4 text-muted-foreground" />
          <span>My Activity</span>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 pb-20 pt-10 sm:pt-14">
        {/* Hero */}
        <header className="flex flex-col items-center gap-6 text-center duration-700 animate-in fade-in slide-in-from-bottom-4">
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
          >
            <SparklesIcon className="size-3.5 text-brand-muted" />
            CAIE O Levels · Pakistan
          </Badge>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edufix-logo.png"
            alt="EduFix PK"
            className="h-28 w-auto drop-shadow-sm sm:h-32"
          />

          <h1 className="max-w-3xl text-balance font-heading text-4xl uppercase tracking-tight text-foreground sm:text-5xl">
            Study smarter for CAIE O Levels
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Past-paper-grounded AI study support for Pakistan Studies, Islamiyat
            and Urdu. Every note, scaffold and grade is retrieved from real CAIE
            past papers and mark schemes — and if the knowledge base can&apos;t
            support an answer, EduFix says so instead of inventing one.
          </p>

          <div className="mt-2 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="group gap-2 bg-primary px-5 text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-95"
            >
              <Link href="#subjects">
                Choose a subject
                <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div
                key={point.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:border-primary/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-muted">
                  <point.icon className="size-4.5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {point.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {point.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </header>

        {/* Subjects */}
        <section id="subjects" className="flex scroll-mt-8 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground">
              Choose a subject
            </h2>
            <p className="text-sm text-muted-foreground">
              Three subjects, three modules each. Urdu renders right-to-left.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((subject) => {
              const SubjectIcon = SUBJECT_ICONS[subject.id];
              return (
                <Card
                  key={subject.id}
                  className="group relative gap-5 py-6 transition-all duration-300 hover:-translate-y-1 hover:ring-primary/40 hover:shadow-[0_16px_48px_-16px_var(--color-brand)]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand to-brand-muted transition-transform duration-300 group-hover:scale-x-100"
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <SubjectIcon className="size-5.5" />
                      </span>
                      {subject.dir === "rtl" ? (
                        <Badge variant="outline" className="rounded-full">
                          RTL
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="mt-3 text-lg">{subject.name}</CardTitle>
                    <CardDescription>Subject code {subject.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {getVisibleModules(subject.id).map((module) => {
                      const isPrimary =
                        module.id === getDefaultModule(subject.id);
                      const ModuleIcon = MODULE_ICONS[module.id];
                      return (
                        <Button
                          key={module.id}
                          asChild
                          size="lg"
                          variant={isPrimary ? "default" : "outline"}
                          className={
                            isPrimary
                              ? "group/btn w-full justify-between bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                              : "group/btn w-full justify-between transition-all duration-200 hover:border-primary/50 active:scale-[0.98]"
                          }
                        >
                          <Link href={`/${subject.id}/${module.id}`}>
                            <span className="flex items-center gap-2">
                              <ModuleIcon className="size-4" />
                              {module.label}
                            </span>
                            <ArrowRightIcon className="size-4 opacity-0 transition-all duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:opacity-100" />
                          </Link>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Modules explainer */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground">
              What each module does
            </h2>
            <p className="text-sm text-muted-foreground">
              A consistent, past-paper-first workflow across every subject.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MODULES.map((module) => {
              const ModuleIcon = MODULE_ICONS[module.id];
              return (
                <div
                  key={module.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_48px_-20px_var(--color-brand)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ModuleIcon className="size-5" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">
                    {module.label}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {MODULE_BLURBS[module.id]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto w-full max-w-6xl px-6 text-xs text-muted-foreground">
          EduFix PK — grounded in CAIE past papers and mark schemes. Retrieval is
          subject-isolated; no answer is generated without a source.
        </div>
      </footer>

      {/* Activity Log Drawer */}
      <ActivityLogDrawer
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />
    </div>
  );
}
