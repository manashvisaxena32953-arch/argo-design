import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const criterionSchema = z.object({
  criterion: z.string(),
  score: z.number().min(1).max(10),
  evidence: z.string(),
  concern: z.string(),
  suggestion: z.string(),
  confidence: z.number().min(0).max(1),
});

const aiResultSchema = z.object({
  criteria: z.array(criterionSchema).min(1),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestions: z.array(z.string()),
  insights: z.array(z.object({ title: z.string(), body: z.string() })),
});

export type AIEvaluationPayload = z.infer<typeof aiResultSchema>;

const inputSchema = z.object({
  problemTitle: z.string(),
  problemStatement: z.string(),
  requirements: z.array(z.string()),
  constraints: z.array(z.string()),
  design: z.string(),
});

const RUBRIC = [
  "Requirement Understanding",
  "Class Responsibilities",
  "Encapsulation & Interfaces",
  "Coupling & Cohesion",
  "Extensibility",
  "Design Patterns / Abstractions",
  "Edge Cases & Testability",
  "Design Explanation",
];

const SYSTEM_PROMPT = `You are a senior software engineer reviewing a learner's low-level design (LLD) submission in a practice platform.

Rules:
- Score against the fixed rubric only. Never invent criteria.
- There is no single correct design. Judge the submission on its own internal consistency and fitness for the stated requirements.
- Every piece of feedback must quote or name the learner's ACTUAL classes, interfaces, methods or relationships. Never give generic advice.
- Explain WHY something matters, in teaching language.
- "evidence" quotes the submission. "concern" states the risk. "suggestion" is one concrete action. "confidence" is 0-1.
- insights explain only LLD concepts that are actually relevant to this submission (e.g. Single Responsibility, Interface Segregation, composition vs inheritance, Strategy, Dependency Inversion, State).
Return STRICT JSON only, no markdown fences.`;

/**
 * Calls the Lovable AI Gateway with a fixed rubric. Throws on any failure so
 * the AIEvaluator can fall back to the deterministic engine.
 */
export const evaluateDesignWithAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<AIEvaluationPayload> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI provider is not configured");

    const userPrompt = `PROBLEM: ${data.problemTitle}
${data.problemStatement}

FUNCTIONAL REQUIREMENTS:
${data.requirements.map((r) => `- ${r}`).join("\n")}

CONSTRAINTS:
${data.constraints.map((r) => `- ${r}`).join("\n")}

LEARNER SUBMISSION:
${data.design}

Score these 8 criteria in this exact order: ${RUBRIC.join(", ")}.
Respond with JSON of shape:
{"criteria":[{"criterion":string,"score":number,"evidence":string,"concern":string,"suggestion":string,"confidence":number}],"strengths":[string],"improvements":[string],"suggestions":[string],"insights":[{"title":string,"body":string}]}
strengths: 2-3 specific positives. improvements: 2-3 evidence-backed problems. suggestions: 2-3 actionable next steps. insights: up to 4 relevant concepts.`;

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI evaluation failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI evaluation returned no content");

    const cleaned = content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "");
    return aiResultSchema.parse(JSON.parse(cleaned));
  });
