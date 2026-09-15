import type { Evaluator } from "./evaluator";
import { AIEvaluator } from "./ai";
import { RuleBasedEvaluator } from "./rule-based";

export * from "./evaluator";
export { AIEvaluator, renderDesign } from "./ai";
export { RuleBasedEvaluator, structuralWarnings } from "./rule-based";
export { heuristicEvaluate } from "./heuristic";

/**
 * The practice flow depends on this factory, never on a concrete evaluator.
 * Adding a HumanEvaluator or CodeEvaluator is a change here only.
 */
export type EvaluatorId = "ai" | "rule-based";

export function createEvaluator(id: EvaluatorId = "ai"): Evaluator {
  return id === "rule-based" ? new RuleBasedEvaluator() : new AIEvaluator();
}
