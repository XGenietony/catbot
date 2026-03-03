export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendMessageToLLM(messages: ChatMessage[]): Promise<string> {
  try {
    return await window.api.agentLoop(messages)
  } catch (error) {
    // Fallback to simple LLM request if Agent Loop fails (e.g. provider not supported)
    console.warn('Agent Loop failed, falling back to simple LLM request:', error)
    return await window.api.llmRequest(messages)
  }
}
