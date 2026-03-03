import { ipcMain } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'

export function registerConfigHandlers(workspacePath: string): void {
  ipcMain.handle('read-config-file', async (_, fileName: string) => {
    if (!['IDENTITY.md', 'AGENTS.md', 'catbot.json'].includes(fileName)) {
      throw new Error('Invalid file name')
    }
    const filePath = join(workspacePath, fileName)
    try {
      return await readFile(filePath, 'utf-8')
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : undefined
      if (code === 'ENOENT') {
        // If file doesn't exist, create it with default content
        // For catbot.json, use empty object as requested
        const defaultContent = fileName === 'catbot.json' ? '{}' : ''
        await writeFile(filePath, defaultContent, 'utf-8')
        return defaultContent
      }
      throw error
    }
  })

  ipcMain.handle('write-config-file', async (_, fileName: string, content: string) => {
    if (!['IDENTITY.md', 'AGENTS.md', 'catbot.json'].includes(fileName)) {
      throw new Error('Invalid file name')
    }
    const filePath = join(workspacePath, fileName)
    await writeFile(filePath, content, 'utf-8')
  })
}
