import { join } from 'path'
import { homedir } from 'os'

export const WORKSPACE_PATH = join(homedir(), '.catbot', 'workspace')
