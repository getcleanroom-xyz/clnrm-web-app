declare module "@novnc/novnc/core/rfb" {
  interface RFBOptions {
    shared?: boolean;
    repeaterID?: string;
    credentials?: { username?: string; password?: string };
    target?: HTMLElement;
    url?: string;
  }

  interface RFBEventMap {
    connect: Event;
    disconnect: Event;
    credentialsrequired: CustomEvent<{ types: string[] }>;
    securityfailure: CustomEvent<{ status: number }>;
    clipboard: CustomEvent<{ text: string }>;
    bell: Event;
    desktopname: CustomEvent<{ name: string }>;
  }

  export default class RFB {
    constructor(target: HTMLElement, url: string, options?: RFBOptions);
    disconnect(): void;
    sendCredentials(credentials: { password: string }): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    sendCtrlAltDel(): void;
    machineShutdown(): void;
    machineReboot(): void;
    machineReset(): void;
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
