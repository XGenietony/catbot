export function TitleBar(): React.JSX.Element {
  return (
    <div className="h-8 w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-between drag-region shrink-0 px-4">
      {/* Traffic lights area - handled by OS, we just need space */}
      <div className="w-20 shrink-0" />

      {/* App Title - Centered using flex-1 */}
      <div className="flex-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 select-none">
        CatBot
      </div>

      {/* Right spacer for balance */}
      <div className="w-20 shrink-0" />
    </div>
  )
}
