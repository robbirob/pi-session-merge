import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerMergeCommand } from "./commands/mergeCommand.ts";

export default function sessionMergeExtension(pi: ExtensionAPI): void {
  registerMergeCommand(pi);
}
