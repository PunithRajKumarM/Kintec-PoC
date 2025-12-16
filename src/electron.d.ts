export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string | null>;
    };
  }
}
