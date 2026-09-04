"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckIcon, ChevronsUpDownIcon, ClockIcon, LogOutIcon, UserIcon } from "lucide-react";

import { ActivityLogDrawer } from "@/components/activity/ActivityLogDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getDefaultModule,
  getVisibleModules,
  isModuleId,
  isModuleVisible,
  type ModuleId,
} from "@/lib/context-guard";
import { SUBJECTS, isSubjectId, type SubjectId } from "@/lib/subjects";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// AccountBar — isolated client island for user state + drawer
// ---------------------------------------------------------------------------

interface AccountBarProps {
  currentSubject: SubjectId;
}

function AccountBar({ currentSubject }: AccountBarProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persist the last-visited subject so ActivityLogDrawer can redirect correctly.
  useEffect(() => {
    try {
      localStorage.setItem("edufixpk:lastSubject", currentSubject);
    } catch {
      // localStorage unavailable — silently ignore.
    }
  }, [currentSubject]);

  // Fetch the authenticated user's email once on mount.
  useEffect(() => {
    (async () => {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        setEmail(data.user?.email ?? null);
      } catch {
        // Auth fetch failure is non-fatal — account bar stays hidden.
      }
    })();
  }, []);

  async function handleSignOut() {
    try {
      const { createSupabaseBrowserClient } = await import(
        "@/lib/supabase/client"
      );
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore errors — redirect regardless.
    }
    router.push("/login");
  }

  if (!email) return null;

  // Derive avatar initial from email local-part.
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      <ActivityLogDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* My Activity button */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="My Activity"
        className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ClockIcon className="size-4" />
        <span className="hidden sm:inline">Activity</span>
      </button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-transparent transition-shadow hover:ring-primary/40 focus-visible:outline-2 focus-visible:outline-primary"
        >
          {initial}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuLabel className="flex items-center gap-2">
            <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDrawerOpen(true)}>
            <ClockIcon className="size-4" />
            My Activity
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
            <LogOutIcon className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
  const pathname = usePathname();
  const [, subjectSegment, moduleSegment] = pathname.split("/");

  const subjectId: SubjectId = isSubjectId(subjectSegment)
    ? subjectSegment
    : SUBJECTS[0].id;
  const rawModuleId: ModuleId = isModuleId(moduleSegment) ? moduleSegment : "notes";
  const subject = SUBJECTS.find((option) => option.id === subjectId) ?? SUBJECTS[0];
  // Req #2 — never resolve to a module hidden for this subject (e.g. urdu/notes);
  // fall back to the subject's default landing module instead.
  const moduleId: ModuleId = isModuleVisible(subjectId, rawModuleId)
    ? rawModuleId
    : getDefaultModule(subjectId);
  const visibleModules = getVisibleModules(subjectId);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href={`/${subject.id}/${moduleId}`}
          aria-label="EduFix PK home"
          className="flex shrink-0 items-center gap-2 rounded-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edufix-logo.png"
            alt="EduFix PK"
            className="h-9 w-auto"
          />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Switch subject"
            className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span>{subject.name}</span>
            <span className="text-xs text-muted-foreground">{subject.code}</span>
            <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuLabel>Subjects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SUBJECTS.map((option) => {
              // Req #2 — keep the current module when switching subjects, but
              // resolve to the target's default if it hides this module (urdu).
              const targetModule = isModuleVisible(option.id, moduleId)
                ? moduleId
                : getDefaultModule(option.id);
              return (
                <DropdownMenuItem key={option.id} asChild>
                  <Link
                    href={`/${option.id}/${targetModule}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex flex-col">
                      <span>{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Code {option.code}
                      </span>
                    </span>
                    {option.id === subject.id ? (
                      <CheckIcon className="size-4 text-brand-muted" />
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <nav
          aria-label="Modules"
          className="ms-auto flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
        >
          {visibleModules.map((module) => {
            const active = module.id === moduleId;
            return (
              <Link
                key={module.id}
                href={`/${subject.id}/${module.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                {module.label}
              </Link>
            );
          })}
        </nav>

        {/* Account bar */}
        <AccountBar currentSubject={subjectId} />
      </div>
    </header>
  );
}
