import type {
  CriterionResult,
  EvaluatorKind,
  Feedback,
  Problem,
  Submission,
} from "../types";

/** What every evaluator returns. Never includes persistence concerns. */
export interface EvaluationResult {
  evaluator: EvaluatorKind;
  evaluatorLabel: string;
  overallScore: number;
  criteria: CriterionResult[];
  feedback: Feedback;
  warnings: string[];
}

/**
 * The abstraction the practice flow depends on.
 * Implementations: RuleBasedEvaluator, AIEvaluator.
 * Future: HumanEvaluator, CodeEvaluator — no change needed here.
 */
export interface Evaluator {
  readonly kind: EvaluatorKind;
  readonly label: string;
  evaluate(submission: Submission, problem: Problem): Promise<EvaluationResult>;
}

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationError";
  }
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const averageScore = (criteria: CriterionResult[]) =>
  criteria.length === 0
    ? 0
    : round1(criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length);
