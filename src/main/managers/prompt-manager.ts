import { join } from 'path'
import { readFile, writeFile, copyFile, access } from 'fs/promises'
import { constants } from 'fs'
import { WORKSPACE_PATH, BUILTIN_PATH } from '../configs'

export class PromptManager {
  private identityPath: string
  private agentsPath: string
  private builtinIdentityPath: string
  private builtinAgentsPath: string

  constructor() {
    this.identityPath = join(WORKSPACE_PATH, 'IDENTITY.md')
    this.agentsPath = join(WORKSPACE_PATH, 'AGENTS.md')
    this.builtinIdentityPath = join(BUILTIN_PATH, 'prompt', 'IDENTITY.md')
    this.builtinAgentsPath = join(BUILTIN_PATH, 'prompt', 'AGENTS.md')
  }

  async init(): Promise<void> {
    await this.ensureFileExists(this.identityPath, this.builtinIdentityPath)
    await this.ensureFileExists(this.agentsPath, this.builtinAgentsPath)
  }

  private async ensureFileExists(targetPath: string, sourcePath: string): Promise<void> {
    try {
      await access(targetPath, constants.F_OK)
    } catch {
      try {
        await copyFile(sourcePath, targetPath)
      } catch (error) {
        console.warn(`Failed to copy prompt from ${sourcePath} to ${targetPath}`, error)
        // Create empty file if copy fails to avoid errors downstream
        await writeFile(targetPath, '', 'utf-8')
      }
    }
  }

  async read(fileName: 'IDENTITY.md' | 'AGENTS.md'): Promise<string> {
    const filePath = fileName === 'IDENTITY.md' ? this.identityPath : this.agentsPath
    try {
      return await readFile(filePath, 'utf-8')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return ''
    }
  }

  async update(fileName: 'IDENTITY.md' | 'AGENTS.md', content: string): Promise<void> {
    const filePath = fileName === 'IDENTITY.md' ? this.identityPath : this.agentsPath
    await writeFile(filePath, content, 'utf-8')
  }
}
