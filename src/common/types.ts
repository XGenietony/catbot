export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  toolUse?: {
    tool: string
    input: unknown
    output?: string
    toolUseId?: string
  }
  isError?: boolean
}
