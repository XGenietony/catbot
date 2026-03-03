import { ElectronAPI } from '@electron-toolkit/preload'

interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      readConfigFile: (fileName: string) => Promise<string>
      writeConfigFile: (fileName: string, content: string) => Promise<void>
      readWorkspaceDir: (subDir?: string) => Promise<FileEntry[]>
      openFile: (filePath: string) => Promise<void>
      llmRequest: (messages: { role: string; content: string }[]) => Promise<string>
      agentLoop: (messages: any[]) => Promise<string>
      onAgentUpdate: (callback: (data: any) => void) => () => void
    }
  }
}
