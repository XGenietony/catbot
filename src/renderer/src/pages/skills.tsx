import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FolderOpen, Plus, Trash2, RefreshCw } from 'lucide-react'
import { SkillInfo } from '../../../common/types'
import { AddSkillModal } from '../components/add-skill-modal'

export default function Skills(): React.JSX.Element {
  const location = useLocation()
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)

  const loadSkills = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const items = await window.api.listSkills()
      setSkills(items)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Failed to load skills')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteSkill = async (name: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete the skill "${name}"?`)) {
      return
    }

    try {
      setDeletingSkill(name)
      await window.api.deleteSkill(name)
      await loadSkills()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Failed to delete skill: ${msg}`)
    } finally {
      setDeletingSkill(null)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  useEffect(() => {
    if (location.pathname === '/skills') {
      loadSkills()
    }
  }, [location.pathname, loadSkills])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-end px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
        {/* Strut to match Workspace header height (text-sm + py-1) */}
        <span className="text-sm py-1 invisible w-0">|</span>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-1 mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          title="Add Skill"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => window.api.openSkillsDir()}
          className="p-1 mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          title="Open Skills Directory"
        >
          <FolderOpen size={16} />
        </button>
        <button
          onClick={loadSkills}
          disabled={isLoading}
          className={`p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer ${
            isLoading ? 'animate-spin' : ''
          }`}
          title="Refresh Skills"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading && <div className="text-gray-600 dark:text-gray-400 text-sm">Loading...</div>}

        {!isLoading && error && (
          <div className="text-sm text-red-600 dark:text-red-400">Error: {error}</div>
        )}

        {!isLoading && !error && skills.length === 0 && (
          <div className="text-gray-600 dark:text-gray-400 text-sm">暂无技能</div>
        )}

        {!isLoading && !error && skills.length > 0 && (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={`${skill.source}:${skill.name}`}
                className="group relative border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                        {skill.name}
                      </h2>
                    </div>
                    {skill.description ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {skill.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">无描述</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">
                    {skill.source === 'home' ? '~/.agents/skills' : skill.source}
                  </span>
                </div>
                {skill.source === 'workspace' && (
                  <button
                    onClick={() => handleDeleteSkill(skill.name)}
                    disabled={deletingSkill === skill.name}
                    className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Skill"
                  >
                    <Trash2
                      size={16}
                      className={deletingSkill === skill.name ? 'animate-spin' : ''}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadSkills}
      />
    </div>
  )
}
