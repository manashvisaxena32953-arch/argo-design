import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { getProblem } from "@/domain/problems";
import type { Attempt, ScoreComparison } from "@/domain/types";
import { renderDesign } from "@/domain/evaluation";
import {
  PageShell,
  ScoreBar,
  ScoreRing,
  StatusBadge,
} from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/attempts/$attemptId")({
  head: () => ({
    meta: [
      { title: "Design Feedback — LLD Arena" },
      {
        name: "description",
        content:
          "Rubric-based feedback on your low-level design: scores, evidence, concerns and suggested improvements.",
      },
      { property: "og:title", content: "Design Feedback — LLD Arena" },
      {
        property: "og:description",
        content: "Explainable, evidence-backed feedback on your LLD submission.",
      },
    ],
  }),
  component: AttemptView,
});

function AttemptView() {
  const { attemptId } = Route.useParams();
  const { ready, getAttempt, runEvaluation, improve, service } = useArena();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | undefined>();
  const [comparison, setComparison] = useState<ScoreComparison | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const found = getAttempt(attemptId);
    setAttempt(found);
    if (found?.status === "COMPLETED") {
      try {
        setComparison(service.comparison(attemptId));
      } catch {
        setComparison(null);
      }
    }
  }, [ready, attemptId, getAttempt, service]);

  // Kick off evaluation if the attempt was left mid-flight.
  useEffect(() => {
    if (!attempt) return;
    if (attempt.status === "SUBMITTED" || attempt.status === "EVALUATING") {
      let cancelled = false;
      runEvaluation(attempt.id).then((next) => {
        if (!cancelled) {
          setAttempt(next);
          setComparison(service.comparison(next.id));
        }
      });
      return () => {
        cancelled = true;
      };
    }
    return;
  }, [attempt, runEvaluation, service]);

  if (!ready) {
    return (
      <PageShell>
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
      </PageShell>
    );
  }

  if (!attempt) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">
          Attempt not found.{" "}
          <Link to="/history" className="text-primary underline">
            Back to history
          </Link>
        </p>
      </PageShell>
    );
  }

  const problem = getProblem(attempt.problemId);
  const evaluation = attempt.evaluation;

  const retry = async () => {
    setBusy(true);
    const next = await runEvaluation(attempt.id);
    setAttempt(next);
    setComparison(service.comparison(next.id));
    setBusy(false);
  };

  const onImprove = () => {
    const next = improve(attempt.id);
    navigate({ to: "/practice/$attemptId", params: { attemptId: next.id } });
  };

  return (
    <PageShell className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> History
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          {problem?.title ?? attempt.problemId}
        </h1>
        <StatusBadge status={attempt.status} />
      </div>

      {attempt.status === "SUBMITTED" || attempt.status === "EVALUATING" ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Your design has been submitted.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Evaluating your design against the 8-criterion rubric…
          </p>
        </div>
      ) : null}

      {attempt.status === "FAILED" ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Evaluation could not be completed.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {attempt.error ?? "The evaluator was unreachable."} Your submission
                has been saved and nothing was lost.
              </p>
              <Button className="mt-4" onClick={retry} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Retrying
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" /> Retry Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {attempt.status === "DRAFT" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This attempt is still a draft.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/practice/$attemptId" params={{ attemptId: attempt.id }}>
              Continue practice
            </Link>
          </Button>
        </div>
      ) : null}

      {evaluation && attempt.status === "COMPLETED" ? (
        <div className="mt-6 space-y-5">
          <section className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-6 sm:flex-row">
            <ScoreRing score={evaluation.overallScore} />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Overall score</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluated by {evaluation.evaluatorLabel}. Multiple valid designs are
                accepted — this is judged on your own reasoning, not a single
                reference answer.
              </p>
              {comparison ? (
                <div className="mono mt-4 flex flex-wrap gap-4 text-xs">
                  <span className="text-muted-foreground">
                    Previous {comparison.previousScore.toFixed(1)}
                  </span>
                  <span>New {comparison.newScore.toFixed(1)}</span>
                  <span
                    className={
                      comparison.improvement >= 0 ? "text-success" : "text-destructive"
                    }
                  >
                    {comparison.improvement >= 0 ? "+" : ""}
                    {comparison.improvement.toFixed(1)}
                  </span>
                </div>
              ) : null}
              <Button className="mt-4" onClick={onImprove}>
                Improve This Design
              </Button>
            </div>
          </section>

          {comparison ? (
            <section className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Improved areas
                </h3>
                <ul className="mono mt-2 space-y-1 text-xs text-success">
                  {comparison.improvedAreas.length ? (
                    comparison.improvedAreas.map((a) => <li key={a}>{a}</li>)
                  ) : (
                    <li className="text-muted-foreground">None yet</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Still needs work
                </h3>
                <ul className="mono mt-2 space-y-1 text-xs text-warning">
                  {comparison.stillNeedsWork.length ? (
                    comparison.stillNeedsWork.map((a) => <li key={a}>{a}</li>)
                  ) : (
                    <li className="text-muted-foreground">Nothing below 7/10</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  New issues
                </h3>
                <ul className="mono mt-2 space-y-1 text-xs text-destructive">
                  {comparison.newIssues.length ? (
                    comparison.newIssues.map((a) => <li key={a}>{a}</li>)
                  ) : (
                    <li className="text-muted-foreground">No regressions</li>
                  )}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2">
            {evaluation.criteria.map((c) => (
              <article
                key={c.criterion}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">{c.criterion}</h3>
                  <span className="mono text-sm">{c.score}/10</span>
                </div>
                <div className="mt-2">
                  <ScoreBar score={c.score} />
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Evidence
                    </dt>
                    <dd className="mt-0.5 leading-relaxed">{c.evidence}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Concern
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-muted-foreground">
                      {c.concern}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suggestion
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-muted-foreground">
                      {c.suggestion}
                    </dd>
                  </div>
                </dl>
                <p className="mono mt-3 text-[11px] text-muted-foreground">
                  confidence {Math.round(c.confidence * 100)}%
                </p>
              </article>
            ))}
          </section>

          <FeedbackList title="What you did well" items={evaluation.feedback.strengths} />
          <FeedbackList
            title="What could be improved"
            items={evaluation.feedback.improvements}
          />
          <FeedbackList
            title="Suggested improvements"
            items={evaluation.feedback.suggestions}
          />

          {evaluation.feedback.insights.length ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Relevant design insights</h2>
              <div className="mt-3 space-y-3">
                {evaluation.feedback.insights.map((i) => (
                  <div key={i.title} className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-sm font-medium">{i.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {i.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {evaluation.warnings.length ? (
            <section className="rounded-xl border border-warning/30 bg-warning/5 p-5">
              <h2 className="text-sm font-semibold">Structural warnings</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {evaluation.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {attempt.status !== "DRAFT" ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Your submission</h2>
          <pre className="mono mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-4 text-xs leading-relaxed text-muted-foreground">
            {renderDesign(attempt.submission.content)}
          </pre>
        </section>
      ) : null}
    </PageShell>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
