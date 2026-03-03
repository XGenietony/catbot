import { ipcMain, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { join, resolve, sep } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import type {
  ContentBlock,
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock
} from '@anthropic-ai/sdk/resources/messages'

const execAsync = promisify(exec)

export const TOOLS: Tool[] = [
  {
    name: 'bash',
    description: 'Run a shell command.',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: 'Read file contents.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, limit: { type: 'integer' } },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to file.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Replace exact text in file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        old_text: { type: 'string' },
        new_text: { type: 'string' }
      },
      required: ['path', 'old_text', 'new_text']
    }
  }
] as unknown as Tool[]

type ToolHandler = (input: unknown) => Promise<string>

export interface AgentLoopOptions {
  client: Anthropic
  model: string
  system: string
  workspacePath: string
  maxTokens?: number
  maxSteps?: number
  onToolUse?: (toolName: string, input: unknown) => void
  onToolResult?: (toolName: string, output: string) => void
}

function resolveWorkspacePath(workspacePath: string, inputPath: string): string {
  const full = resolve(join(workspacePath, inputPath))
  const base = resolve(workspacePath)
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error('Access denied')
  }
  return full
}

function limitText(text: string, limit: number): string {
  if (limit <= 0) return ''
  return text.length > limit ? text.slice(0, limit) : text
}

export function createToolHandlers(workspacePath: string): Record<string, ToolHandler> {
  return {
    bash: async (input: unknown) => {
      const parsed = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
      const command = typeof parsed.command === 'string' ? parsed.command : ''
      if (!command.trim()) return ''

      const DANGEROUS_COMMANDS = ['rm -rf /', 'sudo', 'shutdown', 'reboot', '> /dev/']
      if (DANGEROUS_COMMANDS.some((d) => command.includes(d))) {
        return 'Error: Dangerous command blocked'
      }

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: workspacePath,
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024
        })
        const output = (stdout || '') + (stderr ? `\n${stderr}` : '')
        const trimmed = output.trim()
        return trimmed ? trimmed.slice(0, 50000) : '(no output)'
      } catch (error: any) {
        if (error.killed || error.code === 'ETIMEDOUT') {
          return 'Error: Timeout (120s)'
        }
        const out = (error.stdout || '') + (error.stderr || '')
        const msg = error.message ? error.message.split('\n')[0] : 'Command failed'
        const fullErr = `Error: ${msg}\n${out}`
        return fullErr.trim().slice(0, 50000)
      }
    },
    read_file: async (input: unknown) => {
      const parsed = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
      const filePath = resolveWorkspacePath(workspacePath, typeof parsed.path === 'string' ? parsed.path : '')
      const content = await readFile(filePath, 'utf-8')
      const limit = typeof parsed.limit === 'number' ? parsed.limit : 2000
      return limitText(content, limit)
    },
    write_file: async (input: unknown) => {
      const parsed = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
      const filePath = resolveWorkspacePath(workspacePath, typeof parsed.path === 'string' ? parsed.path : '')
      const content = typeof parsed.content === 'string' ? parsed.content : ''
      await writeFile(filePath, content, 'utf-8')
      return 'ok'
    },
    edit_file: async (input: unknown) => {
      const parsed = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
      const filePath = resolveWorkspacePath(workspacePath, typeof parsed.path === 'string' ? parsed.path : '')
      const oldText = typeof parsed.old_text === 'string' ? parsed.old_text : ''
      const newText = typeof parsed.new_text === 'string' ? parsed.new_text : ''
      const content = await readFile(filePath, 'utf-8')
      if (!oldText) throw new Error('old_text is required')
      const next = content.includes(oldText) ? content.split(oldText).join(newText) : content
      await writeFile(filePath, next, 'utf-8')
      return content === next ? 'no_change' : 'ok'
    }
  }
}

export async function agentLoop(
  initialMessages: MessageParam[],
  opts: AgentLoopOptions
): Promise<MessageParam[]> {
  const messages: MessageParam[] = [...initialMessages]
  const handlers = createToolHandlers(opts.workspacePath)
  const maxSteps = typeof opts.maxSteps === 'number' ? opts.maxSteps : 20
  const maxTokens = typeof opts.maxTokens === 'number' ? opts.maxTokens : 8000

  for (let step = 0; step < maxSteps; step++) {
    const response = await opts.client.messages.create({
      model: opts.model,
      system: opts.system,
      messages,
      tools: TOOLS,
      max_tokens: maxTokens
    })

    messages.push({ role: 'assistant', content: response.content as unknown as MessageParam['content'] })

    if (response.stop_reason !== 'tool_use') {
      return messages
    }

    const results: ToolResultBlockParam[] = []
    for (const block of response.content as ContentBlock[]) {
      if (block.type !== 'tool_use') continue
      const toolUse = block as ToolUseBlock
      const handler = handlers[toolUse.name]
      let output: string
      try {
        opts.onToolUse?.(toolUse.name, toolUse.input)
        output = handler ? await handler(toolUse.input) : `Unknown tool: ${toolUse.name}`
        opts.onToolResult?.(toolUse.name, output)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        output = `Tool error (${toolUse.name}): ${msg}`
        opts.onToolResult?.(toolUse.name, output)
      }
      results.push({ type: 'tool_result', tool_use_id: toolUse.id, content: output, is_error: output.startsWith('Tool error') })
    }
    messages.push({ role: 'user', content: results })
  }

  return messages
}

interface AgentHandlerOptions {
  workspacePath: string
  configPath: string
  identityPath: string
}

export function registerAgentHandlers({ workspacePath, configPath, identityPath }: AgentHandlerOptions): void {
  // IPC Handler for Agent Loop
  ipcMain.handle('agent-loop', async (_, messages: MessageParam[]) => {
    try {
      // 1. Read Config
      let config: unknown = {}
      try {
        const configContent = await readFile(configPath, 'utf-8')
        config = JSON.parse(configContent)
      } catch (err) {
        console.warn('Failed to read catbot.json', err)
      }

      const configRecord = typeof config === 'object' && config !== null ? (config as Record<string, unknown>) : {}
      const modelRecord =
        typeof configRecord.model === 'object' && configRecord.model !== null
          ? (configRecord.model as Record<string, unknown>)
          : {}

      const provider = typeof modelRecord.provider === 'string' ? modelRecord.provider : ''
      const apiKey = typeof modelRecord.apiKey === 'string' ? modelRecord.apiKey : ''
      const baseUrl = typeof modelRecord.baseUrl === 'string' ? modelRecord.baseUrl : ''
      const modelName = typeof modelRecord.modelName === 'string' ? modelRecord.modelName : ''

      if (!apiKey) {
        throw new Error('API Key is missing in Settings')
      }

      if (provider !== 'anthropic') {
        throw new Error('Agent Loop currently only supports Anthropic provider')
      }

      // 2. Read System Prompt (Identity)
      let systemPrompt = ''
      try {
        systemPrompt = await readFile(identityPath, 'utf-8')
      } catch (err) {
        console.warn('Failed to read IDENTITY.md', err)
      }

      // 3. Initialize Client
      const client = new Anthropic({
        apiKey,
        baseURL: baseUrl || undefined
      })

      // 4. Run Agent Loop
      const finalMessages = await agentLoop(messages, {
        client,
        model: modelName || 'claude-3-opus-20240229',
        system: systemPrompt,
        workspacePath,
        maxSteps: 10, // reasonable default
        onToolUse: (toolName, input) => {
          try {
            // Use event.sender instead of mainWindow
            const win = BrowserWindow.getAllWindows()[0]
            if (win) {
              win.webContents.send('agent-update', { type: 'tool_use', tool: toolName, input })
            }
          } catch (e) {
            console.error('Failed to send tool_use update', e)
          }
        },
        onToolResult: (toolName, output) => {
          try {
            const win = BrowserWindow.getAllWindows()[0]
            if (win) {
              win.webContents.send('agent-update', { type: 'tool_result', tool: toolName, output })
            }
          } catch (e) {
            console.error('Failed to send tool_result update', e)
          }
        }
      })

      // Return the last message content
      const lastMessage = finalMessages[finalMessages.length - 1]
      if (lastMessage.role === 'assistant') {
        if (typeof lastMessage.content === 'string') {
          return lastMessage.content
        } else if (Array.isArray(lastMessage.content)) {
          const textBlock = (lastMessage.content as ContentBlock[]).find((block) => block.type === 'text')
          return textBlock && 'text' in textBlock ? (textBlock as { text: string }).text : ''
        }
      }
      return ''
    } catch (error: unknown) {
      console.error('Agent Loop Failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(msg || 'Failed to run agent loop')
    }
  })

  // IPC Handler for LLM
  ipcMain.handle('llm-request', async (_, messages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      // 1. Read Config
      let config: unknown = {}
      try {
        const configContent = await readFile(configPath, 'utf-8')
        config = JSON.parse(configContent)
      } catch (err) {
        console.warn('Failed to read catbot.json', err)
      }

      const configRecord = typeof config === 'object' && config !== null ? (config as Record<string, unknown>) : {}
      const modelRecord =
        typeof configRecord.model === 'object' && configRecord.model !== null
          ? (configRecord.model as Record<string, unknown>)
          : {}

      const provider = typeof modelRecord.provider === 'string' ? modelRecord.provider : ''
      const apiKey = typeof modelRecord.apiKey === 'string' ? modelRecord.apiKey : ''
      const baseUrl = typeof modelRecord.baseUrl === 'string' ? modelRecord.baseUrl : ''
      const modelName = typeof modelRecord.modelName === 'string' ? modelRecord.modelName : ''

      if (!apiKey) {
        throw new Error('API Key is missing in Settings')
      }

      // 2. Read System Prompt (Identity)
      let systemPrompt = ''
      try {
        systemPrompt = await readFile(identityPath, 'utf-8')
      } catch (err) {
        console.warn('Failed to read IDENTITY.md', err)
      }

      // 3. Call LLM Provider
      if (provider === 'anthropic') {
        const client = new Anthropic({
          apiKey,
          baseURL: baseUrl || undefined
        })

        const response = await client.messages.create({
          model: modelName || 'claude-3-opus-20240229',
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 1024
        })

        const textBlock = (response.content as ContentBlock[]).find((block) => block.type === 'text')
        return textBlock && 'text' in textBlock ? String((textBlock as { text: string }).text) : ''
      } else if (provider === 'openai') {
        const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`

        const payload = {
          model: modelName || 'gpt-4o',
          messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            ...messages.map((m) => ({ role: m.role, content: m.content }))
          ]
        } as const

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenAI request failed: ${response.status} ${errorText}`)
        }

        const data: unknown = await response.json()
        const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
        const choices = Array.isArray(record.choices) ? record.choices : []
        const first = choices[0]
        const firstRecord = typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : {}
        const messageObj =
          typeof firstRecord.message === 'object' && firstRecord.message !== null
            ? (firstRecord.message as Record<string, unknown>)
            : {}
        const content = messageObj.content
        return typeof content === 'string' ? content : ''
      } else {
        throw new Error(`Unsupported provider: ${provider}`)
      }
    } catch (error: unknown) {
      console.error('LLM Request Failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(msg || 'Failed to send message to LLM')
    }
  })
}
