import type { Evaluation, ScoreComparison } from "./types";
import { round1 } from "./evaluation/evaluator";

/** Compares a new evaluation against the attempt it was improved from. */
export function compareEvaluations(
  previous: Evaluation,
  next: Evaluation,
): ScoreComparison {
  const improvedAreas: string[] = [];
  const stillNeedsWork: string[] = [];
  const newIssues: string[] = [];

  next.criteria.forEach((criterion) => {
    const before = previous.criteria.find(
      (c) => c.criterion === criterion.criterion,
    );
    if (!before) return;
    const delta = criterion.score - before.score;
    if (delta > 0) {
      improvedAreas.push(
        `${criterion.criterion}: ${before.score} → ${criterion.score}`,
      );
    } else if (delta < 0) {
      newIssues.push(
        `${criterion.criterion} regressed: ${before.score} → ${criterion.score}`,
      );
    }
    if (criterion.score < 7) {
      stillNeedsWork.push(`${criterion.criterion} (${criterion.score}/10)`);
    }
  });

  return {
    previousScore: previous.overallScore,
    newScore: next.overallScore,
    improvement: round1(next.overallScore - previous.overallScore),
    improvedAreas,
    stillNeedsWork,
    newIssues,
  };
}
