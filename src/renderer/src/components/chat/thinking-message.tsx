import { Loader2 } from 'lucide-react'
import catbotIcon from '../../assets/catbot_circle_icon.png'

export function ThinkingMessage(): React.JSX.Element {
  return (
    <div className="flex justify-start items-start gap-3">
      <img src={catbotIcon} alt="CatBot" className="w-12 h-12 rounded-full mt-1" />
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
        <Loader2 className="animate-spin text-gray-400" size={16} />
        <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
      </div>
    </div>
  )
}
