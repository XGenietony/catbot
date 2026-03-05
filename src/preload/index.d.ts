import { ElectronAPI } from '@electron-toolkit/preload'
import { ChatMessage, AgentUpdate } from '../common/types'

interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

interface SkillListItem {
  name: string
  description: string
  source: 'workspace' | 'builtin'
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      readConfigFile: (fileName: string) => Promise<string>
      writeConfigFile: (fileName: string, content: string) => Promise<void>
      readWorkspaceDir: (subDir?: string) => Promise<FileEntry[]>
      openFile: (filePath: string) => Promise<void>
      openSkillsDir: () => Promise<void>
      installSkillGit: (gitUrl: string) => Promise<void>
      installSkillZip: (zipPath: string, force?: boolean) => Promise<string>
      selectSkillZip: () => Promise<string | null>
      deleteSkill: (name: string) => Promise<void>
      agentLoop: (messages: ChatMessage[]) => Promise<string>
      readSession: () => Promise<ChatMessage[]>
      clearSession: () => Promise<void>
      listSkills: (opts?: { filterUnavailable?: boolean }) => Promise<SkillListItem[]>
      onAgentUpdate: (callback: (data: AgentUpdate) => void) => () => void
    }
  }
}
