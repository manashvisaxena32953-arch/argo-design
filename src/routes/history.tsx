import { createFileRoute, Link } from "@tanstack/react-router";
import { getProblem } from "@/domain/problems";
import { EmptyState, PageShell, StatusBadge } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Attempt History — LLD Arena" },
      {
        name: "description",
        content:
          "Every design you have submitted, with status, score and a link back to the full feedback.",
      },
      { property: "og:title", content: "Attempt History — LLD Arena" },
      {
        property: "og:description",
        content: "Review past LLD attempts, scores and feedback.",
      },
    ],
  }),
  component: History,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function History() {
  const { attempts, ready } = useArena();

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight">Attempt History</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every attempt you have started, with its submission and evaluation.
      </p>

      {!ready ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl border border-border bg-card" />
      ) : attempts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No attempts yet"
            description="Pick a problem from the library to start your first design."
            action={
              <Button asChild>
                <Link to="/problems">Browse problems</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Problem</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attempts.map((attempt) => {
                const problem = getProblem(attempt.problemId);
                return (
                  <tr key={attempt.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {problem?.title ?? attempt.problemId}
                      {attempt.previousAttemptId ? (
                        <span className="mono ml-2 text-[10px] text-muted-foreground">
                          RETRY
                        </span>
                      ) : null}
                    </td>
                    <td className="mono px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(attempt.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={attempt.status} />
                    </td>
                    <td className="mono px-4 py-3">
                      {attempt.evaluation
                        ? `${attempt.evaluation.overallScore.toFixed(1)}/10`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {attempt.status === "DRAFT" ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to="/practice/$attemptId"
                            params={{ attemptId: attempt.id }}
                          >
                            Continue
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to="/attempts/$attemptId"
                            params={{ attemptId: attempt.id }}
                          >
                            {attempt.status === "FAILED" ? "Retry" : "View"}
                          </Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
