import type { SessionDigest } from "../types.ts";

export function formatImportedContext(digest: SessionDigest): string {
  return `# Imported Session Context

Source session: ${digest.sourceName ?? digest.sourceSessionId ?? "unknown"}
Source working directory: ${digest.sourceCwd ?? "unknown"}
Imported at: ${digest.importedAt}
Merge mode: Context summary
${digest.largeSession ? "\n> Source session is large. This imported context is a compressed summary.\n" : ""}${digest.branchNote ? `\n> ${digest.branchNote}\n` : ""}
## Original Goal

${digest.originalGoal}

## Current/Final State

${digest.finalState}

## Important Decisions

${bullets(digest.decisions)}

## Relevant Files and Paths

${digest.files.length ? digest.files.map((f) => `- \`${f.path}\` — ${f.note}`).join("\n") : "- None identified."}

## Commands, Tools, or External Actions Mentioned

${digest.commands.length ? digest.commands.map((c) => `- \`${c.command}\` — ${c.note}`).join("\n") : "- None identified."}

## Constraints and Assumptions

${bullets(digest.constraints)}

## Open TODOs / Next Steps

${bullets(digest.todos)}

## Risks / Things Not To Do

${bullets(digest.risks)}

## Raw Notes Worth Preserving

${digest.rawNotes ?? "None."}
`;
}

function bullets(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None identified.";
}
