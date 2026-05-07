export async function openSession(path: string): Promise<any> {
  const { SessionManager } = await import("@earendil-works/pi-coding-agent");
  return SessionManager.open(path);
}
