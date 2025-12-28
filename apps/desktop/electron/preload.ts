import { contextBridge, ipcRenderer } from 'electron';

/**
 * Secure IPC Bridge for Renderer Process
 * Exposes only safe APIs to the web content
 */

// Define the API that will be exposed to the renderer
const electronAPI = {
  // App info
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  isDev: (): Promise<boolean> => ipcRenderer.invoke('app:is-dev'),

  // Window controls
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  closeQuickAdd: (): void => ipcRenderer.send('window:close-quick-add'),

  // Platform info
  platform: process.platform,

  // Event listeners
  onDeepLink: (callback: (url: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) => callback(url);
    ipcRenderer.on('deep-link', handler);
    return () => ipcRenderer.removeListener('deep-link', handler);
  },

  onShortcut: (callback: (action: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('shortcut', handler);
    return () => ipcRenderer.removeListener('shortcut', handler);
  },
};

// Expose the API to the renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
