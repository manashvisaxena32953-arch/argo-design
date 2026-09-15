import type { StructuredDesignContent } from "./types";

export interface ValidationIssue {
  /** Dot path of the offending field, e.g. "classes.2.responsibility". */
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const isBlank = (value: string | undefined | null) =>
  !value || value.trim().length === 0;

/**
 * Deterministic submission validation. Runs before anything is persisted as
 * SUBMITTED, and is reused by the rule-based evaluator.
 */
export function validateSubmission(
  content: StructuredDesignContent,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const classes = content.classes ?? [];
  const interfaces = content.interfaces ?? [];
  const relationships = content.relationships ?? [];

  if (classes.length === 0) {
    issues.push({
      field: "classes",
      message: "Add at least one class before submitting.",
    });
  }

  const seen = new Map<string, number>();
  classes.forEach((cls, index) => {
    if (isBlank(cls.name)) {
      issues.push({
        field: `classes.${index}.name`,
        message: "Class name is required.",
      });
    } else {
      const key = cls.name.trim().toLowerCase();
      const previous = seen.get(key);
      if (previous !== undefined) {
        issues.push({
          field: `classes.${index}.name`,
          message: `Duplicate class name "${cls.name.trim()}" — class names must be unique.`,
        });
      } else {
        seen.set(key, index);
      }
    }

    if (isBlank(cls.responsibility)) {
      issues.push({
        field: `classes.${index}.responsibility`,
        message: "Every class needs a responsibility.",
      });
    }
  });

  const interfaceNames = new Map<string, number>();
  interfaces.forEach((itf, index) => {
    if (isBlank(itf.name)) {
      issues.push({
        field: `interfaces.${index}.name`,
        message: "Interface name is required.",
      });
      return;
    }
    const key = itf.name.trim().toLowerCase();
    if (interfaceNames.has(key) || seen.has(key)) {
      issues.push({
        field: `interfaces.${index}.name`,
        message: `Duplicate entity name "${itf.name.trim()}".`,
      });
    } else {
      interfaceNames.set(key, index);
    }
    if (isBlank(itf.responsibility)) {
      issues.push({
        field: `interfaces.${index}.responsibility`,
        message: "Every interface needs a responsibility.",
      });
    }
    if (isBlank(itf.methods)) {
      issues.push({
        field: `interfaces.${index}.methods`,
        message: "An interface without methods defines no contract.",
      });
    }
  });

  const known = new Set<string>([...seen.keys(), ...interfaceNames.keys()]);

  relationships.forEach((rel, index) => {
    if (isBlank(rel.from) && isBlank(rel.to)) {
      issues.push({
        field: `relationships.${index}.from`,
        message: "Remove empty relationship rows or fill them in.",
      });
      return;
    }
    if (isBlank(rel.from) || !known.has(rel.from.trim().toLowerCase())) {
      issues.push({
        field: `relationships.${index}.from`,
        message: `"${rel.from || "(empty)"}" is not one of your classes or interfaces.`,
      });
    }
    if (isBlank(rel.to) || !known.has(rel.to.trim().toLowerCase())) {
      issues.push({
        field: `relationships.${index}.to`,
        message: `"${rel.to || "(empty)"}" is not one of your classes or interfaces.`,
      });
    }
  });

  if (isBlank(content.explanation)) {
    issues.push({
      field: "explanation",
      message: "Explain your design decisions before submitting.",
    });
  }

  return { valid: issues.length === 0, issues };
}

export const issuesFor = (result: ValidationResult, field: string) =>
  result.issues.filter((i) => i.field === field).map((i) => i.message);
