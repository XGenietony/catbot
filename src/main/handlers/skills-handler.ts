import { ipcMain, shell, dialog } from 'electron'
import { mkdir } from 'node:fs/promises'
import { SkillsManager } from '../managers/skills-manager'

export interface SkillListItem {
  name: string
  description: string
  source: 'workspace' | 'home' | 'builtin'
}

export function registerSkillsHandlers(existingSkillsManager?: SkillsManager): void {
  const skillsManager = existingSkillsManager ?? new SkillsManager()

  ipcMain.handle('open-skills-dir', async () => {
    const skillsDir = skillsManager.getWorkspaceSkillsDir()
    await mkdir(skillsDir, { recursive: true })
    await shell.openPath(skillsDir)
  })

  ipcMain.handle('select-skill-zip', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Zip Files', extensions: ['zip'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    'install-skill-zip',
    async (_, zipPath: string, force: boolean = false): Promise<string> => {
      return await skillsManager.installSkillFromZip(zipPath, force)
    }
  )

  ipcMain.handle('delete-skill', async (_, name: string) => {
    await skillsManager.deleteSkill(name)
  })

  ipcMain.handle('list-skills', async (_event, opts?: { filterUnavailable?: boolean }) => {
    const filterUnavailable =
      typeof opts?.filterUnavailable === 'boolean' ? opts.filterUnavailable : false
    const skills = await skillsManager.listSkills(filterUnavailable)

    const items: SkillListItem[] = []
    for (const skill of skills) {
      const meta = await skillsManager.getSkillMetadata(skill.name)
      items.push({
        name: skill.name,
        description: meta?.description ?? '',
        source: skill.source
      })
    }

    items.sort((a, b) => {
      const priority: Record<SkillListItem['source'], number> = {
        workspace: 0,
        home: 1,
        builtin: 2
      }
      if (a.source !== b.source) return priority[a.source] - priority[b.source]
      return a.name.localeCompare(b.name)
    })

    return items
  })
}
