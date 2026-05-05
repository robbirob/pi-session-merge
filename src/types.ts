export interface SessionInfoLike {
  path: string;
  id: string;
  cwd: string;
  name?: string;
  parentSessionPath?: string;
  created: Date;
  modified: Date;
  messageCount: number;
  firstMessage: string;
  allMessagesText?: string;
}

export interface TextRecord {
  role: string;
  text: string;
  timestamp?: number | string;
}

export interface SessionDigest {
  sourceName?: string;
  sourceSessionId?: string;
  sourceSessionPath?: string;
  sourceCwd?: string;
  importedAt: string;
  originalGoal: string;
  finalState: string;
  decisions: string[];
  files: Array<{ path: string; note: string }>;
  commands: Array<{ command: string; note: string }>;
  constraints: string[];
  todos: string[];
  risks: string[];
  rawNotes?: string;
  largeSession: boolean;
  branchNote?: string;
}
