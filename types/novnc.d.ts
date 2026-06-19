declare module "@novnc/novnc" {
  interface RFBOptions {
    shared?: boolean;
    repeaterID?: string;
    credentials?: { username?: string; password?: string };
    target?: HTMLElement;
    url?: string;
    wsProtocols?: string[];
  }

  interface RFBEventMap {
    connect: Event;
    disconnect: CustomEvent<{ clean: boolean; code?: number; reason?: string }>;
    credentialsrequired: CustomEvent<{ types: string[] }>;
    securityfailure: CustomEvent<{ status: number; reason?: string }>;
    clipboard: CustomEvent<{ text: string }>;
    bell: Event;
    desktopname: CustomEvent<{ name: string }>;
    error: CustomEvent<{ message: string }>;
  }

  export default class RFB {
    constructor(target: HTMLElement, url: string, options?: RFBOptions);
    disconnect(): void;
    sendCredentials(credentials: { password?: string }): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    sendCtrlAltDel(): void;
    machineShutdown(): void;
    machineReboot(): void;
    machineReset(): void;
    scaleViewport: boolean;
    resizeSession: boolean;
    clipViewport: boolean;
    addEventListener<K extends keyof RFBEventMap>(
      type: K,
      listener: (ev: RFBEventMap[K]) => void
    ): void;
    removeEventListener<K extends keyof RFBEventMap>(
      type: K,
      listener: (ev: RFBEventMap[K]) => void
    ): void;
  }
}
