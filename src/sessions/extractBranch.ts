import type { TextRecord } from "../types.ts";

export function extractUsefulBranch(sessionManager: any): { records: TextRecord[]; note?: string } {
  const branch = typeof sessionManager.getBranch === "function"
    ? sessionManager.getBranch()
    : typeof sessionManager.getEntries === "function"
      ? sessionManager.getEntries()
      : [];
  return { records: entriesToTextRecords(branch) };
}

export function entriesToTextRecords(entries: any[]): TextRecord[] {
  const records: TextRecord[] = [];
  for (const entry of entries ?? []) {
    try {
      if (entry.type === "message" && entry.message) {
        const role = entry.message.role;
        if (!["user", "assistant", "custom", "bashExecution", "toolResult"].includes(role)) continue;
        const text = messageText(entry.message);
        if (text.trim()) records.push({ role, text, timestamp: entry.timestamp ?? entry.message.timestamp });
      } else if (entry.type === "custom_message") {
        const text = contentText(entry.content);
        if (text.trim()) records.push({ role: "custom", text, timestamp: entry.timestamp });
      } else if (entry.type === "compaction") {
        records.push({ role: "compaction", text: entry.summary ?? "", timestamp: entry.timestamp });
      } else if (entry.type === "branch_summary") {
        records.push({ role: "branchSummary", text: entry.summary ?? "", timestamp: entry.timestamp });
      }
    } catch {
      // Ignore malformed entries during digest extraction.
    }
  }
  return records;
}

function messageText(message: any): string {
  if (message.role === "bashExecution") {
    return `$ ${message.command}\n${truncate(message.output ?? "", 1200)}`;
  }
  if (message.role === "toolResult") {
    return `${message.toolName ?? "tool"} result: ${truncate(contentText(message.content), 1200)}`;
  }
  if (message.role === "custom") return contentText(message.content);
  return contentText(message.content);
}

function contentText(content: any): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (block?.type === "text") return block.text ?? "";
      if (block?.type === "toolCall") return `$ ${block.name ?? "tool"} ${JSON.stringify(block.arguments ?? {})}`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
