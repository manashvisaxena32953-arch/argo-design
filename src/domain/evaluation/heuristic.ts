import {
  CRITERIA,
  type CriterionResult,
  type DesignInsight,
  type Problem,
  type StructuredDesignContent,
} from "../types";
import { averageScore, type EvaluationResult } from "./evaluator";
import { coverage, patternMentions, structuralWarnings } from "./rule-based";

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

interface Observation {
  kind: "good" | "bad";
  text: string;
  insight?: DesignInsight | undefined;
}

const INSIGHTS = {
  srp: {
    title: "Single Responsibility Principle",
    body: "A class should have one reason to change. When a responsibility sentence needs an 'and', the class usually holds two jobs that will start changing for different reasons — split one of them into a collaborator.",
  },
  strategy: {
    title: "Strategy pattern",
    body: "When an algorithm (pricing, scheduling, fines) varies independently of the object using it, put it behind an interface and inject it. The caller stops changing every time a new rule appears.",
  },
  isp: {
    title: "Interface Segregation",
    body: "Prefer several small, role-focused interfaces over one wide one. Implementers should not be forced to stub methods they do not need.",
  },
  dip: {
    title: "Dependency Inversion",
    body: "High-level policy should depend on abstractions, not on concrete low-level classes. Injecting an interface instead of instantiating a concrete collaborator is what makes a design testable.",
  },
  composition: {
    title: "Composition over inheritance",
    body: "Inheritance couples subclasses to a parent's implementation. When types differ mainly in data or one behaviour, composing a small collaborator keeps the hierarchy flat and the variation swappable.",
  },
  state: {
    title: "State pattern",
    body: "When behaviour depends on a lifecycle phase, model the phases explicitly instead of branching on flags. Each state owns the transitions it permits, so illegal transitions become impossible rather than merely unhandled.",
  },
  testability: {
    title: "Designing for testability",
    body: "Edge cases you can name are edge cases you can test. Listing the empty, full, duplicate and concurrent paths usually exposes a missing collaborator before any code is written.",
  },
} satisfies Record<string, DesignInsight>;

/**
 * Deterministic, contextual evaluation engine used when no AI provider is
 * reachable. It inspects the learner's actual entities, so the feedback
 * quotes their class names instead of giving generic advice.
 */
export function heuristicEvaluate(
  content: StructuredDesignContent,
  problem: Problem,
): EvaluationResult {
  const classes = content.classes.filter((c) => c.name.trim());
  const interfaces = content.interfaces.filter((i) => i.name.trim());
  const relationships = content.relationships.filter(
    (r) => r.from.trim() && r.to.trim(),
  );
  const observations: Observation[] = [];

  const reqCoverage = coverage(problem, content);
  const explanationWords = content.explanation
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const edgeCaseLines = content.edgeCases
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);

  // --- god-class detection -------------------------------------------------
  const multiJob = classes.filter(
    (c) =>
      /\band\b|,|\balso\b/i.test(c.responsibility) ||
      c.methods.split(",").filter((m) => m.trim()).length >= 6,
  );
  if (multiJob.length > 0) {
    const c = multiJob[0]!;
    observations.push({
      kind: "bad",
      text: `${c.name} carries more than one job: "${c.responsibility.trim()}". That is two reasons to change in one class.`,
      insight: INSIGHTS.srp,
    });
  } else if (classes.length >= 2) {
    observations.push({
      kind: "good",
      text: `Each class states a single, verb-led responsibility — ${classes
        .slice(0, 2)
        .map((c) => c.name)
        .join(" and ")} do not overlap.`,
    });
  }

  // --- policy / algorithm separation --------------------------------------
  const policyWords = /(price|pricing|fee|fare|rate|schedul|dispatch|fine|rule|policy|strategy)/i;
  const policyHolders = classes.filter(
    (c) => policyWords.test(c.responsibility) || policyWords.test(c.methods),
  );
  const policyAbstraction = interfaces.some(
    (i) => policyWords.test(i.name) || policyWords.test(i.responsibility),
  );
  if (policyHolders.length > 0 && !policyAbstraction) {
    observations.push({
      kind: "bad",
      text: `${policyHolders[0]!.name} computes ${problem.tags.includes("strategy") ? "a varying rule" : "policy"} inline, so a new rule means editing it.`,
      insight: INSIGHTS.strategy,
    });
  } else if (policyAbstraction) {
    observations.push({
      kind: "good",
      text: `Putting the varying rule behind an interface keeps ${classes[0]?.name ?? "the orchestrator"} closed to modification when the policy changes.`,
      insight: INSIGHTS.strategy,
    });
  }

  // --- interfaces / DIP ----------------------------------------------------
  if (interfaces.length === 0) {
    observations.push({
      kind: "bad",
      text: "No interfaces are declared, so every collaborator is bound to a concrete class and hard to substitute in a test.",
      insight: INSIGHTS.dip,
    });
  } else {
    const wide = interfaces.find(
      (i) => i.methods.split(",").filter((m) => m.trim()).length >= 6,
    );
    if (wide) {
      observations.push({
        kind: "bad",
        text: `${wide.name} exposes a wide contract; implementers will be forced to stub methods they do not need.`,
        insight: INSIGHTS.isp,
      });
    } else {
      observations.push({
        kind: "good",
        text: `${interfaces[0]!.name} gives a narrow contract that can be faked in tests and swapped in production.`,
      });
    }
  }

  // --- inheritance vs composition -----------------------------------------
  const inheritance = relationships.filter((r) => r.type === "inheritance");
  const composition = relationships.filter(
    (r) => r.type === "composition" || r.type === "aggregation",
  );
  if (inheritance.length >= 3 && composition.length === 0) {
    observations.push({
      kind: "bad",
      text: `The model leans on ${inheritance.length} inheritance links and no composition, which tends to freeze the hierarchy early.`,
      insight: INSIGHTS.composition,
    });
  } else if (composition.length > 0) {
    observations.push({
      kind: "good",
      text: `${composition[0]!.from} owning ${composition[0]!.to} by ${composition[0]!.type} keeps the lifetime relationship explicit.`,
      insight: INSIGHTS.composition,
    });
  }

  // --- lifecycle / state ---------------------------------------------------
  const statefulProblem = problem.tags.includes("state");
  const modelsState = /(state|status|phase|idle|moving|dispens)/i.test(
    `${content.explanation} ${classes.map((c) => c.name + c.responsibility).join(" ")} ${interfaces
      .map((i) => i.name)
      .join(" ")}`,
  );
  if (statefulProblem && !modelsState) {
    observations.push({
      kind: "bad",
      text: `${problem.title} is driven by lifecycle phases, but nothing in your model represents the current phase — behaviour will end up as flag branching.`,
      insight: INSIGHTS.state,
    });
  }

  // --- edge cases ----------------------------------------------------------
  if (edgeCaseLines.length === 0) {
    observations.push({
      kind: "bad",
      text: "No edge cases were listed, so failure paths such as empty, full or invalid input are unaccounted for.",
      insight: INSIGHTS.testability,
    });
  } else if (edgeCaseLines.length >= 3) {
    observations.push({
      kind: "good",
      text: `You named ${edgeCaseLines.length} edge cases, including "${edgeCaseLines[0]!.slice(0, 80)}".`,
    });
  }

  const patterns = patternMentions(content);
  const responsibilityQuality = classes.length
    ? classes.filter((c) => c.responsibility.trim().length > 20).length /
      classes.length
    : 0;

  const scores = [
    clamp(3.5 + reqCoverage * 6.5),
    clamp(
      4 + responsibilityQuality * 5 - Math.min(multiJob.length, 3) * 1.2,
    ),
    clamp(3.5 + Math.min(interfaces.length, 3) * 1.8),
    clamp(
      4 +
        Math.min(relationships.length, 5) * 0.8 -
        Math.min(multiJob.length, 3) * 0.8 +
        (policyAbstraction ? 1 : 0),
    ),
    clamp(
      3.5 +
        Math.min(interfaces.length, 3) * 1.2 +
        (policyAbstraction ? 2 : 0) +
        Math.min(composition.length, 3) * 0.5,
    ),
    clamp(2.5 + Math.min(patterns, 4) * 1.7),
    clamp(2.5 + Math.min(edgeCaseLines.length, 6) * 1.1),
    clamp(2.5 + Math.min(explanationWords / 18, 6) * 1.2),
  ];

  const evidence = [
    `Your design maps roughly ${Math.round(reqCoverage * 100)}% of the stated requirements onto named classes or methods (${classes
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ")}).`,
    multiJob.length
      ? `${multiJob[0]!.name}: "${multiJob[0]!.responsibility.trim()}"`
      : `${classes.length} classes, each with a single stated responsibility.`,
    interfaces.length
      ? `Interfaces declared: ${interfaces.map((i) => i.name).join(", ")}.`
      : "No interfaces declared in the submission.",
    relationships.length
      ? `${relationships
          .slice(0, 2)
          .map((r) => `${r.from} --${r.type}--> ${r.to}`)
          .join("; ")}`
      : "No relationships were declared between your entities.",
    policyAbstraction
      ? "A varying rule is isolated behind an interface."
      : `Extension would currently require editing ${classes[0]?.name ?? "existing classes"}.`,
    patterns
      ? `Your explanation references ${patterns} pattern-level concept(s).`
      : "No design pattern or abstraction is named in the explanation.",
    edgeCaseLines.length
      ? `Edge cases listed: ${edgeCaseLines.slice(0, 2).join(" | ")}`
      : "Edge cases section is empty.",
    explanationWords
      ? `Explanation is ${explanationWords} words and covers ${explanationWords > 60 ? "trade-offs as well as structure" : "structure only"}.`
      : "No design explanation provided.",
  ];

  const concerns = [
    reqCoverage > 0.85
      ? "Requirements are well covered."
      : "Some requirements have no visible owner in the model.",
    multiJob.length
      ? `${multiJob[0]!.name} mixes responsibilities.`
      : "Responsibilities are clean.",
    interfaces.length
      ? "Contracts exist but check that each one has a real second implementation in mind."
      : "Nothing is substitutable without editing concrete classes.",
    relationships.length
      ? "Direction of dependency is stated; verify none of them point from policy to detail."
      : "Coupling cannot be judged without declared relationships.",
    policyAbstraction
      ? "Extension points exist for the main varying axis."
      : "The most likely axis of change has no seam.",
    patterns ? "Patterns are named but lightly justified." : "No pattern vocabulary used.",
    edgeCaseLines.length >= 3
      ? "Edge cases are reasonable."
      : "Failure paths are under-specified.",
    explanationWords > 60
      ? "Reasoning is legible."
      : "The reasoning behind the abstractions is too brief to assess.",
  ];

  const suggestions = [
    `Trace each of the ${problem.functionalRequirements.length} requirements of ${problem.title} to the method that satisfies it.`,
    multiJob.length
      ? `Extract the secondary job of ${multiJob[0]!.name} into its own collaborator.`
      : "Keep responsibility statements verb-led and single-clause as the model grows.",
    interfaces.length
      ? "Check each interface has one cohesive role; split it if implementers would stub methods."
      : `Introduce an interface for the part of ${problem.title} most likely to vary.`,
    "State the ownership direction for each relationship and why it is not reversed.",
    policyAbstraction
      ? "Document how a second implementation would be plugged in."
      : "Inject the varying rule instead of computing it inline.",
    `Name the pattern you applied (e.g. ${problem.tags.filter((t) => t !== "lifecycle").slice(0, 2).join(" or ") || "Strategy"}) and what it buys you.`,
    "List the empty, full, duplicate and invalid-input paths explicitly.",
    "Add the alternative design you rejected and the reason.",
  ];

  const criteria: CriterionResult[] = CRITERIA.map((criterion, i) => ({
    criterion,
    score: scores[i]!,
    evidence: evidence[i]!,
    concern: concerns[i]!,
    suggestion: suggestions[i]!,
    confidence: 0.72,
  }));

  const good = observations.filter((o) => o.kind === "good");
  const bad = observations.filter((o) => o.kind === "bad");
  const insights: DesignInsight[] = [];
  for (const o of observations) {
    if (o.insight && !insights.some((i) => i.title === o.insight!.title)) {
      insights.push(o.insight);
    }
  }

  return {
    evaluator: "ai",
    evaluatorLabel: "Offline rubric evaluator (deterministic)",
    overallScore: averageScore(criteria),
    criteria,
    warnings: structuralWarnings(content),
    feedback: {
      strengths: good.slice(0, 3).map((o) => o.text),
      improvements: bad.slice(0, 3).map((o) => o.text),
      suggestions: criteria
        .filter((c) => c.score < 9)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map((c) => c.suggestion),
      insights: insights.slice(0, 4),
    },
  };
}
