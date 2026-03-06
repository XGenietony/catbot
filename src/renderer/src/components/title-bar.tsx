export function TitleBar(): React.JSX.Element {
  return (
    <div className="h-8 w-full bg-gray-100 dark:bg-gray-800 flex items-center drag-region shrink-0">
      {/* Traffic lights area - handled by OS, we just need space */}
      <div className="w-20" />
    </div>
  )
}
