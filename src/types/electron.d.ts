// Electron 类型声明
interface ElectronAPI {
  getAppInfo: () => {
    platform: string;
    version: string;
  };
  
  window: {
    close: () => void;
    minimize: () => void;
    maximize: () => void;
    toggleMaximize: () => void;
    isMaximized: () => Promise<boolean>;
  };
  
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
