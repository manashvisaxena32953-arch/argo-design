import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Search } from "lucide-react";
import { PROBLEMS } from "@/domain/problems";
import type { Difficulty } from "@/domain/types";
import { DifficultyBadge, EmptyState, PageShell } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/problems/")({
  head: () => ({
    meta: [
      { title: "Problem Library — LLD Arena" },
      {
        name: "description",
        content:
          "Five realistic low-level design problems: parking lot, vending machine, elevator, library system and tic-tac-toe.",
      },
      { property: "og:title", content: "Problem Library — LLD Arena" },
      {
        property: "og:description",
        content: "Pick an LLD problem and start a timed design practice session.",
      },
    ],
  }),
  component: ProblemLibrary,
});

const FILTERS: (Difficulty | "All")[] = ["All", "Easy", "Medium", "Hard"];

function ProblemLibrary() {
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [query, setQuery] = useState("");
  const { createAttempt } = useArena();
  const navigate = useNavigate();

  const visible = useMemo(
    () =>
      PROBLEMS.filter(
        (p) =>
          (difficulty === "All" || p.difficulty === difficulty) &&
          (query.trim() === "" ||
            `${p.title} ${p.summary} ${p.tags.join(" ")}`
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [difficulty, query],
  );

  const start = (problemId: string) => {
    const attempt = createAttempt(problemId);
    navigate({ to: "/practice/$attemptId", params: { attemptId: attempt.id } });
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold tracking-tight">Problem Library</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a problem, read the requirements, and design your solution.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setDifficulty(f)}
              aria-pressed={difficulty === f}
              className={
                difficulty === f
                  ? "rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
                  : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems"
            aria-label="Search problems"
            className="pl-9"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No problems match your filters"
            description="Try a different difficulty or clear the search box."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setDifficulty("All");
                  setQuery("");
                }}
              >
                Reset filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((problem) => (
            <article
              key={problem.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <DifficultyBadge level={problem.difficulty} />
                <span className="mono flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" /> {problem.estimatedMinutes} min
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold">
                <Link
                  to="/problems/$problemId"
                  params={{ problemId: problem.id }}
                  className="hover:text-primary"
                >
                  {problem.title}
                </Link>
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {problem.summary}
              </p>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => start(problem.id)}>
                  Start Practice
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    to="/problems/$problemId"
                    params={{ problemId: problem.id }}
                  >
                    Details
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
