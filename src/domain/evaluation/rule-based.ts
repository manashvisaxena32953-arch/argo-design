import { validateSubmission } from "../validation";
import {
  CRITERIA,
  type Problem,
  type StructuredDesignContent,
  type Submission,
} from "../types";
import {
  averageScore,
  type EvaluationResult,
  type Evaluator,
} from "./evaluator";

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

export function structuralWarnings(content: StructuredDesignContent): string[] {
  const warnings: string[] = [];
  const { valid, issues } = validateSubmission(content);
  if (!valid) warnings.push(...issues.map((i) => i.message));

  const classes = content.classes ?? [];
  const interfaces = content.interfaces ?? [];
  const relationships = content.relationships ?? [];

  classes
    .filter((c) => !c.methods || c.methods.trim() === "")
    .forEach((c) =>
      warnings.push(`${c.name || "A class"} declares no methods.`),
    );

  const referenced = new Set(
    relationships.flatMap((r) => [
      r.from.trim().toLowerCase(),
      r.to.trim().toLowerCase(),
    ]),
  );
  [...classes, ...interfaces]
    .filter((e) => e.name && !referenced.has(e.name.trim().toLowerCase()))
    .forEach((e) =>
      warnings.push(`${e.name} takes part in no relationship — is it isolated?`),
    );

  relationships
    .filter((r) => !r.reason || r.reason.trim() === "")
    .forEach((r) =>
      warnings.push(
        `Relationship ${r.from || "?"} → ${r.to || "?"} has no stated reason.`,
      ),
    );

  if (!content.edgeCases || content.edgeCases.trim() === "") {
    warnings.push("No edge cases were listed.");
  }
  if (interfaces.length === 0) {
    warnings.push(
      "No interfaces defined — consider where a contract would decouple things.",
    );
  }

  return warnings;
}

/**
 * Deterministic, offline evaluator. Scores structural integrity only —
 * it makes no judgement about whether the abstractions are good.
 */
export class RuleBasedEvaluator implements Evaluator {
  readonly kind = "rule-based" as const;
  readonly label = "Rule-based structural evaluator";

  async evaluate(
    submission: Submission,
    problem: Problem,
  ): Promise<EvaluationResult> {
    const content = submission.content;
    const warnings = structuralWarnings(content);
    const classes = content.classes ?? [];
    const interfaces = content.interfaces ?? [];
    const relationships = content.relationships ?? [];

    const withResponsibility = classes.filter(
      (c) => c.responsibility.trim().length > 12,
    ).length;
    const withMethods = classes.filter(
      (c) => c.methods.trim().length > 0,
    ).length;
    const explanationWords = content.explanation.trim().split(/\s+/).length;
    const edgeCaseLines = content.edgeCases
      .split("\n")
      .filter((l) => l.trim()).length;
    const reqCoverage = coverage(problem, content);

    const scores: number[] = [
      clamp(3 + reqCoverage * 7),
      clamp(3 + (classes.length ? (withResponsibility / classes.length) * 7 : 0)),
      clamp(3 + Math.min(interfaces.length, 3) * 2 + (withMethods ? 1 : 0)),
      clamp(3 + Math.min(relationships.length, 5) * 1.2),
      clamp(3 + Math.min(interfaces.length, 2) * 1.5 + Math.min(classes.length, 6) * 0.5),
      clamp(2 + Math.min(patternMentions(content), 4) * 2),
      clamp(2 + Math.min(edgeCaseLines, 6) * 1.2),
      clamp(2 + Math.min(explanationWords / 20, 6) * 1.2),
    ];

    const criteria = CRITERIA.map((criterion, i) => ({
      criterion,
      score: scores[i]!,
      evidence: structuralEvidence(i, content),
      concern:
        scores[i]! >= 8
          ? "No structural gap detected for this criterion."
          : structuralConcern(i, content),
      suggestion: structuralSuggestion(i),
      confidence: 0.6,
    }));

    return {
      evaluator: this.kind,
      evaluatorLabel: this.label,
      overallScore: averageScore(criteria),
      criteria,
      warnings,
      feedback: {
        strengths: criteria
          .filter((c) => c.score >= 7)
          .slice(0, 3)
          .map((c) => `${c.criterion}: ${c.evidence}`),
        improvements: criteria
          .filter((c) => c.score < 7)
          .slice(0, 3)
          .map((c) => `${c.criterion}: ${c.concern}`),
        suggestions: criteria
          .filter((c) => c.score < 8)
          .slice(0, 3)
          .map((c) => c.suggestion),
        insights: [],
      },
    };
  }
}

export function coverage(
  problem: Problem,
  content: StructuredDesignContent,
): number {
  const haystack = [
    ...content.classes.map((c) => `${c.name} ${c.responsibility} ${c.methods}`),
    ...content.interfaces.map(
      (i) => `${i.name} ${i.responsibility} ${i.methods}`,
    ),
    content.explanation,
    content.edgeCases,
    content.notes,
  ]
    .join(" ")
    .toLowerCase();

  const hits = problem.functionalRequirements.filter((req) => {
    const keywords = req
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    return keywords.some((k) => haystack.includes(k.slice(0, 6)));
  }).length;

  return problem.functionalRequirements.length
    ? hits / problem.functionalRequirements.length
    : 0;
}

const PATTERN_WORDS = [
  "strategy",
  "state",
  "observer",
  "factory",
  "singleton",
  "command",
  "adapter",
  "builder",
  "repository",
  "interface",
  "polymorph",
];

export function patternMentions(content: StructuredDesignContent): number {
  const text = `${content.explanation} ${content.notes} ${content.classes
    .map((c) => c.name + c.responsibility)
    .join(" ")} ${content.interfaces.map((i) => i.name).join(" ")}`.toLowerCase();
  return PATTERN_WORDS.filter((w) => text.includes(w)).length;
}

function names(content: StructuredDesignContent) {
  return content.classes.map((c) => c.name).filter(Boolean);
}

function structuralEvidence(i: number, c: StructuredDesignContent): string {
  const list = names(c).slice(0, 3).join(", ") || "your submission";
  switch (i) {
    case 0:
      return `Your model introduces ${c.classes.length} classes (${list}).`;
    case 1:
      return `${c.classes.filter((x) => x.responsibility.trim()).length} of ${c.classes.length} classes state a responsibility.`;
    case 2:
      return `${c.interfaces.length} interface(s) declared.`;
    case 3:
      return `${c.relationships.length} relationship(s) declared between entities.`;
    case 4:
      return `Entity count and interface usage suggest ${c.interfaces.length > 0 ? "some" : "limited"} extension points.`;
    case 5:
      return `${patternMentions(c)} pattern-related term(s) appear in your design.`;
    case 6:
      return `${c.edgeCases.split("\n").filter((l) => l.trim()).length} edge case line(s) provided.`;
    default:
      return `Explanation is ${c.explanation.trim().split(/\s+/).filter(Boolean).length} words long.`;
  }
}

function structuralConcern(i: number, c: StructuredDesignContent): string {
  switch (i) {
    case 0:
      return "Some stated requirements do not map to any class or method in your design.";
    case 1:
      return "At least one class has a thin or missing responsibility statement.";
    case 2:
      return "Few or no interfaces — collaborators are likely bound to concrete classes.";
    case 3:
      return "Relationships are sparse, so ownership and direction of dependency are unclear.";
    case 4:
      return "There are few seams where new behaviour could be added without editing existing classes.";
    case 5:
      return "No recognised design pattern or abstraction is named in the explanation.";
    case 6:
      return c.edgeCases.trim()
        ? "Edge cases are listed but thin."
        : "No edge cases were listed.";
    default:
      return "The explanation is short, so the reasoning behind the abstractions is hard to judge.";
  }
}

function structuralSuggestion(i: number): string {
  return [
    "Walk each functional requirement and point at the class/method that satisfies it.",
    "Give each class a one-sentence responsibility that starts with a verb.",
    "Introduce an interface where a collaborator could reasonably have more than one implementation.",
    "Declare the ownership relationships explicitly, and state why each exists.",
    "Identify the axis most likely to change and put an abstraction on it.",
    "Name the pattern you applied and say what it buys you here.",
    "List failure paths: empty, full, concurrent, and invalid input.",
    "Explain the alternative you rejected and why.",
  ][i]!;
}
