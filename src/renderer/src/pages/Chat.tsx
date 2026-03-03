import { useState, useRef, useEffect } from 'react'
import { UserCog, Loader2 } from 'lucide-react'
import { PersonaModal } from '../components/PersonaModal'
import { sendMessageToLLM, ChatMessage } from '../services/LLMService'
import { Message } from '../components/chat/types'
import { UserMessage } from '../components/chat/UserMessage'
import { AssistantMessage } from '../components/chat/AssistantMessage'
import { ToolMessage } from '../components/chat/ToolMessage'

export default function Chat(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (window.api?.onAgentUpdate) {
      const cleanup = window.api.onAgentUpdate((data) => {
        if (data.type === 'tool_use') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `Using tool: ${data.tool}`,
            sender: 'bot',
            timestamp: Date.now(),
            toolUse: {
              tool: data.tool,
              input: data.input
            }
          }])
        } else if (data.type === 'tool_result') {
          setMessages(prev => {
            // Find the last message that is a tool use of the same tool and has no output
            // We search from the end
            const reversed = [...prev].reverse()
            const index = reversed.findIndex(m => m.toolUse && m.toolUse.tool === data.tool && !m.toolUse.output)
            
            if (index !== -1) {
              const realIndex = prev.length - 1 - index
              const msg = prev[realIndex]
              const updated = {
                ...msg,
                toolUse: { ...msg.toolUse!, output: data.output }
              }
              const newMessages = [...prev]
              newMessages[realIndex] = updated
              return newMessages
            }
            return prev
          })
        }
      })
      return cleanup
    }
    return undefined
  }, [])

  const handleSendMessage = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault()
    
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: Date.now()
    }

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Prepare history for LLM
      // Map existing messages plus the new one
      const history: ChatMessage[] = [...messages, userMessage].map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      const responseText = await sendMessageToLLM(history)

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error: unknown) {
      console.error('Chat error:', error)
      const msg = error instanceof Error ? error.message : String(error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${msg || 'Failed to get response'}`,
        sender: 'bot',
        timestamp: Date.now(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white relative">
      {/* Header */}
      <header className="flex-none p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur flex justify-between items-center">
        <h1 className="text-xl font-bold">CatBot Chat</h1>
        <button
          onClick={() => setIsPersonaModalOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          title="Set Persona"
        >
          <UserCog size={20} />
        </button>
      </header>

      {/* Persona Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.sender === 'user') {
            return <UserMessage key={message.id} message={message} />
          }
          if (message.toolUse) {
            return <ToolMessage key={message.id} message={message} />
          }
          return <AssistantMessage key={message.id} message={message} />
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-400" size={16} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 resize-none h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
