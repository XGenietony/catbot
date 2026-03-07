import { ChatMessage } from '../../../../common/types'
import { formatMessageTime } from '../../utils/date'

interface UserMessageProps {
  message: ChatMessage
}

export function UserMessage({ message }: UserMessageProps): React.JSX.Element {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-600 text-white rounded-br-none border border-blue-700 dark:border-blue-500 select-text">
        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
        <span className="text-xs opacity-50 mt-1 block">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
