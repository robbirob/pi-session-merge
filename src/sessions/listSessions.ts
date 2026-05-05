import type { SessionInfoLike } from "../types.ts";

export interface ListCandidateOptions {
  currentCwd: string;
  currentSessionFile?: string;
  all?: boolean;
  cwd?: string;
}

export async function listCandidateSessions(options: ListCandidateOptions): Promise<SessionInfoLike[]> {
  const { SessionManager } = await import("@mariozechner/pi-coding-agent");
  const sessions = options.all
    ? await SessionManager.listAll()
    : await SessionManager.list(options.cwd ?? options.currentCwd);
  return filterAndSortSessions(sessions, options.currentSessionFile);
}

export function filterAndSortSessions<T extends SessionInfoLike>(
  sessions: T[],
  currentSessionFile?: string,
): T[] {
  const current = normalizePath(currentSessionFile);
  return sessions
    .filter((s) => normalizePath(s.path) !== current)
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

export function resolveSessionRef<T extends SessionInfoLike>(sessions: T[], ref: string): T | undefined | "ambiguous" {
  const normalizedRef = normalizePath(ref);
  const matches = sessions.filter((s) => {
    const p = normalizePath(s.path);
    return s.id.startsWith(ref) || p.startsWith(normalizedRef) || p.includes(normalizedRef) || (s.name ?? "").toLowerCase().includes(ref.toLowerCase());
  });
  if (matches.length === 0) return undefined;
  if (matches.length > 1) return "ambiguous";
  return matches[0];
}

function normalizePath(value: string | undefined): string {
  return (value ?? "").replace(/\\/g, "/").toLowerCase();
}
