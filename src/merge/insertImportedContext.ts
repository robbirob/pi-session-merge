export interface InsertMetadata {
  sourceSessionPath: string;
  sourceSessionId?: string;
  sourceCwd?: string;
  sourceName?: string;
  mergeMode: "context-summary";
  importedAt: string;
}

export function insertImportedContext(sessionManager: any, content: string, metadata: InsertMetadata): string {
  if (typeof sessionManager.appendCustomMessageEntry !== "function") {
    throw new Error("Current Pi SessionManager does not support appendCustomMessageEntry().");
  }
  return sessionManager.appendCustomMessageEntry("session-merge", content, true, metadata);
}
