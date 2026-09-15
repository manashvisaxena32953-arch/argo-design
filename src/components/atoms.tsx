import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AttemptStatus, Difficulty } from "@/domain/types";

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const tone =
    level === "Easy"
      ? "bg-success/10 text-success border-success/20"
      : level === "Medium"
        ? "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning"
        : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {level}
    </span>
  );
}

const STATUS_TONE: Record<AttemptStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-accent/10 text-accent border-accent/25",
  EVALUATING: "bg-accent/10 text-accent border-accent/25",
  COMPLETED: "bg-success/10 text-success border-success/25",
  FAILED: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({ status }: { status: AttemptStatus }) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        STATUS_TONE[status],
      )}
    >
      {status}
    </span>
  );
}

export function ScoreRing({
  score,
  size = 120,
  label = "Overall score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / 10));
  const tone =
    score >= 8 ? "text-success" : score >= 6 ? "text-primary" : "text-warning";

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${score} out of 10`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
          strokeLinecap="round"
          className={cn("fill-none transition-[stroke-dashoffset] duration-700", tone)}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute text-center">
        <p className="mono text-2xl font-semibold leading-none">{score.toFixed(1)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">/ 10</p>
      </div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const tone =
    score >= 8 ? "bg-success" : score >= 6 ? "bg-primary" : "bg-warning";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", tone)}
        style={{ width: `${(score / 10) * 100}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6", className)}>
      {children}
    </main>
  );
}
