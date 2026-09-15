import { compareEvaluations } from "./comparison";
import type { Evaluator } from "./evaluation/evaluator";
import { getProblem } from "./problems";
import type { AttemptRepository } from "./repository";
import type {
  Attempt,
  Evaluation,
  ScoreComparison,
  StructuredDesignContent,
} from "./types";
import { validateSubmission, type ValidationResult } from "./validation";

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const emptyDesign = (): StructuredDesignContent => ({
  classes: [{ id: uid(), name: "", responsibility: "", methods: "" }],
  interfaces: [],
  relationships: [],
  explanation: "",
  edgeCases: "",
  notes: "",
});

export const DEFAULT_USER_ID = "local-learner";

export class SubmissionRejectedError extends Error {
  constructor(public readonly validation: ValidationResult) {
    super("Submission failed validation");
    this.name = "SubmissionRejectedError";
  }
}

/**
 * Orchestrates the practice loop. Depends on the Evaluator abstraction and
 * the AttemptRepository port, never on a concrete implementation.
 */
export class PracticeService {
  constructor(
    private readonly repo: AttemptRepository,
    private readonly evaluator: Evaluator,
  ) {}

  listAttempts(): Attempt[] {
    return this.repo.list();
  }

  getAttempt(id: string): Attempt | undefined {
    return this.repo.get(id);
  }

  /** Creates a DRAFT attempt, optionally prefilled from a previous one. */
  createAttempt(problemId: string, previous?: Attempt): Attempt {
    const now = new Date().toISOString();
    const id = uid();
    const attempt: Attempt = {
      id,
      userId: DEFAULT_USER_ID,
      problemId,
      status: "DRAFT",
      submission: {
        id: uid(),
        attemptId: id,
        type: "TEXT",
        content: previous
          ? structuredClone(previous.submission.content)
          : emptyDesign(),
        createdAt: now,
      },
      evaluation: null,
      error: null,
      previousAttemptId: previous?.id ?? null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    this.repo.save(attempt);
    return attempt;
  }

  saveDraft(attemptId: string, content: StructuredDesignContent): Attempt {
    const attempt = this.require(attemptId);
    const updated: Attempt = {
      ...attempt,
      submission: { ...attempt.submission, content },
      updatedAt: new Date().toISOString(),
    };
    this.repo.save(updated);
    return updated;
  }

  /**
   * Persists the submission first, then evaluates. A failing evaluation
   * moves the attempt to FAILED but never discards the submission.
   */
  async submit(
    attemptId: string,
    content: StructuredDesignContent,
  ): Promise<Attempt> {
    const attempt = this.require(attemptId);
    const validation = validateSubmission(content);
    if (!validation.valid) throw new SubmissionRejectedError(validation);

    const now = new Date().toISOString();
    const submitted: Attempt = {
      ...attempt,
      status: "SUBMITTED",
      error: null,
      submission: { ...attempt.submission, content, createdAt: now },
      submittedAt: now,
      updatedAt: now,
    };
    this.repo.save(submitted); // stored BEFORE evaluation

    return this.runEvaluation(submitted.id);
  }

  /** Runs (or re-runs) evaluation for an already-stored submission. */
  async runEvaluation(attemptId: string): Promise<Attempt> {
    const attempt = this.require(attemptId);
    const problem = getProblem(attempt.problemId);
    if (!problem) throw new Error(`Unknown problem ${attempt.problemId}`);

    this.repo.save({
      ...attempt,
      status: "EVALUATING",
      error: null,
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await this.evaluator.evaluate(attempt.submission, problem);
      const evaluation: Evaluation = {
        id: uid(),
        attemptId: attempt.id,
        createdAt: new Date().toISOString(),
        ...result,
      };
      const completed: Attempt = {
        ...attempt,
        status: "COMPLETED",
        evaluation,
        error: null,
        updatedAt: new Date().toISOString(),
      };
      this.repo.save(completed);
      return completed;
    } catch (error) {
      const failed: Attempt = {
        ...attempt, // submission preserved untouched
        status: "FAILED",
        error:
          error instanceof Error
            ? error.message
            : "Evaluation could not be completed.",
        updatedAt: new Date().toISOString(),
      };
      this.repo.save(failed);
      return failed;
    }
  }

  /** "Improve this design" — a new attempt seeded with the old submission. */
  improve(attemptId: string): Attempt {
    const previous = this.require(attemptId);
    return this.createAttempt(previous.problemId, previous);
  }

  comparison(attemptId: string): ScoreComparison | null {
    const attempt = this.require(attemptId);
    if (!attempt.evaluation || !attempt.previousAttemptId) return null;
    const previous = this.repo.get(attempt.previousAttemptId);
    if (!previous?.evaluation) return null;
    return compareEvaluations(previous.evaluation, attempt.evaluation);
  }

  stats() {
    const attempts = this.repo.list();
    const completed = attempts.filter((a) => a.status === "COMPLETED");
    const scores = completed.map((a) => a.evaluation?.overallScore ?? 0);
    const problemsAttempted = new Set(
      attempts.filter((a) => a.status !== "DRAFT").map((a) => a.problemId),
    ).size;
    return {
      attempted: attempts.filter((a) => a.status !== "DRAFT").length,
      problemsAttempted,
      completed: completed.length,
      averageScore: scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : 0,
    };
  }

  private require(id: string): Attempt {
    const attempt = this.repo.get(id);
    if (!attempt) throw new Error(`Attempt ${id} not found`);
    return attempt;
  }
}
