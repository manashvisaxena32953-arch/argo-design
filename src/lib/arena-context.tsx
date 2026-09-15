import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createEvaluator } from "@/domain/evaluation";
import { PracticeService } from "@/domain/practice-service";
import { LocalStorageAttemptRepository } from "@/domain/repository";
import type { Attempt, StructuredDesignContent } from "@/domain/types";

interface ArenaValue {
  ready: boolean;
  attempts: Attempt[];
  stats: ReturnType<PracticeService["stats"]>;
  service: PracticeService;
  refresh: () => void;
  getAttempt: (id: string) => Attempt | undefined;
  createAttempt: (problemId: string) => Attempt;
  improve: (attemptId: string) => Attempt;
  saveDraft: (attemptId: string, content: StructuredDesignContent) => void;
  submit: (
    attemptId: string,
    content: StructuredDesignContent,
  ) => Promise<Attempt>;
  runEvaluation: (attemptId: string) => Promise<Attempt>;
}

const ArenaContext = createContext<ArenaValue | null>(null);

const EMPTY_STATS = {
  attempted: 0,
  problemsAttempted: 0,
  completed: 0,
  averageScore: 0,
};

export function ArenaProvider({ children }: { children: ReactNode }) {
  const service = useMemo(
    () => new PracticeService(new LocalStorageAttemptRepository(), createEvaluator("ai")),
    [],
  );
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setAttempts(service.listAttempts());
  }, [service]);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const value: ArenaValue = {
    ready,
    attempts,
    stats: ready ? service.stats() : EMPTY_STATS,
    service,
    refresh,
    getAttempt: (id) => service.getAttempt(id),
    createAttempt: (problemId) => {
      const attempt = service.createAttempt(problemId);
      refresh();
      return attempt;
    },
    improve: (attemptId) => {
      const attempt = service.improve(attemptId);
      refresh();
      return attempt;
    },
    saveDraft: (attemptId, content) => {
      service.saveDraft(attemptId, content);
      refresh();
    },
    submit: async (attemptId, content) => {
      const result = await service.submit(attemptId, content);
      refresh();
      return result;
    },
    runEvaluation: async (attemptId) => {
      const result = await service.runEvaluation(attemptId);
      refresh();
      return result;
    },
  };

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
}

export function useArena() {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error("useArena must be used inside ArenaProvider");
  return ctx;
}
