import { ipcMain } from 'electron'
import { SessionManager } from '../managers/session-manager'

export function registerSessionHandlers(sessionManager: SessionManager): void {
  ipcMain.handle('read-session', async () => {
    return await sessionManager.read()
  })

  ipcMain.handle('clear-session', async () => {
    await sessionManager.clear()
    return true
  })
}
