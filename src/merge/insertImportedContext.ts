import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export interface InsertMetadata {
  sourceSessionPath: string;
  sourceSessionId?: string;
  sourceCwd?: string;
  sourceName?: string;
  mergeMode: "context-summary";
  importedAt: string;
}

export function insertImportedContext(pi: Pick<ExtensionAPI, "sendMessage">, content: string, metadata: InsertMetadata): void {
  pi.sendMessage(
    {
      customType: "session-merge",
      content,
      display: true,
      details: metadata,
    },
    {
      // Queue for the next user turn. This uses Pi's official message injection
      // path, so the imported context is included in the model context instead
      // of only being appended to the session file/UI state.
      deliverAs: "nextTurn",
    },
  );
}
