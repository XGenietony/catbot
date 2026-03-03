import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  readConfigFile: (fileName: string) => ipcRenderer.invoke('read-config-file', fileName),
  writeConfigFile: (fileName: string, content: string) => ipcRenderer.invoke('write-config-file', fileName, content),
  readWorkspaceDir: (subDir: string = '') => ipcRenderer.invoke('read-workspace-dir', subDir),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  llmRequest: (messages: { role: string; content: string }[]) => ipcRenderer.invoke('llm-request', messages),
  agentLoop: (messages: any[]) => ipcRenderer.invoke('agent-loop', messages),
  onAgentUpdate: (callback: (data: any) => void) => {
    const listener = (_event, value) => callback(value)
    ipcRenderer.on('agent-update', listener)
    return () => ipcRenderer.removeListener('agent-update', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
