/**
 * Core domain model for LLD Arena.
 *
 * User ──< Attempt >── Problem
 * Attempt ── Submission
 * Attempt ── Evaluation ── Feedback
 *
 * Submission is intentionally a tagged union on `type` so DIAGRAM / CODE
 * submissions can be added later without touching the Attempt lifecycle.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  summary: string;
  statement: string;
  functionalRequirements: string[];
  constraints: string[];
  expectedBehaviours: string[];
  hints: string[];
  tags: string[];
}

export interface ClassSpec {
  id: string;
  name: string;
  responsibility: string;
  methods: string;
}

export interface InterfaceSpec {
  id: string;
  name: string;
  responsibility: string;
  methods: string;
}

export const RELATIONSHIP_TYPES = [
  "inheritance",
  "composition",
  "aggregation",
  "dependency",
  "association",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface RelationshipSpec {
  id: string;
  from: string;
  type: RelationshipType;
  to: string;
  reason: string;
}

/** Content of a structured text (MVP) submission. */
export interface StructuredDesignContent {
  classes: ClassSpec[];
  interfaces: InterfaceSpec[];
  relationships: RelationshipSpec[];
  explanation: string;
  edgeCases: string;
  notes: string;
}

export type SubmissionType = "TEXT" | "DIAGRAM" | "CODE";

export interface Submission {
  id: string;
  attemptId: string;
  /** Future types (DIAGRAM, CODE) plug in here without changing Attempt. */
  type: SubmissionType;
  content: StructuredDesignContent;
  createdAt: string;
}

export type AttemptStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED";

export const CRITERIA = [
  "Requirement Understanding",
  "Class Responsibilities",
  "Encapsulation & Interfaces",
  "Coupling & Cohesion",
  "Extensibility",
  "Design Patterns / Abstractions",
  "Edge Cases & Testability",
  "Design Explanation",
] as const;

export type CriterionName = (typeof CRITERIA)[number];

export interface CriterionResult {
  criterion: CriterionName | string;
  score: number; // 1..10
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number; // 0..1
}

export interface DesignInsight {
  title: string;
  body: string;
}

export interface Feedback {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  insights: DesignInsight[];
}

export type EvaluatorKind = "rule-based" | "ai" | "human" | "code";

export interface Evaluation {
  id: string;
  attemptId: string;
  evaluator: EvaluatorKind;
  /** Human-readable label, e.g. "AI rubric evaluator". */
  evaluatorLabel: string;
  overallScore: number;
  criteria: CriterionResult[];
  feedback: Feedback;
  /** Deterministic structural warnings from the rule-based pass. */
  warnings: string[];
  createdAt: string;
}

export interface Attempt {
  id: string;
  userId: string;
  problemId: string;
  status: AttemptStatus;
  submission: Submission;
  evaluation: Evaluation | null;
  error: string | null;
  /** Set when this attempt was created via "Improve this design". */
  previousAttemptId: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface User {
  id: string;
  name: string;
}

export interface ScoreComparison {
  previousScore: number;
  newScore: number;
  improvement: number;
  improvedAreas: string[];
  stillNeedsWork: string[];
  newIssues: string[];
}
