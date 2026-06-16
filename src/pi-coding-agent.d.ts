declare module "@earendil-works/pi-coding-agent" {
  export interface ExtensionAPI {
    registerCommand(name: string, command: { description?: string; handler: (args: string | undefined, ctx: any) => unknown }): void;
    sendMessage(message: any, options?: any): void;
  }

  export const SessionManager: any;
}
