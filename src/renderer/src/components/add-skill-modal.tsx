import { useState } from 'react'
import { X, Loader2, GitBranch, Upload, FileArchive } from 'lucide-react'

interface AddSkillModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type InstallMethod = 'zip' | 'git'

export function AddSkillModal({
  isOpen,
  onClose,
  onSuccess
}: AddSkillModalProps): React.JSX.Element | null {
  const [method, setMethod] = useState<InstallMethod>('zip')
  const [gitUrl, setGitUrl] = useState('')
  const [zipPath, setZipPath] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectFile = async (): Promise<void> => {
    try {
      const path = await window.api.selectSkillZip()
      if (path) setZipPath(path)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsInstalling(true)
    setError(null)

    try {
      if (method === 'git') {
        if (!gitUrl.trim()) return
        await window.api.installSkillGit(gitUrl.trim())
      } else {
        if (!zipPath) return
        const existingSkillName = await window.api.installSkillZip(zipPath, false)
        if (existingSkillName) {
          // Ask for confirmation
          if (
            window.confirm(
              `Skill "${existingSkillName}" already exists. Do you want to overwrite it?`
            )
          ) {
            await window.api.installSkillZip(zipPath, true)
          } else {
            setIsInstalling(false)
            return
          }
        }
      }
      setGitUrl('')
      setZipPath('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setIsInstalling(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Skill</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            disabled={isInstalling}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              method === 'zip'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setMethod('zip')}
          >
            Zip File
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              method === 'git'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setMethod('git')}
          >
            Git Repository
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {method === 'git' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Git Repository URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GitBranch size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/username/skill-repo.git"
                  className="w-full pl-10 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  disabled={isInstalling}
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Clone a skill repository directly.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Skill Zip File
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileArchive size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={zipPath}
                    readOnly
                    placeholder="Select a .zip file..."
                    className="w-full pl-10 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer"
                    onClick={handleSelectFile}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectFile}
                  disabled={isInstalling}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <Upload size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Upload a .zip file containing the skill.</p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg break-all">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isInstalling}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(method === 'git' ? !gitUrl.trim() : !zipPath) || isInstalling}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isInstalling ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Installing...
                </>
              ) : (
                'Install Skill'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
