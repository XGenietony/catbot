import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'

export const WORKSPACE_PATH = join(homedir(), '.catbot', 'workspace')
export const SKILLS_PATH = join(homedir(), '.catbot', 'skills')

export const BUILTIN_PATH = join(app.getAppPath(), 'resources', 'builtin')
