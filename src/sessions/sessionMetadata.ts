import { basenamePath, formatDate } from "../utils/date.ts";
import type { SessionInfoLike } from "../types.ts";

export function sessionDisplayName(session: SessionInfoLike): string {
  return session.name?.trim() || firstLine(session.firstMessage) || session.id || session.path;
}

export function formatSessionLabel(session: SessionInfoLike, showFullCwd = false): string {
  const title = sessionDisplayName(session);
  const cwd = showFullCwd ? session.cwd : basenamePath(session.cwd);
  return `${title} — ${formatDate(session.modified)} — ${cwd} — ${session.messageCount} entries`;
}

export function firstLine(text: string | undefined, max = 80): string {
  const line = (text ?? "").replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}
