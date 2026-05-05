import type { SessionInfoLike } from "../types.ts";
import { formatSessionLabel } from "../sessions/sessionMetadata.ts";

export async function showSessionPicker(ui: any, sessions: SessionInfoLike[], showFullCwd = false): Promise<SessionInfoLike | undefined> {
  const labels = sessions.map((session) => formatSessionLabel(session, showFullCwd));
  const choice = await ui.select("Pick a session to import context from:", labels);
  if (!choice) return undefined;
  const index = labels.indexOf(choice);
  return index >= 0 ? sessions[index] : undefined;
}
