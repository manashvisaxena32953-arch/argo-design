import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { getProblem } from "@/domain/problems";
import { DifficultyBadge, PageShell } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useArena } from "@/lib/arena-context";

export const Route = createFileRoute("/problems/$problemId")({
  head: ({ params }) => {
    const problem = getProblem(params.problemId);
    const title = problem ? `${problem.title} — LLD Arena` : "Problem — LLD Arena";
    const description =
      problem?.summary ?? "Low-level design practice problem on LLD Arena.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProblemDetail,
});

function Section({ title, items }: { title: string; items: string[] }) {
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

function ProblemDetail() {
  const { problemId } = Route.useParams();
  const problem = getProblem(problemId);
  const { createAttempt } = useArena();
  const navigate = useNavigate();

  if (!problem) {
    return (
      <PageShell>
        <p className="text-sm text-muted-foreground">
          That problem doesn't exist.{" "}
          <Link to="/problems" className="text-primary underline">
            Back to the library
          </Link>
        </p>
      </PageShell>
    );
  }

  const start = () => {
    const attempt = createAttempt(problem.id);
    navigate({ to: "/practice/$attemptId", params: { attemptId: attempt.id } });
  };

  return (
    <PageShell className="max-w-4xl">
      <Link
        to="/problems"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Problem Library
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
        <DifficultyBadge level={problem.difficulty} />
        <span className="mono flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {problem.estimatedMinutes} min
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {problem.statement}
      </p>

      <div className="mt-6 space-y-4">
        <Section title="Functional requirements" items={problem.functionalRequirements} />
        <Section title="Key constraints" items={problem.constraints} />
        <Section title="Expected behaviours" items={problem.expectedBehaviours} />

        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
          <AccordionItem value="hints" className="border-none">
            <AccordionTrigger className="text-sm font-semibold">
              Hints ({problem.hints.length}) — open only if you're stuck
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
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button size="lg" onClick={start}>
          Start Practice
        </Button>
      </div>
    </PageShell>
  );
}
