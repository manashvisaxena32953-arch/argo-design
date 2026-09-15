import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PROBLEMS, getProblem } from "@/domain/problems";
import {
  DifficultyBadge,
  EmptyState,
  PageShell,
  StatusBadge,
} from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LLD Arena" },
      {
        name: "description",
        content:
          "Track your low-level design practice: problems attempted, completed, average score and recent feedback.",
      },
      { property: "og:title", content: "Dashboard — LLD Arena" },
      {
        property: "og:description",
        content: "Your LLD practice progress and recommended next problem.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { ready, attempts, stats, createAttempt } = useArena();
  const navigate = useNavigate();

  const draft = attempts.find((a) => a.status === "DRAFT");
  const recent = attempts.filter((a) => a.status !== "DRAFT").slice(0, 5);
  const practised = new Set(attempts.map((a) => a.problemId));
  const recommended = PROBLEMS.filter((p) => !practised.has(p.id)).slice(0, 3);
  const suggestions = recommended.length ? recommended : PROBLEMS.slice(0, 3);

  const start = (problemId: string) => {
    const attempt = createAttempt(problemId);
    navigate({ to: "/practice/$attemptId", params: { attemptId: attempt.id } });
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Practice. Design. Get Feedback. Improve.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Problems attempted" value={`${stats.attempted}`} />
        <StatCard label="Completed" value={`${stats.completed}`} />
        <StatCard
          label="Average score"
          value={stats.completed ? `${stats.averageScore.toFixed(1)}/10` : "—"}
        />
      </div>

      {draft ? (
        <section className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Continue practice
            </p>
            <p className="mt-1 text-sm font-medium">
              {getProblem(draft.problemId)?.title ?? draft.problemId}
            </p>
            <p className="text-xs text-muted-foreground">
              Draft saved {new Date(draft.updatedAt).toLocaleString()}
            </p>
          </div>
          <Button className="ml-auto" asChild>
            <Link to="/practice/$attemptId" params={{ attemptId: draft.id }}>
              Resume
            </Link>
          </Button>
        </section>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent attempts</h2>
            <Link to="/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {!ready ? (
            <div className="mt-4 h-24 animate-pulse rounded-lg bg-muted" />
          ) : recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No attempts yet"
                description="Submit your first design to see scores and feedback here."
                action={
                  <Button asChild>
                    <Link to="/problems">Browse problems</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((attempt) => (
                <li key={attempt.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {getProblem(attempt.problemId)?.title ?? attempt.problemId}
                    </p>
                    <p className="mono text-[11px] text-muted-foreground">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <StatusBadge status={attempt.status} />
                    <span className="mono text-sm">
                      {attempt.evaluation
                        ? `${attempt.evaluation.overallScore.toFixed(1)}/10`
                        : "—"}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to="/attempts/$attemptId"
                        params={{ attemptId: attempt.id }}
                      >
                        {attempt.status === "FAILED" ? "Retry" : "View"}
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Recommended next</h2>
          <div className="mt-3 space-y-3">
            {suggestions.map((problem) => (
              <div
                key={problem.id}
                className="rounded-lg border border-border bg-background/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <DifficultyBadge level={problem.difficulty} />
                  <span className="mono flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" /> {problem.estimatedMinutes} min
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{problem.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {problem.summary}
                </p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  onClick={() => start(problem.id)}
                >
                  Practice
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mono mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
