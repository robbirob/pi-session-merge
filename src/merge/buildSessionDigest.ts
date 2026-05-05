import type { SessionDigest, SessionInfoLike, TextRecord } from "../types.ts";
import { sessionDisplayName } from "../sessions/sessionMetadata.ts";

const LARGE_RECORD_THRESHOLD = 200;
const MAX_TEXT_CHARS = 80_000;

export function buildSessionDigest(records: TextRecord[], source: SessionInfoLike, branchNote?: string): SessionDigest {
  const textRecords = records.filter((r) => r.text.trim());
  const combined = trimToBudget(textRecords.map((r) => `[${r.role}] ${r.text}`).join("\n\n"), MAX_TEXT_CHARS);
  const userRecords = textRecords.filter((r) => r.role === "user");
  const assistantRecords = textRecords.filter((r) => r.role === "assistant" || r.role === "compaction" || r.role === "branchSummary");

  return {
    sourceName: sessionDisplayName(source),
    sourceSessionId: source.id,
    sourceSessionPath: source.path,
    sourceCwd: source.cwd,
    importedAt: new Date().toISOString(),
    originalGoal: cleanSection(userRecords[0]?.text) || cleanSection(source.firstMessage) || "Not identified.",
    finalState: cleanSection(lastUseful(assistantRecords)?.text) || "Not identified from the selected session.",
    decisions: uniqueLines(extractMatching(combined, /\b(decided|decision|choose|chosen|approach|settled|will use)\b/i), 8),
    files: extractFiles(combined).slice(0, 20).map((path) => ({ path, note: "Mentioned in source session" })),
    commands: extractCommands(combined).slice(0, 20).map((command) => ({ command, note: "Mentioned or run in source session" })),
    constraints: uniqueLines(extractMatching(combined, /\b(must|must not|do not|don't|constraint|requirement|required|important)\b/i), 12),
    todos: uniqueLines(extractMatching(combined, /\b(TODO|todo|next|follow-?up|open|remaining|later|still need)\b/i), 12),
    risks: uniqueLines(extractMatching(combined, /\b(risk|avoid|do not|must not|danger|unsafe|corrupt|destructive)\b/i), 10),
    rawNotes: textRecords.length === 0 ? "Source session contained no readable message text." : undefined,
    largeSession: records.length > LARGE_RECORD_THRESHOLD || combined.length >= MAX_TEXT_CHARS,
    branchNote,
  };
}

function lastUseful(records: TextRecord[]): TextRecord | undefined {
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].text.trim().length > 20) return records[i];
  }
  return records.at(-1);
}

function cleanSection(text: string | undefined, max = 1200): string {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

function extractMatching(text: string, regex: RegExp): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && l.length < 500 && regex.test(l));
}

function uniqueLines(lines: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(line.replace(/^[-*]\s*/, ""));
    if (out.length >= max) break;
  }
  return out;
}

export function extractFiles(text: string): string[] {
  const matches = text.match(/(?:[A-Za-z]:)?(?:[.]{1,2}[\\/]|[\\/]|[\w.-]+[\\/])[\w. @()[\]{}+,:;=-]+\.[A-Za-z0-9]{1,8}/g) ?? [];
  return [...new Set(matches.map((m) => m.trim().replace(/[),.;:]+$/, "")))];
}

export function extractCommands(text: string): string[] {
  const commands: string[] = [];
  const fenced = text.matchAll(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)```/gi);
  for (const match of fenced) {
    for (const line of match[1].split(/\r?\n/)) addCommand(commands, line);
  }
  for (const line of text.split(/\r?\n/)) addCommand(commands, line);
  return [...new Set(commands)].slice(0, 50);
}

function addCommand(commands: string[], line: string): void {
  const trimmed = line.trim().replace(/^\$\s*/, "");
  if (/^(npm|pnpm|yarn|node|git|rg|grep|find|ls|cd|mkdir|rm|cp|mv|cat|sed|python|pip|cargo|go|deno|bun)\b/.test(trimmed)) {
    commands.push(trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed);
  }
}

function trimToBudget(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, Math.floor(max * 0.65));
  const tail = text.slice(text.length - Math.floor(max * 0.30));
  return `${head}\n\n[...source session text truncated for summary safety...]\n\n${tail}`;
}
