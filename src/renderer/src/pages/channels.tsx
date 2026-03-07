import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'

interface ChannelConfig {
  id: string
  name: string
  type: 'feishu'
  icon: React.ElementType
  config: Record<string, string>
}

export default function Channels(): React.JSX.Element {
  const [selectedChannel, setSelectedChannel] = useState<string>('feishu')
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({
    feishu: {
      appId: '',
      appSecret: ''
    }
  })

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = (await window.api.getChannelConfig()) as {
          feishu?: { appId: string; appSecret: string }
        }
        if (config && config.feishu) {
          setConfigs((prev) => ({
            ...prev,
            feishu: {
              appId: config.feishu?.appId || '',
              appSecret: config.feishu?.appSecret || ''
            }
          }))
        }
      } catch (error) {
        console.error('Failed to load channel config:', error)
      }
    }
    loadConfig()
  }, [])

  const channels: ChannelConfig[] = [
    {
      id: 'feishu',
      name: '飞书 (Feishu)',
      type: 'feishu',
      icon: MessageCircle,
      config: configs.feishu
    }
  ]

  const handleConfigChange = (channelId: string, key: string, value: string): void => {
    setConfigs((prev) => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        [key]: value
      }
    }))
  }

  const handleSave = async (channelId: string): Promise<void> => {
    try {
      const configToSave = configs[channelId]
      if (!configToSave) {
        throw new Error('No config found for channel')
      }
      await window.api.updateChannelConfig(channelId, configToSave)
      alert('配置已保存')
    } catch (error) {
      console.error('Failed to save channel config:', error)
      alert('保存失败')
    }
  }

  return (
    <div className="flex h-full w-full bg-gray-100 dark:bg-gray-800 gap-1">
      {/* Left Sidebar - Channel List */}
      <div className="w-64 bg-white dark:bg-gray-900 rounded-r-lg flex flex-col shadow-sm border-y border-r border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Platforms
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedChannel === channel.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <channel.icon size={18} />
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right Content - Configuration Form */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg flex flex-col shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-3xl mx-auto">
            {selectedChannel === 'feishu' && (
              <div className="space-y-8">
                <div className="flex items-start gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">飞书配置</h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      配置飞书机器人的 App ID 和 App Secret 以启用连接。
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        App ID
                      </label>
                      <input
                        type="text"
                        value={configs.feishu.appId}
                        onChange={(e) => handleConfigChange('feishu', 'appId', e.target.value)}
                        placeholder="cli_..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        App Secret
                      </label>
                      <input
                        type="password"
                        value={configs.feishu.appSecret}
                        onChange={(e) => handleConfigChange('feishu', 'appSecret', e.target.value)}
                        placeholder="Your App Secret"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleSave('feishu')}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm hover:shadow-md active:scale-95 transform duration-100"
                    >
                      保存配置
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
