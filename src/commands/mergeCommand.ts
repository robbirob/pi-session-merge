import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { parseMergeArgs } from "../utils/args.ts";
import { listCandidateSessions, resolveSessionRef } from "../sessions/listSessions.ts";
import { showSessionPicker } from "../ui/sessionPicker.ts";
import { openSession } from "../sessions/readSession.ts";
import { extractUsefulBranch } from "../sessions/extractBranch.ts";
import { buildSessionDigest } from "../merge/buildSessionDigest.ts";
import { formatImportedContext } from "../merge/formatImportedContext.ts";
import { showPreviewEditor } from "../ui/previewEditor.ts";
import { insertImportedContext } from "../merge/insertImportedContext.ts";

export function registerMergeCommand(pi: ExtensionAPI): void {
  pi.registerCommand("merge", {
    description: "Import summarized context from another Pi session",
    handler: async (args: string | undefined, ctx: any) => {
      await ctx.waitForIdle?.();

      let options;
      try {
        options = parseMergeArgs(args);
      } catch (err) {
        ctx.ui.notify((err as Error).message, "error");
        return;
      }

      const currentCwd = ctx.sessionManager.getCwd?.() ?? ctx.cwd;
      const currentSessionFile = ctx.sessionManager.getSessionFile?.();

      let sessions;
      try {
        sessions = await listCandidateSessions({ currentCwd, currentSessionFile, all: options.all, cwd: options.cwd });
      } catch (err) {
        ctx.ui.notify(`Could not list Pi sessions: ${(err as Error).message}`, "error");
        return;
      }

      if (sessions.length === 0) {
        ctx.ui.notify(
          options.all || options.cwd
            ? "No other Pi sessions found."
            : "No other Pi sessions found for this working directory. Try /merge --all to search all directories.",
          "info",
        );
        return;
      }

      let selected;
      if (options.sessionRef) {
        const resolved = resolveSessionRef(sessions, options.sessionRef);
        if (resolved === "ambiguous") {
          ctx.ui.notify("Session reference matched multiple sessions. Please choose from the picker.", "warning");
        } else if (!resolved) {
          ctx.ui.notify("No session matched that reference. Please choose from the picker.", "warning");
        } else {
          selected = resolved;
        }
      }
      selected ??= await showSessionPicker(ctx.ui, sessions, Boolean(options.all));
      if (!selected) return;

      let sourceSession;
      try {
        sourceSession = await openSession(selected.path);
      } catch {
        ctx.ui.notify("Could not read the selected source session. It may have been moved, deleted, or created by an incompatible Pi version.", "error");
        return;
      }

      const { records, note } = extractUsefulBranch(sourceSession);
      const digest = buildSessionDigest(records, selected, note);
      const formatted = formatImportedContext(digest);
      const reviewed = await showPreviewEditor(ctx.ui, formatted);
      if (!reviewed?.trim()) return;

      const confirmed = await ctx.ui.confirm(
        "Merge this session context into the current session?",
        "This adds a summarized context block and does not modify the source session.",
      );
      if (!confirmed) return;

      try {
        insertImportedContext(ctx.sessionManager, reviewed, {
          sourceSessionPath: selected.path,
          sourceSessionId: selected.id,
          sourceCwd: selected.cwd,
          sourceName: selected.name,
          mergeMode: "context-summary",
          importedAt: digest.importedAt,
        });
      } catch (err) {
        ctx.ui.notify(`Could not insert imported context: ${(err as Error).message}`, "error");
        return;
      }

      ctx.ui.notify("Session context merged into current session.", "success");
    },
  });
}
