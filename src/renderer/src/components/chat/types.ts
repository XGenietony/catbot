export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: number
  isError?: boolean
  toolUse?: {
    tool: string
    input: unknown
    output?: string
  }
}
