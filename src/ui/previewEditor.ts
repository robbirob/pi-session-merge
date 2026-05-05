export async function showPreviewEditor(ui: any, formatted: string): Promise<string | undefined> {
  if (typeof ui.editor === "function") return ui.editor("Review imported session context:", formatted);
  if (typeof ui.input === "function") return ui.input("Review imported session context:", formatted);
  return formatted;
}
