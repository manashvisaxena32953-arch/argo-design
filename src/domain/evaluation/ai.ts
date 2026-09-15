import { evaluateDesignWithAI } from "@/lib/ai-evaluation.functions";
import type { Problem, StructuredDesignContent, Submission } from "../types";
import { averageScore, type EvaluationResult, type Evaluator } from "./evaluator";
import { heuristicEvaluate } from "./heuristic";
import { structuralWarnings } from "./rule-based";

export function renderDesign(content: StructuredDesignContent): string {
  const lines: string[] = ["CLASSES:"];
  content.classes.forEach((c) =>
    lines.push(
      `- ${c.name}: responsibility="${c.responsibility}" methods="${c.methods}"`,
    ),
  );
  lines.push("INTERFACES:");
  if (content.interfaces.length === 0) lines.push("- (none)");
  content.interfaces.forEach((i) =>
    lines.push(
      `- ${i.name}: responsibility="${i.responsibility}" methods="${i.methods}"`,
    ),
  );
  lines.push("RELATIONSHIPS:");
  if (content.relationships.length === 0) lines.push("- (none)");
  content.relationships.forEach((r) =>
    lines.push(`- ${r.from} --${r.type}--> ${r.to} (${r.reason})`),
  );
  lines.push(`DESIGN EXPLANATION: ${content.explanation}`);
  lines.push(`EDGE CASES: ${content.edgeCases || "(none provided)"}`);
  lines.push(`NOTES: ${content.notes || "(none)"}`);
  return lines.join("\n");
}

/**
 * Rubric-driven AI evaluator. Falls back to the deterministic heuristic
 * engine whenever the AI provider is unavailable, so a learner is never
 * left without feedback.
 */
export class AIEvaluator implements Evaluator {
  readonly kind = "ai" as const;
  readonly label = "AI rubric evaluator";

  async evaluate(
    submission: Submission,
    problem: Problem,
  ): Promise<EvaluationResult> {
    try {
      const payload = await evaluateDesignWithAI({
        data: {
          problemTitle: problem.title,
          problemStatement: problem.statement,
          requirements: problem.functionalRequirements,
          constraints: problem.constraints,
          design: renderDesign(submission.content),
        },
      });

      const criteria = payload.criteria.map((c) => ({
        ...c,
        score: Math.max(1, Math.min(10, Math.round(c.score))),
      }));

      return {
        evaluator: this.kind,
        evaluatorLabel: this.label,
        overallScore: averageScore(criteria),
        criteria,
        warnings: structuralWarnings(submission.content),
        feedback: {
          strengths: payload.strengths,
          improvements: payload.improvements,
          suggestions: payload.suggestions,
          insights: payload.insights,
        },
      };
    } catch (error) {
      console.warn("AI evaluation unavailable, using offline engine:", error);
      return heuristicEvaluate(submission.content, problem);
    }
  }
}
