import type { Attempt } from "./types";

/** Persistence port. Swap the adapter without touching the practice flow. */
export interface AttemptRepository {
  list(): Attempt[];
  get(id: string): Attempt | undefined;
  save(attempt: Attempt): void;
  remove(id: string): void;
}

export class InMemoryAttemptRepository implements AttemptRepository {
  private store = new Map<string, Attempt>();

  list(): Attempt[] {
    return [...this.store.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  get(id: string) {
    return this.store.get(id);
  }
  save(attempt: Attempt) {
    this.store.set(attempt.id, attempt);
  }
  remove(id: string) {
    this.store.delete(id);
  }
}

const KEY = "lld-arena.attempts.v1";

/** Browser adapter. Reads defensively so corrupt data never breaks the app. */
export class LocalStorageAttemptRepository implements AttemptRepository {
  private cache: Attempt[] | null = null;

  private read(): Attempt[] {
    if (this.cache) return this.cache;
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(KEY);
      this.cache = raw ? (JSON.parse(raw) as Attempt[]) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private write(attempts: Attempt[]) {
    this.cache = attempts;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(attempts));
    } catch (error) {
      console.error("Could not persist attempts", error);
    }
  }

  list(): Attempt[] {
    return [...this.read()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  get(id: string) {
    return this.read().find((a) => a.id === id);
  }

  save(attempt: Attempt) {
    const all = this.read().filter((a) => a.id !== attempt.id);
    this.write([...all, attempt]);
  }

  remove(id: string) {
    this.write(this.read().filter((a) => a.id !== id));
  }
}
