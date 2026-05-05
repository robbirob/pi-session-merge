export async function openSession(path: string): Promise<any> {
  const { SessionManager } = await import("@mariozechner/pi-coding-agent");
  return SessionManager.open(path);
}
