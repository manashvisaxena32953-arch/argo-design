import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { getProblem } from "@/domain/problems";
import { SubmissionRejectedError } from "@/domain/practice-service";
import type { Attempt, StructuredDesignContent } from "@/domain/types";
import { validateSubmission, type ValidationResult } from "@/domain/validation";
import { DesignForm } from "@/components/DesignForm";
import { DifficultyBadge, PageShell } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/practice/$attemptId")({
  head: () => ({
    meta: [
      { title: "Practice Workspace — LLD Arena" },
      {
        name: "description",
        content:
          "Write your classes, interfaces and relationships, then submit the design for rubric-based feedback.",
      },
      { property: "og:title", content: "Practice Workspace — LLD Arena" },
      {
        property: "og:description",
        content: "Structured low-level design submission workspace.",
      },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { attemptId } = Route.useParams();
  const { ready, getAttempt, saveDraft, submit } = useArena();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | undefined>(undefined);
  const [content, setContent] = useState<StructuredDesignContent | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const found = getAttempt(attemptId);
    setAttempt(found);
    if (found) setContent(found.submission.content);
  }, [ready, attemptId, getAttempt]);

  // Autosave the draft shortly after typing stops.
  useEffect(() => {
    if (!content || !attempt || !dirty.current) return;
    const timer = setTimeout(() => {
      saveDraft(attempt.id, content);
      setSavedAt(new Date().toLocaleTimeString());
      dirty.current = false;
    }, 900);
    return () => clearTimeout(timer);
  }, [content, attempt, saveDraft]);

  const problem = useMemo(
    () => (attempt ? getProblem(attempt.problemId) : undefined),
    [attempt],
  );

  if (!ready) {
    return (
      <PageShell>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </PageShell>
    );
  }

  if (!attempt || !problem || !content) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">
          This attempt could not be found.{" "}
          <Link to="/problems" className="text-primary underline">
            Pick a problem
          </Link>
        </p>
      </PageShell>
    );
  }

  const update = (next: StructuredDesignContent) => {
    dirty.current = true;
    setContent(next);
    if (validation) setValidation(validateSubmission(next));
  };

  const onSaveDraft = () => {
    saveDraft(attempt.id, content);
    setSavedAt(new Date().toLocaleTimeString());
    dirty.current = false;
    toast.success("Draft saved");
  };

  const onSubmit = async () => {
    const result = validateSubmission(content);
    setValidation(result);
    if (!result.valid) {
      toast.error(`${result.issues.length} issue(s) need fixing before submitting.`);
      return;
    }
    setSubmitting(true);
    try {
      saveDraft(attempt.id, content);
      await submit(attempt.id, content);
      navigate({ to: "/attempts/$attemptId", params: { attemptId: attempt.id } });
    } catch (error) {
      if (error instanceof SubmissionRejectedError) {
        setValidation(error.validation);
        toast.error("Submission rejected — see the inline errors.");
      } else {
        toast.error("Could not submit. Your draft is safe.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/problems/$problemId"
          params={{ problemId: problem.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Problem
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{problem.title}</h1>
        <DifficultyBadge level={problem.difficulty} />
        <span className="mono flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {problem.estimatedMinutes} min
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="mono text-[11px] text-muted-foreground">
            {savedAt ? `Draft saved ${savedAt}` : "Autosave on"}
          </span>
          <Button variant="outline" onClick={onSaveDraft} disabled={submitting}>
            Save Draft
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Submitting
              </>
            ) : (
              "Submit Design"
            )}
          </Button>
        </div>
      </div>

      {validation && !validation.valid ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="font-medium">Fix these before submitting:</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {validation.issues.slice(0, 6).map((issue) => (
              <li key={issue.field + issue.message}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Problem statement</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {problem.statement}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Functional requirements</h2>
            <ul className="mt-3 space-y-2">
              {problem.functionalRequirements.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Constraints</h2>
            <ul className="mt-3 space-y-2">
              {problem.constraints.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </section>
          <Accordion
            type="single"
            collapsible
            className="rounded-xl border border-border bg-card px-5"
          >
            <AccordionItem value="hints" className="border-none">
              <AccordionTrigger className="text-sm font-semibold">
                Hints ({problem.hints.length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pb-2">
                  {problem.hints.map((hint) => (
                    <li key={hint} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                      <span className="leading-relaxed">{hint}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        <div>
          <DesignForm
            value={content}
            onChange={update}
            validation={validation}
            disabled={submitting}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onSaveDraft} disabled={submitting}>
              Save Draft
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Design"}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
